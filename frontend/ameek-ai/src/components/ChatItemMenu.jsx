import React, { useEffect, useRef, useState } from 'react'
import { MoreVertical, Trash2 } from 'lucide-react'

const EASE = "ease-[cubic-bezier(0.4,0,0.2,1)]"

function ChatItemMenu({ onDelete }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [above, setAbove] = useState(false)
  const ref = useRef(null)

  const close = () => {
    setOpen(false)
    setConfirming(false)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) close()
    }
    const onKeyDown = (e) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const toggle = (e) => {
    e.stopPropagation()
    if (open) return close()

    // flip upward near the bottom of the scroll container, which clips overflow
    const button = ref.current?.getBoundingClientRect()
    const list = ref.current?.closest("[data-chat-list]")?.getBoundingClientRect()
    setAbove(button && list ? list.bottom - button.bottom < 90 : false)
    setOpen(true)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (!confirming) return setConfirming(true)
    close()
    onDelete()
  }

  return (
    <div
      ref={ref}
      className='relative z-20 shrink-0'
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type='button'
        aria-label='Chat options'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={toggle}
        className={`flex items-center justify-center w-6 h-6 rounded-md border-none bg-transparent cursor-pointer
          text-slate-500 hover:text-slate-200
          transition-[opacity,color] duration-200 ${EASE} motion-reduce:transition-none
          ${open
            ? "opacity-100 text-slate-200"
            : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div
          className={`absolute right-0 ${above ? "bottom-full pb-1" : "top-full pt-1"} min-w-[140px]`}
        >
          <div
            role='menu'
            className='p-1 rounded-lg border border-white/[0.09] bg-[#080a0e] shadow-[0_10px_28px_rgba(0,0,0,0.7)]'
          >
            <button
              type='button'
              role='menuitem'
              onClick={handleDelete}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md border-none bg-transparent cursor-pointer
                text-[13px] text-left whitespace-nowrap transition-colors duration-150 ${EASE}
                ${confirming
                  ? "text-red-300 bg-red-500/10 hover:bg-red-500/20"
                  : "text-red-400 hover:bg-red-500/10"}`}
            >
              <Trash2 size={13} />
              {confirming ? "Really delete?" : "Delete chat"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatItemMenu
