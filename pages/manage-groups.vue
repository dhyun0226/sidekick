<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#09090b] py-16 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">활성 그룹 관리</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          무료 플랜은 2개 그룹만 사용할 수 있습니다. 사용할 그룹을 선택해주세요.
        </p>
      </div>

      <!-- 현재 선택: 2/10 -->
      <div class="bg-white dark:bg-zinc-900 rounded-xl p-4 mb-4 border border-zinc-200 dark:border-zinc-800">
        <p class="text-sm font-bold text-zinc-900 dark:text-white">
          선택: <span class="text-lime-500">{{ selectedGroups.length }}</span> / 2
        </p>
      </div>

      <!-- 그룹 목록 -->
      <div class="space-y-2">
        <div
          v-for="group in allGroups"
          :key="group.id"
          @click="toggleGroup(group.id)"
          class="bg-white dark:bg-zinc-900 rounded-xl p-4 border-2 transition-all cursor-pointer"
          :class="{
            'border-lime-500 bg-lime-50 dark:bg-lime-900/10': selectedGroups.includes(group.id),
            'border-zinc-200 dark:border-zinc-800 hover:border-lime-300': !selectedGroups.includes(group.id),
            'opacity-50': selectedGroups.length >= 2 && !selectedGroups.includes(group.id)
          }"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center border-2"
              :class="{
                'border-lime-500 bg-lime-500 text-white': selectedGroups.includes(group.id),
                'border-zinc-300 dark:border-zinc-700': !selectedGroups.includes(group.id)
              }"
            >
              <Check v-if="selectedGroups.includes(group.id)" :size="18" />
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-zinc-900 dark:text-white">{{ group.name }}</h3>
              <p class="text-xs text-zinc-500">멤버 {{ group.memberCount }}명</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 저장 버튼 -->
      <button
        @click="saveSelection"
        :disabled="selectedGroups.length !== 2"
        class="w-full mt-6 py-4 bg-lime-400 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-300 transition-colors"
      >
        저장하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Check } from 'lucide-vue-next'

const allGroups = ref<any[]>([])
const selectedGroups = ref<string[]>([])

const toggleGroup = (groupId: string) => {
  if (selectedGroups.value.includes(groupId)) {
    // 선택 해제
    selectedGroups.value = selectedGroups.value.filter(id => id !== groupId)
  } else {
    // 선택 추가 (2개까지만)
    if (selectedGroups.value.length < 2) {
      selectedGroups.value.push(groupId)
    }
  }
}

const saveSelection = async () => {
  // TODO: API 호출
  console.log('Selected groups:', selectedGroups.value)
}
</script>
