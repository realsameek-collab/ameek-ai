import React, { useEffect } from 'react'
import { Check } from 'lucide-react'

/**
 * Mobile / tablet agent picker. Presentation only - selecting an option calls
 * back with the same value the desktop chips already use.
 */
function AgentSheet({ open, agents, selected, onSelect, onClose }) {
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
        aria-label='Choose an assistant'
        className='relative w-full rounded-t-2xl border-t border-white/[0.08] bg-[#0d0f14]
          shadow-ambient-lg animate-sheet-up pb-[max(1rem,env(safe-area-inset-bottom))]'
      >
        <div className='flex justify-center pt-2.5 pb-1'>
          <span className='h-1 w-9 rounded-full bg-white/15' />
        </div>

        <p className='px-5 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500'>
          Assistant
        </p>

        <div className='px-2.5 pb-1'>
          {agents.map((agent) => {
            const Icon = agent.icon
            const isActive = selected === agent.label
            return (
              <button
                key={agent.id}
                type='button'
                onClick={() => onSelect(agent.label)}
                className={`w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl border-none cursor-pointer
                  text-left text-[14px] outline-none focus-visible:focus-ring
                  transition-[background-color,transform] duration-200 ease-premium active:scale-[0.99]
                  ${isActive ? 'bg-indigo-500/10 text-slate-100' : 'bg-transparent text-slate-300 hover:bg-white/[0.05]'}`}
              >
                <span className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-lg
                  ${isActive ? 'bg-indigo-500/15 text-indigo-400' : 'bg-white/[0.05] text-slate-500'}`}>
                  <Icon size={16} />
                </span>
                <span className='flex-1 font-medium'>{agent.label}</span>
                {isActive && <Check size={16} className='text-indigo-400 shrink-0' />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AgentSheet
