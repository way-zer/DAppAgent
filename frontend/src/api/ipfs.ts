import axios from 'axios';

export async function status() {
  return axios.get('/api/ipfs/status');
}
