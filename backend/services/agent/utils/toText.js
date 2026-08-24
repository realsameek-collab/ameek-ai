// Normalises anything an LLM / LangChain can hand back into a plain string.
// AIMessage -> .content, content blocks array -> joined text, object -> JSON.
export const toText = (value) => {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    return value.map((part) =>
      typeof part === "string" ? part : (part?.text ?? "")
    ).join("")
  }
  if (typeof value === "object") {
    if ("content" in value) return toText(value.content)
    if ("text" in value) return toText(value.text)
    return JSON.stringify(value)
  }
  return String(value)
}

export default toText
