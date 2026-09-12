import type { Locale } from './locale'
import { messages, type Messages } from './messages'

export function getMessages(locale: Locale): Messages {
  return messages[locale]
}

export type { Messages }
