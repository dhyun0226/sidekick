<template>
  <div class="max-w-2xl mx-auto px-8 py-12">
    <h1 class="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-white mb-10 leading-tight">설정</h1>

    <div class="space-y-8">
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

      <!-- Account -->
      <div class="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
        <h3 class="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium mb-4">계정</h3>
        <div class="space-y-1">
          <button
            @click="$emit('sign-out')"
            class="w-full py-2 text-desktop-callout text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors text-left"
          >
            로그아웃
          </button>
          <button
            @click="$emit('delete-account')"
            class="w-full py-2 text-desktop-callout text-zinc-400 hover:text-red-500 transition-colors text-left"
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
