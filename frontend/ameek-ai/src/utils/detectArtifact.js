const FENCE = /```(\w+)?\s*\n([\s\S]*?)```/g

const looksLikeDocument = (code) => {
    const c = code.toLowerCase()
    if (c.includes('<!doctype') || c.includes('<html')) return true
    // fragment that still stands alone: markup plus behaviour or styling
    const hasMarkup = /<(div|main|section|body|form|button|canvas|table|ul|svg)\b/.test(c)
    const hasBehaviour = c.includes('<script') || c.includes('<style')
    return hasMarkup && hasBehaviour
}

const titleFrom = (code, prompt = '') => {
    const titleTag = code.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
    if (titleTag) return titleTag

    const h1 = code.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim()
    if (h1 && h1.length <= 40) return h1

    const words = prompt
        .replace(/[^a-z0-9\s]/gi, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) => !/^(make|create|build|write|generate|design|a|an|the|me|my|us|for|to|of|on|using|with|in|and|please|simple|small|basic|nice|good|some)$/i.test(w))
        .slice(0, 3)

    if (words.length) {
        const t = words.join(' ')
        return t.charAt(0).toUpperCase() + t.slice(1)
    }
    return 'Artifact'
}

// wraps a bare fragment so it renders as a standalone page in the sandbox
export const toDocument = (code) => {
    if (/<html[\s>]/i.test(code)) return code
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>${code}</body></html>`
}

/**
 * Returns { code, language, title } for a self-contained HTML artifact, or null.
 * Deliberately narrow: a javascript or python block is never an artifact, so
 * ordinary code answers keep rendering inline in the chat.
 */
export const detectArtifact = (content, prompt = '') => {
    if (typeof content !== 'string' || !content) return null

    FENCE.lastIndex = 0
    let match
    while ((match = FENCE.exec(content)) !== null) {
        const language = (match[1] || '').toLowerCase()
        const code = (match[2] || '').trim()

        if (language !== 'html' && language !== 'svg') continue
        if (code.length < 80) continue
        if (!looksLikeDocument(code)) continue

        return {
            code,
            language: language === 'svg' ? 'SVG' : 'HTML',
            title: titleFrom(code, prompt),
        }
    }
    return null
}

export default detectArtifact
