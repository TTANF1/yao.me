import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

async function moduleUrl(path, replacements = []) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } })
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}
const sseUrl = await moduleUrl('../lib/support/sse.ts')
const apiUrl = await moduleUrl('../lib/support/api.ts', [["import 'server-only'", ''], ["from './sse'", `from '${sseUrl}'`]])
const routeUrl = await moduleUrl('../app/api/support/route.ts', [["from '@/lib/support/api'", `from '${apiUrl}'`]])
const { sourceSummary } = await import(await moduleUrl('../lib/support/source.ts'))
const { readServerEvents, encodeServerEvent } = await import(sseUrl)
const { streamChatViaApi } = await import(apiUrl)
const { POST } = await import(routeUrl)
const encoder = new TextEncoder()
function body(text, width = 3) {
  const bytes = typeof text === 'string' ? encoder.encode(text) : text
  return new ReadableStream({ start(output) { for (let i = 0; i < bytes.length; i += width) output.enqueue(bytes.slice(i, i + width)); output.close() } })
}
async function collect(stream) { return Array.fromAsync(readServerEvents(stream)) }
const payload = {
  session_id: 'test-session', message_id: 'm1', answer: '公开回答 [1]', status: 'answered',
  sources: [{ n: 1, title: '公开资料', heading: '', path: 'public/about.md', start_line: 1, end_line: 2, excerpt: '公开内容' }],
  followups: [], usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 }, trace_id: 't1', intent: 'about',
}
function request(accept = 'text/event-stream', origin = 'https://www.fyao.me', input = { message: '你好', locale: 'zh' }) {
  return new Request('http://localhost/api/support', { method: 'POST', headers: { Origin: origin, Accept: accept, 'Content-Type': 'application/json', 'x-real-ip': String(Math.random()) }, body: JSON.stringify(input) })
}
function wire(events) { return events.map(([event, data]) => new TextDecoder().decode(encodeServerEvent(event, data))).join('') }
const originalFetch = globalThis.fetch
process.env.SUPPORT_API_BASE_URL = 'http://fake-upstream.test'
process.env.SUPPORT_SITE_TOKEN = 'test-secret'

await test('source summaries link verified repository identities and keep knowledge text concise', () => {
  const source = { n: 1, title: 'TTANF1/Edgewise — GitHub 公开项目', path: 'github/Edgewise.md', heading: '', excerpt: '项目描述：Intelligent pixel cleanup.', startLine: 1, endLine: 8 }
  assert.deepEqual(sourceSummary(source), { url: 'https://github.com/TTANF1/Edgewise', title: 'TTANF1/Edgewise', description: 'Intelligent pixel cleanup.' })
  assert.equal(sourceSummary({ ...source, title: 'TTANF1/EdgewiseFake' }).url, undefined)
  assert.equal(sourceSummary({ ...source, path: 'github/../../secret.md' }).url, undefined)
  assert.deepEqual(sourceSummary({ ...source, title: '开发记录', path: 'articles/public.md', excerpt: '## 公开思路\n[像素处理](https://example.com) **实现**。' }), { url: undefined, title: '开发记录', description: '公开思路 像素处理 实现。' })
})

