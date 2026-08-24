import React, { useEffect, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import ChatItemMenu from './ChatItemMenu'

const LONG_PRESS_MS = 500
const MOVE_TOLERANCE_PX = 10

/**
 * One row in the sidebar chat list.
 * `compact` renders the icon-only variant used by the collapsed rail.
 */
function ConversationRow({ conversation, isActive, compact = false, onSelect, onDelete, onLongPress }) {
  const [pressing, setPressing] = useState(false)
  const timer = useRef(null)
  const origin = useRef(null)
  const fired = useRef(false)

  const clearPress = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    origin.current = null
    setPressing(false)
  }

  useEffect(() => clearPress, [])

  // touch only - a mouse never starts the timer, so desktop is untouched
  const handlePointerDown = (e) => {
    if (e.pointerType !== 'touch' || !onLongPress) return
    fired.current = false
    origin.current = { x: e.clientX, y: e.clientY }
    setPressing(true)
    timer.current = setTimeout(() => {
      fired.current = true
      clearPress()
      onLongPress()
    }, LONG_PRESS_MS)
  }

  // a scroll gesture must cancel the press rather than delete a chat
  const handlePointerMove = (e) => {
    if (!origin.current) return
    const dx = Math.abs(e.clientX - origin.current.x)
    const dy = Math.abs(e.clientY - origin.current.y)
    if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clearPress()
  }

  const handleClick = () => {
    // swallow the click the browser fires after a completed long press
    if (fired.current) {
      fired.current = false
      return
    }
    onSelect()
  }

  return (
    <div
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearPress}
      onPointerCancel={clearPress}
      onPointerLeave={clearPress}
      onContextMenu={(e) => { if (pressing || fired.current) e.preventDefault() }}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      title={compact ? conversation?.title || 'New Chat' : undefined}
      style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none' }}
      className={`group relative isolate flex items-center gap-2.5 cursor-pointer mb-1
        rounded-xl border border-transparent outline-none
        focus-visible:focus-ring transition-transform duration-200 ease-premium
        ${pressing ? 'scale-[0.98] select-none' : ''}
        ${compact ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-xl bg-white/[0.05]
          transition-opacity duration-200 ease-premium
          ${isActive ? 'opacity-0' : pressing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-xl transform-gpu
          bg-indigo-500/10 shadow-[inset_0_0_0_1px_rgb(99_102_241_/_0.18)]
          transition-[opacity,transform] duration-[260ms] ease-premium
          ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.94]'}`}
      />
      {!compact && (
        <span
          aria-hidden
          className={`pointer-events-none absolute left-0 top-1/2 -mt-2.5 h-5 w-[3px] rounded-r-full
            bg-indigo-400 origin-center transform-gpu
            transition-[opacity,transform] duration-[260ms] ease-premium
            ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}
        />
      )}

      <div
        className={`relative z-10 flex items-center justify-center shrink-0 rounded-lg
          transition-colors duration-200 ease-premium
          ${compact ? 'w-[26px] h-[26px]' : 'w-[28px] h-[28px]'}
          ${isActive ? 'bg-indigo-500/15 text-indigo-400' : 'bg-white/[0.05] text-slate-500'}`}
      >
        {/* the icon fades to three drifting dots on hover. lg: only, and
            tailwind v4 already scopes hover to (hover: hover), so a touch
            device can never leave it stuck in the hovered state. */}
        <MessageSquare
          size={13}
          className='transition-opacity duration-200 ease-premium lg:group-hover:opacity-0'
        />
        <span
          aria-hidden
          className='pointer-events-none absolute inset-0 hidden lg:flex items-center justify-center gap-[3px]
            opacity-0 transition-opacity duration-200 ease-premium lg:group-hover:opacity-100'
        >
          <span className='row-dot' />
          <span className='row-dot' />
          <span className='row-dot' />
        </span>
      </div>

      {!compact && (
        <>
          <span
            className={`relative z-10 flex-1 min-w-0 text-[13px] font-medium truncate
              transition-colors duration-200 ease-premium
              ${isActive ? 'text-slate-100' : 'text-slate-300'}`}
          >
            {conversation?.title || 'New Chat'}
          </span>
          <ChatItemMenu onDelete={onDelete} />
        </>
      )}
    </div>
  )
}

export default ConversationRow
