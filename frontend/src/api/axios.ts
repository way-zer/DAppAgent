import axios from 'axios'
import {message} from 'antd'

export function initAxios() {
    axios.interceptors.response.use((resp) => {
        return resp.data
    }, (error => {
        if (axios.isAxiosError(error) && !error.config.skipErrorHandler) {
            if (error.response?.status == 400) {
                message.error(error.response?.data).then()
            }
        }
        throw error
    }))
}

declare module 'axios' {
    interface AxiosRequestConfig {
        skipErrorHandler?: boolean
    }
}