import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import {useDispatch, useSelector} from 'react-redux'
import getMessages  from '../features/getMessages'
import {clearError, setMessages, setPending} from '../redux/messageSlice'
function ChatArea() {
  const { selectedConversation } = useSelector((state) => state.conversation)
  const dispatch = useDispatch()
  const [draft, setDraft] = useState('')

  // only ever true on mobile - ChatInput reports focus against its own
  // breakpoint, so desktop never enters the collapsed empty state
  const [composerFocused, setComposerFocused] = useState(false)

  // id of the conversation whose history is currently in the store
  const loadedId = useRef(null)

  // mirrored into a ref so the fetch callback can compare against the live
  // store without re-running the effect every time a message arrives
  const messageCount = useSelector((state) => state.message.messages.length)
  const countRef = useRef(0)
  countRef.current = messageCount

  useEffect(() => {
    const id = selectedConversation?._id ?? null

    if (!id) {
      // New Chat - nothing from the previous conversation survives, including
      // an indicator or error card left over from it
      dispatch(setMessages([]))
      dispatch(setPending(false))
      dispatch(clearError())
      loadedId.current = null
      return
    }

    // clear only when moving between two real conversations. coming from a
    // blank slate must not clear, because ChatInput has already put the user's
    // message in the store optimistically and this effect would wipe it.
    const isSwitch = loadedId.current !== null && loadedId.current !== id
    if (isSwitch) {
      dispatch(setMessages([]))
      // a thinking indicator or error card belongs to the conversation it was
      // raised in - it must not follow the user into a different one.
      // null -> id is not a switch, so a brand new chat keeps its indicator.
      dispatch(setPending(false))
      dispatch(clearError())
    }
    loadedId.current = id

    let cancelled = false

    getMessages(id).then((data) => {
      if (cancelled) return
      // an empty history means the server has not stored this turn yet - the
      // optimistic messages on screen are newer than this response, so keep them
      if (!Array.isArray(data) || data.length === 0) return
      // a slow history response must never replace a longer optimistic list -
      // that would delete the reply the user is already reading
      if (data.length < countRef.current) return
      dispatch(setMessages(data))
    })

    return () => { cancelled = true }
  }, [selectedConversation?._id, dispatch])

  return (
    <div className = 'flex-1 min-w-0 flex flex-col'>
      <Nav/>
      <MessageList onSuggestion={setDraft} composerFocused={composerFocused}/>
      <ChatInput value={draft} setValue={setDraft} onFocusChange={setComposerFocused}/>
    </div>
  )
}

export default ChatArea