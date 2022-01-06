import axios from 'axios';
import { useService } from 'sdk';

const testAppName = "test";

export async function fileUpload(file: FormData, path: string) {
  // const config = {
  //   headers: {'Content-Type': 'multipart/form-data'},
  // };
  //   return axios.put(`/api/file/upload?path=${path}`, file, config);
  return useService("file").upload(testAppName, path, "cid");
}

export async function fileInfo(path: string) {
    //return axios.get(`/api/file/list?path=${path}`);
    return useService("file").list(path);
}

export async function createDirectory(path: string, name: string) {
    //return axios.put(`/api/file/upload?path=${path}/${name}/`);
    return useService("file").mkdir(testAppName, path + "/" + name + "/");
}

export async function deleteFile(path: string) {
    //return axios.post(`/api/file/delete?path=${path}`);
    useService("file").delete(testAppName, path);
}

export async function copyFile(path: string, from: string) {
  //return axios.put(`/api/file/upload?path=${path}&from=${from}`);
  let cid = undefined;
  return useService("file").upload(testAppName, path, cid);
}

export async function moveFile(path: string, from: string) {
    return copyFile(path, from).then(() => deleteFile(from));
}
