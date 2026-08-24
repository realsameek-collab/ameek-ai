import api from '../../utils/axios.js'

const getMessages = async (conversationId) => {
  try {
    const { data } = await api.post(`/api/chat/get-message/${conversationId}`)
    console.log(data)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.log('getMessages error:', error)
    return []
  }
}

export default getMessages
