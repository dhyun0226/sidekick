<template>
  <div class="companion-wrap" :class="[companion.theme, companion.shape, stateClass]">
    <div class="aura"></div>
    <div class="orbit orbit-one"></div>
    <div class="orbit orbit-two"></div>
    <div class="spark spark-one"></div>
    <div class="spark spark-two"></div>
    <div class="spark spark-three"></div>
    <div class="mascot">
      <div class="ear ear-left"></div>
      <div class="ear ear-right"></div>
      <div class="tail"></div>
      <div class="arm arm-left"></div>
      <div class="arm arm-right"></div>
      <div class="accent accent-left"></div>
      <div class="accent accent-right"></div>
      <div class="body-shine"></div>
      <div class="face">
        <span class="eye eye-left"></span>
        <span class="eye eye-right"></span>
        <span class="cheek cheek-left"></span>
        <span class="cheek cheek-right"></span>
        <span class="mouth"></span>
      </div>
      <div class="prop">
        <component :is="companion.icon" :size="22" :stroke-width="2.3" />
      </div>
      <div class="reading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="foot foot-left"></div>
      <div class="foot foot-right"></div>
    </div>
    <div class="shadow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bookmark, BookOpen, Quote, Timer, Moon } from 'lucide-vue-next'

const props = defineProps<{
  code: string
  state: 'idle' | 'focus' | 'thinking' | 'cheer' | 'sleepy' | 'paused' | 'celebrate'
}>()

const companions: Record<string, any> = {
  pipi: { theme: 'theme-pipi', shape: 'shape-sprout', icon: Bookmark },
  momo: { theme: 'theme-momo', shape: 'shape-leaf', icon: BookOpen },
  rumi: { theme: 'theme-rumi', shape: 'shape-petal', icon: Quote },
  toto: { theme: 'theme-toto', shape: 'shape-drop', icon: Timer },
  nori: { theme: 'theme-nori', shape: 'shape-moon', icon: Moon }
}

const companion = computed(() => companions[props.code] || companions.pipi)
const stateClass = computed(() => `state-${props.state}`)
</script>

<style scoped>
.companion-wrap {
  --body: #bef264;
  --body-2: #84cc16;
  --ink: #18181b;
  --glow: rgba(190, 242, 100, 0.35);
  position: relative;
  width: min(38vh, 260px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.theme-pipi {
  --body: #fde047;
  --body-2: #fb923c;
  --glow: rgba(253, 224, 71, 0.36);
}

.theme-momo {
  --body: #d9f99d;
  --body-2: #86efac;
  --glow: rgba(187, 247, 208, 0.34);
}

.theme-rumi {
  --body: #f9a8d4;
  --body-2: #c084fc;
  --glow: rgba(244, 114, 182, 0.32);
}

.theme-toto {
  --body: #93c5fd;
  --body-2: #38bdf8;
  --glow: rgba(147, 197, 253, 0.34);
}

.theme-nori {
  --body: #c4b5fd;
  --body-2: #818cf8;
  --glow: rgba(196, 181, 253, 0.34);
}

.aura {
  position: absolute;
  inset: 8%;
  border-radius: 999px;
  background: radial-gradient(circle, var(--glow), transparent 68%);
  filter: blur(12px);
  animation: aura-pulse 5.5s ease-in-out infinite;
}

.orbit {
  position: absolute;
  z-index: 1;
  width: 64%;
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  opacity: 0;
  transform-origin: 50% 50%;
}

.orbit-one {
  animation: orbit-drift 8s linear infinite;
}

.orbit-two {
  width: 72%;
  animation: orbit-drift 10s linear infinite reverse;
}

.spark {
  position: absolute;
  z-index: 3;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 0 18px var(--glow);
  opacity: 0;
}

.spark-one {
  top: 18%;
  left: 18%;
}

.spark-two {
  top: 24%;
  right: 16%;
}

.spark-three {
  right: 28%;
  bottom: 26%;
}

.mascot {
  position: relative;
  width: 66%;
  aspect-ratio: 1;
  border-radius: 42% 46% 48% 44%;
  background: linear-gradient(145deg, var(--body), var(--body-2));
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.16), inset 0 12px 28px rgba(255, 255, 255, 0.46), inset 0 -14px 30px rgba(24, 24, 27, 0.08);
  animation: idle-bob 3.8s ease-in-out infinite;
  transform-origin: 50% 78%;
  z-index: 2;
}

.body-shine {
  position: absolute;
  inset: 10% auto auto 18%;
  width: 34%;
  height: 26%;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0));
  transform: rotate(-18deg);
  pointer-events: none;
}

