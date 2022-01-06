import axios from 'axios';
import { useService } from 'sdk';

export async function list() {
  //return axios.get('/api/apps/list');
  return useService("apps").listPrivate();
}

export async function create(name: string) {
  //return axios.post('/api/apps/create?name=' + name);
  return useService("apps").create(name);
}

export async function info(name: string) {
  //return axios.get('/api/apps/info?name=' + name);
  return useService("apps").info(name);
}

export async function publish(name: string) {
 // return axios.post('/api/apps/publish?name=' + name);
  return useService("apps").publish(name);
}
