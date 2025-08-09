<template>
  <div class="min-h-screen py-8 px-4">
    <!-- Animated Background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
      <div class="absolute inset-0 bg-gradient-to-tr from-blue-800/50 via-purple-800/50 to-pink-800/50"></div>

      <!-- Floating orbs -->
      <div class="floating-orb orb-1"></div>
      <div class="floating-orb orb-2"></div>
      <div class="floating-orb orb-3"></div>
    </div>

    <div class="max-w-4xl mx-auto relative z-10">
      <!-- Enhanced Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold mb-4">
          <span class="gradient-text">Upload Your Photos</span>
        </h1>
        <p class="text-white/80 text-xl max-w-2xl mx-auto">
          Share your moments with AI-powered tagging and automatic processing
        </p>
      </div>

      <!-- Enhanced Upload Form -->
      <div class="glass-card rounded-3xl p-8 mb-8 backdrop-blur-xl">
        <form @submit.prevent="handleUpload">
          <!-- Enhanced File Upload Area -->
          <div class="mb-8">
            <label class="block text-lg font-semibold text-white mb-4">Select Your Photos</label>
            <div
              @drop="handleDrop"
              @dragover.prevent
              @dragenter.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              :class="[
                'upload-zone border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 relative overflow-hidden',
                isDragOver
                  ? 'border-purple-400 bg-purple-400/10 scale-105'
                  : 'border-white/30 hover:border-purple-400/50 hover:bg-white/5',
              ]"
              @click="fileInput?.click()"
            >
              <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleFileSelect" />

              <!-- Upload zone background effect -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300"
                :class="{ 'opacity-100': isDragOver }"
              ></div>

              <div v-if="selectedFiles.length === 0" class="relative z-10">
                <div class="upload-icon text-8xl mb-6 animate-bounce">📁</div>
                <h3 class="text-2xl font-bold text-white mb-3">Drop photos here or click to browse</h3>
                <p class="text-white/70 text-lg mb-4">Supports JPG, PNG, GIF up to 10MB each</p>
                <div
                  class="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  <span>📤</span>
                  <span>Choose Files</span>
                </div>
              </div>

              <div v-else class="relative z-10">
                <div class="upload-icon text-8xl mb-6 animate-pulse">✨</div>
                <h3 class="text-2xl font-bold text-white mb-2">{{ selectedFiles.length }} file(s) selected</h3>
                <p class="text-white/70">Ready to upload your amazing photos!</p>
              </div>
            </div>
          </div>

          <!-- Enhanced Selected Files Preview -->
          <div v-if="selectedFiles.length > 0" class="mb-8">
            <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
              <span class="mr-3">🖼️</span>
              Selected Photos
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="file-card glass-card rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 group"
                :style="{ animationDelay: `${index * 100}ms` }"
              >
                <!-- Image Preview -->
                <div class="relative overflow-hidden">
                  <img
                    v-if="file.preview"
                    :src="file.preview"
                    :alt="file.name"
                    class="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  ></div>

                  <!-- Remove button overlay -->
                  <button
                    type="button"
                    @click="removeFile(index)"
                    class="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 transform scale-75 hover:scale-100"
                  >
                    ❌
                  </button>
                </div>

                <!-- File Info -->
                <div class="p-4">
                  <h4 class="font-semibold text-white text-sm mb-1 truncate">{{ file.name }}</h4>
                  <p class="text-white/60 text-xs mb-3">{{ formatFileSize(file.size) }}</p>

                  <!-- Enhanced Title Input -->
                  <div class="relative">
                    <input
                      v-model="file.title"
                      type="text"
                      placeholder="Enter photo title..."
                      class="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Action Buttons -->
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              v-if="selectedFiles.length > 0"
              type="button"
              @click="clearFiles"
              class="clear-btn glass-card text-white px-6 py-3 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Clear All</span>
            </button>
            <div></div>

            <button
              type="submit"
              :disabled="selectedFiles.length === 0 || uploading"
              :class="[
                'upload-btn px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 min-w-[200px] justify-center',
                selectedFiles.length === 0 || uploading
                  ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl',
              ]"
            >
              <span v-if="uploading" class="flex items-center">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                <span>Uploading Magic...</span>
              </span>
              <span v-else class="flex items-center">
                <span>🚀</span>
                <span>Upload Photos</span>
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Enhanced Upload Progress -->
      <div v-if="uploadProgress.length > 0" class="glass-card rounded-3xl p-8 backdrop-blur-xl">
        <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
          <span class="mr-3">📊</span>
          Upload Progress
        </h3>
        <div class="space-y-4">
          <div
            v-for="(progress, index) in uploadProgress"
            :key="progress.fileName"
            class="progress-item glass-card rounded-xl p-4 animate-slide-in"
            :style="{ animationDelay: `${index * 150}ms` }"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-white font-medium truncate flex-1 mr-4">{{ progress.fileName }}</span>
              <div class="flex items-center space-x-3">
                <span class="text-white/80 text-sm font-mono">{{ progress.progress }}%</span>
                <div class="status-icon">
                  <span v-if="progress.status === 'completed'" class="text-green-400 text-xl animate-bounce">✅</span>
                  <span v-else-if="progress.status === 'error'" class="text-red-400 text-xl animate-pulse">❌</span>
                  <div
                    v-else
                    class="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Enhanced Progress Bar -->
            <div class="relative bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                :style="{ width: progress.progress + '%' }"
                :class="[
                  'h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden',
                  progress.status === 'completed'
                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                    : progress.status === 'error'
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : 'bg-gradient-to-r from-blue-400 to-purple-500',
                ]"
              >
                <!-- Animated shine effect -->
                <div
                  class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { FileWithMetadata, UploadProgress } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

