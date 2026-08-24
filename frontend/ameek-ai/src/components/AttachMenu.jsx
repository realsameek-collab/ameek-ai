import React, { useEffect, useRef } from 'react'
import { FileText, ImageUp, Upload } from 'lucide-react'

const OPTIONS = [
  { id: 'file', icon: Upload, label: 'Upload file' },
  { id: 'image', icon: ImageUp, label: 'Add image' },
  { id: 'doc', icon: FileText, label: 'Add document' },
]

/**
 * Desktop attachment popover, anchored above the attach button.
 * Nothing is wired to a file picker yet - each option reports progress.
 */
function AttachMenu({ open, onSelect, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) onClose()
    }
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      role='menu'
      className='absolute bottom-full left-0 mb-2 z-30 min-w-[188px] p-1
        rounded-xl border border-white/[0.09] bg-[#12141a] shadow-ambient-lg animate-rise'
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.id}
            type='button'
            role='menuitem'
            onClick={() => onSelect(option.label)}
            className='w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-none
              bg-transparent cursor-pointer text-left text-[13px] text-slate-300 whitespace-nowrap
              outline-none focus-visible:focus-ring
              transition-colors duration-150 ease-premium hover:bg-white/[0.06] hover:text-slate-100'
          >
            <Icon size={15} strokeWidth={1.75} className='shrink-0 text-slate-500' />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default AttachMenu
