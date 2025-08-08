<template>
  <div
    id="app"
    class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
  >
    <!-- Animated background elements -->
    <div class="absolute inset-0 opacity-30">
      <div
        class="absolute top-0 left-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"
      ></div>
      <div
        class="absolute top-0 right-0 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"
      ></div>
      <div
        class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"
      ></div>
    </div>

    <!-- Navigation -->
    <nav class="backdrop-blur-lg bg-white/10 border-b border-white/20 sticky top-0 z-50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link
              to="/"
              class="flex items-center space-x-2 text-xl font-bold text-white hover:text-purple-300 transition-colors duration-300 group"
            >
              <div class="relative">
                <span class="text-2xl group-hover:animate-bounce">📸</span>
                <div
                  class="absolute inset-0 bg-purple-400/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"
                ></div>
              </div>
              <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Photo Share
              </span>
            </router-link>
          </div>

          <div class="flex items-center space-x-4">
            <router-link
              to="/"
              class="nav-link text-white/80 hover:text-white px-4 py-2 rounded-lg text-sm font-medium relative group overflow-hidden"
            >
              <span class="relative z-10">Home</span>
              <div
                class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
              ></div>
            </router-link>

            <router-link
              v-if="isAuthenticated"
              to="/upload"
              class="nav-link text-white/80 hover:text-white px-4 py-2 rounded-lg text-sm font-medium relative group overflow-hidden"
            >
              <span class="relative z-10">Upload</span>
              <div
                class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
              ></div>
            </router-link>

            <button
              v-if="isAuthenticated"
              @click="handleSignOut"
              class="glass-button bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Sign Out
            </button>

            <router-link
              v-else
              to="/login"
              class="glass-button bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Sign In
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content with page transitions -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
      <transition name="page" mode="out-in">
        <router-view />
      </transition>
    </main>

    <!-- Enhanced Toast notifications -->
    <transition-group name="toast" tag="div" class="fixed bottom-4 right-4 z-50 space-y-2">
      <div
        v-if="notification.show"
        key="notification"
        :class="[
          'glass-card rounded-xl p-4 shadow-2xl transform transition-all duration-500',
          notification.type === 'error'
            ? 'bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white'
            : 'bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white',
        ]"
      >
        <div class="flex items-center space-x-2">
          <div class="flex-shrink-0">
            <span v-if="notification.type === 'success'" class="text-xl animate-bounce">✅</span>
            <span v-else class="text-xl animate-pulse">❌</span>
          </div>
          <p class="font-medium">{{ notification.message }}</p>
        </div>
      </div>
    </transition-group>
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

<style scoped>
/* Custom animations */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* Glass morphism effects */
.glass-card {
  backdrop-filter: blur(16px) saturate(200%);
  -webkit-backdrop-filter: blur(16px) saturate(200%);
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.125);
}

.glass-button {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.glass-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.glass-button:hover::before {
  left: 100%;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(1.05);
}

/* Toast transitions */
.toast-enter-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Navigation hover effects */
.nav-link {
  position: relative;
  overflow: hidden;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.nav-link:hover::after {
  transform: scaleX(1);
}
</style>

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
