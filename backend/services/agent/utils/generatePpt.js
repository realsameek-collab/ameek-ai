import pptxgen from "pptxgenjs"

const COLORS = {
  primary: "2563EB",
  primaryLight: "60A5FA",
  primarySoft: "EFF6FF",
  secondary: "0F172A",
  text: "334155",
  heading: "0F172A",
  light: "F8FAFC",
  border: "E2E8F0",
  white: "FFFFFF",
  muted: "64748B",
  onDarkMuted: "94A3B8",
  onDarkSoft: "DBEAFE",
}

// LAYOUT_WIDE is 13.33 x 7.5 inches
const W = 13.33
const H = 7.5
const M = 0.7                 // side margin
const CW = W - M * 2          // content width
const BODY_TOP = 1.65         // where content starts on a titled slide
const FOOT_Y = 6.95

const str = (v) => String(v ?? "")
const list = (v) => (Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined) : [])

/* ------------------------------------------------------------------ *
 * shared chrome
 * ------------------------------------------------------------------ */

const accentBar = (ppt, slide, color = COLORS.primary) => {
  slide.addShape(ppt.ShapeType.rect, {
    x: 0, y: 0, w: W, h: 0.14,
    fill: { color }, line: { color },
  })
}

const slideTitle = (slide, title, { onDark = false } = {}) => {
  slide.addText(str(title), {
    x: M, y: 0.5, w: CW, h: 0.7,
    fontSize: 26, bold: true,
    color: onDark ? COLORS.white : COLORS.heading,
    valign: "middle", fit: "shrink",
  })
}

const titleRule = (ppt, slide) => {
  slide.addShape(ppt.ShapeType.rect, {
    x: M, y: 1.28, w: 1.6, h: 0.05,
    fill: { color: COLORS.primary }, line: { color: COLORS.primary },
  })
}

const footer = (slide, page, total, { onDark = false } = {}) => {
  const color = onDark ? COLORS.onDarkMuted : COLORS.muted
  slide.addText("AmeekAI", {
    x: M, y: FOOT_Y, w: 3, h: 0.25,
    align: "left", fontSize: 10, color,
  })
  slide.addText(`${page} / ${total}`, {
    x: W - M - 3, y: FOOT_Y, w: 3, h: 0.25,
    align: "right", fontSize: 10, color,
  })
}

/* ------------------------------------------------------------------ *
 * layouts
 * ------------------------------------------------------------------ */

const layoutBullets = (ppt, slide, points) => {
  const visible = points.slice(0, 6)
  const gap = visible.length > 4 ? 0.72 : 0.86

  visible.forEach((point, index) => {
    const y = BODY_TOP + index * gap

    slide.addShape(ppt.ShapeType.roundRect, {
      x: M, y, w: CW, h: gap - 0.16,
      fill: { color: index % 2 ? COLORS.light : COLORS.primarySoft },
      line: { color: COLORS.border, width: 0.75 },
      rectRadius: 0.06,
    })
    slide.addShape(ppt.ShapeType.ellipse, {
      x: M + 0.26, y: y + (gap - 0.16) / 2 - 0.06, w: 0.12, h: 0.12,
      fill: { color: COLORS.primary }, line: { color: COLORS.primary },
    })
    slide.addText(str(point), {
      x: M + 0.58, y, w: CW - 0.9, h: gap - 0.16,
      fontSize: 15, color: COLORS.text, valign: "middle", fit: "shrink",
    })
  })
}

const layoutCards = (ppt, slide, points) => {
  const cards = points.slice(0, 3)
  if (!cards.length) return layoutBullets(ppt, slide, points)

  const gap = 0.4
  const cw = (CW - gap * (cards.length - 1)) / cards.length

  cards.forEach((point, i) => {
    const x = M + i * (cw + gap)
    slide.addShape(ppt.ShapeType.roundRect, {
      x, y: BODY_TOP, w: cw, h: 3.6,
      fill: { color: COLORS.light },
      line: { color: COLORS.border, width: 0.75 },
      rectRadius: 0.08,
    })
    slide.addShape(ppt.ShapeType.rect, {
      x, y: BODY_TOP, w: cw, h: 0.09,
      fill: { color: COLORS.primary }, line: { color: COLORS.primary },
    })
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.35, y: BODY_TOP + 0.35, w: cw - 0.7, h: 0.6,
      fontSize: 30, bold: true, color: COLORS.primaryLight,
    })
    slide.addText(str(point), {
      x: x + 0.35, y: BODY_TOP + 1.05, w: cw - 0.7, h: 2.3,
      fontSize: 15, color: COLORS.text, valign: "top", fit: "shrink",
    })
  })
}

// pulls a leading figure out of "72% of teams report..." -> ["72%", "of teams..."]
const splitStat = (point) => {
  const m = str(point).match(/^\s*([€$£]?[\d][\d.,]*\s*(?:%|x|X|\+|k|K|M|bn)?)\s*[-–—:]?\s*(.*)$/)
  if (m && m[1]) return [m[1].trim(), m[2].trim()]
  return [null, str(point)]
}