await test('SSE splits UTF-8, CRLF, multiline data and comments correctly', async () => {
  const data = ': heartbeat\r\nevent: delta\r\ndata: {\r\ndata: "text":"你好"}\r\n\r\n'
  assert.deepEqual(await collect(body(data, 1)), [{ event: 'delta', data: { text: '你好' } }])
})
await test('SSE rejects unterminated and oversized frames', async () => {
  await assert.rejects(collect(body('event: delta\ndata: {"text":"partial"}')))
  await assert.rejects(collect(body('x'.repeat(1_048_577), 65_536)), /stream_too_large/)
})
await test('route forwards real incremental output before final answer, then maps public fields', async () => {
  let release
  let upstreamOutput
  const gate = new Promise((resolve) => { release = resolve })
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://fake-upstream.test/api/v1/chat/stream')
    assert.equal(options.headers['X-Site-Token'], 'test-secret')
    assert.equal(options.headers.Origin, 'https://www.fyao.me')
    assert.equal(options.redirect, 'error')
    assert.deepEqual(JSON.parse(options.body), { message: '你好', locale: 'zh' })
    return new Response(new ReadableStream({
      start(output) { upstreamOutput = output; output.enqueue(encodeServerEvent('delta', { text: '公开' })) },
      async pull(output) { await gate; output.enqueue(encodeServerEvent('message', payload)); output.enqueue(encodeServerEvent('done', {})); output.close() },
    }), { headers: { 'Content-Type': 'text/event-stream' } })
  }
  const response = await POST(request())
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /no-transform/)
  const iterator = readServerEvents(response.body)
  assert.deepEqual((await iterator.next()).value, { event: 'delta', data: { text: '公开' } })
  assert.ok(upstreamOutput)
  release()
  const final = (await iterator.next()).value
  assert.equal(final.data.sessionId, 'test-session')
  assert.equal(final.data.sources[0].startLine, 1)
  assert.equal(final.data.sources[0].start_line, undefined)
  assert.equal((await iterator.next()).value.event, 'done')
  await iterator.return()
})
await test('route retains JSON compatibility', async () => {
  globalThis.fetch = async (url) => { assert.match(url, /\/chat$/); return Response.json(payload) }
  const response = await POST(request('application/json'))
  assert.equal((await response.json()).answer, payload.answer)
})
await test('route rejects origin, history, invalid locale before upstream', async () => {
  globalThis.fetch = () => { throw new Error('must not call upstream') }
  assert.equal((await POST(request('text/event-stream', 'https://bad.test'))).status, 403)
  assert.equal((await POST(request('text/event-stream', 'https://fyao.me', { message: 'hi', locale: 'zh', history: [] }))).status, 400)
  assert.equal((await POST(request('text/event-stream', 'https://fyao.me', { message: 'hi', locale: 'fr' }))).status, 400)
})
await test('proxy sanitizes final source paths and error payloads', async () => {
  for (const events of [
    [['message', { ...payload, sources: [{ ...payload.sources[0], path: 'C:\\private\\secret.md' }] }]],
    [['error', { code: 'private-path-secret', detail: 'sensitive' }]],
    [['done', {}]],
    [['delta', { text: 'partial' }]],
  ]) {
    globalThis.fetch = async () => new Response(body(wire(events)), { headers: { 'Content-Type': 'text/event-stream' } })
    const response = await streamChatViaApi(request(), { message: 'hi', locale: 'en' })
    const received = await collect(response.body)
    assert.equal(received.at(-1).event, 'error')
    assert.doesNotMatch(JSON.stringify(received), /private|secret|sensitive/)
  }
})
await test('proxy limits accumulated deltas', async () => {
  globalThis.fetch = async () => new Response(body(wire([['delta', { text: 'x'.repeat(15_000) }], ['delta', { text: 'x'.repeat(15_000) }]]), 4096), { headers: { 'Content-Type': 'text/event-stream' } })
  const response = await streamChatViaApi(request(), { message: 'hi', locale: 'en' })
  const events = await collect(response.body)
  assert.equal(events[0].event, 'delta')
  assert.equal(events[1].event, 'error')
})
await test('upstream HTTP failures never retry or forward bodies', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; return new Response('private upstream body', { status: 429 }) }
  const response = await POST(request())
  assert.equal(response.status, 429)
  assert.deepEqual(await response.json(), { error: { code: 'rate_limited' } })
  assert.equal(calls, 1)
})
await test('downstream cancellation aborts upstream fetch', async () => {
  let signal
  globalThis.fetch = async (_, options) => {
    signal = options.signal
    return new Response(new ReadableStream({ start(output) { output.enqueue(encodeServerEvent('status', { stage: 'working' })) } }), { headers: { 'Content-Type': 'text/event-stream' } })
  }
  const response = await streamChatViaApi(request(), { message: 'hi', locale: 'en' })
  await response.body.cancel()
  assert.equal(signal.aborted, true)
})
await test('timeout covers response body and aborts an unfinished upstream stream', async () => {
  const originalTimer = globalThis.setTimeout
  globalThis.setTimeout = (callback, delay, ...args) => originalTimer(callback, delay === 90_000 ? 25 : delay, ...args)
  let calls = 0
  globalThis.fetch = async (_, options) => {
    calls++
    return new Response(new ReadableStream({
      start(output) {
        output.enqueue(encodeServerEvent('status', { stage: 'working' }))
        options.signal.addEventListener('abort', () => output.error(new Error('aborted')), { once: true })
      },
    }), { headers: { 'Content-Type': 'text/event-stream' } })
  }
  try {
    const response = await streamChatViaApi(request(), { message: 'hi', locale: 'en' })
    const events = await collect(response.body)
    assert.equal(events.at(-1).event, 'error')
    assert.deepEqual(events.at(-1).data, { code: 'support_timeout' })
    assert.equal(calls, 1)
  } finally {
    globalThis.setTimeout = originalTimer
  }
})
globalThis.fetch = originalFetch
