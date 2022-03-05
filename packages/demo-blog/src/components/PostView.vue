<template>
  <n-page-header @back="back" id="post" :title="post.title">
    <n-p class="subTitle">Updated at {{ post.update.toLocaleString() }}</n-p>
    <div id="body">
      <editor v-model="post.content" preview-only previewTheme="vuepress"/>
    </div>
    <n-divider/>
    <div id="comments"></div>
  </n-page-header>
</template>

<script lang="ts" setup>
import {useRouter} from 'vue-router';
import Editor from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

const router = useRouter();

const post = {
  title: '安装ArchWSL (Windows 下的Archlinux子系统)',
  update: new Date(),
  content: '# MARKDOWN\n## 2\n ```\ntest\n```',
};

function back() {
  router.push({path: '/'});
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
