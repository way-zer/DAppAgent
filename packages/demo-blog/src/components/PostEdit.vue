<template>
  <n-page-header @back="back" id="post">
    <template #title>
      <n-input v-model:value="post.title" placeholder="请输入标题" show-count/>
    </template>
    <template #extra>
      <n-button type="success" @click="save">保存</n-button>
    </template>
    <span>文章标签: </span>
    <n-dynamic-tags v-model:value="post.tags"/>
    <n-p class="subTitle">Created at {{ new Date(post.created.toString()).toLocaleString() }}</n-p>
    <div id="body">
      <editor v-model="post.content" previewThemiconfontJse="vuepress"
              iconfontJs="https://at.alicdn.com/t/font_2605852_ihjkm7wo1y.js"
              @uploadImg="onUploadImg" @save="saveLocal"/>
    </div>
  </n-page-header>
</template>

<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router';
import Editor from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import {getPost, Post, setPost} from '/@/service';
import {ref} from 'vue';
import axios from 'axios';
import {useDialog} from 'naive-ui';

const id = useRoute().params.id.toString();
const router = useRouter();
const localKey = 'POST_SAVE_' + id;

const post = ref(await getPost(id).catch(() => ({
  _id: id, created: new Date(), updated: new Date(),
  title: '', content: '',
} as Post)));

if (localStorage.getItem(localKey))
  useDialog().warning({
    closable: false,
    content: '发现未提交暂存编辑，是否加载',
    negativeText: '取消',
    positiveText: '确认', async onPositiveClick() {
      post.value = JSON.parse(localStorage.getItem(localKey)!!);
    },
  });

function back() {
  router.push({path: '/'});
}

async function save() {
  post.value.updated = new Date();
  await setPost(post.value);
  localStorage.removeItem(localKey);
  await router.push({path: '/post/' + id});
}

async function onUploadImg(files: FileList, callback: (urls: string[]) => void) {
  const res = await Promise.all(Array.from(files).map(async file => {
    const {data} = await axios.post('/ipfs/upload', file, {
      headers: {
        'content-type': 'application/octet-stream',
      },
    });
    return `/ipfs/${data.cid}?${file.name}`;
  }));
  callback(res);
}

function saveLocal() {
  localStorage.setItem(localKey, JSON.stringify(post.value));
}

</script>

<style lang="stylus" scoped>
#post
  text-align left
  padding-top 70px
  @media (max-width 800px)
    padding-top 20px

  ::v-deep(.n-page-header__main), ::v-deep(.n-page-header__title)
    width 100%

.subTitle
  font-size: 14px;
  color: #788590;
  margin-top: 10px;
</style>
