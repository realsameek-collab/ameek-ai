import React from 'react'

/**
 * Mobile / tablet launch splash.
 *
 * Visibility is decided entirely in CSS (see .splash-only in index.css), so
 * desktop never renders it and no JS media query, listener or loop is needed.
 * `exiting` drives the fade-out just before App unmounts it.
 */
function SplashScreen({ exiting = false }) {
  return (
    <div
      role='status'
      aria-label='Loading AmeekAI'
      className={`splash-only fixed inset-0 z-[100] flex-col items-center justify-center
        bg-[#0d0f14] px-6 transition-opacity duration-300 ease-premium
        ${exiting ? 'opacity-0' : 'opacity-100'}`}
    >
      <svg className='splash-mark' viewBox='0 0 64 64' aria-hidden focusable='false'>
        <path className='splash-stroke splash-stroke-1' pathLength='1' d='M12 52 L32 14' />
        <path className='splash-stroke splash-stroke-2' pathLength='1' d='M32 14 L52 52' />
        <circle className='splash-node' cx='32' cy='40' r='5' />
      </svg>

      <span aria-hidden className='splash-word'>AmeekAI</span>
      <span className='sr-only'>Loading</span>
    </div>
  )
}

export default SplashScreen
