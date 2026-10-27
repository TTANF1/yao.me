export type ServerEvent = { event: string; data: unknown }

// SSE frames and UTF-8 characters can both span transport chunks.
export async function* readServerEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<ServerEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let buffer = ''
  let size = 0
  let event = 'message'
  let data: string[] = []

  function line(value: string): ServerEvent | undefined {
    if (!value) {
      const result = data.length ? { event, data: JSON.parse(data.join('\n')) as unknown } : undefined
      event = 'message'
      data = []
      return result
    }
    if (value.startsWith(':')) return
    const colon = value.indexOf(':')
    const field = colon === -1 ? value : value.slice(0, colon)
    const content = colon === -1 ? '' : value.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') event = content
    if (field === 'data') data.push(content)
  }

  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > 1_048_576) throw new Error('stream_too_large')
      buffer += decoder.decode(chunk.value, { stream: true })
      let end: number
      while ((end = buffer.search(/[\r\n]/)) !== -1) {
        // Hold a trailing CR until the next chunk to distinguish CRLF.
        if (buffer[end] === '\r' && end === buffer.length - 1) break
        const width = buffer[end] === '\r' && buffer[end + 1] === '\n' ? 2 : 1
        const result = line(buffer.slice(0, end))
        buffer = buffer.slice(end + width)
        if (result) yield result
      }
    }
    buffer += decoder.decode()
    if (buffer.endsWith('\r')) {
      const result = line(buffer.slice(0, -1))
      if (result) yield result
      buffer = ''
    }
    // An unterminated event is incomplete; callers also require an explicit done.
    if (buffer || data.length) throw new Error('incomplete_stream')
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export function encodeServerEvent(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}
