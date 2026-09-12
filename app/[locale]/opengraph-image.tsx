import { ImageResponse } from 'next/og'
import { isLocale } from '@/lib/locale'
import { getMessages } from '@/lib/i18n'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Yao'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : 'zh'
  const t = getMessages(locale)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#fafafa',
          color: '#18181b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 80px',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {t.hero.name}
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: '#52525b' }}>
          {t.hero.tagline}
        </div>
      </div>
    ),
    { ...size },
  )
}
