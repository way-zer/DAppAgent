<template>
  <title>{{siteInfo?.title}}</title>
  <n-spin id="user" :show="siteInfoLoading">
    <img :src="siteInfo?.avatar" :alt="siteInfo?.title">
    <n-h1>{{ siteInfo?.title }}</n-h1>
    <n-space justify="center" id="social">
      <n-button v-if="siteInfo?.social?.github" text tag="a" target="_blank" :href="siteInfo?.social?.github">
        <n-icon key="github" size="22px">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
            <path
              d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6c-3.3.3-5.6-1.3-5.6-3.6c0-2 2.3-3.6 5.2-3.6c3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9c2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9c.3 2 2.9 3.3 5.9 2.6c2.9-.7 4.9-2.6 4.6-4.6c-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2c12.8 2.3 17.3-5.6 17.3-12.1c0-6.2-.3-40.4-.3-61.4c0 0-70 15-84.7-29.8c0 0-11.4-29.1-27.8-36.6c0 0-22.9-15.7 1.6-15.4c0 0 24.9 2 38.6 25.8c21.9 38.6 58.6 27.5 72.9 20.9c2.3-16 8.8-27.1 16-33.7c-55.9-6.2-112.3-14.3-112.3-110.5c0-27.5 7.6-41.3 23.6-58.9c-2.6-6.5-11.1-33.3 2.6-67.9c20.9-6.5 69 27 69 27c20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27c13.7 34.7 5.2 61.4 2.6 67.9c16 17.7 25.8 31.5 25.8 58.9c0 96.5-58.9 104.2-114.8 110.5c9.2 7.9 17 22.9 17 46.4c0 33.7-.3 75.4-.3 83.6c0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252C496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2c1.6 1.6 3.9 2.3 5.2 1c1.3-1 1-3.3-.7-5.2c-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9c1.6 1 3.6.7 4.3-.7c.7-1.3-.3-2.9-2.3-3.9c-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2c2.3 2.3 5.2 2.6 6.5 1c1.3-1.3.7-4.3-1.3-6.2c-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9c1.6 2.3 4.3 3.3 5.6 2.3c1.6-1.3 1.6-3.9 0-6.2c-1.4-2.3-4-3.3-5.6-2z"
              fill="currentColor"></path>
          </svg>
        </n-icon>
      </n-button>
      <suspense v-if="siteInfo?.isOwner">
        <setting v-slot="{onClick}">
          <n-tooltip v-if="siteInfo?.isOwner" trigger="hover">
            编辑站点信息
            <template #trigger>
              <n-button text @click="onClick">
                <n-icon key="DocumentSettings20Regular" size="22px">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <g fill="none">
                      <path
                        d="M6 2a2 2 0 0 0-2 2v4.207a5.48 5.48 0 0 1 1-.185V4a1 1 0 0 1 1-1h4v3.5A1.5 1.5 0 0 0 11.5 8H15v8a1 1 0 0 1-1 1H9.743c-.314.38-.677.716-1.08 1H14a2 2 0 0 0 2-2V7.414a1.5 1.5 0 0 0-.44-1.06l-3.914-3.915A1.5 1.5 0 0 0 10.586 2H6zm8.793 5H11.5a.5.5 0 0 1-.5-.5V3.207L14.793 7zM3.065 10.442a2 2 0 0 1-1.43 2.478l-.462.118a4.709 4.709 0 0 0 .01 1.016l.35.083a2 2 0 0 1 1.456 2.519l-.127.422c.258.204.537.378.835.518l.325-.344a2 2 0 0 1 2.91.002l.337.358c.292-.135.568-.302.822-.498l-.156-.556a2 2 0 0 1 1.43-2.479l.46-.117a4.71 4.71 0 0 0-.01-1.017l-.348-.082a2 2 0 0 1-1.456-2.52l.126-.422a4.32 4.32 0 0 0-.835-.518l-.325.344a2 2 0 0 1-2.91-.001l-.337-.358a4.314 4.314 0 0 0-.821.497l.156.557zM5.499 14.5a1 1 0 1 1 0-2a1 1 0 0 1 0 2z"
                        fill="currentColor"></path>
                    </g>
                  </svg>
                </n-icon>
              </n-button>
            </template>
          </n-tooltip>
        </setting>
      </suspense>
      <n-tooltip v-if="siteInfo?.isOwner" trigger="hover">
        新建文章
        <template #trigger>
          <n-button text @click="newPost">
            <n-icon key="CreateOutline" size="22px">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M384 224v184a40 40 0 0 1-40 40H104a40 40 0 0 1-40-40V168a40 40 0 0 1 40-40h167.48" fill="none"
                      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path>
                <path
                  d="M459.94 53.25a16.06 16.06 0 0 0-23.22-.56L424.35 65a8 8 0 0 0 0 11.31l11.34 11.32a8 8 0 0 0 11.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38z"
                  fill="currentColor"></path>
                <path
                  d="M399.34 90L218.82 270.2a9 9 0 0 0-2.31 3.93L208.16 299a3.91 3.91 0 0 0 4.86 4.86l24.85-8.35a9 9 0 0 0 3.93-2.31L422 112.66a9 9 0 0 0 0-12.66l-9.95-10a9 9 0 0 0-12.71 0z"
                  fill="currentColor"></path>
              </svg>
            </n-icon>
          </n-button>
        </template>
      </n-tooltip>
    </n-space>
    <n-divider id="divider"/>
  </n-spin>
  <n-list id="posts">
    <n-spin :show="postsLoading">
      <n-list-item v-for="post of (posts?.data)" :key="post.title">
        <n-thing class="post" :title="post.title" :description="new Date(post.updated.toString()).toLocaleString()"
                 @click="router.push('/post/'+post._id)">
          <template #header-extra>
            <n-tag v-for="tag of post.tags" :key="tag" round>{{ tag }}</n-tag>
          </template>
        </n-thing>
      </n-list-item>
      <n-card v-if="!posts?.data?.length">
        <n-empty description="无内容" size="huge">
          <template #extra v-if="siteInfo?.isOwner">
            <n-button @click="newPost">新建文章</n-button>
          </template>
        </n-empty>
      </n-card>
    </n-spin>
  </n-list>
  <n-pagination
    :item-count="posts?.count||0"
    v-model:page="page"
    v-model:page-size="pageSize"
    :page-sizes="[10, 20, 30, 40]"
    show-size-picker
    style="justify-content: center"
  />
</template>

<script lang="ts" setup>
import {useRouter} from 'vue-router';
import {getPosts, newID, siteInfoAsync} from '/@/service';
import {usePromise} from 'vue-promised';
import Setting from '/@/components/modals/Setting.vue';
import {computed, ref} from 'vue';

const router = useRouter();

const {data: siteInfo, isPending: siteInfoLoading} = usePromise(siteInfoAsync);
const page = ref(1);
const pageSize = ref(10);
const postsAsync = computed(() => getPosts(pageSize.value * (page.value - 1), pageSize.value));
const {data: posts, isPending: postsLoading} = usePromise(postsAsync);

function newPost() {
  router.push('/edit/' + newID());
}
</script>

<style lang="stylus" scoped>
#user
  img
    width 100px
    height 100px
    border-radius 50%
    margin-top 70px
    @media (max-width 800px)
      width 75px
      height 75px
      margin-top 40px

  #divider
    width 50%
    margin 0 auto

#posts
  margin-top 50px
  @media (max-width 800px)
    margin-top 30px

  .post
    cursor pointer
    text-align left
</style>
