<template>
  <div class="min-h-screen bg-white dark:bg-[#09090b]">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div class="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
        <button @click="$router.back()" class="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <ChevronLeft :size="20" class="text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 class="text-lg font-bold text-zinc-900 dark:text-white">이용약관</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="prose prose-zinc dark:prose-invert prose-sm max-w-none">

        <p class="text-zinc-500 dark:text-zinc-400 text-xs mb-8">최종 수정일: 2024년 2월 4일</p>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제1조 (목적)</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            본 약관은 Cheer Readers(이하 "서비스")이 제공하는 독서 기록 및 공유 서비스의 이용과 관련하여
            서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제2조 (정의)</h2>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>1. "서비스"란 Cheer Readers이 제공하는 독서 기록, 그룹 독서, 통계 등의 모든 서비스를 의미합니다.</li>
            <li>2. "이용자"란 본 약관에 따라 서비스를 이용하는 회원을 의미합니다.</li>
            <li>3. "프리미엄 서비스"란 유료로 제공되는 부가 서비스를 의미합니다.</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제3조 (약관의 효력 및 변경)</h2>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.</li>
            <li>2. 서비스는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
            <li>3. 약관이 변경될 경우 서비스 내 공지사항을 통해 고지합니다.</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제4조 (서비스의 제공)</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">서비스는 다음과 같은 기능을 제공합니다:</p>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>1. 독서 기록 및 진도 관리</li>
            <li>2. 그룹 독서 기능</li>
            <li>3. 독서 통계 및 분석</li>
            <li>4. 리뷰 및 코멘트 작성</li>
            <li>5. 기타 서비스가 정하는 기능</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제5조 (유료 서비스 및 결제)</h2>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>1. 프리미엄 서비스는 월간 또는 연간 구독 방식으로 제공됩니다.</li>
            <li>2. 결제는 토스페이먼츠를 통해 처리됩니다.</li>
            <li>3. 구독은 자동 갱신되며, 이용자는 언제든지 자동 갱신을 취소할 수 있습니다.</li>
            <li>4. 자동 갱신 취소 시 현재 구독 기간 종료일까지 프리미엄 기능을 이용할 수 있습니다.</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제6조 (청약철회 및 환불)</h2>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>1. 이용자는 결제일로부터 7일 이내에 청약철회를 요청할 수 있습니다.</li>
            <li>2. 단, 서비스를 이용한 경우(로그인 후 기능 사용) 청약철회가 제한될 수 있습니다.</li>
            <li>3. 환불은 결제 수단에 따라 영업일 기준 3~7일 소요될 수 있습니다.</li>
            <li>4. 환불 요청은 고객센터 이메일({{ contactEmail }})로 문의해 주세요.</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제7조 (이용자의 의무)</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">이용자는 다음 행위를 해서는 안 됩니다:</p>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>1. 타인의 정보 도용</li>
            <li>2. 서비스 운영을 방해하는 행위</li>
            <li>3. 불법적인 목적으로 서비스를 이용하는 행위</li>
            <li>4. 타인의 명예를 훼손하거나 불이익을 주는 행위</li>
            <li>5. 기타 관련 법령에 위반되는 행위</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제8조 (서비스 이용 제한)</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            서비스는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우,
            사전 통지 후 서비스 이용을 제한하거나 계정을 정지할 수 있습니다.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제9조 (면책사항)</h2>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>1. 서비스는 천재지변, 시스템 장애 등 불가항력적인 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>2. 이용자가 자신의 개인정보를 타인에게 유출하여 발생한 피해에 대해 책임을 지지 않습니다.</li>
            <li>3. 이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 서비스는 개입하지 않습니다.</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제10조 (분쟁 해결)</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            본 약관과 관련하여 분쟁이 발생한 경우, 서비스와 이용자는 상호 협의하여 해결하며,
            협의가 되지 않을 경우 관할 법원에 소송을 제기할 수 있습니다.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">제11조 (문의)</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            서비스 이용에 관한 문의사항은 아래 연락처로 문의해 주세요.
          </p>
          <div class="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <p class="text-sm text-zinc-700 dark:text-zinc-300">
              <span class="font-medium">이메일:</span> {{ contactEmail }}
            </p>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'

const contactEmail = 'dhyun0226@gmail.com'
</script>
