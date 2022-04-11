import axios from 'axios';
import { useService } from '@dapp-agent/sdk';

export async function myAppList() {
  return [1, 2, 3];
}

export async function recentAppList() {
  return [4, 5, 6];
}

export async function appInfo(id: string) {
  return {id: id, name: 'app' + id};
}

export async function connectPeer(addr:string) {
  return useService("system").connectPeer(addr);
}

export async function openApp(url:string) {
  return useService("apps").clone(url);
}