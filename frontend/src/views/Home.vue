<template>
  <div class="px-4 py-8 relative">
    <!-- Hero Section with enhanced animations -->
    <div class="text-center mb-16 relative">
      <!-- Floating particles -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="floating-particle opacity-30" style="left: 10%; animation-delay: 0s"></div>
        <div class="floating-particle opacity-20" style="left: 80%; animation-delay: 2s"></div>
        <div class="floating-particle opacity-25" style="left: 60%; animation-delay: 4s"></div>
      </div>

      <div class="hero-content">
        <h1 class="text-6xl md:text-7xl font-bold text-white mb-6 relative">
          <span
            class="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient"
          >
            Welcome to Photo Share
          </span>
          <div
            class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"
          ></div>
        </h1>

        <p class="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
          Share your memories with the world. Upload, store, and share photos securely in the cloud with
          <span class="text-purple-300 font-semibold">AI-powered features</span> and
          <span class="text-pink-300 font-semibold">lightning-fast delivery</span>.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up-delay">
          <router-link
            v-if="!isAuthenticated"
            to="/login"
            class="cta-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
          >
            <span class="relative z-10 flex items-center space-x-2">
              <span>🚀</span>
              <span>Get Started</span>
            </span>
            <div
              class="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
            ></div>
          </router-link>

          <router-link
            v-else
            to="/upload"
            class="cta-button bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
          >
            <span class="relative z-10 flex items-center space-x-2">
              <span>📤</span>
              <span>Upload Photos</span>
            </span>
            <div
              class="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
            ></div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Enhanced Features Section -->
    <div class="grid md:grid-cols-3 gap-8 mb-16">
      <div
        class="feature-card glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-500 hover:shadow-2xl group"
      >
        <div
          class="feature-icon text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
        >
          ☁️
        </div>
        <h3 class="text-2xl font-semibold mb-4 text-white">Cloud Storage</h3>
        <p class="text-white/70 leading-relaxed">
          Secure storage in AWS S3 with global CDN delivery for lightning-fast access worldwide
        </p>
        <div
          class="mt-4 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        ></div>
      </div>

      <div
        class="feature-card glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-500 hover:shadow-2xl group"
      >
        <div
          class="feature-icon text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
        >
          🔒
        </div>
        <h3 class="text-2xl font-semibold mb-4 text-white">Secure Access</h3>
        <p class="text-white/70 leading-relaxed">
          Protected by AWS Cognito authentication with enterprise-grade security
        </p>
        <div
          class="mt-4 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        ></div>
      </div>

      <div
        class="feature-card glass-card p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-500 hover:shadow-2xl group"
      >
        <div
          class="feature-icon text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
        >
          ⚡
        </div>
        <h3 class="text-2xl font-semibold mb-4 text-white">Fast & Scalable</h3>
        <p class="text-white/70 leading-relaxed">
          Serverless architecture with automatic scaling and AI-powered image processing
        </p>
        <div
          class="mt-4 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        ></div>
      </div>
    </div>

    <!-- Enhanced Photos Section -->
    <div v-if="isAuthenticated" class="relative">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h2 class="text-4xl font-bold text-white">Your Photos</h2>

        <!-- Enhanced Search Controls -->
        <div class="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div class="relative group">
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Search photos..."
              class="search-input pl-12 pr-4 py-3 glass-card text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 w-full sm:w-64"
            />
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                class="h-5 w-5 text-white/60 group-focus-within:text-purple-400 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
            class="search-select px-4 py-3 glass-card text-white rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 w-full sm:w-48"
          >
            <option value="" class="bg-gray-800">All Tags</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag" class="bg-gray-800">
              {{ tag }}
            </option>
          </select>

          <button
            @click="clearFilters"
            class="filter-button px-6 py-3 glass-card text-white rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 group"
          >
            <span>🗑️</span>
            <span>Clear</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-flex items-center justify-center">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent"></div>
        </div>
        <p class="mt-6 text-white/80 text-lg">Loading your amazing photos...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="photos.length === 0" class="text-center py-16">
        <div class="empty-state-icon text-8xl mb-6 animate-bounce">📷</div>
        <h3 class="text-2xl font-bold text-white mb-4">No photos yet</h3>
        <p class="text-white/70 mb-8 max-w-md mx-auto">Start your photography journey by uploading your first photo!</p>
        <router-link
          to="/upload"
          class="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          <span>📤</span>
          <span>Upload Now</span>
        </router-link>
      </div>

      <!-- Photos Grid -->
      <div v-else class="photos-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="photo-card glass-card rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group animate-fade-in"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <!-- Image Container -->
          <div class="relative overflow-hidden">
            <img
              :src="getImageUrl(photo)"
              :alt="photo.title"
              class="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
              @error="handleImageError"
              loading="lazy"
            />

            <!-- Overlay on hover -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <div class="absolute bottom-4 left-4 right-4">
                <button
                  class="w-full bg-white/20 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-white/30 transition-all duration-300"
                >
                  View Details
                </button>
              </div>
            </div>

            <!-- Processing Status Badge -->
            <div v-if="photo.processedAt" class="absolute top-3 right-3">
              <span class="status-badge bg-green-500/90 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                ✓ Processed
              </span>
            </div>
            <div v-else-if="photo.processingStatus === 'processing'" class="absolute top-3 right-3">
              <span
                class="status-badge bg-yellow-500/90 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm animate-pulse"
              >
                ⏳ Processing...
              </span>
            </div>
          </div>

          <!-- Photo Info -->
          <div class="p-6">
            <h3
              class="font-semibold text-white text-lg mb-2 truncate group-hover:text-purple-300 transition-colors duration-300"
            >
              {{ photo.title }}
            </h3>
            <p class="text-white/60 text-sm mb-4">{{ formatDate(photo.createdAt) }}</p>

            <!-- Auto Tags -->
            <div v-if="photo.autoTags && photo.autoTags.length > 0" class="mb-4">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in photo.autoTags.slice(0, 3)"
                  :key="tag"
                  class="tag inline-block bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-400/30 hover:bg-purple-500/30 transition-colors duration-300"
                >
                  {{ tag }}
                </span>
                <span
                  v-if="photo.autoTags.length > 3"
                  class="tag inline-block bg-gray-500/20 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-400/30"
                >
                  +{{ photo.autoTags.length - 3 }} more
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <button class="action-btn text-white/60 hover:text-purple-400 transition-colors duration-300">
                <span class="text-lg">❤️</span>
              </button>
              <button class="action-btn text-white/60 hover:text-blue-400 transition-colors duration-300">
                <span class="text-lg">💬</span>
              </button>
              <button class="action-btn text-white/60 hover:text-green-400 transition-colors duration-300">
                <span class="text-lg">🔗</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Guest Welcome -->
    <div v-else class="text-center py-16 relative">
      <div class="glass-card p-12 rounded-3xl max-w-2xl mx-auto">
        <h2 class="text-4xl font-bold text-white mb-6">Join Our Community</h2>
        <p class="text-white/80 mb-10 text-lg leading-relaxed">
          Sign up to start sharing your photos and discover amazing content from others. Experience the power of
          AI-enhanced photo sharing.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/login"
            class="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Sign In
          </router-link>
          <router-link
            to="/login"
            class="glass-card text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
          >
            Sign Up
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { Photo } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

