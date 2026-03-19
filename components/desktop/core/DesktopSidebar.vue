<template>
  <aside class="w-sidebar h-full flex flex-col shrink-0 bg-white/50 dark:bg-zinc-950/50">
    <!-- Logo -->
    <div class="px-6 pt-7 pb-5">
      <h1 class="text-desktop-callout font-medium tracking-[0.02em] text-zinc-400 dark:text-zinc-500 select-none">사이드킥</h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 space-y-0.5">
      <NuxtLink
        to="/"
        class="sidebar-item"
        :class="{ active: route.path === '/' }"
      >
        <Home :size="17" :stroke-width="1.75" />
        <span>홈</span>
      </NuxtLink>

      <NuxtLink
        to="/my-library"
        class="sidebar-item"
        :class="{ active: route.path === '/my-library' }"
      >
        <BookOpen :size="17" :stroke-width="1.75" />
        <span>내 서재</span>
      </NuxtLink>

      <NuxtLink
        to="/discover"
        class="sidebar-item"
        :class="{ active: route.path === '/discover' }"
      >
        <Compass :size="17" :stroke-width="1.75" />
        <span>디스커버</span>
      </NuxtLink>

      <NuxtLink
        to="/profile"
        class="sidebar-item"
        :class="{ active: route.path === '/profile' }"
      >
        <User :size="17" :stroke-width="1.75" />
        <span>프로필</span>
      </NuxtLink>

      <NuxtLink
        to="/settings"
        class="sidebar-item"
        :class="{ active: route.path === '/settings' }"
      >
        <Settings :size="17" :stroke-width="1.75" />
        <span>설정</span>
      </NuxtLink>

      <!-- Spacer -->
      <div class="pt-5 pb-1">
        <p class="px-3 text-desktop-micro font-medium text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">그룹</p>
      </div>

      <NuxtLink
        v-for="group in socialGroups"
        :key="group.id"
        :to="`/group/${group.id}`"
        class="sidebar-item"
        :class="{ active: route.path === `/group/${group.id}` }"
      >
        <Users :size="17" :stroke-width="1.75" />
        <span class="truncate">{{ group.name }}</span>
      </NuxtLink>

      <div v-if="socialGroups.length === 0 && !loading" class="px-3 py-2 text-desktop-caption text-zinc-300 dark:text-zinc-600">
        참여 중인 그룹이 없어요
      </div>
    </nav>

    <!-- Bottom: User -->
    <div class="px-3 pb-5 pt-3">
      <NuxtLink to="/profile" class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-all duration-200 ease-apple">
        <div class="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
          <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
            <User :size="14" :stroke-width="1.75" />
          </div>
        </div>
        <div class="min-w-0">
          <p class="text-desktop-caption font-medium text-zinc-600 dark:text-zinc-400 truncate">{{ userStore.profile?.nickname }}</p>
        </div>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Home, BookOpen, Compass, User, Users, Settings } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'

const route = useRoute()
const userStore = useUserStore()
const client = useSupabaseClient()

const socialGroups = ref<any[]>([])
const loading = ref(true)

const fetchGroups = async () => {
  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) return

    const { data } = await client
      .from('group_members')
      .select('group_id, left_at, groups!inner(id, name, group_type, status, deleted_at)')
      .eq('user_id', user.id)
      .is('left_at', null)

    if (data) {
      socialGroups.value = data
        .filter((d: any) => d.groups.group_type === 'social' && !d.groups.deleted_at && d.groups.status === 'active')
        .map((d: any) => ({ id: d.groups.id, name: d.groups.name }))
    }
  } catch (e) {
    console.error('Sidebar groups fetch error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchGroups)

// 페이지 이동 시 그룹 목록 갱신 (새 그룹 생성/참여 반영, 디바운스)
let fetchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => route.path, () => {
  if (fetchTimer) clearTimeout(fetchTimer)
  fetchTimer = setTimeout(fetchGroups, 500)
})

onUnmounted(() => {
  if (fetchTimer) clearTimeout(fetchTimer)
})
</script>
