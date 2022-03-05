import {createRouter, createWebHashHistory} from 'vue-router';
import Home from '/@/components/Home.vue';
import PostView from '/@/components/PostView.vue';

const routes = [
  {path: '/', name: 'Home', component: Home},
  {path: '/post/:id', name: 'Post', component: PostView},
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
