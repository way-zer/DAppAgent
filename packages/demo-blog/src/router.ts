import {createRouter, createWebHashHistory} from 'vue-router';
import Home from '/@/components/Home.vue';
import PostView from '/@/components/PostView.vue';
import PostEdit from '/@/components/PostEdit.vue';

const routes = [
  {path: '/', name: 'Home', component: Home},
  {path: '/post/:id', name: 'PostView', component: PostView},
  {path: '/edit/:id', name: 'PostEdit', component: PostEdit},
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
