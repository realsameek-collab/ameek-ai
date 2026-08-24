import { configureStore } from '@reduxjs/toolkit'
import  userReducer  from './userSlice'
import  conversationReducer  from './conversationSlice'
import  messagesReducer  from './messageSlice'
import  artifactReducer  from './artifactSlice'
export const store = configureStore({
  reducer: {
    user:userReducer,
    conversation :conversationReducer,
    message :messagesReducer,
    artifact :artifactReducer
  },
})