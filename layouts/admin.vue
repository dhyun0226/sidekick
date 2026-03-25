<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-shrink-0 flex flex-col fixed inset-y-0 z-50">
      <!-- Logo / Brand -->
      <div class="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl text-zinc-900 dark:text-white">
          <span class="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center text-black text-xs font-black">CR</span>
          <span>Cheer Readers Admin</span>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="[
            route.path === item.path || (item.path !== '/admin' && route.path.startsWith(item.path))
              ? 'bg-lime-50 dark:bg-lime-900/10 text-lime-600 dark:text-lime-400'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
          ]"
        >
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Footer / User Info -->
      <div class="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
             <Shield :size="16" class="text-zinc-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-zinc-900 dark:text-white truncate">Administrator</p>
            <p class="text-xs text-zinc-500 truncate">Super Admin</p>
          </div>
          <NuxtLink to="/" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Exit Admin">
            <LogOut :size="16" />
          </NuxtLink>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 ml-64 min-w-0">
      <div class="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 px-8 flex items-center justify-between">
        <h1 class="text-lg font-bold text-zinc-900 dark:text-white capitalize">
          {{ currentPageTitle }}
        </h1>
        <div class="flex items-center gap-4">
          <!-- Command Palette Trigger -->
          <button
            @click="commandPaletteRef?.open()"
            class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-sm text-zinc-500 transition-colors"
          >
            <Search :size="14" />
            <span>검색...</span>
            <span class="ml-2 text-xs border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-0.5">⌘K</span>
          </button>
          
          <div class="text-xs text-zinc-400">
            {{ currentDate }}
          </div>
        </div>
      </div>

      <div class="p-8">
        <slot />
      </div>
    </main>
    
    <CommandPalette ref="commandPaletteRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  Shield,
  LogOut,
  Settings,
  Search,
  MessageCircle
} from 'lucide-vue-next'
import CommandPalette from '~/components/admin/CommandPalette.vue'

const route = useRoute()
const commandPaletteRef = ref<InstanceType<typeof CommandPalette> | null>(null)

const navItems = [
  { label: '대시보드', path: '/admin', icon: LayoutDashboard },
  { label: '도서 관리', path: '/admin/books', icon: BookOpen },
  { label: '그룹 관리', path: '/admin/groups', icon: Users }, 
  { label: '사용자 관리', path: '/admin/users', icon: Shield },
  { label: '구독 관리', path: '/admin/subscriptions', icon: CreditCard },
  { label: '문의 관리', path: '/admin/inquiries', icon: MessageCircle },
]

const currentPageTitle = computed(() => {
  const currentItem = navItems.find(item =>
    item.path === '/admin'
      ? route.path === '/admin'
      : route.path.startsWith(item.path)
  )
  return currentItem ? currentItem.label : 'Admin'
})

const currentDate = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
})
</script>
