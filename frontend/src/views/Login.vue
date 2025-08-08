<template>
  <div class="min-h-screen py-8 px-4 flex items-center justify-center">
    <!-- Animated Background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900"></div>
      <div class="absolute inset-0 bg-gradient-to-tr from-blue-800/30 via-purple-800/30 to-pink-800/30"></div>

      <!-- Floating geometric shapes -->
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Enhanced Login Card -->
      <div class="glass-card rounded-3xl p-8 backdrop-blur-xl transform hover:scale-105 transition-all duration-300">
        <!-- Header with Animation -->
        <div class="text-center mb-8">
          <div class="auth-icon text-6xl mb-4 animate-bounce">
            {{ isSignUp ? '🌟' : '👋' }}
          </div>
          <h1 class="text-3xl font-bold mb-2">
            <span class="gradient-text">
              {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
            </span>
          </h1>
          <p class="text-white/80 text-lg">
            {{ isSignUp ? 'Join our amazing photo sharing community' : 'Sign in to continue your journey' }}
          </p>
        </div>

        <!-- Enhanced Sign In/Up Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email Field -->
          <div class="form-group">
            <label for="email" class="block text-sm font-semibold text-white mb-2 flex items-center">
              <span class="mr-2">📧</span>
              Email Address
            </label>
            <div class="relative">
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                class="form-input w-full px-4 py-3 glass-card text-white placeholder-white/50 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
              />
              <div class="input-glow"></div>
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password" class="block text-sm font-semibold text-white mb-2 flex items-center">
              <span class="mr-2">🔒</span>
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                type="password"
                required
                class="form-input w-full px-4 py-3 glass-card text-white placeholder-white/50 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
              />
              <div class="input-glow"></div>
            </div>
          </div>

          <!-- Confirm Password Field (Sign Up Only) -->
          <div v-if="isSignUp" class="form-group">
            <label for="confirmPassword" class="block text-sm font-semibold text-white mb-2 flex items-center">
              <span class="mr-2">🔐</span>
              Confirm Password
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                type="password"
                required
                class="form-input w-full px-4 py-3 glass-card text-white placeholder-white/50 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                placeholder="Confirm your password"
              />
              <div class="input-glow"></div>
            </div>
          </div>

          <!-- Enhanced Error Messages -->
          <div
            v-if="errorMessage"
            class="error-card glass-card rounded-xl p-4 border border-red-400/30 bg-red-500/10 animate-shake"
          >
            <div class="flex items-center">
              <span class="text-2xl mr-3">⚠️</span>
              <span class="text-red-300 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Enhanced Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="submit-btn w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="loading" class="flex items-center">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
              <span>{{ isSignUp ? 'Creating Magic...' : 'Signing In...' }}</span>
            </span>
            <span v-else class="flex items-center">
              <span>{{ isSignUp ? '✨' : '🚀' }}</span>
              <span>{{ isSignUp ? 'Create Account' : 'Sign In' }}</span>
            </span>
          </button>
        </form>

        <!-- Enhanced Toggle Sign In/Up -->
        <div class="mt-8 text-center">
          <button
            @click="toggleMode"
            class="toggle-btn text-white/80 hover:text-white text-sm font-medium hover:underline transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto space-x-2"
          >
            <span>{{ isSignUp ? '🔑' : '🆕' }}</span>
            <span>{{ isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }}</span>
          </button>
        </div>

        <!-- Enhanced Confirmation Code Form -->
        <div v-if="showConfirmation" class="confirmation-section mt-8 pt-8 border-t border-white/20 animate-slide-down">
          <div class="text-center mb-6">
            <div class="confirmation-icon text-5xl mb-4 animate-pulse">📬</div>
            <h3 class="text-2xl font-bold text-white mb-2">Check Your Email</h3>
            <p class="text-white/70 text-sm">
              We've sent a magical confirmation code to
              <span class="text-purple-300 font-semibold">{{ formData.email }}</span>
            </p>
          </div>

          <form @submit.prevent="handleConfirmation" class="space-y-6">
            <!-- Confirmation Code Field -->
            <div class="form-group">
              <label for="confirmationCode" class="block text-sm font-semibold text-white mb-2 flex items-center">
                <span class="mr-2">🔢</span>
                Confirmation Code
              </label>
              <div class="relative">
                <input
                  id="confirmationCode"
                  v-model="confirmationCode"
                  type="text"
                  required
                  maxlength="6"
                  class="form-input w-full px-4 py-3 glass-card text-white placeholder-white/50 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
                <div class="input-glow"></div>
              </div>
            </div>

            <!-- Confirm Button -->
            <button
              type="submit"
              :disabled="loading"
              class="confirm-btn w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <span v-if="loading">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                Confirming...
              </span>
              <span v-else class="flex items-center">
                <span>✅</span>
                <span>Confirm Email</span>
              </span>
            </button>

            <!-- Resend Button -->
            <button
              type="button"
              @click="resendConfirmation"
              class="resend-btn w-full text-white/80 hover:text-white text-sm font-medium py-2 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>📬</span>
              <span>Resend Confirmation Code</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Decorative Elements -->
      <div class="decorative-elements">
        <div class="floating-particle particle-1"></div>
        <div class="floating-particle particle-2"></div>
        <div class="floating-particle particle-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signIn, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import type { FormData } from '@/types';

const router = useRouter();

const isSignUp = ref<boolean>(false);
const loading = ref<boolean>(false);
const errorMessage = ref<string>('');
const showConfirmation = ref<boolean>(false);
const confirmationCode = ref<string>('');

const formData = ref<FormData>({
  email: '',
  password: '',
  confirmPassword: '',
});

// Toggle between sign in and sign up
const toggleMode = (): void => {
  isSignUp.value = !isSignUp.value;
  errorMessage.value = '';
  showConfirmation.value = false;
};

// Handle form submission
const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';

  if (isSignUp.value && formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  loading.value = true;

  try {
    if (isSignUp.value) {
      await signUp({
        username: formData.value.email,
        password: formData.value.password,
        options: {
          userAttributes: {
            email: formData.value.email,
          },
        },
      });
      showConfirmation.value = true;
    } else {
      await signIn({
        username: formData.value.email,
        password: formData.value.password,
      });
      router.push('/');
    }
  } catch (error: any) {
    console.error('Auth error:', error);
    errorMessage.value = error.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
};

// Handle email confirmation
const handleConfirmation = async (): Promise<void> => {
  if (!confirmationCode.value) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    await confirmSignUp({
      username: formData.value.email,
      confirmationCode: confirmationCode.value,
    });

    // Automatically sign in after confirmation
    await signIn({
      username: formData.value.email,
      password: formData.value.password,
    });

    router.push('/');
  } catch (error: any) {
    console.error('Confirmation error:', error);
    errorMessage.value = error.message || 'Invalid confirmation code';
  } finally {
    loading.value = false;
  }
};

// Resend confirmation code
const resendConfirmation = async (): Promise<void> => {
  loading.value = true;
  errorMessage.value = '';

  try {
    await resendSignUpCode({
      username: formData.value.email,
    });
    errorMessage.value = 'Confirmation code sent!';
  } catch (error: any) {
    console.error('Resend error:', error);
    errorMessage.value = error.message || 'Failed to resend code';
  } finally {
    loading.value = false;
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

/* Floating geometric shapes */
.floating-shape {
  position: absolute;
  opacity: 0.6;
  animation: float-shapes 15s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 50%;
  top: 15%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #f093fb, #f5576c);
  transform: rotate(45deg);
  top: 70%;
  right: 20%;
  animation-delay: 5s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  border-radius: 20%;
  bottom: 20%;
  left: 20%;
  animation-delay: 10s;
}

.shape-4 {
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, #43e97b, #38f9d7);
  border-radius: 50%;
  top: 30%;
  right: 30%;
  animation-delay: 7s;
}

@keyframes float-shapes {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
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

/* Form enhancements */
.form-group {
  position: relative;
}

.form-input {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  z-index: 1;
}

.form-input:focus {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.input-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: linear-gradient(45deg, transparent, rgba(147, 51, 234, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.form-input:focus + .input-glow {
  opacity: 1;
}

/* Button enhancements */
.submit-btn,
.confirm-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.submit-btn:not(:disabled):hover,
.confirm-btn:not(:disabled):hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.submit-btn::before,
.confirm-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.submit-btn:hover::before,
.confirm-btn:hover::before {
  left: 100%;
}

/* Toggle button */
.toggle-btn {
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  color: #a855f7;
}

/* Auth icon animation */
.auth-icon {
  transition: transform 0.3s ease;
}

.glass-card:hover .auth-icon {
  transform: scale(1.1);
}

/* Error card animation */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.error-card {
  animation: slide-down 0.3s ease-out;
}

/* Confirmation section animation */
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.5s ease-out;
}

.confirmation-section {
  position: relative;
}

.confirmation-icon {
  transition: transform 0.3s ease;
}

.confirmation-section:hover .confirmation-icon {
  transform: scale(1.1);
}

/* Resend button */
.resend-btn {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.resend-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Decorative floating particles */
.decorative-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float-particles 8s ease-in-out infinite;
}

.particle-1 {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.particle-2 {
  top: 60%;
  right: 25%;
  animation-delay: 3s;
}

.particle-3 {
  bottom: 30%;
  left: 30%;
  animation-delay: 6s;
}

@keyframes float-particles {
  0%,
  100% {
    transform: translateY(0px) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
}

/* Loading animation */
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

/* Bounce animation */
.animate-bounce {
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

/* Pulse animation */
.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .glass-card {
    margin: 1rem;
    padding: 1.5rem;
  }

  .auth-icon {
    font-size: 3rem;
  }

  .confirmation-icon {
    font-size: 3rem;
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

/* Focus states for accessibility */
button:focus,
input:focus {
  outline: 2px solid rgba(147, 51, 234, 0.5);
  outline-offset: 2px;
}

/* Disabled state improvements */
button:disabled {
  transform: none !important;
  cursor: not-allowed;
}

/* Enhanced transitions */
* {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
</style>
