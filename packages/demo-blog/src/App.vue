<template>
  <n-config-provider>
    <n-global-style/>
    <n-dialog-provider>
      <Suspense>
        <router-view/>
      </Suspense>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
</script>

<style lang="stylus">
#app
  text-align center
  margin 0 auto
  max-width 700px
  padding 0 20px
</style>
