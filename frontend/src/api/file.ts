import axios from "axios";

export async function fileUpload(file: FormData, path: string) {
    const config = {
        headers: {"Content-Type": "multipart/form-data"}
    }
    return axios.put(`/api/file/upload?path=${path}`, file, config);
}

export async function fileInfo(path: string) {
    return axios.get(`/api/file/list?path=${path}`);
}