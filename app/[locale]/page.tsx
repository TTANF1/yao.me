import { isLocale, type Locale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'
import { GameHome } from '@/components/game-home'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)

  return <GameHome locale={locale} hero={t.hero} nav={t.nav} />
}