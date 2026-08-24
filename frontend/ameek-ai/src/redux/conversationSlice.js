import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({

    name:"conversation",
    initialState:{
          conversations:[],
          selectedConversation:null
    },
    reducers:{

        setConversations:(state, action) => {
            state.conversations = Array.isArray(action.payload) ? action.payload : []
        },
        addConversation:(state, action)=>{
            state.conversations.unshift(action.payload)
        },
         setSelectedConversation:(state, action)=>{
            state.selectedConversation = action.payload
        },
        removeConversation:(state, action)=>{
            state.conversations = state.conversations.filter((c)=> c?._id !== action.payload)
        },
        updateConversationTitle:(state, action)=>{
            const {_id, title} = action.payload || {}
            if (!_id || !title) return
            const conversation = state.conversations.find((c)=> c?._id === _id)
            if (conversation) conversation.title = title
            if (state.selectedConversation?._id === _id) {
                state.selectedConversation.title = title
            }
        }

    }
});

        
export const { setConversations, addConversation ,  setSelectedConversation, removeConversation, updateConversationTitle} = conversationSlice.actions
export default conversationSlice.reducer