.ear {
  position: absolute;
  top: -7%;
  width: 23%;
  height: 26%;
  border-radius: 63% 38% 56% 42%;
  background: linear-gradient(145deg, var(--body), var(--body-2));
  box-shadow: inset 0 8px 16px rgba(255, 255, 255, 0.28);
  transform-origin: 50% 100%;
  animation: ear-wiggle 5.2s ease-in-out infinite;
}

.ear-left {
  left: 16%;
  transform: rotate(-18deg);
}

.ear-right {
  right: 16%;
  transform: rotate(18deg) scaleX(-1);
  animation-delay: 0.18s;
}

.tail {
  position: absolute;
  right: -8%;
  bottom: 20%;
  width: 24%;
  height: 18%;
  border-radius: 999px 999px 999px 10px;
  background: linear-gradient(145deg, var(--body-2), var(--body));
  box-shadow: inset 0 8px 16px rgba(255, 255, 255, 0.24);
  transform: rotate(-18deg);
  transform-origin: 0 50%;
  animation: tail-sway 4.8s ease-in-out infinite;
  z-index: -1;
}

.arm {
  position: absolute;
  top: 55%;
  width: 17%;
  height: 11%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  transform-origin: 50% 50%;
}

.arm-left {
  left: 8%;
  transform: rotate(18deg);
}

.arm-right {
  right: 8%;
  transform: rotate(-18deg);
}

.accent {
  position: absolute;
  top: 18%;
  width: 20%;
  height: 20%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
}

.accent-left {
  left: 10%;
}

.accent-right {
  right: 11%;
  transform: scale(0.78);
}

.face {
  position: absolute;
  inset: 28% 22% auto;
  height: 32%;
}

.eye {
  position: absolute;
  top: 12%;
  width: 13%;
  height: 22%;
  border-radius: 999px;
  background: var(--ink);
  animation: blink 5.8s ease-in-out infinite;
}

.eye-left {
  left: 20%;
}

.eye-right {
  right: 20%;
}

.mouth {
  position: absolute;
  left: 50%;
  bottom: 8%;
  width: 24%;
  height: 12%;
  border-radius: 0 0 999px 999px;
  border-bottom: 4px solid var(--ink);
  transform: translateX(-50%);
}

.cheek {
  position: absolute;
  top: 44%;
  width: 13%;
  height: 8%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.34);
}

.cheek-left {
  left: 10%;
}

.cheek-right {
  right: 10%;
}

.prop {
  position: absolute;
  left: 50%;
  bottom: 15%;
  width: 42%;
  height: 30%;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: rgba(24, 24, 27, 0.78);
  background: rgba(255, 255, 255, 0.38);
  transform: translateX(-50%);
  animation: prop-breathe 4.2s ease-in-out infinite;
}

.reading-dots {
  position: absolute;
  left: 50%;
  bottom: 7%;
  display: flex;
  gap: 4px;
  transform: translateX(-50%);
  opacity: 0;
}

.reading-dots span {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: rgba(24, 24, 27, 0.42);
  animation: dot-pulse 1.1s ease-in-out infinite;
}

.reading-dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.reading-dots span:nth-child(3) {
  animation-delay: 0.32s;
}

.foot {
  position: absolute;
  bottom: -5%;
  width: 22%;
  height: 13%;
  border-radius: 999px;
  background: rgba(24, 24, 27, 0.12);
}

.foot-left {
  left: 25%;
}

.foot-right {
  right: 25%;
}

.shadow {
  position: absolute;
  bottom: 10%;
  width: 52%;
  height: 8%;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.16);
  filter: blur(8px);
  animation: shadow-bob 3.8s ease-in-out infinite;
}

.state-focus .mascot {
  animation: focus-breathe 5.4s ease-in-out infinite;
}

.state-focus .orbit {
  opacity: 1;
}

.state-focus .aura {
  animation-duration: 7s;
}

.state-focus .prop {
  animation: prop-focus 2.8s ease-in-out infinite;
}

.state-focus .reading-dots {
  opacity: 1;
}

.state-thinking .mascot {
  animation: thinking 1.4s ease-in-out infinite;
}

.state-thinking .arm-left {
  animation: arm-note-left 1.4s ease-in-out infinite;
}

