<template>
  <n-page-header @back="back" id="post" :title="post.title">
    <template #extra>
      <n-button v-if="siteInfo.isOwner" @click="edit">编辑</n-button>
    </template>
    <n-p class="subTitle">Updated at {{ new Date(post.updated.toString()).toLocaleString() }}</n-p>
    <div id="body">
      <editor v-model="post.content" preview-only previewTheme="vuepress"/>
    </div>
    <n-divider/>
    <div id="comments"></div>
  </n-page-header>
</template>

<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router';
import Editor from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import {getPost, siteInfoAsync} from '/@/service';

const siteInfo = await siteInfoAsync.value;
const id = useRoute().params.id.toString();
const post = await getPost(id);

const router = useRouter();

function back() {
  router.push({path: '/'});
}

async function edit() {
  await router.push({path: '/edit/' + id});
}
</script>

<style lang="stylus" scoped>
#post
  text-align left
  padding-top 70px
  @media (max-width 800px)
    padding-top 20px

.subTitle
  font-size: 14px;
  color: #788590;
  margin-top: 10px;
</style>
