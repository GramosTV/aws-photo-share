<template>
  <div class="px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Upload Photos</h1>

      <!-- Upload Form -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <form @submit.prevent="handleUpload">
          <!-- File Upload Area -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Select Photos </label>
            <div
              @drop="handleDrop"
              @dragover.prevent
              @dragenter.prevent
              :class="[
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
              ]"
              @click="fileInput?.click()"
            >
              <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleFileSelect" />

              <div v-if="selectedFiles.length === 0">
                <div class="text-4xl mb-4">📁</div>
                <p class="text-lg text-gray-600 mb-2">Drop photos here or click to browse</p>
                <p class="text-sm text-gray-500">Supports JPG, PNG, GIF up to 10MB each</p>
              </div>

              <div v-else>
                <div class="text-4xl mb-4">✅</div>
                <p class="text-lg text-gray-600">{{ selectedFiles.length }} file(s) selected</p>
              </div>
            </div>
          </div>

          <!-- Selected Files Preview -->
          <div v-if="selectedFiles.length > 0" class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Selected Files</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <img
                  v-if="file.preview"
                  :src="file.preview"
                  :alt="file.name"
                  class="w-12 h-12 object-cover rounded mr-3"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                  <p class="text-sm text-gray-500">{{ formatFileSize(file.size) }}</p>

                  <!-- Title Input -->
                  <input
                    v-model="file.title"
                    type="text"
                    placeholder="Enter photo title..."
                    class="mt-2 block w-full text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button type="button" @click="removeFile(index)" class="ml-2 text-red-500 hover:text-red-700">
                  ❌
                </button>
              </div>
            </div>
          </div>

          <!-- Upload Button -->
          <div class="flex justify-between items-center">
            <button
              v-if="selectedFiles.length > 0"
              type="button"
              @click="clearFiles"
              class="text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
            <div></div>

            <button
              type="submit"
              :disabled="selectedFiles.length === 0 || uploading"
              :class="[
                'px-6 py-2 rounded-lg font-medium',
                selectedFiles.length === 0 || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white',
              ]"
            >
              <span v-if="uploading" class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </span>
              <span v-else>Upload Photos</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploadProgress.length > 0" class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Progress</h3>
        <div class="space-y-3">
          <div v-for="progress in uploadProgress" :key="progress.fileName" class="flex items-center">
            <div class="flex-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-700">{{ progress.fileName }}</span>
                <span class="text-gray-500">{{ progress.progress }}%</span>
              </div>
              <div class="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  :style="{ width: progress.progress + '%' }"
                  :class="[
                    'h-2 rounded-full transition-all duration-300',
                    progress.status === 'completed'
                      ? 'bg-green-500'
                      : progress.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-blue-500',
                  ]"
                ></div>
              </div>
            </div>
            <div class="ml-4">
              <span v-if="progress.status === 'completed'" class="text-green-500">✅</span>
              <span v-else-if="progress.status === 'error'" class="text-red-500">❌</span>
              <span v-else class="text-blue-500">⏳</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { uploadData } from 'aws-amplify/storage';
import { post } from 'aws-amplify/api';
import type { FileWithMetadata, UploadProgress } from '@/types';

const selectedFiles = ref<FileWithMetadata[]>([]);
const uploading = ref<boolean>(false);
const isDragOver = ref<boolean>(false);
const uploadProgress = ref<UploadProgress[]>([]);
const fileInput = ref<HTMLInputElement>();

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
        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

        // Upload to S3
        const uploadResult = await uploadData({
          path: `photos/${fileName}`,
          data: file,
          options: {
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (totalBytes) {
                progressItem.progress = Math.round((transferredBytes / totalBytes) * 100);
              }
            },
          },
        }).result;

        // Save metadata to API
        await post({
          apiName: 'PhotoAPI',
          path: '/photos',
          options: {
            body: {
              title: file.title || file.name,
              fileName: fileName,
              fileSize: file.size,
              contentType: file.type,
              url: uploadResult.path,
            },
          },
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
