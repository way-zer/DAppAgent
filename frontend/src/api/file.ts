import axios from 'axios';

export async function fileUpload(file: FormData, path: string) {
  const config = {
    headers: {'Content-Type': 'multipart/form-data'},
  };
    return axios.put(`/api/file/upload?path=${path}`, file, config);
}

export async function fileInfo(path: string) {
    return axios.get(`/api/file/list?path=${path}`);
}

export async function createDirectory(path: string, name: string) {
    return axios.put(`/api/file/upload?path=${path}/${name}/`);
}

export async function deleteFile(path: string) {
    return axios.post(`/api/file/delete?path=${path}`);
}

export async function copyFile(path: string, from: string) {
  return axios.put(`/api/file/upload?path=${path}&from=${from}`);
}

export async function moveFile(path: string, from: string) {
    return copyFile(path, from).then(() => deleteFile(from));
}