const selectedFiles = ref<FileWithMetadata[]>([]);
const uploading = ref<boolean>(false);
const isDragOver = ref<boolean>(false);
const uploadProgress = ref<UploadProgress[]>([]);
const fileInput = ref<HTMLInputElement>();

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

// Handle file selection
const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(Array.from(target.files));
  }
};

// Handle drag and drop
const handleDrop = (event: DragEvent): void => {
  event.preventDefault();
  isDragOver.value = false;

  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
};

// Add files to selection
const addFiles = (files: File[]): void => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));

  imageFiles.forEach((file) => {
    const fileWithMetadata: FileWithMetadata = Object.assign(file, {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      preview: undefined,
    });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      fileWithMetadata.preview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    selectedFiles.value.push(fileWithMetadata);
  });
};

// Remove file from selection
const removeFile = (index: number): void => {
  selectedFiles.value.splice(index, 1);
};

// Clear all files
const clearFiles = () => {
  selectedFiles.value = [];
  uploadProgress.value = [];
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Handle upload
const handleUpload = async (): Promise<void> => {
  if (selectedFiles.value.length === 0) return;

  uploading.value = true;
  uploadProgress.value = selectedFiles.value.map((file) => ({
    fileName: file.name,
    progress: 0,
    status: 'uploading' as const,
  }));

  try {
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i];
      const progressItem = uploadProgress.value[i];

      try {
        // Step 1: Get pre-signed upload URL from our API
        const uploadData = await apiCall('/upload-url', 'POST', {
          fileName: file.name,
          fileType: file.type,
        });

        // Step 2: Upload directly to S3 using pre-signed URL
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        progressItem.progress = 100;

        // Step 3: Save metadata to our API
        await apiCall('/photos', 'POST', {
          title: file.title || file.name,
          s3Key: uploadData.s3Key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        progressItem.status = 'completed';
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        progressItem.status = 'error';
      }
    }

    // Clear selected files after successful upload
    setTimeout(() => {
      selectedFiles.value = [];
      uploadProgress.value = [];
    }, 2000);
  } catch (error) {
    console.error('Upload error:', error);
  } finally {
    uploading.value = false;
  }
};
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

/* Floating orbs animation */
.floating-orb {
  position: absolute;
  border-radius: 50%;
  opacity: 0.7;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, #f093fb, #f5576c);
  top: 60%;
  right: 15%;
  animation-delay: 10s;
}

.orb-3 {
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  bottom: 20%;
  left: 60%;
  animation-delay: 5s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-50px) rotate(180deg);
    opacity: 1;
  }
}

/* Gradient text animation */
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

/* Upload zone enhancements */
.upload-zone {
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.upload-zone:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.upload-icon {
  transition: transform 0.3s ease;
}

.upload-zone:hover .upload-icon {
  transform: scale(1.1);
}

/* File card animations */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-card {
  animation: slide-in 0.5s ease-out forwards;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.file-card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* Button enhancements */
.upload-btn,
.clear-btn {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.upload-btn:not(:disabled):hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.clear-btn:hover {
  box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3);
}

/* Progress item animations */
.progress-item {
  animation: slide-in 0.5s ease-out forwards;
  transition: all 0.3s ease;
}

.progress-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* Shimmer effect for progress bars */
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(200%) skewX(-12deg);
  }
}

.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}

/* Status icon animations */
.status-icon {
  min-width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Enhanced animations */
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

.animate-bounce {
  animation: bounce-gentle 2s ease-in-out infinite;
}

/* Drag over effects */
.upload-zone.border-purple-400 {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1));
  border-color: #a855f7;
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .upload-zone {
    padding: 2rem;
  }

  .file-card:hover {
    transform: scale(1.02);
  }

  .upload-btn,
  .clear-btn {
    min-width: auto;
    width: 100%;
  }
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

/* Smooth transitions */
* {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

/* Loading states */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Focus states */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.3);
}
</style>
