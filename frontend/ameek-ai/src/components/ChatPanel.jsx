import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import ConversationRow from './ConversationRow'

/**
 * Floating chat list, anchored to the collapsed rail.
 *
 * Desktop only - the mobile drawer already covers this on small screens, so
 * SideBar renders this behind a `hidden lg:block` wrapper.
 */
function ChatPanel({
  open,
  onClose,
  anchorRef,
  conversations = [],
  selectedId,
  onSelect,
  onDelete,
  autoFocusSearch = false,
}) {
  const panelRef = useRef(null)
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')

  // a fresh open always starts clean
  useEffect(() => {
    if (!open) return
    setQuery('')
    if (autoFocusSearch) {
      // after the enter animation begins, so focus does not fight the transform
      const id = requestAnimationFrame(() => searchRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open, autoFocusSearch])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    const onPointerDown = (e) => {
      // the rail is excluded so its trigger button can toggle rather than
      // reopen a panel this handler just closed
      if (panelRef.current?.contains(e.target)) return
      if (anchorRef?.current?.contains(e.target)) return
      onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open, onClose, anchorRef])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => (c?.title || 'New Chat').toLowerCase().includes(q))
  }, [conversations, query])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role='dialog'
      aria-label='Chats'
      className='hidden lg:flex flex-col absolute left-[calc(100%+8px)] top-2 z-50
        w-[280px] max-h-[min(560px,calc(100vh-32px))]
        rounded-2xl border border-white/[0.09] bg-[#12141a] shadow-ambient-lg
        overflow-hidden animate-panel-in'
    >
      <div className='flex items-center gap-2 px-3 pt-3 pb-2 shrink-0'>
        <span className='flex-1 text-[13px] font-semibold text-slate-100 tracking-tight'>Chats</span>
        <button
          type='button'
          aria-label='Close chats'
          onClick={onClose}
          className='flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent
            cursor-pointer text-slate-500 hover:text-slate-200 hover:bg-white/[0.07]
            transition-[color,background-color] duration-150 ease-premium
            outline-none focus-visible:focus-ring'
        >
          <X size={15} />
        </button>
      </div>

      <div className='px-3 pb-2 shrink-0'>
        <div className='flex items-center gap-2 h-9 px-2.5 rounded-xl border border-white/[0.08]
          bg-white/[0.04] focus-within:border-white/[0.14] transition-colors duration-200 ease-premium'>
          <Search size={14} className='shrink-0 text-slate-500' />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search chats'
            className='flex-1 min-w-0 bg-transparent border-none outline-none
              text-[13px] text-slate-100 placeholder:text-slate-500'
          />
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-2
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {filtered.length === 0 ? (
          <p className='px-2 py-6 text-center text-[12.5px] text-slate-600'>
            {conversations.length === 0 ? 'No conversations yet' : 'No chats match that search'}
          </p>
        ) : (
          filtered.map((conv, i) => (
            <ConversationRow
              key={conv?._id ?? i}
              conversation={conv}
              isActive={selectedId === conv?._id}
              onSelect={() => { onSelect(conv); onClose() }}
              onDelete={() => onDelete(conv?._id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ChatPanel
