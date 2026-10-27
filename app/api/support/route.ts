import { chatViaApi, streamChatViaApi, healthViaApi, SupportApiError, validSessionId } from '@/lib/support/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000
const MAX_BODY_BYTES = 16_384
const buckets = new Map<string, number[]>()
const DEFAULT_ALLOWED_ORIGINS = ['https://fyao.me', 'https://www.fyao.me']

function allowedOrigins(): string[] {
  const extra = process.env.SUPPORT_ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  const dev = process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []
  return [...DEFAULT_ALLOWED_ORIGINS, ...extra, ...dev]
}

function verifyOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  if (!origin) throw new SupportApiError('bad_origin', 403)
  if (!allowedOrigins().includes(origin)) throw new SupportApiError('forbidden_origin', 403)
}

function rateAllowed(request: Request): boolean {
  const now = Date.now()
  const cutoff = now - RATE_WINDOW_MS
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const key = forwarded || request.headers.get('x-real-ip') || 'unknown'
  const recent = (buckets.get(key) ?? []).filter((timestamp) => timestamp > cutoff)
  if (recent.length >= RATE_LIMIT) return false
  recent.push(now)
  buckets.set(key, recent)
  if (buckets.size > 2000) {
    for (const [bucketKey, timestamps] of buckets) {
      if (timestamps[timestamps.length - 1] <= cutoff) buckets.delete(bucketKey)
    }
    // Bound memory even when many distinct addresses arrive in the same window.
    if (buckets.size > 2000) buckets.delete(buckets.keys().next().value!)
  }
  return true
}

function failure(error: unknown): Response {
  const known = error instanceof SupportApiError ? error : new SupportApiError('internal_error', 500)
  return Response.json({ error: { code: known.code } }, {
    status: known.status,
    headers: { 'Cache-Control': 'no-store', ...(known.status === 429 ? { 'Retry-After': '60' } : {}) },
  })
}

async function readInput(request: Request): Promise<Record<string, unknown>> {
  const length = request.headers.get('content-length')
  if (length && Number(length) > MAX_BODY_BYTES) throw new SupportApiError('request_too_large', 413)
  const reader = request.body?.getReader()
  if (!reader) throw new SupportApiError('invalid_json', 400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new SupportApiError('request_too_large', 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  let body: unknown
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new SupportApiError('invalid_json', 400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SupportApiError('invalid_request', 400)
  return body as Record<string, unknown>
}

export async function POST(request: Request) {
  try {
    verifyOrigin(request)
    if (!rateAllowed(request)) throw new SupportApiError('rate_limited', 429)
    const input = await readInput(request)
    if (Object.keys(input).some((key) => !['message', 'sessionId', 'locale'].includes(key))) {
      throw new SupportApiError('invalid_request', 400)
    }
    if (typeof input.message !== 'string') throw new SupportApiError('invalid_message', 400)
    const message = input.message.trim()
    if (!message) throw new SupportApiError('empty_message', 400)
    if (message.length > 2000) throw new SupportApiError('message_too_long', 400)
    if (input.locale !== 'zh' && input.locale !== 'en') throw new SupportApiError('invalid_locale', 400)
    if (input.sessionId !== undefined && !validSessionId(input.sessionId)) {
      throw new SupportApiError('invalid_session', 400)
    }
    const args: { message: string; sessionId?: string; locale: 'zh' | 'en' } = { message, sessionId: input.sessionId, locale: input.locale }
    if (request.headers.get('accept')?.includes('text/event-stream')) {
      return await streamChatViaApi(request, args)
    }
    const result = await chatViaApi(request, args)
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return failure(error)
  }
}

export async function GET(request: Request) {
  try {
    verifyOrigin(request)
    if (!rateAllowed(request)) throw new SupportApiError('rate_limited', 429)
    return Response.json(await healthViaApi(request), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return failure(error)
  }
}
