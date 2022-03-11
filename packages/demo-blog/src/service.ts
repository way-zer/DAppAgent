import {useService} from '@dapp-agent/sdk';
import {ref} from 'vue';

export interface Post {
  _id: string,
  title: string,
  created: Date,
  updated: Date,
  content: string,
  tags: string[]
}

export type SiteInfo = Awaited<ReturnType<typeof getSiteInfo>>

export async function getSiteInfo() {
  const info = await useService('apps').thisInfo();
  return {
    title: info.name,
    isOwner: info.modifiable,
    avatar: info.icon,
    social: {
      github: info.ext['social_github'],
    },
  };
}

export const siteInfoAsync = ref(getSiteInfo());

export async function updateSiteInfo(info: Omit<SiteInfo, 'isOwner'>) {
  await useService('apps').updateDescSelf({
    name: info.title,
    icon: info.avatar,
    ext: {
      'social_github': info.social.github,
    },
  });
  siteInfoAsync.value = getSiteInfo();
}

export async function getPosts(offset: number, limit: number) {
  return await useService('db').query<Post>('posts', {}, offset, limit);
}

export async function getPost(id: string) {
  return await useService('db').get<Post>('posts', id);
}

export async function setPost(post: Post) {
  return await useService('db').insert('posts', post);
}

export function newID() {
  let s = [] as string[];
  let hexDigits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.charAt(Math.floor(Math.random() * 0x10));
  }
  s[14] = '4';
  s[19] = hexDigits.charAt((s[19].charCodeAt(0) & 0x3) | 0x8);
  s[8] = s[13] = s[18] = s[23] = '-';
  return s.join('');
}
