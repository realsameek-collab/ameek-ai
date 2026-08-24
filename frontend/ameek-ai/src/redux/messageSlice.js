import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({

    name:"message",
    initialState:{
          messages:[],

          // the assistant reply is in flight - drives the thinking indicator
          pending:false,

          // { prompt } of a send that failed, so it can be retried
          error:null,

          // bumped by the error card's Try again button. ChatInput watches it
          // rather than the error object, so retrying the same prompt twice
          // still registers as two distinct requests.
          retryToken:0

    },
    reducers:{

        setMessages:(state, action) => {
            state.messages = Array.isArray(action.payload) ? action.payload : []
        },
        addMessage:(state, action)=>{
            if (action.payload) state.messages.push(action.payload)
        },

        setPending:(state, action)=>{
            state.pending = Boolean(action.payload)
            // a new attempt clears the previous failure
            if (state.pending) state.error = null
        },

        setError:(state, action)=>{
            state.error = action.payload ?? null
            state.pending = false
        },

        clearError:(state)=>{
            state.error = null
        },

        requestRetry:(state)=>{
            state.retryToken += 1
        },

    }
});


export const {
    setMessages,
    addMessage,
    setPending,
    setError,
    clearError,
    requestRetry
} = messageSlice.actions
export default messageSlice.reducer
