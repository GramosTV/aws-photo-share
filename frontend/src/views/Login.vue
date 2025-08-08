<template>
  <div class="px-4 py-8">
    <div class="max-w-md mx-auto">
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isSignUp ? 'Create Account' : 'Sign In' }}
          </h1>
          <p class="text-gray-600 mt-2">
            {{ isSignUp ? 'Join our photo sharing community' : 'Welcome back!' }}
          </p>
        </div>

        <!-- Sign In/Up Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1"> Email Address </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1"> Password </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <div v-if="isSignUp">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1"> Confirm Password </label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your password"
            />
          </div>

          <!-- Error Messages -->
          <div v-if="errorMessage" class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {{ isSignUp ? 'Creating Account...' : 'Signing In...' }}
            </span>
            <span v-else>
              {{ isSignUp ? 'Create Account' : 'Sign In' }}
            </span>
          </button>
        </form>

        <!-- Toggle Sign In/Up -->
        <div class="mt-6 text-center">
          <button @click="toggleMode" class="text-blue-600 hover:text-blue-800 text-sm">
            {{ isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }}
          </button>
        </div>

        <!-- Confirmation Code Form -->
        <div v-if="showConfirmation" class="mt-6 pt-6 border-t">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Your Email</h3>
          <p class="text-sm text-gray-600 mb-4">
            We've sent a confirmation code to {{ formData.email }}. Please enter it below.
          </p>

          <form @submit.prevent="handleConfirmation" class="space-y-4">
            <div>
              <label for="confirmationCode" class="block text-sm font-medium text-gray-700 mb-1">
                Confirmation Code
              </label>
              <input
                id="confirmationCode"
                v-model="confirmationCode"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 6-digit code"
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              <span v-if="loading">Confirming...</span>
              <span v-else>Confirm Email</span>
            </button>

            <button type="button" @click="resendConfirmation" class="w-full text-blue-600 hover:text-blue-800 text-sm">
              Resend Confirmation Code
            </button>
          </form>
        </div>
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
