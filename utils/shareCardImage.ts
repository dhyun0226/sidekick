type ReadingShareCardImageInput = {
  title: string
  author?: string
  groupName?: string
  companionCode?: string
  companionName?: string
  durationSeconds?: number
  progress?: number
  pagesRead?: number
  quote?: string
}

const themes: Record<string, { from: string; mid: string; to: string; accent: string }> = {
  pipi: { from: '#fff7ed', mid: '#fef3c7', to: '#dcfce7', accent: '#f97316' },
  momo: { from: '#f7fee7', mid: '#dcfce7', to: '#e0f2fe', accent: '#22c55e' },
  rumi: { from: '#fdf2f8', mid: '#fae8ff', to: '#ffedd5', accent: '#c084fc' },
  toto: { from: '#ecfeff', mid: '#dbeafe', to: '#f0f9ff', accent: '#38bdf8' },
  nori: { from: '#f5f3ff', mid: '#ede9fe', to: '#e0e7ff', accent: '#818cf8' }
}

const companionLabels: Record<string, string> = {
  pipi: 'Pipi',
  momo: 'Momo',
  rumi: 'Rumi',
  toto: 'Toto',
  nori: 'Nori'
}

const formatDuration = (seconds = 0) => {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${Math.max(1, minutes)}m`
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth) {
      line = next
      continue
    }

    if (line) lines.push(line)
    line = word
    if (lines.length === maxLines) break
  }

  if (line && lines.length < maxLines) lines.push(line)

  lines.forEach((item, index) => {
    const value = index === maxLines - 1 && words.length > lines.join(' ').split(/\s+/).length
      ? `${item.replace(/\s+\S*$/, '')}...`
      : item
    ctx.fillText(value, x, y + index * lineHeight)
  })

  return y + lines.length * lineHeight
}

const drawMascot = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  theme: { accent: string; mid: string }
) => {
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size)
  gradient.addColorStop(0, theme.mid)
  gradient.addColorStop(1, theme.accent)

  ctx.save()
  ctx.shadowColor = 'rgba(24, 24, 27, 0.18)'
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 20
  ctx.fillStyle = gradient
  roundRect(ctx, x, y + size * 0.06, size, size * 0.88, size * 0.38)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)'
  ctx.beginPath()
  ctx.arc(x + size * 0.24, y + size * 0.25, size * 0.1, 0, Math.PI * 2)
  ctx.arc(x + size * 0.72, y + size * 0.28, size * 0.075, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#18181b'
  ctx.beginPath()
  ctx.ellipse(x + size * 0.34, y + size * 0.42, size * 0.035, size * 0.06, 0, 0, Math.PI * 2)
  ctx.ellipse(x + size * 0.64, y + size * 0.42, size * 0.035, size * 0.06, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#18181b'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x + size * 0.5, y + size * 0.56, size * 0.1, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()
}

export const downloadReadingShareCard = async (input: ReadingShareCardImageInput) => {
  if (typeof document === 'undefined') return

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const code = input.companionCode || 'pipi'
  const theme = themes[code] || themes.pipi
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  bg.addColorStop(0, theme.from)
  bg.addColorStop(0.52, theme.mid)
  bg.addColorStop(1, theme.to)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)'
  ctx.beginPath()
  ctx.arc(140, 130, 210, 0, Math.PI * 2)
  ctx.arc(980, 230, 240, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#18181b'
  ctx.font = '900 34px Pretendard, Arial, sans-serif'
  ctx.fillText('SIDEKICK READING SESSION', 78, 112)

  drawMascot(ctx, 772, 112, 210, theme)

  ctx.font = '950 72px Pretendard, Arial, sans-serif'
  ctx.fillStyle = '#18181b'
  const titleBottom = wrapText(ctx, input.title || '오늘의 독서', 78, 250, 690, 82, 5)

  ctx.font = '800 32px Pretendard, Arial, sans-serif'
  ctx.fillStyle = 'rgba(24, 24, 27, 0.62)'
  const meta = [input.author, input.groupName].filter(Boolean).join(' · ')
  if (meta) wrapText(ctx, meta, 78, titleBottom + 28, 760, 40, 2)

  const quote = (input.quote || '').trim()
  if (quote) {
    ctx.fillStyle = 'rgba(24, 24, 27, 0.16)'
    roundRect(ctx, 78, 650, 924, 238, 36)
    ctx.fill()

    ctx.fillStyle = 'rgba(24, 24, 27, 0.78)'
    ctx.font = '800 34px Pretendard, Arial, sans-serif'
    wrapText(ctx, `"${quote}"`, 124, 722, 820, 48, 3)
  }

  const stats = [
    { label: '읽은 시간', value: formatDuration(input.durationSeconds) },
    { label: '진행률', value: `${Math.round(input.progress || 0)}%` },
    { label: '페이지', value: `${Math.max(0, Math.round(input.pagesRead || 0))}` }
  ]

  stats.forEach((stat, index) => {
    const x = 78 + index * 316
    ctx.fillStyle = 'rgba(255, 255, 255, 0.58)'
    roundRect(ctx, x, 996, 292, 164, 34)
    ctx.fill()

    ctx.fillStyle = '#18181b'
    ctx.font = '950 48px Pretendard, Arial, sans-serif'
    ctx.fillText(stat.value, x + 34, 1062)
    ctx.fillStyle = 'rgba(24, 24, 27, 0.56)'
    ctx.font = '850 26px Pretendard, Arial, sans-serif'
    ctx.fillText(stat.label, x + 34, 1114)
  })

  ctx.fillStyle = 'rgba(24, 24, 27, 0.56)'
  ctx.font = '850 30px Pretendard, Arial, sans-serif'
  ctx.fillText(`with ${input.companionName || companionLabels[code] || 'Sidekick'}`, 78, 1240)
  ctx.textAlign = 'right'
  ctx.fillText('cheerreaders.com', 1002, 1240)
  ctx.textAlign = 'left'

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.95))
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sidekick-reading-card-${Date.now()}.png`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
