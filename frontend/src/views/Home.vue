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
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Your Photos</h2>

        <!-- Search Controls -->
        <div class="flex space-x-4">
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Search photos..."
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>

          <select
            v-model="selectedTag"
            @change="handleTagFilter"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Tags</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>

          <button @click="clearFilters" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg">
            Clear Filters
          </button>
        </div>
      </div>

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
            :src="getImageUrl(photo)"
            :alt="photo.title"
            class="w-full h-48 object-cover"
            @error="handleImageError"
          />
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 truncate">{{ photo.title }}</h3>
            <p class="text-sm text-gray-500">{{ formatDate(photo.createdAt) }}</p>

            <!-- Auto Tags -->
            <div v-if="photo.autoTags && photo.autoTags.length > 0" class="mt-2">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in photo.autoTags.slice(0, 3)"
                  :key="tag"
                  class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {{ tag }}
                </span>
                <span
                  v-if="photo.autoTags.length > 3"
                  class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                >
                  +{{ photo.autoTags.length - 3 }} more
                </span>
              </div>
            </div>

            <!-- Processing Status -->
            <div v-if="photo.processedAt" class="mt-2">
              <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"> ✓ Processed </span>
            </div>
            <div v-else-if="photo.processingStatus === 'processing'" class="mt-2">
              <span class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                ⏳ Processing...
              </span>
            </div>
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
import { ref, onMounted, computed } from 'vue';
import { getCurrentUser } from 'aws-amplify/auth';
import { get } from 'aws-amplify/api';
import type { Photo } from '@/types';

const isAuthenticated = ref<boolean>(false);
const loading = ref<boolean>(false);
const photos = ref<Photo[]>([]);
const searchQuery = ref<string>('');
const selectedTag = ref<string>('');

// Debounce search input
let searchTimeout: number;
const debouncedSearch = (): void => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadPhotos();
  }, 300);
};

// Get unique tags from all photos
const availableTags = computed(() => {
  const tags = new Set<string>();
  photos.value.forEach((photo) => {
    photo.autoTags?.forEach((tag) => tags.add(tag));
    photo.manualTags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
});

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

// Load user's photos with optional search/filter parameters
const loadPhotos = async (): Promise<void> => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();

    if (searchQuery.value.trim()) {
      queryParams.append('search', searchQuery.value.trim());
    }

    if (selectedTag.value) {
      queryParams.append('tag', selectedTag.value);
    }

    const path = queryParams.toString() ? `/photos?${queryParams.toString()}` : '/photos';

    const response = await get({
      apiName: 'PhotoAPI',
      path,
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

// Handle tag filter change
const handleTagFilter = (): void => {
  loadPhotos();
};

// Clear all filters
const clearFilters = (): void => {
  searchQuery.value = '';
  selectedTag.value = '';
  loadPhotos();
};

// Get best available image URL (processed > thumbnail > original)
const getImageUrl = (photo: Photo): string => {
  return photo.processedUrl || photo.thumbnailUrl || photo.url;
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
