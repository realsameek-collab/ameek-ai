import api from "../../utils/axios"

export const generateTitle = async (payload) => {

    try {
        const { data } = await api.post("/api/agent/title", payload)
        return data?.title || null
    } catch (error) {
        console.log("generateTitle error:", error?.response?.data || error?.message)
        return null
    }
}

export default generateTitle
