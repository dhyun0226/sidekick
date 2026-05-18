<template>
  <article class="share-card" :class="themeClass">
    <div class="share-card__top">
      <div>
        <p class="share-card__eyebrow">{{ eyebrow }}</p>
        <h3 class="share-card__title">{{ title || '오늘의 독서' }}</h3>
        <p class="share-card__meta">{{ metaText }}</p>
      </div>
      <CompanionMascot :code="companionCode" state="celebrate" class="share-card__mascot" />
    </div>

    <p v-if="quote" class="share-card__quote">"{{ quote }}"</p>

    <div class="share-card__stats">
      <div>
        <strong>{{ durationText }}</strong>
        <span>읽은 시간</span>
      </div>
      <div>
        <strong>{{ progress }}%</strong>
        <span>진행률</span>
      </div>
      <div>
        <strong>{{ pagesRead }}</strong>
        <span>페이지</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CompanionMascot from './CompanionMascot.vue'

const props = withDefaults(defineProps<{
  title?: string
  author?: string
  groupName?: string
  companionCode?: string
  durationSeconds?: number
  progress?: number
  pagesRead?: number
  quote?: string
  eyebrow?: string
}>(), {
  companionCode: 'pipi',
  durationSeconds: 0,
  progress: 0,
  pagesRead: 0,
  eyebrow: 'Sidekick Reading Session'
})

const durationText = computed(() => {
  const seconds = Math.max(0, Math.round(props.durationSeconds || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${Math.max(1, minutes)}m`
})

const metaText = computed(() => {
  const parts = [props.author, props.groupName].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '혼자 또는 그룹과 함께 읽는 중'
})

const themeClass = computed(() => `share-card--${props.companionCode || 'pipi'}`)
</script>

<style scoped>
.share-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 22px;
  min-height: 260px;
  color: #18181b;
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 48%, #dcfce7 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55), 0 24px 70px rgba(24, 24, 27, 0.16);
}

.share-card--momo {
  background: linear-gradient(135deg, #f7fee7 0%, #dcfce7 52%, #e0f2fe 100%);
}

.share-card--rumi {
  background: linear-gradient(135deg, #fdf2f8 0%, #fae8ff 52%, #ffedd5 100%);
}

.share-card--toto {
  background: linear-gradient(135deg, #ecfeff 0%, #dbeafe 52%, #f0f9ff 100%);
}

.share-card--nori {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 52%, #e0e7ff 100%);
}

.share-card__top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.share-card__eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
  color: rgba(24, 24, 27, 0.52);
}

.share-card__title {
  margin: 0;
  font-size: 28px;
  line-height: 1.05;
  font-weight: 950;
  letter-spacing: 0;
}

.share-card__meta {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: rgba(24, 24, 27, 0.62);
}

.share-card__mascot {
  width: 108px;
  height: 108px;
  flex-shrink: 0;
  transform: scale(0.64);
  transform-origin: top right;
}

.share-card__quote {
  margin: 18px 0 0;
  padding-left: 14px;
  border-left: 3px solid rgba(24, 24, 27, 0.2);
  font-size: 15px;
  line-height: 1.55;
  font-weight: 750;
  color: rgba(24, 24, 27, 0.76);
}

.share-card__stats {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.share-card__stats div {
  border-radius: 18px;
  padding: 12px 10px;
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(16px);
}

.share-card__stats strong,
.share-card__stats span {
  display: block;
}

.share-card__stats strong {
  font-size: 18px;
  line-height: 1;
  font-weight: 950;
}

.share-card__stats span {
  margin-top: 5px;
  font-size: 11px;
  font-weight: 800;
  color: rgba(24, 24, 27, 0.55);
}
</style>