const layoutStatistics = (ppt, slide, points) => {
  const stats = points.slice(0, 3).map(splitStat)
  if (!stats.length || !stats.some(([n]) => n)) return layoutBullets(ppt, slide, points)

  const gap = 0.4
  const cw = (CW - gap * (stats.length - 1)) / stats.length

  stats.forEach(([figure, label], i) => {
    const x = M + i * (cw + gap)
    slide.addShape(ppt.ShapeType.roundRect, {
      x, y: BODY_TOP, w: cw, h: 3.2,
      fill: { color: COLORS.primarySoft },
      line: { color: COLORS.border, width: 0.75 },
      rectRadius: 0.08,
    })
    slide.addText(figure ?? "—", {
      x: x + 0.2, y: BODY_TOP + 0.55, w: cw - 0.4, h: 1.2,
      align: "center", fontSize: 46, bold: true, color: COLORS.primary, fit: "shrink",
    })
    slide.addText(label, {
      x: x + 0.35, y: BODY_TOP + 1.85, w: cw - 0.7, h: 1.1,
      align: "center", fontSize: 14, color: COLORS.text, valign: "top", fit: "shrink",
    })
  })
}

const layoutTwoColumn = (ppt, slide, points) => {
  if (points.length < 2) return layoutBullets(ppt, slide, points)

  const half = Math.ceil(points.length / 2)
  const cols = [points.slice(0, half), points.slice(half)]
  const gap = 0.5
  const cw = (CW - gap) / 2

  cols.forEach((col, c) => {
    const x = M + c * (cw + gap)
    slide.addShape(ppt.ShapeType.roundRect, {
      x, y: BODY_TOP, w: cw, h: 3.9,
      fill: { color: c === 0 ? COLORS.primarySoft : COLORS.light },
      line: { color: COLORS.border, width: 0.75 },
      rectRadius: 0.08,
    })
    col.slice(0, 5).forEach((point, i) => {
      const y = BODY_TOP + 0.35 + i * 0.68
      slide.addShape(ppt.ShapeType.ellipse, {
        x: x + 0.32, y: y + 0.12, w: 0.1, h: 0.1,
        fill: { color: COLORS.primary }, line: { color: COLORS.primary },
      })
      slide.addText(str(point), {
        x: x + 0.6, y, w: cw - 0.95, h: 0.6,
        fontSize: 14, color: COLORS.text, valign: "middle", fit: "shrink",
      })
    })
  })
}

const layoutProcess = (ppt, slide, points) => {
  const steps = points.slice(0, 5)
  if (steps.length < 2) return layoutBullets(ppt, slide, points)

  const gap = 0.3
  const cw = (CW - gap * (steps.length - 1)) / steps.length
  const lineY = BODY_TOP + 0.55

  slide.addShape(ppt.ShapeType.rect, {
    x: M + cw / 2, y: lineY, w: CW - cw, h: 0.03,
    fill: { color: COLORS.border }, line: { color: COLORS.border },
  })

  steps.forEach((point, i) => {
    const x = M + i * (cw + gap)
    slide.addShape(ppt.ShapeType.ellipse, {
      x: x + cw / 2 - 0.28, y: lineY - 0.26, w: 0.56, h: 0.56,
      fill: { color: COLORS.primary }, line: { color: COLORS.primary },
    })
    slide.addText(String(i + 1), {
      x: x + cw / 2 - 0.28, y: lineY - 0.26, w: 0.56, h: 0.56,
      align: "center", valign: "middle", fontSize: 16, bold: true, color: COLORS.white,
    })
    slide.addText(str(point), {
      x, y: lineY + 0.6, w: cw, h: 1.9,
      align: "center", fontSize: 13.5, color: COLORS.text, valign: "top", fit: "shrink",
    })
  })
}

const layoutQuote = (ppt, slide, points) => {
  const quote = points[0] ?? ""
  slide.addText("“", {
    x: M, y: BODY_TOP - 0.5, w: 2, h: 1.4,
    fontSize: 96, bold: true, color: COLORS.primaryLight,
  })
  slide.addText(str(quote), {
    x: M + 0.9, y: BODY_TOP + 0.45, w: CW - 1.8, h: 2.6,
    fontSize: 24, italic: true, color: COLORS.heading, valign: "middle", fit: "shrink",
  })
  const rest = points.slice(1, 3)
  rest.forEach((p, i) => {
    slide.addText(str(p), {
      x: M + 0.9, y: BODY_TOP + 3.2 + i * 0.4, w: CW - 1.8, h: 0.35,
      fontSize: 13, color: COLORS.muted,
    })
  })
}

const layoutTakeaway = (ppt, slide, points) => {
  slide.addShape(ppt.ShapeType.roundRect, {
    x: M, y: BODY_TOP, w: CW, h: 3.8,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary },
    rectRadius: 0.1,
  })
  points.slice(0, 4).forEach((point, i) => {
    slide.addText(str(point), {
      x: M + 0.7, y: BODY_TOP + 0.55 + i * 0.8, w: CW - 1.4, h: 0.7,
      fontSize: 18, bold: i === 0, color: COLORS.white, valign: "middle", fit: "shrink",
    })
  })
}

