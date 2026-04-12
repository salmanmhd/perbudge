import axios from "axios";
import { AUTH_TOKEN, clearAuthToken } from "./auth-token";
import { toast } from "sonner";


const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 10000
})

axiosInstance.interceptors.request.use((config) => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem(AUTH_TOKEN)
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, (error) => {
    console.log('axios req inter: ', error);

    Promise.reject(error)
})



axiosInstance.interceptors.response.use((response) => {
    console.log('response: ', response);
    return response

}, (error) => {
    console.log('response error: ', error);

    if (error.response.status === 401) {
        clearAuthToken()
        if (typeof window !== "undefined") {
            toast.error("Un-authorised", {
                description: "Redirecting to login page"
            })
            setTimeout(() => {
                window.location.href = "/login"
            }, 1000)
        }
    }
})


export { axiosInstance }