<template>
  <article class="share-card" :class="themeClass">
    <div class="share-card__grain"></div>
    <div class="share-card__orb share-card__orb-a"></div>
    <div class="share-card__orb share-card__orb-b"></div>
    <div class="share-card__top">
      <div>
        <p class="share-card__eyebrow">{{ eyebrow }}</p>
        <h3 class="share-card__title">{{ title || '오늘의 독서' }}</h3>
        <p class="share-card__meta">{{ metaText }}</p>
      </div>
      <CompanionMascot :code="companionCode" state="celebrate" class="share-card__mascot" />
    </div>

    <p v-if="quote" class="share-card__quote">"{{ quote }}"</p>
    <p v-else class="share-card__quote share-card__quote--empty">{{ companionName }}와 함께한 조용한 독서 기록</p>

    <div class="share-card__progress">
      <div class="share-card__progress-top">
        <span>Reading progress</span>
        <strong>{{ progress }}%</strong>
      </div>
      <div class="share-card__progress-track">
        <span :style="{ width: `${safeProgress}%` }"></span>
      </div>
    </div>

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
    <div class="share-card__footer">
      <span>with {{ companionName }}</span>
      <span>cheerreaders.com</span>
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

const safeProgress = computed(() => Math.max(0, Math.min(100, Math.round(props.progress || 0))))
const companionName = computed(() => ({
  pipi: 'Pipi',
  momo: 'Momo',
  rumi: 'Rumi',
  toto: 'Toto',
  nori: 'Nori'
})[props.companionCode || 'pipi'] || 'Sidekick')

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
  min-height: 360px;
  color: #18181b;
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 48%, #dcfce7 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55), 0 24px 70px rgba(24, 24, 27, 0.16);
}

.share-card__grain {
  position: absolute;
  inset: 0;
  opacity: 0.42;
  background-image: radial-gradient(rgba(24, 24, 27, 0.08) 1px, transparent 1px);
  background-size: 18px 18px;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, black, transparent 72%);
}

.share-card__orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
  pointer-events: none;
}

.share-card__orb-a {
  width: 180px;
  height: 180px;
  right: -44px;
  top: -38px;
  background: rgba(255, 255, 255, 0.4);
}

.share-card__orb-b {
  width: 120px;
  height: 120px;
  left: -32px;
  bottom: 80px;
  background: rgba(24, 24, 27, 0.08);
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
  position: relative;
  z-index: 2;
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
  position: relative;
  z-index: 2;
  margin: 20px 0 0;
  padding-left: 14px;
  border-left: 3px solid rgba(24, 24, 27, 0.2);
  font-size: 15px;
  line-height: 1.55;
  font-weight: 750;
  color: rgba(24, 24, 27, 0.76);
}

.share-card__quote--empty {
  color: rgba(24, 24, 27, 0.52);
}

.share-card__progress {
  position: relative;
  z-index: 2;
  margin-top: 20px;
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.46);
  backdrop-filter: blur(16px);
}

.share-card__progress-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  font-weight: 900;
  color: rgba(24, 24, 27, 0.56);
}

.share-card__progress-top strong {
  color: #18181b;
}

.share-card__progress-track {
  height: 8px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(24, 24, 27, 0.12);
}

.share-card__progress-track span {
  display: block;
  height: 100%;
  min-width: 8px;
  border-radius: inherit;
  background: #18181b;
}

.share-card__stats {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 56px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  z-index: 2;
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

.share-card__footer {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 20px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  font-weight: 900;
  color: rgba(24, 24, 27, 0.46);
}

@media (max-width: 520px) {
  .share-card {
    min-height: 390px;
    padding: 18px;
  }

  .share-card__title {
    font-size: 22px;
  }

  .share-card__mascot {
    width: 88px;
    height: 88px;
  }

  .share-card__stats {
    left: 14px;
    right: 14px;
  }
}
</style>
