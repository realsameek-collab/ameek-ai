import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'

const LANGUAGE_LABELS = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', rb: 'ruby', sh: 'bash', shell: 'bash', zsh: 'bash',
  yml: 'yaml', md: 'markdown', cs: 'c#', cpp: 'c++',
}

// rehype-highlight turns the code into nested <span> elements, so `children`
// is a React tree rather than a string. walk it to recover the real source.
const toPlainText = (node) => {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(toPlainText).join('')
  if (node.props && node.props.children !== undefined) return toPlainText(node.props.children)
  return ''
}

function CodeBlock({ className = '', children }) {
  const [copied, setCopied] = useState(false)

  const raw = toPlainText(children).replace(/\n$/, '')
  const match = /language-(\w+)/.exec(className)
  const language = match ? (LANGUAGE_LABELS[match[1]] ?? match[1]) : 'code'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard is unavailable outside a secure context - fail quietly
    }
  }

  return (
    <div className='not-prose my-3 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0c11] shadow-ambient-sm'>
      <div className='flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/[0.06] bg-white/[0.02]'>
        <span className='text-[11px] font-medium tracking-wide text-slate-500 select-none'>
          {language}
        </span>
        <button
          type='button'
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className='flex items-center gap-1.5 px-2 py-1 rounded-md border-none bg-transparent cursor-pointer
            text-[11px] font-medium text-slate-500 hover:text-slate-200 hover:bg-white/[0.06]
            transition-[color,background-color,transform] duration-200 ease-premium
            active:scale-[0.94] outline-none focus-visible:focus-ring'
        >
          {copied ? <Check size={13} className='text-emerald-400' /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <pre className='m-0 px-4 py-3 overflow-x-auto text-[12.5px] leading-relaxed
        [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5
        [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full'>
        <code className={`${className} font-mono`}>{children}</code>
      </pre>
    </div>
  )
}

export default CodeBlock
