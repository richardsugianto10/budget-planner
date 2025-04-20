<template>
  <div class="profile-menu" ref="profileMenuRef">
    <div class="profile-trigger" @click="toggleDropdown">
      <img 
        :src="userImage || '/default-avatar.png'" 
        :alt="user?.username || 'User'"
        class="profile-image"
        @error="handleImageError"
      />
    </div>

    <div v-if="isDropdownOpen" class="profile-dropdown">
      <div class="dropdown-item" @click="openProfileDashboard">
        <FontAwesomeIcon icon="user" />
        <span>Profile Dashboard</span>
      </div>
      <div class="dropdown-item" @click="handleLogout">
        <FontAwesomeIcon icon="arrow-right-from-bracket" />
        <span>Logout</span>
      </div>
    </div>

    <!-- Profile Dashboard Modal -->
    <div v-if="showProfileDashboard" class="modal-backdrop" @click="closeProfileDashboard">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Profile Dashboard</h2>
          <button class="close-button" @click="closeProfileDashboard">
            <FontAwesomeIcon icon="xmark" />
          </button>
        </div>

        <div class="profile-form">
          <div class="profile-picture-section">
            <div class="image-wrapper">
              <img 
                :src="userImage || '/default-avatar.png'" 
                :alt="user?.username || 'User'"
                class="large-profile-image"
                @error="handleImageError"
              />
            </div>
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileUpload" 
              accept="image/*" 
              class="hidden-file-input"
            />
            <button class="change-picture-button" @click="triggerFileInput" :disabled="isUploading">
              <FontAwesomeIcon :icon="isUploading ? 'spinner' : 'camera'" :spin="isUploading" />
              {{ isUploading ? 'Uploading...' : 'Change Picture' }}
            </button>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input 
              type="email" 
              v-model="email" 
              disabled 
              class="input-disabled"
            />
          </div>

          <div class="form-group">
            <label>Username</label>
            <input 
              type="text" 
              v-model="username"
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label>New Password</label>
            <input 
              type="password" 
              v-model="newPassword"
              class="input-field"
              placeholder="Enter new password"
            />
          </div>

          <div class="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              v-model="confirmPassword"
              class="input-field"
              placeholder="Confirm new password"
            />
          </div>

          <div class="form-actions">
            <button class="cancel-button" @click="closeProfileDashboard">Cancel</button>
            <button class="save-button" @click="saveChanges">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/axios'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const router = useRouter()
const { user } = storeToRefs(authStore)

const isDropdownOpen = ref(false)
const showProfileDashboard = ref(false)
const userImage = ref('')
const email = ref('')
const username = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const profileMenuRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const loadImage = async (url: string): Promise<string> => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error('Error loading image:', error);
    return '/default-avatar.png';
  }
};

// Watch for changes in the user object from the store
watch(user, (newUser) => {
  console.log('User object changed:', newUser);
  if (newUser) {
    email.value = newUser.email || '';
    username.value = newUser.username || '';
    userImage.value = newUser.display_picture || '';
    console.log('Updated userImage value:', userImage.value);
  }
}, { immediate: true });

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (profileMenuRef.value && !profileMenuRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Fetch user data on component mount
  authStore.fetchUser()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const openProfileDashboard = async () => {
  showProfileDashboard.value = true
  isDropdownOpen.value = false
  
  try {
    // Always fetch fresh user data when opening the dashboard
    await authStore.fetchUser()
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
}

const closeProfileDashboard = () => {
  showProfileDashboard.value = false
  newPassword.value = ''
  confirmPassword.value = ''
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const saveChanges = async () => {
  try {
    // Validate passwords if they are being changed
    if (newPassword.value || confirmPassword.value) {
      if (newPassword.value !== confirmPassword.value) {
        alert('Passwords do not match')
        return
      }
      if (newPassword.value.length < 6) {
        alert('Password must be at least 6 characters long')
        return
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (username.value !== user.value?.username) {
      updateData.username = username.value
    }
    if (newPassword.value) {
      updateData.password = newPassword.value
    }

    // Only make API call if there are changes
    if (Object.keys(updateData).length > 0) {
      await api.put('/auth/update-profile', updateData)
      
      // Refresh user data
      await authStore.fetchUser()
    }

    closeProfileDashboard()
  } catch (error: any) {
    console.error('Error updating profile:', error)
    alert(error.response?.data?.message || 'Failed to update profile')
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) {
    console.log('No file selected');
    return;
  }
  
  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (JPEG, PNG, etc.)');
    console.log('Invalid file type:', file.type);
    return;
  }
  
  if (file.size > 2 * 1024 * 1024) { // 2MB limit
    alert('File size should be less than 2MB');
    console.log('File too large:', file.size);
    return;
  }

  try {
    console.log('Starting file upload...');
    isUploading.value = true;
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Sending upload request...');
    // Upload to Cloudinary through our API
    const uploadResponse = await api.post('/upload/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('Upload successful, response:', uploadResponse.data);
    
    if (!uploadResponse.data.imageUrl) {
      throw new Error('No image URL received from server');
    }
    
    console.log('Updating profile with new image URL:', uploadResponse.data.imageUrl);
    // Update user profile with new image URL
    await api.put('/auth/update-profile', {
      display_picture: uploadResponse.data.imageUrl
    });
    
    console.log('Profile updated, refreshing user data...');
    // Refresh user data to get updated profile picture
    await authStore.fetchUser();
    
    alert('Profile picture updated successfully!');
  } catch (error: any) {
    console.error('Error uploading profile picture:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    let errorMessage = 'Failed to upload profile picture';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Upload timed out. Please try again with a smaller image.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    alert(errorMessage);
  } finally {
    isUploading.value = false;
    // Clear the file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.error('Image failed to load:', {
    src: img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    complete: img.complete,
    currentSrc: img.currentSrc
  });
  img.src = '/default-avatar.png';
};
</script>

<style scoped lang="scss">
.profile-menu {
  position: relative;
}

.profile-trigger {
  cursor: pointer;
  transition: transform 0.2s;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
  }
}

.profile-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
  font-size: 0; /* Hide alt text */
  color: transparent; /* Hide alt text */
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 100;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f7fafc;
    color: #2d3748;
  }

  &:first-child {
    border-radius: 12px 12px 0 0;
  }

  &:last-child {
    border-radius: 0 0 12px 12px;
    border-top: 1px solid #e2e8f0;
  }
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
  }
}

.close-button {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background: #f7fafc;
  }
}

.profile-form {
  padding: 1.5rem;
}

.profile-picture-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  
  .image-wrapper {
    width: 160px;
    height: 160px;
    overflow: hidden;
    border-radius: 50%;
  }
}

.large-profile-image {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e2e8f0;
  margin-bottom: 1rem;
  font-size: 0; /* Hide alt text */
  color: transparent; /* Hide alt text */
}

.hidden-file-input {
  display: none;
}

.change-picture-button {
  padding: 0.5rem 1rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  color: #4a5568;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  min-width: 140px;
  justify-content: center;

  &:hover {
    background: #edf2f7;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
  }
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #2d3748;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.input-disabled {
  @extend .input-field;
  background: #f7fafc;
  color: #718096;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
  }
}

.save-button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5a67d8;
  }
}
</style> 