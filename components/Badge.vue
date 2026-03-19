<template>
  <div
    class="inline-flex items-center gap-1 rounded-full font-semibold transition-colors duration-200"
    :class="[variantClass, sizeClass]"
  >
    <slot name="icon"></slot>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'zinc' | 'lime' | 'amber' | 'orange' | 'teal' | 'purple' | 'blue' | 'pink' | 'emerald' | 'indigo' | 'red' | 'cyan' | 'rose' | 'violet' | 'sky' | 'fuchsia'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'zinc',
  size: 'md'
})

const variantClass = computed(() => {
  const variants = {
    zinc: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
    lime: 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400',
    fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'
  }
  return variants[props.variant] || variants.zinc
})

const sizeClass = computed(() => {
  return props.size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2 py-1'
})
</script>
