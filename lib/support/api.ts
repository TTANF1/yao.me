import 'server-only'

import type { PublicSource, SupportApiResponse, SupportStatus } from './types'

const UPSTREAM_TIMEOUT_MS = 90_000
const MAX_RESPONSE_BYTES = 1_048_576
const STATUSES = new Set<SupportStatus>(['answered', 'clarify', 'insufficient', 'out_of_scope'])

export class SupportApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code)
    this.name = 'SupportApiError'
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SupportApiError('upstream_invalid_response', 502)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, maxLength = 20_000): string {
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new SupportApiError('upstream_invalid_response', 502)
  }
  return value
}

function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new SupportApiError('upstream_invalid_response', 502)
  }
  return value
}

export function validSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value)
}

function configuration() {
  const base = process.env.SUPPORT_API_BASE_URL?.trim()
  const token = process.env.SUPPORT_SITE_TOKEN?.trim()
  if (!base || !token) throw new SupportApiError('support_not_configured', 503)
  try {
    const url = new URL(base)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('invalid_config')
    }
    return { base: url.href.replace(/\/+$/, ''), token }
  } catch {
    throw new SupportApiError('support_not_configured', 503)
  }
}

async function upstream(path: string, request: Request, body?: object): Promise<unknown> {
  const { base, token } = configuration()
  const controller = new AbortController()
  const abort = () => controller.abort()
  request.signal.addEventListener('abort', abort, { once: true })
  if (request.signal.aborted) abort()
  const timer = setTimeout(abort, UPSTREAM_TIMEOUT_MS)
  try {
    // One attempt only: retrying a POST could persist a duplicate turn in Python.
    const upstreamOrigin = request.headers.get('origin')
    const response = await fetch(`${base}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'X-Site-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(upstreamOrigin ? { Origin: upstreamOrigin } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    })
    if (!response.ok) {
      // Never forward upstream bodies, details, headers, or filesystem paths.
      await response.body?.cancel()
      if (response.status === 429) throw new SupportApiError('rate_limited', 429)
      if (response.status === 408 || response.status === 504) throw new SupportApiError('support_timeout', 504)
      if (response.status === 404 && body) throw new SupportApiError('session_unavailable', 409)
      throw new SupportApiError('support_unavailable', response.status >= 500 ? 503 : 502)
    }
    const reader = response.body?.getReader()
    if (!reader) throw new SupportApiError('upstream_invalid_response', 502)
    let size = 0
    const chunks: Uint8Array[] = []
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_RESPONSE_BYTES) {
          await reader.cancel()
          throw new SupportApiError('upstream_invalid_response', 502)
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) {
    if (error instanceof SupportApiError) throw error
    if (controller.signal.aborted) {
      throw new SupportApiError(request.signal.aborted ? 'request_cancelled' : 'support_timeout', request.signal.aborted ? 499 : 504)
    }
    if (error instanceof SyntaxError) throw new SupportApiError('upstream_invalid_response', 502)
    throw new SupportApiError('support_unavailable', 503)
  } finally {
    clearTimeout(timer)
    request.signal.removeEventListener('abort', abort)
  }
}

function publicSource(value: unknown): PublicSource {
  const source = record(value)
  const path = text(source.path, 1000)
  // Sources are public, relative knowledge paths, never machine-local paths.
  if (!path || path.startsWith('/') || /[\\:\u0000-\u001f]/.test(path) || path.split('/').includes('..')) {
    throw new SupportApiError('upstream_invalid_response', 502)
  }
  const startLine = integer(source.start_line)
  const endLine = integer(source.end_line)
  const n = integer(source.n)
  if (n < 1 || startLine < 1 || endLine < startLine) throw new SupportApiError('upstream_invalid_response', 502)
  return {
    n,
    title: text(source.title, 1000),
    heading: text(source.heading, 1000),
    path,
    startLine,
    endLine,
    excerpt: text(source.excerpt, 10_000),
  }
}

export async function chatViaApi(
  request: Request,
  input: { message: string; sessionId?: string; locale: 'zh' | 'en' },
): Promise<SupportApiResponse> {
  const payload = record(await upstream('/api/v1/chat', request, {
    message: input.message,
    ...(input.sessionId ? { session_id: input.sessionId } : {}),
    locale: input.locale,
  }))
  const status = text(payload.status) as SupportStatus
  if (!STATUSES.has(status) || !validSessionId(payload.session_id) || !Array.isArray(payload.sources) ||
      payload.sources.length > 50 || !Array.isArray(payload.followups) || payload.followups.length > 10) {
    throw new SupportApiError('upstream_invalid_response', 502)
  }
  const answer = text(payload.answer)
  if (!answer.trim()) throw new SupportApiError('upstream_invalid_response', 502)
  const usage = record(payload.usage)
  return {
    sessionId: payload.session_id,
    messageId: text(payload.message_id, 200),
    status,
    answer,
    sources: payload.sources.map(publicSource),
    followups: payload.followups.map((value) => text(value, 2000)),
    traceId: text(payload.trace_id, 200),
    intent: text(payload.intent, 200),
    usage: {
      promptTokens: integer(usage.prompt_tokens),
      completionTokens: integer(usage.completion_tokens),
      totalTokens: integer(usage.total_tokens),
    },
  }
}

export async function healthViaApi(request: Request) {
  const payload = record(await upstream('/api/v1/health', request))
  const rag = record(payload.rag)
  const llm = record(payload.llm)
  const store = record(payload.store)
  if (!['ok', 'degraded'].includes(text(payload.status)) || !['ok', 'empty', 'error'].includes(text(rag.status)) ||
      typeof llm.configured !== 'boolean') {
    throw new SupportApiError('upstream_invalid_response', 502)
  }
  // Validate the store contract without exposing conversation counts or details.
  for (const key of ['conversations', 'messages', 'feedback', 'gaps']) integer(store[key])
  return {
    status: payload.status,
    rag: rag.status === 'ok',
    llm: llm.configured,
    store: true,
  }
}
