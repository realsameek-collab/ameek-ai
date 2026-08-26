import React from 'react'
import api from '../../utils/axios.js'

async function logOut() {
  try {
    const {data} = await api.get("/api/auth/logout")
    console.log(data)
  } catch (error) {
    console.log(error)
  } finally {
    // must run even if the request fails, otherwise a stale token keeps
    // getting sent as Authorization and the user appears logged in again
    localStorage.removeItem("sessionId")
  }
}

export default logOut