import React from 'react'

/**
 * The AmeekAI mark, same geometry as the splash screen so the identity stays
 * consistent. Static shape - only the glow animates, and only while thinking.
 */
export function AmeekMark({ size = 15, className = '' }) {
  return (
    <svg
      viewBox='0 0 64 64'
      width={size}
      height={size}
      aria-hidden
      focusable='false'
      className={className}
    >
      <path
        d='M12 52 L32 14 L52 52'
        fill='none'
        stroke='currentColor'
        strokeWidth='6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='32' cy='40' r='5' fill='currentColor' />
    </svg>
  )
}

/**
 * Shown in the assistant's slot the instant a message is sent.
 *
 * Deliberately occupies the same row geometry as an assistant MessageBubble
 * (justify-start, mb-6) so the real reply lands exactly where this sat - no
 * layout jump when one replaces the other.
 *
 * The wording never changes while it runs. The backend reports no processing
 * stages, so claiming any would be fiction.
 */
function ThinkingIndicator() {
  return (
    <div className='flex justify-start mb-6 animate-fade-in'>
      <div
        role='status'
        aria-live='polite'
        aria-label='AmeekAI is generating a response'
        className='inline-flex items-center gap-2 text-[13px] select-none'
      >
        <AmeekMark className='thinking-mark shrink-0 text-indigo-400' />

        <span className='font-medium text-slate-300'>AmeekAI</span>
        <span className='text-slate-500'>Thinking</span>

        <span aria-hidden className='flex items-center gap-1 pl-0.5 text-indigo-400'>
          <span className='thinking-dot' />
          <span className='thinking-dot' />
          <span className='thinking-dot' />
        </span>
      </div>
    </div>
  )
}

export default ThinkingIndicator
