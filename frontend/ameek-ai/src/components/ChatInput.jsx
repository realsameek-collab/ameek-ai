import {
  AudioLines,
  Code2,
  FileText,
  Globe,
  ImageIcon,
  MessageSquare,
  Mic,
  Paperclip,
  PenLine,
  Plus,
  Presentation,
  Send,
  Square,
  X,
  Zap,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import sendMessage from '../features/sendMessage'
import { createConversation } from '../features/CreateConversation'
import { generateTitle } from '../features/generateTitle'
import AgentSheet from './AgentSheet'
import AttachSheet from './AttachSheet'
import AttachMenu from './AttachMenu'
import { useDispatch, useSelector } from 'react-redux'
import { addConversation, setSelectedConversation, updateConversationTitle } from '../redux/conversationSlice'
import { addMessage, setError, setPending } from '../redux/messageSlice'
import { openArtifact, setArtifact } from '../redux/artifactSlice'
import detectArtifact from '../utils/detectArtifact'

// label is what the UI shows, value is what the graph router expects.
// "image" maps to the vision node - sending "image" would fall through to chat.
const agents = [
  { id: 'auto', icon: Zap, label: 'Auto', value: 'auto' },
  { id: 'chat', icon: MessageSquare, label: 'Chat', value: 'chat' },
  { id: 'coding', icon: Code2, label: 'Coding', value: 'coding' },
  { id: 'pdf', icon: FileText, label: 'PDF', value: 'pdf' },
  { id: 'ppt', icon: Presentation, label: 'PPT', value: 'ppt' },
  { id: 'vision', icon: ImageIcon, label: 'vision', value: 'vision' },
  { id: 'search', icon: Globe, label: 'Search', value: 'search' },
]

const MOBILE_QUERY = '(max-width: 1023.98px), (pointer: coarse)'

// actions for the focused mobile composer. each one selects an agent that
// already exists in `agents` above - nothing here invents new behaviour.
// `agent` must match that list's `label` exactly, which is what the mode pill
// and the send path both read.
const QUICK_ACTIONS = [
  { id: 'image', icon: ImageIcon, label: 'Create an image', agent: 'vision' },
  { id: 'write', icon: PenLine, label: 'Write or edit', agent: 'Chat' },
  { id: 'search', icon: Globe, label: 'Search the web', agent: 'Search' },
]

function ChatInput({ value, setValue, onFocusChange }) {
  const [selectedAgent, setSelectedAgent] = useState('Auto')
  const [loading, setLoading] = useState(false)
  const [writing, setWriting] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [file, setFile] = useState(null)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  )

  const dispatch = useDispatch()
  const { selectedConversation } = useSelector((state) => state.conversation)
  const { artifact, open: artifactOpen } = useSelector((state) => state.artifact)
  const { error, retryToken } = useSelector((state) => state.message)
  const messageCount = useSelector((state) => state.message.messages.length)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const autoFocused = useRef(false)
  const lastRetry = useRef(0)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // ready the input on mobile so the user can type straight away. iOS will not
  // raise the keyboard without a gesture - we do not try to force it.
  useEffect(() => {
    if (!isMobile || autoFocused.current) return
    autoFocused.current = true
    inputRef.current?.focus({ preventScroll: true })
  }, [isMobile])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  // focus drives width only. height is content driven, so tapping an empty
  // input never changes the bar's vertical size.
  const focused = writing

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = '24px'
    el.style.height = `${Math.min(el.scrollHeight, isMobile ? 96 : 168)}px`
  }, [value, isMobile])

  // mirrors the server's multer rules, so a rejected file is caught here
  // instead of coming back as a 500
  const MAX_FILE_MB = 20

  const pickFile = () => {
    setAttachOpen(false)
    fileInputRef.current?.click()
  }

  // browsers do not always report a MIME type - HEIC, some screenshots and
  // files from certain Windows sources arrive with type "". multer reads that
  // same empty value and rejects them, so fall back to the extension.
  const EXT_MIME = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    gif: 'image/gif', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif',
    pdf: 'application/pdf',
  }

  const resolveType = (f) => {
    if (f.type) return f.type
    return EXT_MIME[f.name?.split('.').pop()?.toLowerCase()] ?? ''
  }

  const handleFileChange = (e) => {
    const picked = e.target.files?.[0]
    // reset immediately so choosing the same file twice still fires onChange
    e.target.value = ''
    if (!picked) return

    const type = resolveType(picked)
    const isAllowed = type === 'application/pdf' || type.startsWith('image/')
    if (!isAllowed) return setToast(`Can't attach "${picked.name}" - images and PDFs only.`)
    if (picked.size > MAX_FILE_MB * 1024 * 1024) {
      return setToast(`"${picked.name}" is over ${MAX_FILE_MB}MB.`)
    }

    // rebuild only when the browser gave us nothing, so the multipart part
    // carries a real mimetype and the router can classify it
    setFile(picked.type ? picked : new File([picked], picked.name, { type }))
    inputRef.current?.focus({ preventScroll: true })
  }

  /**
   * One send attempt.
   *
   * The user's message and the thinking state are committed before any network
   * call, so the screen is never blank while waiting. `skipUserMessage` is used
   * by Try again, where the message is already on screen from the failed try.
   */
  const runSend = async (prompt, { skipUserMessage = false, attachment = null } = {}) => {
    if (!prompt || loading) return

    setLoading(true)

    if (!skipUserMessage) {
      dispatch(addMessage({ _id: `local-${Date.now()}`, role: 'user', content: prompt }))
    }
    // clears any previous error as part of the same reducer
    dispatch(setPending(true))

    try {
      let conversation = selectedConversation
      const isNewConversation = !conversation?._id

      if (isNewConversation) {
        conversation = await createConversation()
        if (!conversation?._id) {
          // the typed message is kept either way
          const status = conversation?.status
          setToast(
            status === 401 ? 'Session expired. Please log in again.'
            : status === 500 ? 'Server error. Check the gateway and Redis.'
            : status ? `Could not start a chat (${status}).`
            : 'Could not reach the server. Is the gateway running?'
          )
          dispatch(setError({ prompt }))
          return
        }
        dispatch(addConversation(conversation))
        dispatch(setSelectedConversation(conversation))
      }

      // "auto" lets the existing router classify the prompt, exactly as before
      const agent = agents.find((a) => a.label === selectedAgent)?.value ?? 'auto'
      const data = await sendMessage({ prompt, conversationId: conversation._id, agent, file: attachment })

      if (!data?.content) {
        dispatch(setError({ prompt }))
        return
      }

      // batched into a single render, so the reply takes the indicator's place
      // instead of the indicator vanishing first and leaving a gap
      dispatch(setPending(false))
      dispatch(addMessage(data))

      // a deck from the ppt agent wins, otherwise fall back to detecting
      // self-contained html in the reply.
      // isolated: the reply is already on screen, so a detection failure must
      // not fall through to the catch below and show an error under a good answer
      try {
        if (data.artifacts?.type === 'ppt') {
          dispatch(setArtifact(data.artifacts))
        } else {
          const found = detectArtifact(data.content, prompt)
          if (found) dispatch(setArtifact(found))
        }
      } catch {
        // no artifact panel this turn - the message itself is unaffected
      }

      const needsTitle = isNewConversation || !conversation?.title || conversation.title === 'New Chat'

      if (needsTitle) {
        generateTitle({ prompt, conversationId: conversation._id }).then((newTitle) => {
          if (newTitle) {
            dispatch(updateConversationTitle({ _id: conversation._id, title: newTitle }))
          }
        })
      }
    } catch {
      // nothing may leave the indicator spinning forever
      dispatch(setError({ prompt }))
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = () => {
    // an attachment on its own is a valid turn - the server still requires a
    // prompt string, so supply the same wording the agents already default to
    const prompt = value.trim() || (file
      ? (file.type === 'application/pdf' ? 'Summarise this PDF' : 'Analyse this image')
      : '')
    if (!prompt || loading) return

    const attachment = file
    setValue('')
    setFile(null)
    runSend(prompt, { attachment })
  }

  // Try again in the error card bumps retryToken - resend the same prompt
  // without adding a second copy of the user's message
  useEffect(() => {
    if (!retryToken || retryToken === lastRetry.current) return
    lastRetry.current = retryToken
    if (error?.prompt) runSend(error.prompt, { skipUserMessage: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryToken])

  // one place for focus, so the width animation and the empty-state collapse
  // can never disagree. isMobile is passed up rather than re-tested elsewhere -
  // the breakpoint that decides which composer renders also decides this.
  const handleFocus = () => {
    setWriting(true)
    onFocusChange?.(isMobile)
  }

  const handleBlur = () => {
    setWriting(false)
    onFocusChange?.(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSelectAgent = (label) => {
    setSelectedAgent(label)
    setSheetOpen(false)
    inputRef.current?.focus({ preventScroll: true })
  }

  const iconButton = `flex items-center justify-center tap-target rounded-xl border border-transparent
    bg-transparent cursor-pointer text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]
    transition-[color,background-color,transform] duration-200 ease-premium
    active:scale-[0.94] outline-none focus-visible:focus-ring`

  // an attachment alone is enough to send, so the button stops depending on
  // the textarea having content
  const canSend = Boolean(value.trim() || file)

  const activeAgent = agents.find((a) => a.label === selectedAgent) ?? agents[0]
  const ActiveIcon = activeAgent.icon

  const deskIcon = `flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent
    cursor-pointer text-slate-500 hover:text-slate-200 hover:bg-white/[0.07]
    transition-[color,background-color] duration-150 ease-premium
    outline-none focus-visible:focus-ring`

  // mobile bar icons: 40px hit area, 24px visual, muted so the primary
  // action stays the strongest element in the row
  const barIcon = `shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-none
    bg-transparent cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]
    transition-[color,background-color,transform] duration-200 ease-premium
    active:scale-[0.92] outline-none focus-visible:focus-ring`

  return (
    <div className={`w-full px-3 md:px-5 py-3 lg:py-4 bg-[#0d0f14]
      pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-4
      ${isMobile ? 'border-t border-white/[0.06]' : ''}`}>

      {artifact && !artifactOpen && (
        <button
          type='button'
          onClick={() => dispatch(openArtifact())}
          className='mx-auto mb-2 flex w-fit max-w-full items-center gap-2 rounded-full border border-white/[0.08]
            bg-white/[0.04] px-3 py-1.5 text-[12px] text-slate-300 cursor-pointer outline-none
            focus-visible:focus-ring transition-[background-color,transform] duration-200 ease-premium
            hover:bg-white/[0.07] active:scale-[0.97] animate-fade-in'
        >
          {artifact.type === 'ppt'
            ? <Presentation size={13} className='text-indigo-400 shrink-0' />
            : <Code2 size={13} className='text-indigo-400 shrink-0' />}
          <span className='truncate'>{artifact.title}</span>
          <span className='text-slate-600'>·</span>
          <span className='text-slate-500 shrink-0'>Open</span>
        </button>
      )}

      {/* quick actions. same condition as the collapsed empty state, plus an
          empty input - once there is a message, or the user has started
          typing, they are gone. mobile only. */}
      {isMobile && writing && messageCount === 0 && !value.trim() && (
        <div className='mb-1.5 animate-rise'>
          {QUICK_ACTIONS.map(({ id, icon: Icon, label, agent }) => (
            <button
              key={id}
              type='button'
              // keeps focus on the textarea, so the keyboard never drops and
              // the empty state never flashes back in mid-tap
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSelectedAgent(agent)
                inputRef.current?.focus({ preventScroll: true })
              }}
              className='w-full flex items-center gap-3 px-2 min-h-[44px] rounded-xl
                border-none bg-transparent cursor-pointer text-left text-[14px] text-slate-400
                outline-none focus-visible:focus-ring
                transition-[background-color,color] duration-200 ease-premium
                hover:bg-white/[0.05] hover:text-slate-200 active:bg-white/[0.07]'
            >
              <Icon size={17} strokeWidth={1.75} className='shrink-0 text-slate-500' />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*,application/pdf'
        onChange={handleFileChange}
        className='hidden'
        aria-hidden
        tabIndex={-1}
      />

      {file && (
        <div className='mx-auto mb-2 flex w-fit max-w-full items-center gap-2 rounded-xl border
          border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[12px] text-slate-300 animate-fade-in'>
          {file.type === 'application/pdf'
            ? <FileText size={14} className='shrink-0 text-indigo-400' />
            : <ImageIcon size={14} className='shrink-0 text-indigo-400' />}
          <span className='truncate max-w-[220px]'>{file.name}</span>
          <button
            type='button'
            aria-label='Remove attachment'
            onClick={() => setFile(null)}
            className='shrink-0 flex items-center justify-center w-5 h-5 rounded-md border-none
              bg-transparent text-slate-500 cursor-pointer outline-none focus-visible:focus-ring
              transition-colors duration-150 ease-premium hover:text-slate-200'
          >
            <X size={13} />
          </button>
        </div>
      )}

      {toast && (
        <div
          role='status'
          className='mx-auto mb-2 w-fit max-w-full rounded-full border border-white/[0.08]
            glass px-3.5 py-2 text-[12.5px] text-slate-200 shadow-ambient animate-fade-in'
        >
          {toast}
        </div>
      )}

      {isMobile ? (
        /* ---------------- mobile / tablet: single pill bar ---------------- */
        <div className={`flex items-end gap-1.5 rounded-[26px] border bg-white/[0.08]
          pl-2 pr-1.5 py-1.5 transition-[margin,border-color,background-color]
          duration-200 ease-premium
          ${focused
            ? 'mx-0 border-white/[0.12] bg-white/[0.10]'
            : 'mx-4 border-white/[0.06]'}`}>

          <button
            type='button'
            aria-label='Add attachment'
            onClick={() => setAttachOpen(true)}
            className={barIcon}
          >
            <Plus size={22} strokeWidth={1.75} />
          </button>

          <textarea
            ref={inputRef}
            placeholder={loading ? 'Thinking...' : 'Ameek is here .....'}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={loading}
            value={value}
            rows={1}
            className='flex-1 min-w-0 h-6 max-h-24 mb-2 bg-transparent outline-none resize-none
              text-[15px] text-slate-100 placeholder:text-slate-500 leading-6 py-0
              [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50'
          />

          {/* right cluster stays grouped and anchored while the input flexes */}
          <div className='flex shrink-0 items-center gap-1.5'>
            <button
              type='button'
              onClick={() => setSheetOpen(true)}
              aria-label={`Assistant: ${activeAgent.label}`}
              className='shrink-0 inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-full
                bg-white/[0.07] text-[12.5px] font-medium text-slate-300 border-none
                cursor-pointer outline-none focus-visible:focus-ring
                transition-[background-color,transform] duration-200 ease-premium
                hover:bg-white/[0.11] active:scale-[0.96]'
            >
              <ActiveIcon size={15} strokeWidth={1.75} className='text-indigo-400' />
              {activeAgent.label}
            </button>

            <button
              type='button'
              aria-label='Voice input'
              onClick={() => setToast('This feature is still in progress')}
              className={barIcon}
            >
              <Mic size={19} strokeWidth={1.75} />
            </button>

            <button
              type='button'
              disabled={loading}
              aria-label={loading ? 'Generating' : canSend ? 'Send message' : 'Talk with Ameek AI'}
              onClick={() => {
                if (loading) return
                if (canSend) handleSendMessage()
                else setToast('This feature is still in progress')
              }}
              className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-full border-none
                outline-none focus-visible:focus-ring
                transition-[background-color,opacity,transform] duration-200 ease-premium
                ${loading
                  ? 'bg-white/[0.10] text-slate-400 cursor-default'
                  : 'bg-indigo-500 text-white cursor-pointer hover:opacity-90 active:scale-[0.94]'}`}
            >
              <span key={loading ? 'stop' : canSend ? 'send' : 'voice'}
                className='flex animate-fade-in'>
                {loading
                  ? <Square size={13} strokeWidth={2.4} />
                  : canSend
                    ? <Send size={17} strokeWidth={1.9} />
                    : <AudioLines size={18} strokeWidth={1.9} />}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* ---------------- desktop / laptop ---------------- */
        <div className={`w-full mx-auto transition-[max-width] duration-200 ease-premium
          ${focused ? 'max-w-[56rem]' : 'max-w-[52rem]'}`}>
          <div className={`rounded-2xl border bg-white/[0.03] overflow-hidden
            transition-[border-color,background-color,box-shadow] duration-200 ease-premium
            ${focused
              ? 'border-white/[0.12] bg-white/[0.045] shadow-ambient'
              : 'border-white/[0.07] shadow-ambient-sm'}`}>

            {/* mode row - compresses before it ever overflows */}
            <div className='flex items-center gap-1 px-2 pt-2 pb-1
              overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              {agents.map((agent) => {
                const isActive = selectedAgent === agent.label
                const Icon = agent.icon
                return (
                  <button
                    key={agent.id}
                    type='button'
                    title={agent.label}
                    aria-pressed={isActive}
                    onClick={() => setSelectedAgent(agent.label)}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2 xl:px-2.5 rounded-lg
                      text-[11.5px] xl:text-xs font-medium border cursor-pointer outline-none
                      focus-visible:focus-ring
                      transition-[background-color,color,border-color] duration-150 ease-premium
                      ${isActive
                        ? 'bg-indigo-500/15 text-slate-100 border-indigo-500/30'
                        : 'bg-transparent text-slate-500 border-transparent hover:bg-white/[0.05] hover:text-slate-300'}`}
                  >
                    <Icon size={13} strokeWidth={1.75}
                      className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                    <span>{agent.label}</span>
                  </button>
                )
              })}
            </div>

            <textarea
              ref={inputRef}
              placeholder={loading ? 'Thinking...' : 'Ask anything...'}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={loading}
              value={value}
              rows={1}
              className='w-full h-6 max-h-[168px] px-4 pt-1.5 pb-1 bg-transparent outline-none resize-none
                text-[14.5px] text-slate-100 placeholder:text-slate-500 leading-6 overflow-y-auto
                disabled:opacity-50
                [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full'
            />

            <div className='flex items-center justify-between gap-2 px-2 pb-2 pt-1'>
              <div className='relative flex items-center gap-0.5'>
                <button
                  type='button'
                  title='Attach'
                  aria-label='Attach'
                  aria-expanded={attachOpen}
                  onClick={() => setAttachOpen((v) => !v)}
                  className={deskIcon}
                >
                  <Paperclip size={17} strokeWidth={1.75} />
                </button>

                <button
                  type='button'
                  title='Voice input'
                  aria-label='Voice input'
                  onClick={() => setToast('This feature is still in progress')}
                  className={deskIcon}
                >
                  <Mic size={17} strokeWidth={1.75} />
                </button>

                <AttachMenu
                  open={attachOpen}
                  onClose={() => setAttachOpen(false)}
                  onSelect={pickFile}
                />
              </div>

              <button
                type='button'
                disabled={loading}
                title={loading ? 'Generating' : canSend ? 'Send' : 'Voice'}
                aria-label={loading ? 'Generating' : canSend ? 'Send message' : 'Talk with Ameek AI'}
                onClick={() => {
                  if (loading) return
                  if (canSend) handleSendMessage()
                  else setToast('This feature is still in progress')
                }}
                className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border-none
                  outline-none focus-visible:focus-ring
                  transition-[background-color,opacity,transform] duration-200 ease-premium
                  ${loading
                    ? 'bg-white/[0.08] text-slate-400 cursor-default'
                    : 'bg-indigo-500 text-white cursor-pointer hover:bg-indigo-400 active:scale-[0.94]'}`}
              >
                <span key={loading ? 'stop' : canSend ? 'send' : 'voice'}
                  className='flex animate-fade-in'>
                  {loading
                    ? <Square size={13} strokeWidth={2.4} />
                    : canSend
                      ? <Send size={16} strokeWidth={1.9} />
                      : <AudioLines size={17} strokeWidth={1.9} />}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AgentSheet
        open={sheetOpen}
        agents={agents}
        selected={selectedAgent}
        onSelect={handleSelectAgent}
        onClose={() => setSheetOpen(false)}
      />

      <AttachSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onSelect={pickFile}
      />
    </div>
  )
}

export default ChatInput
