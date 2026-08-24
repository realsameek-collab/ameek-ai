import api from '../../utils/axios.js'

async function sendMessage(payload) {

     try {
        const { file, ...fields } = payload ?? {}

        // no attachment - unchanged json request
        if (!file) {
           const {data} = await api.post("/api/agent/chat",fields)
           return data
        }

        // multer reads the file from a "file" field, which only exists on a
        // multipart body. the content-type header is left unset on purpose so
        // the browser can add its own multipart boundary.
        const form = new FormData()
        Object.entries(fields).forEach(([key, value]) => {
           if (value !== undefined && value !== null) form.append(key, value)
        })
        form.append("file", file)

        const {data} = await api.post("/api/agent/chat", form)
        return data
     } catch (error) {
        console.log(error)
        return null
     }

}

export default sendMessage