.state-thinking .arm-right {
  animation: arm-note-right 1.4s ease-in-out infinite;
}

.state-thinking .ear {
  animation-duration: 1.6s;
}

.state-cheer .mascot,
.state-celebrate .mascot {
  animation: cheer 0.9s ease-in-out infinite;
}

.state-cheer .spark,
.state-celebrate .spark {
  animation: sparkle 1.4s ease-in-out infinite;
}

.state-cheer .spark-two,
.state-celebrate .spark-two {
  animation-delay: 0.24s;
}

.state-cheer .spark-three,
.state-celebrate .spark-three {
  animation-delay: 0.48s;
}

.state-celebrate .tail,
.state-cheer .tail {
  animation: tail-cheer 0.7s ease-in-out infinite;
}

.state-paused .mascot {
  animation: paused-sway 4.8s ease-in-out infinite;
}

.state-paused .eye {
  height: 7%;
  top: 19%;
  animation: none;
}

.state-paused .mouth {
  width: 16%;
  border-bottom-width: 3px;
}

.state-sleepy .eye {
  height: 5%;
  top: 20%;
}

.state-sleepy .mascot {
  animation-duration: 6s;
  opacity: 0.9;
}

.state-sleepy .tail {
  animation-duration: 7s;
}

.shape-leaf .ear-left,
.shape-leaf .ear-right {
  border-radius: 88% 10% 88% 12%;
}

.shape-petal .ear-left,
.shape-petal .ear-right {
  top: -4%;
  width: 20%;
  height: 24%;
  border-radius: 999px 999px 44% 44%;
}

.shape-drop .mascot {
  border-radius: 52% 52% 46% 46%;
}

.shape-drop .ear-left,
.shape-drop .ear-right {
  top: -2%;
  width: 16%;
  height: 28%;
  border-radius: 999px;
}

.shape-moon .mascot {
  border-radius: 48% 56% 44% 58%;
}

.shape-moon .ear-left,
.shape-moon .ear-right {
  width: 18%;
  height: 20%;
}

@keyframes aura-pulse {
  0%, 100% { transform: scale(0.96); opacity: 0.74; }
  50% { transform: scale(1.08); opacity: 1; }
}

@keyframes orbit-drift {
  0% { transform: rotate(0deg) scale(0.92); }
  50% { transform: rotate(180deg) scale(1.03); }
  100% { transform: rotate(360deg) scale(0.92); }
}

@keyframes idle-bob {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
}

@keyframes tail-sway {
  0%, 100% { transform: rotate(-18deg) translateY(0); }
  50% { transform: rotate(-4deg) translateY(-3px); }
}

@keyframes tail-cheer {
  0%, 100% { transform: rotate(-22deg); }
  50% { transform: rotate(14deg); }
}

@keyframes shadow-bob {
  0%, 100% { transform: scale(1); opacity: 0.16; }
  50% { transform: scale(0.86); opacity: 0.1; }
}

@keyframes arm-note-left {
  0%, 100% { transform: rotate(18deg) translateY(0); }
  50% { transform: rotate(4deg) translateY(-4px); }
}

@keyframes arm-note-right {
  0%, 100% { transform: rotate(-18deg) translateY(0); }
  50% { transform: rotate(-4deg) translateY(-4px); }
}

@keyframes thinking {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-6px) rotate(4deg); }
}

@keyframes cheer {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-14px) scale(1.04); }
}

@keyframes focus-breathe {
  0%, 100% { transform: translateY(0) scale(1) rotate(-0.4deg); }
  50% { transform: translateY(-5px) scale(1.025) rotate(0.4deg); }
}

@keyframes paused-sway {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-3px) rotate(2deg); }
}

@keyframes ear-wiggle {
  0%, 82%, 100% { rotate: 0deg; }
  88% { rotate: -5deg; }
  94% { rotate: 4deg; }
}

@keyframes blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.12); }
}

@keyframes prop-breathe {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-2px); }
}

@keyframes prop-focus {
  0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
  50% { transform: translateX(-50%) translateY(-3px) scale(1.04); }
}

@keyframes dot-pulse {
  0%, 100% { transform: translateY(0); opacity: 0.32; }
  50% { transform: translateY(-4px); opacity: 0.9; }
}

@keyframes sparkle {
  0%, 100% { transform: translateY(6px) scale(0.5); opacity: 0; }
  45% { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
