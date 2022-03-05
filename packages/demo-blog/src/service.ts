import {useService} from '@dapp-agent/sdk';
import {ref} from 'vue';

export interface Post {
  _id: string,
  title: string,
  created: Date,
  updated: Date,
  content: string,
  tags: { name: string, color: string }[]
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

export const siteInfo = ref(getSiteInfo());

export async function updateSiteInfo(info: Omit<SiteInfo, 'isOwner'>) {
  await useService('apps').updateDescSelf({
    name: info.title,
    icon: info.avatar,
    ext: {
      'social_github': info.social.github,
    },
  });
  siteInfo.value = getSiteInfo();
}

export async function posts() {
  return await useService('db').queryAll<Post>('posts');
}
