<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-800"> 📸 Photo Share </router-link>
          </div>

          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </router-link>

            <router-link
              v-if="isAuthenticated"
              to="/upload"
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Upload
            </router-link>

            <button
              v-if="isAuthenticated"
              @click="handleSignOut"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>

            <router-link
              v-else
              to="/login"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>

    <!-- Toast notifications -->
    <div v-if="notification.show" class="fixed bottom-4 right-4 z-50 max-w-sm">
      <div
        :class="[
          'rounded-lg p-4 shadow-lg',
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white',
        ]"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import type { Notification } from '@/types';

const router = useRouter();
const isAuthenticated = ref<boolean>(false);
const notification = ref<Notification>({
  show: false,
  message: '',
  type: 'success',
});

// Check authentication status
const checkAuthStatus = async (): Promise<void> => {
  try {
    await getCurrentUser();
    isAuthenticated.value = true;
  } catch (error) {
    isAuthenticated.value = false;
  }
};

// Handle sign out
const handleSignOut = async (): Promise<void> => {
  try {
    await signOut();
    isAuthenticated.value = false;
    showNotification('Successfully signed out', 'success');
    router.push('/');
  } catch (error) {
    showNotification('Error signing out', 'error');
  }
};

// Show notification
const showNotification = (message: string, type: 'success' | 'error' = 'success'): void => {
  notification.value = { show: true, message, type };
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

// Check auth on mount
onMounted(() => {
  checkAuthStatus();
});

// Listen for auth changes
router.beforeEach(async (to) => {
  await checkAuthStatus();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return '/login';
  }
});
</script>
