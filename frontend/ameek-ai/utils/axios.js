import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true
})

// Attach the stored session token as a Bearer header on every request.
// This is a fallback for browsers (mostly mobile) that block the
// cross-domain session cookie — the cookie still works where it's allowed.
api.interceptors.request.use((config) => {
    // never clobber an Authorization header the caller set deliberately -
    // /auth/login sends the Firebase ID token this way, and overwriting it
    // with a stale sessionId would break every login after the first
    if (config.headers?.Authorization) return config;

    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
        config.headers.Authorization = `Bearer ${sessionId}`;
    }
    return config;
});

export default api