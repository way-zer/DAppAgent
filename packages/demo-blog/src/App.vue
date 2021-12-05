<template>
  <img
    alt="Vue logo"
    src="../assets/logo.svg"
    width="300"
  >
  <app-navigation/>
  <router-view/>
</template>

<script lang="ts" setup>
import AppNavigation from '/@/components/AppNavigation.vue';
import {useService} from 'sdk/index';

useService('test').hello().then(console.log);
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
