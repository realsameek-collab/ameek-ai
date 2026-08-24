import React from 'react'
import { Coins, LogOut, MessageSquare, PanelLeftIcon, PanelRight, PenSquare, Plus, Search, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ChatPanel from './ChatPanel'
import { AmeekMark } from './ThinkingIndicator'
import { getConversation } from '../features/getConversation'
import { useDispatch, useSelector } from 'react-redux'
import { removeConversation, setConversations, setSelectedConversation } from '../redux/conversationSlice'
import { deleteConversation } from '../features/deleteConversation'
import ConversationRow from './ConversationRow'
import ConfirmDeleteSheet from './ConfirmDeleteSheet'
import logOut from '../features/logOut'
import { setUserData } from '../redux/userSlice'

const iconButton = `flex items-center justify-center tap-target rounded-lg bg-transparent border-none
    cursor-pointer text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]
    transition-[color,background-color,transform] duration-200 ease-premium
    active:scale-[0.94] outline-none focus-visible:focus-ring`

function SideBar() {

    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    // which flyout the rail has open: null | 'chats' | 'search'
    const [panel, setPanel] = useState(null)
    const railRef = useRef(null)
    const [pendingDelete, setPendingDelete] = useState(null)
    const dispatch = useDispatch()
    const [imageError, setImageError] = useState(false)
    const { conversations = [], selectedConversation } = useSelector(state => state.conversation)
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        const getConv = async () => {
            const data = await getConversation()
            dispatch(setConversations(data))
        }
        getConv()
    }, [userData?._id])

    useEffect(() => {
        if (!mobileOpen) return
        const onKeyDown = (e) => { if (e.key === "Escape") setMobileOpen(false) }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [mobileOpen])

    const handleCreateConversation = () => {
        // enter a pristine draft - nothing is persisted or pushed into the sidebar
        // until ChatInput commits it on the first successful send
        dispatch(setSelectedConversation(null))
        setMobileOpen(false)
    }

    const handleSelectConversation = (conv) => {
        dispatch(setSelectedConversation(conv))
        setMobileOpen(false)
    }

    const handleDeleteConversation = async (conversationId) => {
        const ok = await deleteConversation(conversationId)
        if (!ok) return
        dispatch(removeConversation(conversationId))
        if (selectedConversation?._id === conversationId) {
            dispatch(setSelectedConversation(null))
        }
    }

    const listScroll = 'flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

    return (
        <>
            {/* mobile drawer trigger - hidden once the panel is open */}
            <button
                type='button'
                aria-label='Open chat list'
                onClick={() => setMobileOpen(true)}
                className={`lg:hidden fixed top-3 left-3 z-40 tap-target flex items-center justify-center
                    rounded-xl glass border border-white/[0.08] text-slate-300 shadow-ambient
                    transition-[opacity,transform] duration-200 ease-premium active:scale-[0.96]
                    outline-none focus-visible:focus-ring
                    ${mobileOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <PanelRight size={18} />
            </button>

            {/* backdrop */}
            {mobileOpen && (
                <div
                    aria-hidden
                    onClick={() => setMobileOpen(false)}
                    className='lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in'
                />
            )}

            {/* collapsed rail - desktop only */}
            <div ref={railRef} className={`${collapsed ? 'lg:flex' : 'lg:hidden'} hidden relative flex-col items-center w-[64px] h-screen
                bg-[#0d0f14] border-r border-white/[0.06] py-3 gap-0.5 shrink-0`}>

                {/* logo doubles as the expand control - it swaps to the panel
                    icon on hover, so the rail keeps one slot instead of two */}
                <button
                    type='button'
                    aria-label='Expand sidebar'
                    title='Expand sidebar'
                    onClick={() => { setPanel(null); setCollapsed(false) }}
                    className={`${iconButton} group relative mb-1`}
                >
                    <AmeekMark
                        size={19}
                        className='text-indigo-400 transition-opacity duration-200 ease-premium group-hover:opacity-0'
                    />
                    <span aria-hidden className='absolute inset-0 flex items-center justify-center
                        opacity-0 transition-opacity duration-200 ease-premium group-hover:opacity-100'>
                        <PanelRight size={18} />
                    </span>
                </button>

                <button type='button' aria-label='New chat' title='New chat'
                    className={iconButton}
                    onClick={() => { setPanel(null); handleCreateConversation() }}>
                    <PenSquare size={17} />
                </button>

                <button type='button' aria-label='Search chats' title='Search chats'
                    aria-expanded={panel === 'search'}
                    className={`${iconButton} ${panel === 'search' ? 'bg-white/[0.07] text-slate-200' : ''}`}
                    onClick={() => setPanel(panel === 'search' ? null : 'search')}>
                    <Search size={17} />
                </button>

                <button type='button' aria-label='Chats' title='Chats'
                    aria-expanded={panel === 'chats'}
                    className={`${iconButton} ${panel === 'chats' ? 'bg-white/[0.07] text-slate-200' : ''}`}
                    onClick={() => setPanel(panel === 'chats' ? null : 'chats')}>
                    <MessageSquare size={17} />
                </button>

                <ChatPanel
                    open={panel !== null}
                    autoFocusSearch={panel === 'search'}
                    onClose={() => setPanel(null)}
                    anchorRef={railRef}
                    conversations={conversations}
                    selectedId={selectedConversation?._id}
                    onSelect={handleSelectConversation}
                    onDelete={handleDeleteConversation}
                />

                <div className={`${listScroll} w-full`} />

                {/* same actions as the expanded footer - collapsing the rail
                    must not make credits or log out unreachable */}
                <div className='shrink-0 flex flex-col items-center gap-1 pt-1'>
                    <div aria-hidden className='w-7 h-px bg-white/[0.06] mb-1' />

                    {userData ? (
                        <>
                            <button type='button' aria-label='Credits' title='Credits'
                                className={`${iconButton} text-yellow-600 hover:text-yellow-500`}>
                                <Coins size={16} />
                            </button>

                            <button type='button' aria-label='Log out' title='Log out'
                                className={`${iconButton} text-slate-600`}
                                onClick={() => { logOut(); dispatch(setUserData()) }}>
                                <LogOut size={16} />
                            </button>

                            <div className='relative shrink-0 mt-0.5' title={userData?.name || 'user'}>
                                {userData?.avatar && !imageError ? (
                                    <img
                                        className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25'
                                        src={userData.avatar}
                                        alt='avatar'
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className='w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center'>
                                        <User size={15} className='text-slate-400' />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button type='button' aria-label='Login' title='Login' className={iconButton}>
                            <User size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* full panel - mobile drawer, and desktop when not collapsed */}
            <div className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] h-screen shrink-0
                bg-[#0d0f14] border-r border-white/[0.06] will-change-transform
                transition-transform duration-[260ms] ease-premium
                ${mobileOpen ? 'translate-x-0 shadow-ambient-lg' : '-translate-x-full'}
                lg:translate-x-0 lg:shadow-none
                ${collapsed ? 'lg:hidden' : 'lg:block'}`}>
                <div className='flex flex-col h-full'>
                    <div className='flex items-center gap-1.5 px-3 sm:px-4 py-3 border-b border-white/[0.06]'>
                        <button
                            type='button'
                            aria-label='Collapse sidebar'
                            className={`hidden lg:flex ${iconButton}`}
                            onClick={() => setCollapsed(true)}
                        >
                            <PanelLeftIcon size={18} />
                        </button>
                        <button
                            type='button'
                            aria-label='Close chat list'
                            className={`lg:hidden ${iconButton}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <PanelLeftIcon size={18} />
                        </button>

                        <span className='text-[16px] font-semibold text-slate-100 tracking-tight flex-1 px-1'>
                            AmeekAI
                        </span>

                        <span className='shrink-0 text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide'>
                            free
                        </span>

                        <button type='button' aria-label='New chat' className={iconButton} onClick={handleCreateConversation}>
                            <PenSquare size={15} />
                        </button>
                    </div>

                    <div className='px-3 sm:px-4 pt-4 pb-1'>
                        <button
                            type='button'
                            onClick={handleCreateConversation}
                            className='w-full flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium text-white
                                bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl border-none cursor-pointer
                                shadow-ambient-sm outline-none focus-visible:focus-ring
                                transition-[opacity,transform,box-shadow] duration-200 ease-premium
                                hover:opacity-90 hover:shadow-ambient active:scale-[0.98]'
                        >
                            <Plus size={16} />
                            New Chat
                        </button>
                    </div>

                    <div className='px-4 sm:px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600'>
                        {conversations.length == 0 ? 'No Recent Conversation' : 'Recents'}
                    </div>

                    <div data-chat-list className={`${listScroll} px-2.5 pb-2`}>
                        {conversations.map((conv, i) => (
                            <ConversationRow
                                key={conv?._id ?? i}
                                conversation={conv}
                                isActive={selectedConversation?._id === conv?._id}
                                onSelect={() => handleSelectConversation(conv)}
                                onDelete={() => handleDeleteConversation(conv?._id)}
                                onLongPress={() => setPendingDelete(conv)}
                            />
                        ))}
                    </div>

                    <div className='mx-2.5 h-px bg-white/[0.06]' />

                    <div className='px-2.5 sm:px-3.5 py-3.5'>
                        {userData ? (
                            <div className='flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 hover:bg-white/[0.05] transition-colors duration-200 ease-premium'>
                                <div className='relative shrink-0'>
                                    {userData?.avatar && !imageError ? (
                                        <img
                                            className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25'
                                            src={userData.avatar}
                                            alt='avatar'
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className='w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center'>
                                            <User size={15} className='text-slate-400' />
                                        </div>
                                    )}
                                </div>

                                <div className='flex-1 min-w-0'>
                                    <p className='text-[13.5px] font-semibold text-slate-100 truncate leading-tight'>{userData?.name || "user"}</p>
                                    <p className='text-[11px] text-slate-600 mt-0.5 leading-tight'>{"Free Plan"}</p>
                                </div>

                                <div className='flex items-center gap-0.5 shrink-0'>
                                    <button
                                        type='button'
                                        aria-label='Credits'
                                        className={`${iconButton} text-yellow-600 hover:text-yellow-500`}
                                    >
                                        <Coins size={16} />
                                    </button>
                                    <button
                                        type='button'
                                        aria-label='Log out'
                                        className={`${iconButton} text-slate-600`}
                                        onClick={() => {
                                            logOut();
                                            dispatch(setUserData())
                                        }}
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type='button'
                                className='w-full flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium text-slate-200
                                    bg-white/[0.05] border border-white/[0.08] rounded-xl cursor-pointer outline-none
                                    focus-visible:focus-ring transition-[background-color,transform] duration-200 ease-premium
                                    hover:bg-white/[0.08] active:scale-[0.98]'
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDeleteSheet
                open={Boolean(pendingDelete)}
                title={pendingDelete?.title}
                onCancel={() => setPendingDelete(null)}
                onConfirm={() => {
                    const id = pendingDelete?._id
                    setPendingDelete(null)
                    if (id) handleDeleteConversation(id)
                }}
            />
        </>
    )
}

export default SideBar
