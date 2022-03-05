<template>
  <slot @click="show = true"></slot>
  <n-modal v-model:show="show" :mask-closable="false">
    <n-dialog title="编辑站点" :closable="false"
              positive-text="保存" @positive-click="save"
              negative-text="取消" @negative-click="show=false">
      <n-form>
        <n-form-item label="站点名" path="title">
          <n-input v-model:value="data.title" placeholder="XXXX's blog"/>
        </n-form-item>
        <n-form-item-row label="头像">
          <n-input v-model:value="data.avatar" placeholder="/ipfs/xxxx"/>
          <n-upload :custom-request="upload" :show-file-list="false">
            <n-button>上传文件</n-button>
          </n-upload>
          <template #feedback>
            <n-card>
              <n-image :src="data.avatar"/>
            </n-card>
          </template>
        </n-form-item-row>
        <n-form-item label="社交地址">
          <n-form-item label="Github" label-placement="left">
            <n-input v-model:value="data.social.github" placeholder="github.com/xxx"/>
          </n-form-item>
        </n-form-item>
      </n-form>
    </n-dialog>
  </n-modal>
</template>

<script lang="ts" setup>
import {ref} from 'vue';
import {siteInfo, updateSiteInfo} from '/@/service';
import {UploadCustomRequestOptions} from 'naive-ui';
import axios from 'axios';

const show = ref(false);
const rawData = await siteInfo.value;
const data = ref(rawData);

function upload({file, onProgress, onFinish, onError}: UploadCustomRequestOptions) {
  console.log(file.file!!.size);
  axios.post('/ipfs/upload', file.file, {
    headers: {
      'content-type': 'application/octet-stream',
    },
    onUploadProgress({loaded, total}) {
      onProgress({percent: Math.ceil(loaded / total) * 100});
    },
  }).then((e) => {
    console.log(e.data);
    data.value = {
      ...data.value,
      avatar: `/ipfs/${e.data.cid}?${file.name}`,
    };
    onFinish();
  }).catch(onError);
}

function save() {
  const value = data.value as any;
  delete value.isOwner;
  updateSiteInfo(value);
  show.value = false;
}
</script>

<style lang="stylus" scoped>

</style>
