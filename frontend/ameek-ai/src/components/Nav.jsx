import { MessageSquare } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'

function Nav() {
  const { selectedConversation } = useSelector((state) => state.conversation)
  const { messages } = useSelector((state) => state.message)
  return (
    <>
    {selectedConversation && <div className='h-14 flex items-center px-5 border-b border-white/[0.06] bg-[#0d0f14]'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20'>
          <MessageSquare size={16} className='text-indigo-400' />
        </div>
        <div className='flex items-center gap-3'>
          <div className='text-sm font-semibold text-slate-100 tracking-tight'>
            {selectedConversation?.title || 'New Chat'}
          </div>
          <div className='inline-flex items-center text-xs font-medium text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-full'>
            {messages?.length || 0} Messages
          </div>
        </div>
      </div>
    </div>
    
}
    </>
  )
}

export default Nav