type RecapCardStat = {
  label: string
  value: string | number
}

type RecapCardInput = {
  title: string
  sentence: string
  stats: RecapCardStat[]
  highlights?: RecapCardStat[]
}

const loadFont = '800 64px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    } else {
      line = test
    }
  }

  if (line && lines.length < maxLines) lines.push(line)
  lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight))
  return lines.length * lineHeight
}

export const downloadRecapCardImage = async ({ title, sentence, stats, highlights = [] }: RecapCardInput) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#f4f4f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350)
  gradient.addColorStop(0, '#ecfccb')
  gradient.addColorStop(0.5, '#ffffff')
  gradient.addColorStop(1, '#dbeafe')
  ctx.fillStyle = gradient
  ctx.fillRect(36, 36, 1008, 1278)

  ctx.fillStyle = '#18181b'
  ctx.font = '900 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('SIDEKICK RECAP', 96, 140)

  ctx.font = loadFont
  wrapText(ctx, title, 96, 245, 820, 76, 2)

  ctx.font = '700 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillStyle = '#52525b'
  wrapText(ctx, sentence, 96, 420, 840, 48, 3)

  const statWidth = 204
  const statHeight = 150
  stats.slice(0, 8).forEach((item, index) => {
    const col = index % 4
    const row = Math.floor(index / 4)
    const x = 96 + col * (statWidth + 24)
    const y = 585 + row * (statHeight + 24)
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, x, y, statWidth, statHeight, 24)
    ctx.fill()
    ctx.fillStyle = '#18181b'
    ctx.font = '900 40px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(String(item.value), x + 24, y + 66)
    ctx.fillStyle = '#71717a'
    ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(item.label, x + 24, y + 112)
  })

  if (highlights.length > 0) {
    ctx.fillStyle = '#18181b'
    ctx.font = '900 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText('Highlights', 96, 1040)

    highlights.slice(0, 3).forEach((item, index) => {
      const y = 1100 + index * 62
      ctx.fillStyle = '#71717a'
      ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(item.label, 96, y)
      ctx.fillStyle = '#18181b'
      ctx.font = '900 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(String(item.value), 350, y)
    })
  }

  ctx.fillStyle = '#71717a'
  ctx.font = '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('cheerreaders.com', 96, 1246)

  const link = document.createElement('a')
  link.download = `sidekick-recap-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
