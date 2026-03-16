<template>
  <div class="max-w-2xl mx-auto px-8 py-8">
    <h1 class="text-desktop-title text-zinc-900 dark:text-white mb-8">설정</h1>

    <div class="space-y-6">
      <DesktopSettingsProfile
        :profile="profile"
        :saving="saving"
        @save="$emit('save-profile', $event)"
        @file-change="$emit('file-change', $event)"
      />

      <DesktopSettingsDisplay
        :is-dark="isDark"
        :input-mode="inputMode"
        @toggle-theme="$emit('toggle-theme')"
        @change-input-mode="$emit('change-input-mode', $event)"
      />

      <DesktopSettingsNotifications
        :settings="notificationSettings"
        @toggle="$emit('toggle-notification', $event)"
      />

      <DesktopSettingsSubscription
        :is-premium="isPremium"
        @upgrade="$emit('upgrade')"
        @manage="$emit('manage-subscription')"
      />

      <!-- Danger Zone -->
      <div class="apple-card p-6">
        <h3 class="text-desktop-headline text-zinc-900 dark:text-white mb-4">계정</h3>
        <div class="space-y-3">
          <button
            @click="$emit('sign-out')"
            class="w-full px-4 py-2.5 text-desktop-callout text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left"
          >
            로그아웃
          </button>
          <button
            @click="$emit('delete-account')"
            class="w-full px-4 py-2.5 text-desktop-callout text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left"
          >
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DesktopSettingsProfile from './DesktopSettingsProfile.vue'
import DesktopSettingsDisplay from './DesktopSettingsDisplay.vue'
import DesktopSettingsNotifications from './DesktopSettingsNotifications.vue'
import DesktopSettingsSubscription from './DesktopSettingsSubscription.vue'

defineProps<{
  profile: any
  saving: boolean
  isDark: boolean
  inputMode: 'percent' | 'page'
  notificationSettings: Record<string, boolean>
  isPremium: boolean
}>()

defineEmits([
  'save-profile', 'file-change', 'toggle-theme', 'change-input-mode',
  'toggle-notification', 'upgrade', 'manage-subscription',
  'sign-out', 'delete-account'
])
</script>
