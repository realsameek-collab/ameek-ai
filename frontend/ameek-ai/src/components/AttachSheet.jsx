import React, { useEffect } from 'react'
import { Camera, FileUp, ImageUp } from 'lucide-react'

const OPTIONS = [
  { id: 'image', icon: ImageUp, label: 'Upload image' },
  { id: 'file', icon: FileUp, label: 'Upload file' },
  { id: 'camera', icon: Camera, label: 'Take photo' },
]

/**
 * Mobile attach menu. Nothing is wired to a file picker or the camera yet -
 * every option reports that it is still in progress.
 */
function AttachSheet({ open, onSelect, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className='lg:hidden fixed inset-0 z-[70] flex items-end'>
      <div
        aria-hidden
        onClick={onClose}
        className='absolute inset-0 bg-black/55 backdrop-blur-sm animate-fade-in'
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-label='Add to conversation'
        className='relative w-full rounded-t-2xl border-t border-white/[0.08] bg-[#0d0f14]
          shadow-ambient-lg animate-sheet-up pb-[max(1rem,env(safe-area-inset-bottom))]'
      >
        <div className='flex justify-center pt-2.5 pb-1'>
          <span className='h-1 w-9 rounded-full bg-white/15' />
        </div>

        <p className='px-5 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500'>
          Add
        </p>

        <div className='px-2.5 pb-1'>
          {OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type='button'
                onClick={() => onSelect(option.label)}
                className='w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl border-none cursor-pointer
                  bg-transparent text-left text-[14px] text-slate-300 outline-none focus-visible:focus-ring
                  transition-[background-color,transform] duration-200 ease-premium
                  hover:bg-white/[0.05] active:scale-[0.99]'
              >
                <span className='flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-white/[0.05] text-slate-400'>
                  <Icon size={16} />
                </span>
                <span className='flex-1 font-medium'>{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AttachSheet
