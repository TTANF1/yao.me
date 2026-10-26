export type PublicSource = {
  n: number
  title: string
  heading: string
  path: string
  startLine: number
  endLine: number
  excerpt: string
}

export type Usage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export type SupportStatus = 'answered' | 'clarify' | 'insufficient' | 'out_of_scope'

export type SupportApiResponse = {
  sessionId: string
  messageId: string
  answer: string
  status: SupportStatus
  sources: PublicSource[]
  followups: string[]
  usage: Usage
  traceId: string
  intent: string
}
