import React, { useEffect, useState } from 'react'
import Markdown from "react-markdown"
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import CodeBlock from './CodeBlock'
import { X } from 'lucide-react'

function MessageBubble({ role, content, images }) {
  const isUser = role === "user"
  const [zoomed, setZoomed] = useState(null)
  const [broken, setBroken] = useState(() => new Set())

  // broken urls are filtered out of the render instead of being pulled out of
  // the DOM directly, which would leave React holding a stale node reference
  const visibleImages = (images ?? []).filter((img) => img && !broken.has(img))
  const isSingleImage = visibleImages.length === 1

  useEffect(() => {
    if (!zoomed) return
    const onKeyDown = (e) => { if (e.key === "Escape") setZoomed(null) }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [zoomed])

  return (
    <div className={`flex mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`text-[14px] leading-relaxed break-words ${
        isUser
          ? "max-w-[75%] px-4 py-3 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-700 text-white whitespace-pre-wrap"
          : "w-full text-slate-200"
      }`}>
        <div className={isUser ? '' : 'md-body'}>
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ children }) => <>{children}</>,
              code: ({ node, className, children, ...props }) => {
                const isBlock = /language-/.test(className || '') || String(children).includes('\n')
                if (!isBlock) {
                  return (
                    <code className='px-1.5 py-0.5 rounded-md bg-white/[0.07] border border-white/[0.06] text-[12.5px] font-mono text-indigo-200' {...props}>
                      {children}
                    </code>
                  )
                }
                return <CodeBlock className={className}>{children}</CodeBlock>
              },
            }}
          >
            {content}
          </Markdown>
        </div>

        {visibleImages.length > 0 && (
          <div className='flex flex-wrap gap-3 mt-4'>
            {visibleImages.map((img, i) => (
              <button
                key={img ?? i}
                type='button'
                onClick={() => setZoomed(img)}
                aria-label='View image larger'
                className='p-0 border-none bg-transparent rounded-xl cursor-zoom-in outline-none
                  focus-visible:focus-ring transition-transform duration-200 ease-premium
                  hover:scale-[1.02] active:scale-[0.98]'
              >
                <img
                  src={img}
                  alt=''
                  loading='lazy'
                  onError={() => setBroken((prev) => new Set(prev).add(img))}
                  className={`rounded-xl border border-white/10
                    transition-opacity duration-200 ease-premium hover:opacity-90
                    ${isSingleImage
                      ? 'max-w-[380px] max-h-[280px] w-auto h-auto object-contain'
                      : 'w-40 h-28 object-cover'}`}
                />
              </button>
            ))}
          </div>
        )}

        {/* quiet system notice, not part of the model output. rendered per
            completed assistant message, so it can never appear while the
            thinking indicator is up - that state has no message to attach to. */}
        {!isUser && (
          <p
            role='note'
            className='mt-3 mb-0 text-center text-[11px] leading-snug text-slate-600 break-words'
          >
            AmeekAI can make mistakes. Check important info.
          </p>
        )}
      </div>

      {zoomed && (
        <div
          role='dialog'
          aria-modal='true'
          onClick={() => setZoomed(null)}
          className='fixed inset-0 z-[60] flex items-center justify-center p-4
            bg-black/80 backdrop-blur-sm animate-fade-in cursor-zoom-out'
        >
          <button
            type='button'
            aria-label='Close image'
            onClick={() => setZoomed(null)}
            className='absolute top-3 right-3 tap-target flex items-center justify-center rounded-xl
              glass border border-white/[0.08] text-slate-300 outline-none focus-visible:focus-ring
              transition-transform duration-200 ease-premium active:scale-[0.94]'
          >
            <X size={18} />
          </button>

          <img
            src={zoomed}
            alt=''
            onClick={(e) => e.stopPropagation()}
            className='max-w-[92vw] max-h-[88vh] object-contain rounded-xl
              shadow-ambient-lg animate-rise cursor-default'
          />
        </div>
      )}
    </div>
  )
}

export default MessageBubble
