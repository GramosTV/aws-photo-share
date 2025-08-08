<template>
  <div class="px-4 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Photo Share</h1>
      <p class="text-xl text-gray-600 mb-8">
        Share your memories with the world. Upload, store, and share photos securely in the cloud.
      </p>

      <router-link
        v-if="!isAuthenticated"
        to="/login"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
      >
        Get Started
      </router-link>

      <router-link
        v-else
        to="/upload"
        class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
      >
        Upload Photos
      </router-link>
    </div>

    <!-- Features Section -->
    <div class="grid md:grid-cols-3 gap-8 mb-12">
      <div class="text-center p-6 bg-white rounded-lg shadow-md">
        <div class="text-4xl mb-4">☁️</div>
        <h3 class="text-xl font-semibold mb-2">Cloud Storage</h3>
        <p class="text-gray-600">Secure storage in AWS S3 with global CDN delivery</p>
      </div>

      <div class="text-center p-6 bg-white rounded-lg shadow-md">
        <div class="text-4xl mb-4">🔒</div>
        <h3 class="text-xl font-semibold mb-2">Secure Access</h3>
        <p class="text-gray-600">Protected by AWS Cognito authentication</p>
      </div>

      <div class="text-center p-6 bg-white rounded-lg shadow-md">
        <div class="text-4xl mb-4">⚡</div>
        <h3 class="text-xl font-semibold mb-2">Fast & Scalable</h3>
        <p class="text-gray-600">Serverless architecture with automatic scaling</p>
      </div>
    </div>

    <!-- Recent Photos Section -->
    <div v-if="isAuthenticated">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Recent Photos</h2>

      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading photos...</p>
      </div>

      <div v-else-if="photos.length === 0" class="text-center py-8">
        <div class="text-6xl mb-4">📷</div>
        <p class="text-gray-600 mb-4">No photos yet. Start by uploading your first photo!</p>
        <router-link to="/upload" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Upload Now
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <img
            :src="photo.thumbnailUrl || photo.url"
            :alt="photo.title"
            class="w-full h-48 object-cover"
            @error="handleImageError"
          />
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 truncate">{{ photo.title }}</h3>
            <p class="text-sm text-gray-500">{{ formatDate(photo.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest Welcome -->
    <div v-else class="text-center py-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Join Our Community</h2>
      <p class="text-gray-600 mb-8">Sign up to start sharing your photos and discover amazing content from others.</p>
      <div class="space-x-4">
        <router-link to="/login" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Sign In
        </router-link>
        <router-link to="/login" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg">
          Sign Up
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getCurrentUser } from 'aws-amplify/auth';
import { get } from 'aws-amplify/api';
import type { Photo } from '@/types';

const isAuthenticated = ref<boolean>(false);
const loading = ref<boolean>(false);
const photos = ref<Photo[]>([]);

// Check authentication status
const checkAuthStatus = async (): Promise<void> => {
  try {
    await getCurrentUser();
    isAuthenticated.value = true;
    await loadPhotos();
  } catch (error) {
    isAuthenticated.value = false;
  }
};

// Load user's photos
const loadPhotos = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await get({
      apiName: 'PhotoAPI',
      path: '/photos',
    }).response;

    const data = (await response.body.json()) as unknown as { photos: Photo[] };
    photos.value = data.photos || [];
  } catch (error) {
    console.error('Error loading photos:', error);
    photos.value = [];
  } finally {
    loading.value = false;
  }
};

// Handle image load errors
const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
};

// Format date for display
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  checkAuthStatus();
});
</script>