const LAYOUTS = {
  cards: layoutCards,
  statistics: layoutStatistics,
  stats: layoutStatistics,
  "two-column": layoutTwoColumn,
  comparison: layoutTwoColumn,
  table: layoutTwoColumn,
  process: layoutProcess,
  timeline: layoutProcess,
  diagram: layoutProcess,
  quote: layoutQuote,
  "key-takeaway": layoutTakeaway,
  closing: layoutTakeaway,
}

/* ------------------------------------------------------------------ *
 * slides
 * ------------------------------------------------------------------ */

const addCover = (ppt, data) => {
  const slide = ppt.addSlide()
  slide.background = { color: COLORS.secondary }

  accentBar(ppt, slide)

  slide.addShape(ppt.ShapeType.rect, {
    x: M, y: 2.55, w: 1.6, h: 0.06,
    fill: { color: COLORS.primaryLight }, line: { color: COLORS.primaryLight },
  })

  slide.addText(str(data?.title ?? "Untitled"), {
    x: M, y: 2.85, w: CW - 1.5, h: 1.5,
    fontSize: 42, bold: true, color: COLORS.white, valign: "top", fit: "shrink",
  })

  if (data?.subtitle) {
    slide.addText(str(data.subtitle), {
      x: M, y: 4.5, w: CW - 2.5, h: 0.8,
      fontSize: 17, color: COLORS.onDarkSoft, valign: "top", fit: "shrink",
    })
  }

  slide.addText("Generated by AmeekAI", {
    x: M, y: FOOT_Y, w: 5, h: 0.25,
    fontSize: 10, color: COLORS.onDarkMuted,
  })
}

const addSectionSlide = (ppt, slide_data, page, total) => {
  const slide = ppt.addSlide()
  slide.background = { color: COLORS.secondary }
  accentBar(ppt, slide, COLORS.primaryLight)

  slide.addText(String(page).padStart(2, "0"), {
    x: M, y: 2.5, w: 2, h: 1,
    fontSize: 44, bold: true, color: COLORS.primaryLight,
  })
  slide.addText(str(slide_data?.title), {
    x: M, y: 3.45, w: CW - 1, h: 1.4,
    fontSize: 32, bold: true, color: COLORS.white, valign: "top", fit: "shrink",
  })

  const points = list(slide_data?.points)
  if (points.length) {
    slide.addText(str(points[0]), {
      x: M, y: 4.9, w: CW - 2, h: 0.7,
      fontSize: 15, color: COLORS.onDarkSoft, fit: "shrink",
    })
  }

  footer(slide, page, total, { onDark: true })
  if (slide_data?.speaker_notes) slide.addNotes(str(slide_data.speaker_notes))
}

const addContentSlide = (ppt, slide_data, page, total) => {
  const layout = str(slide_data?.layout).toLowerCase().trim()

  if (layout === "section") return addSectionSlide(ppt, slide_data, page, total)

  const slide = ppt.addSlide()
  slide.background = { color: COLORS.white }

  slideTitle(slide, slide_data?.title)
  titleRule(ppt, slide)

  const points = list(slide_data?.points)
  const render = LAYOUTS[layout] ?? layoutBullets
  if (points.length) render(ppt, slide, points)

  footer(slide, page, total)
  if (slide_data?.speaker_notes) slide.addNotes(str(slide_data.speaker_notes))
}

const addThankYou = (ppt) => {
  const slide = ppt.addSlide()
  slide.background = { color: COLORS.secondary }
  accentBar(ppt, slide, COLORS.primaryLight)

  slide.addText("Thank you", {
    x: 0, y: 3.0, w: W, h: 1,
    align: "center", fontSize: 40, bold: true, color: COLORS.white,
  })
  slide.addShape(ppt.ShapeType.rect, {
    x: W / 2 - 0.8, y: 4.15, w: 1.6, h: 0.05,
    fill: { color: COLORS.primaryLight }, line: { color: COLORS.primaryLight },
  })
  slide.addText("Generated by AmeekAI", {
    x: 0, y: FOOT_Y, w: W, h: 0.25,
    align: "center", fontSize: 10, color: COLORS.onDarkMuted,
  })
}

/* ------------------------------------------------------------------ */

export const generatePpt = (data) => {
  const ppt = new pptxgen()
  ppt.layout = "LAYOUT_WIDE"
  ppt.author = "AmeekAI"
  ppt.title = str(data?.title)
  ppt.subject = str(data?.title)
  ppt.company = "AmeekAI"
  ppt.lang = "en-US"
  ppt.theme = {
    headFontFace: "Aptos",
    bodyFontFace: "Aptos",
    lang: "en-US",
  }

  addCover(ppt, data)

  const slides = list(data?.slides)
  slides.forEach((s, i) => addContentSlide(ppt, s, i + 1, slides.length))

  addThankYou(ppt)
  return ppt
}
