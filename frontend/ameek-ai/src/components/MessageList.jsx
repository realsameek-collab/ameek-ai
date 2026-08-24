import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowDown, RotateCw } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ThinkingIndicator, { AmeekMark } from './ThinkingIndicator'
import { requestRetry } from '../redux/messageSlice'

/* ---------------------------------------------------------------
   scroll tuning - single source of truth for the whole file
   --------------------------------------------------------------- */

// how close to the bottom still counts as "following along"
const NEAR_BOTTOM_PX = 140

// gap left above a freshly sent message once it is pinned near the top
const ANCHOR_TOP_GAP_PX = 16

// a smooth scroll emits scroll events all the way through. for this long we
// treat them as ours, not as the user changing their mind.
const PROGRAMMATIC_MS = 700

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// reduced motion gets an instant jump instead of an animation
const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth')

function MessageList({ onSuggestion, composerFocused = false }) {
  const dispatch = useDispatch()
  const { selectedConversation } = useSelector((state) => state.conversation)
  const { messages, pending, error } = useSelector((state) => state.message)
  const hasMessages = Array.isArray(messages) && messages.length > 0

  const scrollRef = useRef(null)
  const spacerRef = useRef(null)
  const anchorRef = useRef(null)

  // auto-follow is on. a ref because the scroll handler reads it every frame
  // and must never re-render just to record where the user is.
  const follow = useRef(true)
  const programmaticUntil = useRef(0)
  const settleTimer = useRef(0)
  const rafId = useRef(0)
  const prevLength = useRef(0)

  // the only piece of scroll state React needs to know about
  const [showJump, setShowJump] = useState(false)

  /* -------------------------------------------------------------
     the spacer

     it reserves just enough room below the newest turn for that turn
     to sit at the top of the viewport. once the reply is taller than
     the viewport the spacer computes to 0 and disappears on its own,
     so it never leaves dead space under a long answer.

     because the spacer makes "anchor at top" and "scrolled to bottom"
     the same position, following the reply and pinning the question
     are not competing behaviours.
     ------------------------------------------------------------- */
  const anchorOffset = useCallback(() => {
    const el = scrollRef.current
    const anchor = anchorRef.current
    if (!el || !anchor) return null
    return anchor.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
  }, [])

  const updateSpacer = useCallback(() => {
    const el = scrollRef.current
    const spacer = spacerRef.current
    if (!el || !spacer) return

    const top = anchorOffset()
    if (top === null) {
      spacer.style.height = '0px'
      return
    }

    // measured by subtracting the spacer rather than zeroing it, so the
    // scroll position is never clamped and snapped back mid-measurement
    const contentHeight = el.scrollHeight - spacer.offsetHeight
    const needed = el.clientHeight - (contentHeight - top) - ANCHOR_TOP_GAP_PX
    spacer.style.height = `${Math.max(0, Math.round(needed))}px`
  }, [anchorOffset])

  /* ------------------------- scrolling ------------------------- */

  // reads where we actually ended up and sets the state to match. run after a
  // programmatic scroll settles: pinning a question with a long answer below it
  // legitimately leaves the user away from the bottom, and the button should
  // say so rather than the code assuming it landed at the end.
  const settle = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const near = distance <= NEAR_BOTTOM_PX
    follow.current = near
    setShowJump((v) => (v === !near ? v : !near))
  }, [])

  const scrollTo = useCallback((top, behavior = scrollBehavior()) => {
    const el = scrollRef.current
    if (!el) return
    programmaticUntil.current = Date.now() + (behavior === 'auto' ? 0 : PROGRAMMATIC_MS)
    follow.current = true
    setShowJump(false)
    el.scrollTo({ top, behavior })

    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(settle, behavior === 'auto' ? 0 : PROGRAMMATIC_MS)
  }, [settle])

  const scrollToLatest = useCallback((behavior = scrollBehavior()) => {
    const el = scrollRef.current
    if (!el) return
    scrollTo(el.scrollHeight, behavior)
  }, [scrollTo])

  const scrollToAnchor = useCallback((behavior = scrollBehavior()) => {
    const top = anchorOffset()
    if (top === null) return scrollToLatest(behavior)
    scrollTo(Math.max(0, top - ANCHOR_TOP_GAP_PX), behavior)
  }, [anchorOffset, scrollTo, scrollToLatest])

  // where "following" points: the current turn if there is one, else the end
  const followCurrent = useCallback((behavior = scrollBehavior()) => {
    if (anchorRef.current) scrollToAnchor(behavior)
    else scrollToLatest(behavior)
  }, [scrollToAnchor, scrollToLatest])

  /* ---------------------- reading the scroll ------------------- */

  const handleScroll = useCallback(() => {
    // coalesced to one measurement per frame - a fling fires far more
    // scroll events than there are frames to render
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0
      const el = scrollRef.current
      if (!el) return

      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      const near = distance <= NEAR_BOTTOM_PX

      // our own animation is running: adopt the result if it landed at the
      // bottom, but never read it as the user choosing to leave
      if (Date.now() < programmaticUntil.current) {
        if (near) {
          follow.current = true
          setShowJump((v) => (v ? false : v))
        }
        return
      }

      follow.current = near
      setShowJump((v) => (v === !near ? v : !near))
    })
  }, [])

  // wheel, touch and keys are unambiguous user intent. they cancel the
  // programmatic window immediately, so scrolling away mid-animation is
  // respected instead of being swallowed.
  const handleUserIntent = useCallback(() => {
    programmaticUntil.current = 0
  }, [])

  /* --------------------------- effects ------------------------- */

  // new content. runs before paint so nothing is ever seen in the wrong place.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const length = messages.length
    const previous = prevLength.current
    prevLength.current = length

    const last = messages[length - 1]
    const isSend =
      length === previous + 1 &&
      last?.role === 'user' &&
      String(last?._id ?? '').startsWith('local-')

    if (isSend) {
      // a freshly sent message outranks wherever the user was reading
      anchorRef.current = el.querySelector(`[data-mid="${String(last._id)}"]`)
      updateSpacer()
      scrollToAnchor()
      return
    }

    updateSpacer()

    // following means staying with the current turn. anchored to the question
    // rather than the raw bottom, so a reply taller than the viewport opens at
    // its first line instead of its last.
    if (follow.current) followCurrent()
  }, [messages, pending, error, updateSpacer, scrollToAnchor, followCurrent])

  // a different conversation opens at its newest message, with no state
  // carried over from the previous one
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    anchorRef.current = null
    if (spacerRef.current) spacerRef.current.style.height = '0px'
    clearTimeout(settleTimer.current)
    follow.current = true
    setShowJump(false)
    prevLength.current = messages.length
    scrollToLatest('auto')
    // messages is intentionally omitted - this is about switching, not content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?._id])

  // viewport changes: window resize, orientation, and the mobile keyboard
  // opening all resize this container
  useEffect(() => {
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      updateSpacer()
      // instant - an animated correction during a resize reads as drift
      if (follow.current) followCurrent('auto')
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateSpacer, followCurrent])

  useEffect(() => () => {
    if (rafId.current) cancelAnimationFrame(rafId.current)
    clearTimeout(settleTimer.current)
  }, [])

  const showEmpty = !hasMessages && !pending && !error

  // the greeting only ever collapses while it is the thing on screen. once a
  // message exists showEmpty is false, so a sent conversation can never bring
  // it back - no separate "has started" flag needed.
  const collapsed = showEmpty && composerFocused

  return (
    <div className='relative flex-1 min-h-0'>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleUserIntent}
        onTouchMove={handleUserIntent}
        onKeyDown={handleUserIntent}
        className={`h-full overflow-y-auto overscroll-contain px-6
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          ${collapsed ? 'py-0' : 'py-6'}`}
      >
        {showEmpty ? (
          /* mobile: tapping the composer clears the greeting out of the way so
             the input owns the screen. composerFocused is only ever true at the
             mobile breakpoint, so the desktop layout below is untouched. */
          <div
            aria-hidden={collapsed || undefined}
            className={`empty-state flex flex-col items-center justify-center gap-4 text-center
              ${collapsed ? 'is-collapsed' : ''}`}
          >
            <div className='flex flex-col gap-1.5'>
              <h1 className='text-[20px] font-semibold text-slate-200 tracking-tight'>AmeekAI</h1>
              <p className='text-[15px] font-semibold text-slate-400 tracking-tight'>How can I help you?</p>
              <p className='text-[13px] text-slate-600 max-w-[260px] leading-relaxed'>
                Ask me anything — code, ideas, explanations, or just a quick question.
              </p>
            </div>
            <div className='flex flex-wrap justify-center gap-2 mt-1'>
              {["Write a Netflix clone","Explain Redis","Build a dashboard"].map((s)=>(
                 <button
                   key={s}
                   type='button'
                   tabIndex={collapsed ? -1 : 0}
                   onClick={() => onSuggestion?.(s)}
                   className='text-[12px] text-slate-400 bg-white/[0.04] border border-white/[0.07] px-3 py-2 min-h-[40px] rounded-lg
                     hover:bg-white/[0.08] hover:text-slate-200 cursor-pointer outline-none focus-visible:focus-ring
                     transition-[background-color,color,transform] duration-200 ease-premium active:scale-[0.97]'>
                  {s}
                 </button>
              ))}
            </div>
          </div>
        ) : (
         <div>
          {messages?.map((msg,i)=>(
            <div key={msg?._id ?? i} data-mid={msg?._id ?? ''}>
              <MessageBubble role={msg?.role} content={msg?.content} images={msg?.images || []}/>
            </div>
          ))}

          {pending && <ThinkingIndicator />}

          {error && (
            <div className='flex justify-start mb-6 animate-fade-in'>
              <div className='flex flex-col gap-2 text-[13px]'>
                <div className='flex items-center gap-2'>
                  <AmeekMark className='shrink-0 text-slate-500' />
                  <span className='font-medium text-slate-300'>AmeekAI</span>
                </div>
                <p className='m-0 text-slate-400'>
                  Something went wrong. Please try again.
                </p>
                <button
                  type='button'
                  onClick={() => dispatch(requestRetry())}
                  className='inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/[0.09]
                    bg-white/[0.04] px-2.5 py-1.5 text-[12.5px] text-slate-300 cursor-pointer
                    outline-none focus-visible:focus-ring
                    transition-[background-color,transform] duration-200 ease-premium
                    hover:bg-white/[0.08] hover:text-slate-100 active:scale-[0.97]'
                >
                  <RotateCw size={13} strokeWidth={2} />
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* room for the newest turn to reach the top. height is written
              directly to the node - it must not cost a render. */}
          <div ref={spacerRef} aria-hidden style={{ height: 0 }} />
         </div>
        )}
      </div>

      {showJump && (
        <button
          type='button'
          aria-label='Jump to latest message'
          onClick={() => scrollToLatest()}
          className='absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center
            w-9 h-9 rounded-full border border-white/[0.10] glass text-slate-400
            shadow-ambient cursor-pointer outline-none focus-visible:focus-ring animate-fade-in
            transition-[background-color,color,transform] duration-200 ease-premium
            hover:text-slate-100 hover:border-white/[0.16] active:scale-[0.92]'
        >
          <ArrowDown size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

export default MessageList
