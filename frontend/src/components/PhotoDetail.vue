<template>
  <div v-if="photo" class="photo-detail-overlay" @click="closeModal">
    <div class="photo-detail-modal" @click.stop>
      <!-- Close Button -->
      <button
        @click="closeModal"
        class="close-button absolute top-4 right-4 z-50 text-white/80 hover:text-white transition-colors duration-300"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <!-- Main Content -->
      <div class="photo-detail-content">
        <!-- Left Side - Image -->
        <div class="photo-display">
          <img :src="photo.photoUrl" :alt="photo.title" class="main-photo" @error="handleImageError" />

          <!-- Image Info Overlay -->
          <div class="image-info-overlay">
            <div class="image-stats">
              <span class="stat-item">
                📐 {{ photo.dimensions?.width || 'Unknown' }}×{{ photo.dimensions?.height || 'Unknown' }}
              </span>
              <span class="stat-item"> 📁 {{ formatFileSize(photo.fileSize) }} </span>
              <span class="stat-item"> 🕒 {{ formatDate(photo.createdAt) }} </span>
            </div>
          </div>
        </div>

        <!-- Right Side - Details -->
        <div class="photo-info">
          <!-- Header -->
          <div class="photo-header">
            <h2 class="photo-title">{{ photo.title }}</h2>
            <span class="status-badge" :class="statusClass">
              {{ statusText }}
            </span>
          </div>

          <!-- Description -->
          <div class="photo-description" v-if="photo.description">
            <h3 class="section-title">Description</h3>
            <p class="description-text">{{ photo.description }}</p>
          </div>

          <!-- AI Analysis Section -->
          <div class="ai-analysis-section" v-if="hasAIFeatures">
            <h3 class="section-title">🤖 AI Analysis</h3>

            <!-- Confidence Score -->
            <div class="confidence-score" v-if="photo.rekognitionConfidence">
              <div class="confidence-header">
                <span class="confidence-label">Recognition Confidence</span>
                <span class="confidence-value">{{ photo.rekognitionConfidence }}%</span>
              </div>
              <div class="confidence-bar">
                <div class="confidence-fill" :style="{ width: photo.rekognitionConfidence + '%' }"></div>
              </div>
            </div>

            <!-- Auto Tags -->
            <div class="auto-tags" v-if="photo.autoTags && photo.autoTags.length > 0">
              <h4 class="tags-title">🏷️ Auto-detected Tags</h4>
              <div class="tags-grid">
                <span v-for="tag in photo.autoTags" :key="tag" class="ai-tag">
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Manual Tags -->
            <div class="manual-tags" v-if="photo.tags && photo.tags.length > 0">
              <h4 class="tags-title">🏷️ Your Tags</h4>
              <div class="tags-grid">
                <span v-for="tag in photo.tags" :key="tag" class="manual-tag">
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Add Tags Section -->
            <div class="add-tags-section">
              <h4 class="tags-title">Add Custom Tags</h4>
              <div class="add-tag-input">
                <input
                  v-model="newTag"
                  @keyup.enter="addTag"
                  type="text"
                  placeholder="Add a tag..."
                  class="tag-input"
                />
                <button @click="addTag" class="add-tag-btn" :disabled="!newTag.trim()">Add</button>
              </div>
            </div>
          </div>

          <!-- Technical Details -->
          <div class="technical-details">
            <h3 class="section-title">📊 Technical Details</h3>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">File Name:</span>
                <span class="detail-value">{{ photo.fileName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">File Type:</span>
                <span class="detail-value">{{ photo.mimeType }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">File Size:</span>
                <span class="detail-value">{{ formatFileSize(photo.fileSize) }}</span>
              </div>
              <div class="detail-item" v-if="photo.dimensions">
                <span class="detail-label">Dimensions:</span>
                <span class="detail-value">{{ photo.dimensions.width }}×{{ photo.dimensions.height }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Uploaded:</span>
                <span class="detail-value">{{ formatDate(photo.createdAt) }}</span>
              </div>
              <div class="detail-item" v-if="photo.updatedAt !== photo.createdAt">
                <span class="detail-label">Last Updated:</span>
                <span class="detail-value">{{ formatDate(photo.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="photo-actions">
            <button class="action-button primary" @click="downloadPhoto">
              <span>📥</span>
              <span>Download</span>
            </button>
            <button class="action-button secondary" @click="sharePhoto">
              <span>🔗</span>
              <span>Share</span>
            </button>
            <button class="action-button danger" @click="deletePhoto">
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Photo } from '@/types';

interface Props {
  photo: Photo | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'update-photo', photo: Photo): void;
  (e: 'delete-photo', photoId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const newTag = ref('');

// Computed properties
const hasAIFeatures = computed(() => {
  return props.photo?.autoTags?.length || props.photo?.rekognitionConfidence;
});

const statusClass = computed(() => {
  switch (props.photo?.status) {
    case 'processed':
      return 'status-processed';
    case 'processing':
      return 'status-processing';
    case 'failed':
      return 'status-failed';
    default:
      return 'status-unknown';
  }
});

const statusText = computed(() => {
  switch (props.photo?.status) {
    case 'processed':
      return '✅ Processed';
    case 'processing':
      return '⏳ Processing';
    case 'failed':
      return '❌ Failed';
    default:
      return '❓ Unknown';
  }
});

// Methods
const closeModal = () => {
  emit('close');
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE2cHgiIGZpbGw9IiM5OTkiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

const addTag = async () => {
  if (!newTag.value.trim() || !props.photo) return;

  // TODO: Implement API call to add tag
  console.log('Adding tag:', newTag.value);
  newTag.value = '';
};

const downloadPhoto = () => {
  if (props.photo?.photoUrl) {
    const link = document.createElement('a');
    link.href = props.photo.photoUrl;
    link.download = props.photo.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const sharePhoto = () => {
  if (props.photo?.photoUrl) {
    navigator.clipboard.writeText(props.photo.photoUrl);
    // TODO: Show notification
    console.log('Photo URL copied to clipboard');
  }
};

const deletePhoto = () => {
  if (props.photo && confirm('Are you sure you want to delete this photo?')) {
    emit('delete-photo', props.photo.id);
  }
};
</script>

<style scoped>
.photo-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.photo-detail-modal {
  background: rgba(30, 20, 60, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  max-width: 1200px;
  max-height: 90vh;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.close-button {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 0, 0, 0.6);
  transform: scale(1.1);
}

.photo-detail-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  height: 80vh;
}

.photo-display {
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.main-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px 0 0 12px;
}

.image-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 20px;
}

.image-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  color: white;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.photo-info {
  padding: 32px;
  overflow-y: auto;
  color: white;
}

.photo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.photo-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  flex: 1;
  margin-right: 16px;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.status-processed {
  background: rgba(34, 197, 94, 0.2);
  color: rgb(34, 197, 94);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-processing {
  background: rgba(251, 191, 36, 0.2);
  color: rgb(251, 191, 36);
  border: 1px solid rgba(251, 191, 36, 0.3);
  animation: pulse 2s infinite;
}

.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: rgb(239, 68, 68);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 16px 0;
  color: #e0e7ff;
}

.description-text {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
}

.ai-analysis-section {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin: 24px 0;
}

.confidence-score {
  margin-bottom: 20px;
}

.confidence-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.confidence-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.confidence-value {
  color: #10b981;
  font-weight: 600;
}

.confidence-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.tags-title {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 12px 0;
  color: #e0e7ff;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-tag {
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.manual-tag {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.add-tag-input {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.tag-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
}

.tag-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.add-tag-btn {
  background: rgba(139, 92, 246, 0.8);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.add-tag-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 1);
  transform: translateY(-1px);
}

.add-tag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.technical-details {
  margin-top: 24px;
}

.details-grid {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.detail-value {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.photo-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-button.primary {
  background: rgba(34, 197, 94, 0.8);
  color: white;
}

.action-button.primary:hover {
  background: rgba(34, 197, 94, 1);
  transform: translateY(-2px);
}

.action-button.secondary {
  background: rgba(59, 130, 246, 0.8);
  color: white;
}

.action-button.secondary:hover {
  background: rgba(59, 130, 246, 1);
  transform: translateY(-2px);
}

.action-button.danger {
  background: rgba(239, 68, 68, 0.8);
  color: white;
}

.action-button.danger:hover {
  background: rgba(239, 68, 68, 1);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .photo-detail-content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .photo-info {
    max-height: 50vh;
    padding: 20px;
  }

  .photo-actions {
    flex-direction: column;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
