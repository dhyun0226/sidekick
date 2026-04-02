<template>
  <div class="min-h-screen bg-white dark:bg-[#09090b]">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div class="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
        <button @click="$router.back()" class="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <ChevronLeft :size="20" class="text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 class="text-lg font-bold text-zinc-900 dark:text-white">개인정보처리방침</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="prose prose-zinc dark:prose-invert prose-sm max-w-none">

        <p class="text-zinc-500 dark:text-zinc-400 text-xs mb-8">최종 수정일: 2024년 2월 4일</p>

        <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-8">
          Cheer Readers(이하 "서비스")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을 준수하고 있습니다.
          본 개인정보처리방침은 서비스가 수집하는 개인정보의 항목, 수집 목적, 보유 기간 등을 안내합니다.
        </p>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">1. 수집하는 개인정보 항목</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">서비스는 다음과 같은 개인정보를 수집합니다:</p>

          <div class="space-y-4">
            <div class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p class="font-medium text-zinc-800 dark:text-zinc-200 text-sm mb-2">필수 항목</p>
              <ul class="text-zinc-600 dark:text-zinc-400 text-sm space-y-1">
                <li>• 이메일 주소 (소셜 로그인 시)</li>
                <li>• 닉네임</li>
                <li>• 프로필 이미지 (선택)</li>
              </ul>
            </div>

            <div class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p class="font-medium text-zinc-800 dark:text-zinc-200 text-sm mb-2">자동 수집 항목</p>
              <ul class="text-zinc-600 dark:text-zinc-400 text-sm space-y-1">
                <li>• 서비스 이용 기록</li>
                <li>• 접속 로그</li>
                <li>• 기기 정보</li>
              </ul>
            </div>

            <div class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p class="font-medium text-zinc-800 dark:text-zinc-200 text-sm mb-2">결제 시 수집 항목</p>
              <ul class="text-zinc-600 dark:text-zinc-400 text-sm space-y-1">
                <li>• 결제 정보 (토스페이먼츠를 통해 처리)</li>
                <li>• 결제 내역</li>
              </ul>
              <p class="text-zinc-500 dark:text-zinc-400 text-xs mt-2">
                ※ 카드번호 등 민감한 결제 정보는 토스페이먼츠에서 직접 처리하며, 서비스는 저장하지 않습니다.
              </p>
            </div>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">2. 개인정보의 수집 및 이용 목적</h2>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>• 회원 가입 및 관리</li>
            <li>• 서비스 제공 및 운영</li>
            <li>• 독서 기록 저장 및 통계 제공</li>
            <li>• 그룹 독서 기능 제공</li>
            <li>• 유료 서비스 결제 처리</li>
            <li>• 고객 문의 응대</li>
            <li>• 서비스 개선 및 신규 기능 개발</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">3. 개인정보의 보유 및 이용 기간</h2>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>• <span class="font-medium">회원 정보:</span> 회원 탈퇴 시까지</li>
            <li>• <span class="font-medium">결제 정보:</span> 전자상거래법에 따라 5년간 보관</li>
            <li>• <span class="font-medium">접속 로그:</span> 3개월</li>
          </ul>
          <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-3">
            단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">4. 개인정보의 제3자 제공</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 다음의 경우에는 예외로 합니다:
          </p>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2 mt-3">
            <li>• 이용자가 사전에 동의한 경우</li>
            <li>• 법령의 규정에 의한 경우</li>
            <li>• 수사 목적으로 법령에 정해진 절차에 따른 요청이 있는 경우</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">5. 개인정보 처리 위탁</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">
            서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-zinc-200 dark:border-zinc-700">
                  <th class="text-left py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200">수탁업체</th>
                  <th class="text-left py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200">위탁 업무</th>
                </tr>
              </thead>
              <tbody class="text-zinc-600 dark:text-zinc-400">
                <tr class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="py-2 px-3">Supabase</td>
                  <td class="py-2 px-3">데이터베이스 호스팅</td>
                </tr>
                <tr class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="py-2 px-3">토스페이먼츠</td>
                  <td class="py-2 px-3">결제 처리</td>
                </tr>
                <tr>
                  <td class="py-2 px-3">Vercel</td>
                  <td class="py-2 px-3">웹 호스팅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">6. 이용자의 권리</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">
            이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:
          </p>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>• 개인정보 열람 요청</li>
            <li>• 개인정보 정정 요청</li>
            <li>• 개인정보 삭제 요청</li>
            <li>• 개인정보 처리 정지 요청</li>
            <li>• 회원 탈퇴</li>
          </ul>
          <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-3">
            위 권리 행사는 서비스 내 설정 또는 고객센터를 통해 요청할 수 있습니다.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">7. 개인정보의 안전성 확보 조치</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">
            서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
          </p>
          <ul class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-2">
            <li>• 개인정보의 암호화</li>
            <li>• 해킹 등에 대비한 보안 시스템 운영</li>
            <li>• 개인정보에 대한 접근 제한</li>
            <li>• SSL/TLS를 통한 통신 암호화</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">8. 쿠키의 사용</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            서비스는 이용자에게 더 나은 서비스를 제공하기 위해 쿠키를 사용합니다.
            쿠키는 로그인 상태 유지, 서비스 이용 환경 설정 등에 사용됩니다.
            이용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나,
            이 경우 서비스 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">9. 개인정보처리방침의 변경</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            본 개인정보처리방침이 변경되는 경우 서비스 내 공지사항을 통해 고지합니다.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">10. 개인정보 보호책임자</h2>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">
            개인정보 처리에 관한 문의사항은 아래 연락처로 문의해 주세요.
          </p>
          <div class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
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