const isAuthenticated = ref<boolean>(false);
const loading = ref<boolean>(false);
const photos = ref<Photo[]>([]);
const searchQuery = ref<string>('');
const selectedTag = ref<string>('');

// Get authentication token
const getAuthToken = async (): Promise<string> => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (!idToken) {
      throw new Error('No ID token available');
    }
    return idToken;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    throw error;
  }
};

// Make authenticated API call
const apiCall = async (path: string, method: string = 'GET', body?: any): Promise<any> => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Debounce search input
let searchTimeout: ReturnType<typeof setTimeout>;
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

    const data = await apiCall(path);
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

<style scoped>
/* Glass morphism effects */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Floating particles animation */
@keyframes float-particles {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.floating-particles::before,
.floating-particles::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 50%;
  opacity: 0.6;
  animation: float-particles 6s ease-in-out infinite;
}

.floating-particles::before {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.floating-particles::after {
  top: 60%;
  right: 30%;
  animation-delay: 3s;
}

/* Enhanced feature cards */
.feature-card {
  position: relative;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.02);
}

.feature-card:hover .feature-card-icon {
  transform: scale(1.2) rotate(10deg);
}

.feature-card-icon {
  transition: transform 0.3s ease;
}

/* Gradient text animations */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.gradient-text {
  background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
  background-size: 400% 400%;
  animation: gradient-shift 4s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Photo grid animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.photos-grid {
  animation: fade-in 0.8s ease-out;
}

.photo-card {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.photo-card:hover {
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Search and filter enhancements */
.search-input,
.search-select {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-input:focus,
.search-select:focus {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.filter-button {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-button:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Status badge animations */
.status-badge {
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Tag hover effects */
.tag {
  transition: all 0.3s ease;
  cursor: pointer;
}

.tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Action button animations */
.action-btn {
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.action-btn:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.1);
}

/* Empty state animation */
.empty-state-icon {
  animation: bounce-gentle 2s ease-in-out infinite;
}

@keyframes bounce-gentle {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Loading spinner enhancement */
.animate-spin {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive animations */
@media (max-width: 768px) {
  .photo-card:hover {
    transform: scale(1.02);
  }

  .feature-card:hover {
    transform: translateY(-5px) scale(1.01);
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(45deg, #764ba2, #667eea);
}
</style>
