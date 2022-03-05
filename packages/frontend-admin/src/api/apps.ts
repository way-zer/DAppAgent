import axios from 'axios';

export async function myAppList() {
  return [1, 2, 3];
}

export async function recentAppList() {
  return [4, 5, 6];
}

export async function appInfo(id: string) {
  return {id: id, name: 'app' + id};
}