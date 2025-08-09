import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import { Amplify } from 'aws-amplify';
import App from './App.vue';
import Home from './views/Home.vue';
import Upload from './views/Upload.vue';
import Login from './views/Login.vue';
import './style.css';

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/upload',
      name: 'Upload',
      component: Upload,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
  ],
});

// Configure AWS Amplify
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      region: import.meta.env.VITE_AWS_REGION || 'eu-central-1',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
      },
    },
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_PHOTOS_BUCKET || '',
      region: import.meta.env.VITE_AWS_REGION || 'eu-central-1',
    },
  },
};

if (amplifyConfig.Auth.Cognito.userPoolId) {
  Amplify.configure(amplifyConfig);
}

// Create and mount app
const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.mount('#app');
