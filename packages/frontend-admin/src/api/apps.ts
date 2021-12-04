import axios from 'axios';

export async function list() {
  return axios.get('/api/apps/list');
}

export async function create(name: string) {
  return axios.post('/api/apps/create?name=' + name);
}

export async function info(name: string) {
  return axios.get('/api/apps/info?name=' + name);
}

export async function publish(name: string) {
  return axios.post('/api/apps/publish?name=' + name);
}
