import React, { useEffect } from 'react'

/**
 * Touch-only delete confirmation for the sidebar chat list.
 * Presentation only - confirming calls back into the existing delete handler.
 */
function ConfirmDeleteSheet({ open, title, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-[80] flex items-end'>
      <div
        aria-hidden
        onClick={onCancel}
        className='absolute inset-0 bg-black/55 backdrop-blur-sm animate-fade-in'
      />

      <div
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='confirm-delete-title'
        className='relative w-full rounded-t-2xl border-t border-white/[0.08] bg-[#0d0f14]
          shadow-ambient-lg animate-sheet-up px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]'
      >
        <div className='flex justify-center pb-3'>
          <span className='h-1 w-9 rounded-full bg-white/15' />
        </div>

        <p id='confirm-delete-title' className='text-[15px] font-semibold text-slate-100'>
          Delete chat?
        </p>
        <p className='mt-1.5 text-[13px] leading-relaxed text-slate-400'>
          {title ? (
            <>“<span className='text-slate-300'>{title}</span>” and its messages will be removed. This cannot be undone.</>
          ) : (
            <>This chat and its messages will be removed. This cannot be undone.</>
          )}
        </p>

        <div className='mt-4 flex gap-2.5'>
          <button
            type='button'
            onClick={onCancel}
            className='flex-1 min-h-[46px] rounded-xl border border-white/[0.08] bg-white/[0.04]
              text-[14px] font-medium text-slate-200 cursor-pointer outline-none focus-visible:focus-ring
              transition-[background-color,transform] duration-200 ease-premium
              hover:bg-white/[0.07] active:scale-[0.98]'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className='flex-1 min-h-[46px] rounded-xl border border-red-500/25 bg-red-500/12
              text-[14px] font-medium text-red-300 cursor-pointer outline-none focus-visible:focus-ring
              transition-[background-color,transform] duration-200 ease-premium
              hover:bg-red-500/20 active:scale-[0.98]'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteSheet
