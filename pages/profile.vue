<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#09090b] pb-20 pb-safe">
    <!-- 1. Compact Header -->
    <div class="pt-safe pb-4">
      
      <!-- Nav Bar -->
      <div class="flex justify-between items-center px-4 py-4">
        <button @click="router.back()" class="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <ChevronLeft :size="24" />
        </button>
        <button @click="openSettings" class="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <Settings :size="24" />
        </button>
      </div>

      <!-- Profile -->
      <div class="px-4 pb-3">
        <div class="flex items-center gap-3">
          <div class="relative group cursor-pointer" @click="openSettings">
            <div class="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
                <User :size="20" />
              </div>
            </div>
            <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 :size="14" class="text-white" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h1 class="text-base font-bold text-zinc-900 dark:text-white">
              {{ userStore.profile?.nickname }}
            </h1>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">오늘도 즐거운 독서 되세요!</p>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="px-4 border-t border-zinc-200 dark:border-zinc-800/50 pt-3">
        <div class="flex justify-between items-center">
          <button @click="activeTab = 'library'" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.books }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">완독</span>
          </button>
          <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

          <button @click="activeTab = 'timeline'" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.comments }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">기록</span>
          </button>
          <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

          <button @click="activeTab = 'insight'" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-lime-600 dark:text-lime-400">{{ stats.streak }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">연속</span>
          </button>
          <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

          <button @click="router.push('/')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.groups }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">그룹</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Subscription Info Card -->
    <div class="px-4 pt-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/50">
      <!-- Premium User -->
      <div
        v-if="isPremium"
        class="bg-gradient-to-br from-lime-400 via-lime-500 to-emerald-500 rounded-2xl p-4 relative overflow-hidden"
      >
        <div class="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
          <span class="text-xs font-bold text-white">PREMIUM</span>
        </div>

        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Crown :size="24" class="text-white" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">프리미엄 회원</h3>
            <p class="text-xs text-white/80">무제한 독서의 즐거움</p>
          </div>
        </div>

        <div v-if="subscriptionDetails" class="space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="text-white/80">구독 기간</span>
            <span class="font-bold text-white">{{ formatDate(subscriptionDetails.end_date) }}까지</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-white/80">자동 갱신</span>
            <span class="font-bold text-white">{{ subscriptionDetails.auto_renew ? '활성화' : '비활성화' }}</span>
          </div>
        </div>

        <button
          @click="router.push('/subscription')"
          class="mt-3 w-full py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
        >
          구독 관리
        </button>
      </div>

      <!-- Free User -->
      <div
        v-else
        @click="router.push('/subscription')"
        class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 cursor-pointer hover:border-lime-400 transition-all group"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <Lock :size="24" class="text-zinc-400 group-hover:text-lime-500 transition-colors" />
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white">무료 플랜</h3>
            <p class="text-xs text-zinc-500">기본 기능만 이용 가능</p>
          </div>
          <ChevronRight :size="20" class="text-zinc-400 group-hover:text-lime-500 transition-colors" />
        </div>

        <div class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-3">
          <span>그룹 생성 제한 (최대 2개)</span>
          <span>•</span>
          <span>분석 기능 제한</span>
        </div>

        <div class="flex items-center justify-between bg-lime-400/10 dark:bg-lime-900/20 rounded-lg px-3 py-2">
          <span class="text-xs font-bold text-lime-700 dark:text-lime-400">프리미엄으로 업그레이드</span>
          <ArrowRight :size="16" class="text-lime-600" />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="sticky top-0 z-30 bg-gray-50/95 dark:bg-[#09090b]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div class="flex px-4">
        <button
          @click="activeTab = 'library'"
          class="flex-1 py-3 text-sm font-bold transition-colors relative"
          :class="activeTab === 'library' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
        >
          서재
          <div v-if="activeTab === 'library'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
        </button>
        <button
          @click="activeTab = 'timeline'"
          class="flex-1 py-3 text-sm font-bold transition-colors relative"
          :class="activeTab === 'timeline' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
        >
          기록
          <div v-if="activeTab === 'timeline'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
        </button>
        <button
          @click="handleInsightTabClick"
          class="flex-1 py-3 text-sm font-bold transition-colors relative"
          :class="activeTab === 'insight' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
        >
          <span class="flex items-center justify-center gap-1">
            분석
            <Lock v-if="!isPremium" :size="12" class="text-zinc-400" />
          </span>
          <div v-if="activeTab === 'insight'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="px-4 pt-3 min-h-[300px]">

      <!-- Tab 1: Library Grid -->
      <div v-if="activeTab === 'library'">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <LoadingSpinner size="md" message="서재 불러오는 중..." />
        </div>

        <div v-else-if="library.length === 0" class="py-12 flex flex-col items-center text-center">
          <div class="text-4xl mb-2">📚</div>
          <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">서재가 비어있어요</h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            책을 완독하면 이곳에 쌓입니다.
          </p>
          <button
            @click="router.push('/')"
            class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg"
          >
            책 읽으러 가기
          </button>
        </div>

        <div v-else class="space-y-6">
          <!-- Reading Books Section (Not Finished) -->
          <div v-if="readingBooks.length > 0">
            <div class="flex items-center gap-3 mb-4">
              <h3 class="text-sm font-bold text-zinc-900 dark:text-white">읽고 있는 책</h3>
              <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
              <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ readingBooks.length }}권</span>
            </div>

            <!-- Reading Books Grid -->
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="book in readingBooks"
                :key="book.id"
                @click="openBookDetail(book)"
                class="cursor-pointer active:opacity-70 transition-opacity opacity-60"
              >
                <div class="aspect-[1/1.5] overflow-hidden rounded-lg shadow-sm">
                  <img
                    :src="book.cover_url"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="mt-1 text-center">
                  <div class="h-3 mb-0.5 flex items-center justify-center">
                    <span class="text-[10px] text-zinc-400">읽는 중</span>
                  </div>
                  <div class="text-[9px] text-zinc-400">{{ Math.round(book.progress_pct) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Finished Books by Year -->
          <div v-for="yearGroup in libraryByYear" :key="yearGroup.year">
            <!-- Year Divider -->
            <div class="flex items-center gap-3 mb-4">
              <h3 class="text-sm font-bold text-zinc-900 dark:text-white">{{ yearGroup.year }}년</h3>
              <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
              <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ yearGroup.books.length }}권</span>
            </div>

            <!-- Books Grid for This Year -->
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="book in yearGroup.books"
                :key="book.id"
                @click="openBookDetail(book)"
                class="cursor-pointer active:opacity-70 transition-opacity"
              >
                <div class="aspect-[1/1.5] overflow-hidden rounded-lg shadow-sm">
                  <img
                    :src="book.cover_url"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="mt-1 text-center">
                  <div v-if="book.myRating" class="flex items-center justify-center gap-0.5 mb-0.5">
                    <Star :size="10" fill="#EAB308" class="text-yellow-500" />
                    <span class="text-[10px] font-bold text-zinc-900 dark:text-white">{{ book.myRating }}</span>
                  </div>
                  <div v-else class="h-3 mb-0.5 flex items-center justify-center">
                    <span class="text-[10px] text-zinc-400">──</span>
                  </div>
                  <div class="text-[9px] text-zinc-500">{{ formatMonthOnly(book.finished_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tab 2: Timeline Feed -->
      <div v-if="activeTab === 'timeline'">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <LoadingSpinner size="md" message="타임라인 불러오는 중..." />
        </div>

        <div v-else-if="timeline.length === 0" class="py-12 flex flex-col items-center text-center">
          <div class="text-4xl mb-2">✍️</div>
          <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">아직 남긴 기록이 없어요</h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            책을 읽으며 생각을 남겨보세요.
          </p>
          <button
            @click="router.push('/')"
            class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg"
          >
            내 그룹으로 가기
          </button>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in timeline"
            :key="item.id"
            @click="isBookFinished(item.groupBookId) ? navigateToItem(item) : null"
            :class="[
              'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all',
              isBookFinished(item.groupBookId)
                ? 'cursor-pointer hover:border-lime-400 dark:hover:border-lime-500'
                : 'cursor-default opacity-60'
            ]"
          >
            <!-- Title -->
            <h4 class="font-bold text-sm text-zinc-900 dark:text-white mb-2 line-clamp-1">
              {{ item.bookTitle }}
            </h4>

            <!-- Meta Info -->
            <div class="flex items-center gap-2 mb-3 text-xs">
              <span class="text-zinc-500 dark:text-zinc-400">{{ item.groupName }}</span>
              <span class="text-zinc-300 dark:text-zinc-700">·</span>
              <span class="text-zinc-500 dark:text-zinc-400">{{ formatTimeAgo(item.created_at) }}</span>
              <span class="text-zinc-300 dark:text-zinc-700">·</span>
              <!-- Review: Show rating stars -->
              <template v-if="item.type === 'review'">
                <div class="flex items-center gap-1">
                  <div class="flex gap-0.5">
                    <template v-for="i in 5" :key="i">
                      <Star v-if="getStarType(i, item.rating) === 'full'" :size="12" fill="#EAB308" class="text-yellow-500" />
                      <StarHalf v-else-if="getStarType(i, item.rating) === 'half'" :size="12" fill="#EAB308" class="text-yellow-500" />
                      <Star v-else :size="12" fill="none" class="text-yellow-500" />
                    </template>
                  </div>
                  <span class="font-bold text-yellow-600 dark:text-yellow-400">{{ item.rating }}</span>
                </div>
              </template>
              <!-- Comment: Show position percentage -->
              <span v-else class="text-lime-600 dark:text-lime-400">
                {{ Math.round(item.position_pct) }}%
              </span>
            </div>

            <!-- Quote -->
            <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
              <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                {{ item.anchor_text }}
              </p>
            </div>

            <!-- Content -->
            <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {{ item.content }}
            </p>
          </div>
        </div>
      </div>

      <!-- Tab 3: Insight -->
      <div v-if="activeTab === 'insight'">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <LoadingSpinner size="md" message="통계 불러오는 중..." />
        </div>

        <div v-else class="space-y-3">
          <!-- Yearly Goal Card -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 relative"
               :class="isGoalAchieved ? 'ring-2 ring-lime-400/50' : ''">

            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-zinc-900 dark:text-white">
                  {{ new Date().getFullYear() }}년 독서 목표
                </h4>
                <!-- Year-over-year growth badge (compact) -->
                <div v-if="lastYearBooks > 0" class="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                     :class="yearOverYearGrowth >= 0
                       ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400'
                       : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'">
                  <span>{{ yearOverYearGrowth >= 0 ? '+' : '' }}{{ yearOverYearGrowth }}%</span>
                </div>
              </div>
              <button v-if="!editingGoal" @click="startEditGoal" class="text-xs text-lime-600 hover:text-lime-500 font-bold">
                수정
              </button>
            </div>

            <!-- Goal Edit Mode -->
            <div v-if="editingGoal" class="space-y-3">
              <div class="flex items-center gap-2">
                <input
                  v-model.number="tempGoal"
                  type="number"
                  min="1"
                  class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white"
                />
                <span class="text-sm text-zinc-600 dark:text-zinc-400">권</span>
              </div>
              <div class="flex gap-2">
                <button
                  @click="saveGoal"
                  class="flex-1 px-3 py-1.5 bg-lime-400 text-black rounded-lg text-xs font-bold hover:bg-lime-300"
                >
                  저장
                </button>
                <button
                  @click="cancelEditGoal"
                  class="flex-1 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600"
                >
                  취소
                </button>
              </div>
            </div>

            <!-- Goal Display Mode -->
            <div v-else>
              <!-- Progress -->
              <div class="mb-2">
                <div class="flex justify-between items-end mb-1">
                  <span class="text-2xl font-bold text-zinc-900 dark:text-white">
                    {{ thisYearBooks }}<span class="text-base text-zinc-500">/ {{ yearlyGoal }}</span>
                  </span>
                  <span class="text-sm text-zinc-500">{{ Math.round((thisYearBooks/yearlyGoal)*100) }}%</span>
                </div>
                <div class="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div
                    class="bg-lime-400 h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min((thisYearBooks/yearlyGoal)*100, 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Compact Info -->
              <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                <span>{{ daysLeftInYear }}일 남음</span>
                <span>·</span>
                <span>월 {{ booksNeededPerMonth }}권 필요</span>
                <span>·</span>
                <span v-if="isGoalAchieved" class="text-lime-600 dark:text-lime-400 font-bold">🎉 달성!</span>
                <span v-else-if="onTrack" class="text-green-600 dark:text-green-400 font-bold">✅ 달성 중</span>
                <span v-else class="text-orange-600 dark:text-orange-400 font-bold">💪 파이팅</span>
              </div>

              <!-- Monthly Progress Chart (Line Graph) -->
              <div v-if="monthlyProgress.length > 0" class="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <h5 class="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">월별 진행</h5>
                <div class="w-full px-3">
                  <!-- Chart Area -->
                  <div class="h-16 w-full mb-2 relative">
                    <svg
                      class="absolute inset-0 w-full h-full"
                      :viewBox="`-10 0 ${Math.max(monthlyProgress.length - 1, 1) * 100 + 20} 100`"
                      preserveAspectRatio="none"
                    >
                      <!-- Line -->
                      <polyline
                        v-if="monthlyProgress.length > 1"
                        :points="monthlyProgress.map((m, i) =>
                          `${i * 100},${100 - (m.count / maxMonthlyCount) * 90}`
                        ).join(' ')"
                        fill="none"
                        stroke="#a3e635"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />

                      <!-- Points -->
                      <g v-for="(month, i) in monthlyProgress" :key="'point-' + month.month">
                        <circle
                          :cx="i * 100"
                          :cy="100 - (month.count / maxMonthlyCount) * 90"
                          r="4"
                          fill="#84cc16"
                        />
                      </g>
                    </svg>
                  </div>

                  <!-- Labels (positioned absolutely to match SVG points exactly) -->
                  <div class="relative w-full h-4">
                    <span
                      v-for="(month, i) in monthlyProgress"
                      :key="'label-' + month.month"
                      class="absolute text-[9px] text-zinc-400 transform -translate-x-1/2 whitespace-nowrap"
                      :style="{
                        left: monthlyProgress.length === 1
                          ? '50%'
                          : `${((i * 100 + 10) / (Math.max(monthlyProgress.length - 1, 1) * 100 + 20)) * 100}%`
                      }"
                    >
                      {{ month.month }}월
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Heatmap Component with Streak Info -->
          <ReadingHeatmap
            :activities="timeline"
            :currentStreak="currentStreak"
            :longestStreak="longestStreak"
            @day-click="handleDayClick"
          />

          <!-- Stats Summary -->
          <div class="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-3">이번 달</h3>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div>
                <div class="text-lg font-bold text-zinc-900 dark:text-white">{{ thisMonthBooks }}</div>
                <div class="text-[10px] text-zinc-500">완독</div>
              </div>
              <div>
                <div class="text-lg font-bold text-zinc-900 dark:text-white">{{ thisMonthComments }}</div>
                <div class="text-[10px] text-zinc-500">기록</div>
              </div>
              <div>
                <div class="text-lg font-bold text-lime-600 dark:text-lime-400">{{ stats.streak }}</div>
                <div class="text-[10px] text-zinc-500">연속</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Settings Modal -->
    <div v-if="settingsModalOpen" class="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="settingsModalOpen = false"></div>
      <div class="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl animate-scale-up border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white">설정</h3>
          <button @click="settingsModalOpen = false" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>
        
        <div class="space-y-8">
          <!-- 1. Profile Edit -->
          <section>
            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-3 px-1">프로필 편집</h4>
            <div class="flex flex-col items-center gap-3 mb-4">
              <div class="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 relative group cursor-pointer" @click="triggerFileInput">
                 <img v-if="previewAvatar" :src="previewAvatar" class="w-full h-full object-cover" />
                 <div v-else class="w-full h-full flex items-center justify-center text-zinc-400"><User :size="32"/></div>
                 <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera :size="20" class="text-white" />
                 </div>
              </div>
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange" />
              <button @click="triggerFileInput" class="text-xs text-lime-500 font-medium hover:underline">사진 변경</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-500 mb-1 px-1">닉네임</label>
              <div class="flex gap-2">
                <input
                  v-model="editNickname"
                  type="text"
                  class="flex-1 min-w-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white"
                />
                <button
                  @click="saveProfile"
                  class="flex-shrink-0 px-4 py-2 bg-lime-400 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  :disabled="isSaving"
                >
                  <div v-if="isSaving" class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span v-else>저장</span>
                </button>
              </div>
            </div>
          </section>

          <!-- 2. App Settings -->
          <section class="space-y-3">
            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-2 px-1">앱 설정</h4>
            
            <!-- Dark Mode -->
            <div class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl cursor-pointer" @click="toggleTheme">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white dark:bg-zinc-700 rounded-full shadow-sm text-zinc-600 dark:text-zinc-300">
                  <Moon v-if="isDark" :size="18" />
                  <Sun v-else :size="18" />
                </div>
                <span class="text-sm font-medium text-zinc-900 dark:text-white">다크 모드</span>
              </div>
              <div 
                class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                :class="isDark ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
              >
                <div 
                  class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                  :class="isDark ? 'translate-x-5' : 'translate-x-0'"
                ></div>
              </div>
            </div>

            <!-- Notifications -->
            <div class="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-white dark:bg-zinc-700 rounded-full shadow-sm text-zinc-600 dark:text-zinc-300">
                  <Bell :size="18" />
                </div>
                <span class="text-sm font-medium text-zinc-900 dark:text-white">알림 설정</span>
              </div>
              
              <div class="space-y-3 pl-2 pr-1">
                <!-- 1. Comment Replies -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.comment_reply = !notificationSettings.comment_reply">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">내 글에 달린 답글</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.comment_reply ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.comment_reply ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>

                <!-- 2. Reactions -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.reaction = !notificationSettings.reaction">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">반응/좋아요</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.reaction ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.reaction ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>

                <!-- 3. Member Join -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.member_join = !notificationSettings.member_join">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">새 멤버 가입</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.member_join ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.member_join ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>

                <!-- 4. Completion -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.completion = !notificationSettings.completion">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">책 완독 알림</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.completion ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.completion ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>

                <!-- 5. Book Added -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.book_added = !notificationSettings.book_added">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">새 책 추가 알림</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.book_added ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.book_added ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. Account -->
          <section>
            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-2 px-1">계정</h4>
            <div class="space-y-2">
              <button
                @click="handleSignOut"
                class="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut :size="18" />
                로그아웃
              </button>
              <button
                @click="handleDeleteAccount"
                class="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-medium hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 :size="18" />
                계정 삭제
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Book Detail Modal -->
    <div v-if="showBookDetailModal && selectedBook" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="closeBookDetail"></div>
      <div class="relative min-h-screen flex items-start justify-center p-4">
        <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8 overflow-hidden">

          <!-- Header with Book Cover -->
          <div class="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <!-- Close Button Row -->
            <div class="flex items-center justify-between px-4 pt-4 pb-3">
              <h3 class="text-xs font-bold text-zinc-500 uppercase">책 상세</h3>
              <button @click="closeBookDetail" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <X :size="20" class="text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>

            <!-- Book Info -->
            <div class="px-4 pb-4 flex gap-4">
              <div class="w-20 h-28 rounded-lg overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                <img :src="selectedBook.cover_url" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="text-base font-bold text-zinc-900 dark:text-white mb-1 line-clamp-2 leading-tight">{{ selectedBook.title }}</h2>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{{ selectedBook.author }}</p>
                <div class="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-2">
                  <span v-if="selectedBook.publisher">{{ selectedBook.publisher }}</span>
                  <span v-if="selectedBook.publisher && selectedBook.total_pages">·</span>
                  <span v-if="selectedBook.total_pages">{{ selectedBook.total_pages }}p</span>
                </div>
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <div v-if="selectedBook.myRating" class="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                    <Star :size="12" fill="#EAB308" class="text-yellow-500" />
                    <span class="text-xs font-bold text-yellow-700 dark:text-yellow-400">{{ selectedBook.myRating }}</span>
                  </div>
                  <div class="flex items-center bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    <span class="text-xs font-bold text-zinc-600 dark:text-zinc-400">{{ bookTimeline.length }}개 기록</span>
                  </div>
                  <div v-if="selectedBook.finished_at" class="flex items-center gap-1 bg-lime-50 dark:bg-lime-900/20 px-2 py-1 rounded">
                    <span class="text-xs font-bold text-lime-700 dark:text-lime-400">{{ formatCompletionDate(selectedBook.finished_at) }} 완독</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div class="flex px-4">
              <button
                @click="bookDetailTab = 'all'"
                class="flex-1 py-3 text-sm font-bold transition-colors relative"
                :class="bookDetailTab === 'all' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
              >
                전체
                <div v-if="bookDetailTab === 'all'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
              </button>
              <button
                @click="bookDetailTab = 'review'"
                class="flex-1 py-3 text-sm font-bold transition-colors relative"
                :class="bookDetailTab === 'review' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
              >
                리뷰
                <div v-if="bookDetailTab === 'review'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
              </button>
              <button
                @click="bookDetailTab = 'comments'"
                class="flex-1 py-3 text-sm font-bold transition-colors relative"
                :class="bookDetailTab === 'comments' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
              >
                코멘트
                <div v-if="bookDetailTab === 'comments'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 space-y-3 max-h-[60vh] overflow-y-auto">

            <!-- All Tab -->
            <div v-if="bookDetailTab === 'all'" class="space-y-3">
              <div
                v-for="item in bookTimeline"
                :key="item.id"
                @click="selectedBook?.finished_at ? navigateToItem(item) : null"
                :class="[
                  'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all',
                  selectedBook?.finished_at
                    ? 'cursor-pointer hover:border-lime-400 dark:hover:border-lime-500'
                    : 'cursor-default opacity-60'
                ]"
              >
                <!-- Meta Info -->
                <div class="flex items-center gap-2 mb-3 text-xs">
                  <span class="text-zinc-500 dark:text-zinc-400">{{ item.groupName }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span class="text-zinc-500 dark:text-zinc-400">{{ formatDateTime(item.created_at) }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>

                  <!-- Review: Show rating stars -->
                  <template v-if="item.type === 'review'">
                    <div class="flex items-center gap-1">
                      <div class="flex gap-0.5">
                        <template v-for="i in 5" :key="i">
                          <Star v-if="getStarType(i, item.rating) === 'full'" :size="12" fill="#EAB308" class="text-yellow-500" />
                          <StarHalf v-else-if="getStarType(i, item.rating) === 'half'" :size="12" fill="#EAB308" class="text-yellow-500" />
                          <Star v-else :size="12" fill="none" class="text-yellow-500" />
                        </template>
                      </div>
                      <span class="font-bold text-yellow-600 dark:text-yellow-400">{{ item.rating }}</span>
                    </div>
                  </template>

                  <!-- Comment: Show position percentage -->
                  <span v-else class="text-lime-600 dark:text-lime-400">
                    {{ Math.round(item.position_pct) }}%
                  </span>
                </div>

                <!-- Quote -->
                <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                    {{ item.anchor_text }}
                  </p>
                </div>

                <!-- Content -->
                <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {{ item.content }}
                </p>
              </div>

              <!-- Empty State -->
              <div v-if="bookTimeline.length === 0" class="py-12 text-center">
                <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                  📝
                </div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">기록이 없습니다</h3>
                <p class="text-xs text-zinc-500">이 책에 대한 생각을 남겨보세요</p>
              </div>
            </div>

            <!-- Review Tab -->
            <div v-if="bookDetailTab === 'review'">
              <div
                v-if="bookReview"
                @click="selectedBook?.finished_at ? navigateToItem(bookReview) : null"
                :class="[
                  'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all',
                  selectedBook?.finished_at
                    ? 'cursor-pointer hover:border-lime-400 dark:hover:border-lime-500'
                    : 'cursor-default opacity-60'
                ]"
              >
                <!-- Meta Info -->
                <div class="flex items-center gap-2 mb-3 text-xs">
                  <span class="text-zinc-500 dark:text-zinc-400">{{ bookReview.groupName }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span class="text-zinc-500 dark:text-zinc-400">{{ formatDateTime(bookReview.created_at) }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <div class="flex items-center gap-1">
                    <div class="flex gap-0.5">
                      <template v-for="i in 5" :key="i">
                        <Star v-if="getStarType(i, bookReview.rating) === 'full'" :size="12" fill="#EAB308" class="text-yellow-500" />
                        <StarHalf v-else-if="getStarType(i, bookReview.rating) === 'half'" :size="12" fill="#EAB308" class="text-yellow-500" />
                        <Star v-else :size="12" fill="none" class="text-yellow-500" />
                      </template>
                    </div>
                    <span class="font-bold text-yellow-600 dark:text-yellow-400">{{ bookReview.rating }}</span>
                  </div>
                </div>

                <!-- Content -->
                <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {{ bookReview.content }}
                </p>
              </div>
              <div v-else class="py-12 text-center">
                <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                  ⭐
                </div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">리뷰가 없습니다</h3>
                <p class="text-xs text-zinc-500">이 책에 대한 리뷰를 남겨보세요</p>
              </div>
            </div>

            <!-- Comments Tab -->
            <div v-if="bookDetailTab === 'comments'" class="space-y-3">
              <div
                v-for="comment in bookComments"
                :key="comment.id"
                @click="selectedBook?.finished_at ? navigateToItem(comment) : null"
                :class="[
                  'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all',
                  selectedBook?.finished_at
                    ? 'cursor-pointer hover:border-lime-400 dark:hover:border-lime-500'
                    : 'cursor-default opacity-60'
                ]"
              >
                <!-- Meta Info -->
                <div class="flex items-center gap-2 mb-3 text-xs">
                  <span class="text-zinc-500 dark:text-zinc-400">{{ comment.groupName }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span class="text-zinc-500 dark:text-zinc-400">{{ formatDateTime(comment.created_at) }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span class="text-lime-600 dark:text-lime-400">
                    {{ Math.round(comment.position_pct) }}%
                  </span>
                </div>

                <!-- Quote -->
                <div v-if="comment.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                    {{ comment.anchor_text }}
                  </p>
                </div>

                <!-- Content -->
                <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {{ comment.content }}
                </p>
              </div>

              <div v-if="bookComments.length === 0" class="py-12 text-center">
                <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                  💬
                </div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">코멘트가 없습니다</h3>
                <p class="text-xs text-zinc-500">책을 읽으며 생각을 남겨보세요</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Day Activity Detail Modal -->
    <div v-if="showDayActivityModal && selectedDay" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="closeDayActivity"></div>

      <!-- Modal Content -->
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[85vh] flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white">{{ selectedDay.dateString }}</h2>
              <p class="text-xs text-zinc-500 mt-1">{{ selectedDay.count }}개의 활동</p>
            </div>
            <button @click="closeDayActivity" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <X :size="20" class="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        <!-- Activities List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div
            v-for="item in selectedDay.activities"
            :key="item.id"
            @click="isBookFinished(item.groupBookId) ? navigateToItem(item) : null"
            :class="[
              'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all',
              isBookFinished(item.groupBookId)
                ? 'cursor-pointer hover:border-lime-400 dark:hover:border-lime-500'
                : 'cursor-default opacity-60'
            ]"
          >
            <!-- Meta Info -->
            <div class="flex items-center gap-2 mb-3 text-xs">
              <span class="text-zinc-500 dark:text-zinc-400">{{ item.groupName }}</span>
              <span class="text-zinc-300 dark:text-zinc-700">·</span>
              <span class="text-zinc-500 dark:text-zinc-400">{{ formatTimeOnly(item.created_at) }}</span>
              <span class="text-zinc-300 dark:text-zinc-700">·</span>

              <!-- Review: Show rating stars inline -->
              <template v-if="item.type === 'review'">
                <div class="flex items-center gap-1">
                  <div class="flex gap-0.5">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      :size="12"
                      :fill="getStarType(i, item.rating) !== 'empty' ? '#EAB308' : 'none'"
                      :class="getStarType(i, item.rating) !== 'empty' ? 'text-yellow-500' : 'text-zinc-300 dark:text-zinc-600'"
                    />
                  </div>
                  <span class="font-bold text-yellow-600">{{ item.rating }}</span>
                </div>
              </template>

              <!-- Comment: Show position percentage -->
              <span v-else class="text-lime-600 dark:text-lime-400 font-bold">
                {{ Math.round(item.position_pct) }}%
              </span>
            </div>

            <!-- Quote -->
            <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
              <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                {{ item.anchor_text }}
              </p>
            </div>

            <!-- Content -->
            <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {{ item.content }}
            </p>
          </div>

          <!-- Empty State -->
          <div v-if="selectedDay.count === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
              📭
            </div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">활동이 없습니다</h3>
            <p class="text-xs text-zinc-500">이 날은 기록이 없네요</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <ConfirmModal
      :isOpen="showLogoutConfirm"
      title="로그아웃"
      message="정말 로그아웃 하시겠습니까?"
      description="다시 로그인하려면 구글 계정으로 로그인해야 합니다."
      confirmText="로그아웃"
      cancelText="취소"
      variant="warning"
      @confirm="confirmLogout"
      @cancel="cancelLogout"
    />

    <!-- Delete Account Confirmation Modal -->
    <ConfirmModal
      :isOpen="showDeleteAccountConfirm"
      title="계정 삭제"
      message="정말 계정을 삭제하시겠습니까?"
      description="모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다. 이 작업은 되돌릴 수 없습니다."
      confirmText="삭제하기"
      cancelText="취소"
      variant="danger"
      @confirm="confirmDeleteAccount"
      @cancel="cancelDeleteAccount"
    />

    <!-- Upgrade Prompt Modal -->
    <UpgradePromptModal
      :isOpen="upgradeInsightOpen"
      feature="insights"
      @close="upgradeInsightOpen = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { ChevronLeft, LogOut, User, Camera, Edit2, Star, StarHalf, Heart, Settings, Moon, Sun, Bell, X, Crown, Lock, ChevronRight, ArrowRight, Trash2 } from 'lucide-vue-next'
import ReadingHeatmap from '~/components/ReadingHeatmap.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import UpgradePromptModal from '~/components/UpgradePromptModal.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const user = useSupabaseUser()
const { isDark, toggleTheme } = useTheme()
const { isPremium, subscription: subscriptionDetails, fetchSubscription } = useSubscription()

// State
const activeTab = ref<'timeline' | 'library' | 'insight'>('library')
const loading = ref(true)
const timeline = ref<any[]>([])
const library = ref<any[]>([])
const stats = ref({
  books: 0,
  comments: 0,
  streak: 0,
  groups: 0
})

// Settings Modal State
const settingsModalOpen = ref(false)
const notificationSettings = ref({
  comment_reply: true,
  reaction: true,
  member_join: true,
  completion: true,
  book_added: true
})

// Book Detail Modal State
const showBookDetailModal = ref(false)
const selectedBook = ref<any>(null)
const bookDetailTab = ref<'all' | 'review' | 'comments'>('all')

// Day Activity Modal State
const showDayActivityModal = ref(false)
const selectedDay = ref<any>(null)

// Yearly Goal State
const yearlyGoal = ref(50) // Default goal: 50 books per year
const editingGoal = ref(false)
const tempGoal = ref(50)

// Upgrade Modal State
const upgradeInsightOpen = ref(false)

// Edit Profile State
const editNickname = ref('')
const previewAvatar = ref('')
const avatarFile = ref<File | null>(null)
const isSaving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Helper function to get local date string (YYYY-MM-DD) without timezone conversion
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Computed
const currentUserId = computed(() => userStore.user?.id)

const thisMonthBooks = computed(() => {
  const now = new Date()
  return library.value.filter(book => {
    const d = new Date(book.finished_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

const thisMonthComments = computed(() => {
  const now = new Date()
  return timeline.value.filter(item => {
    const d = new Date(item.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

// Reading books (not finished yet)
const readingBooks = computed(() => {
  return library.value.filter(book => !book.finished_at)
})

// Library grouped by year (for display with year dividers)
const libraryByYear = computed(() => {
  const grouped: Record<number, any[]> = {}

  // Only include finished books
  library.value
    .filter(book => book.finished_at)
    .forEach(book => {
      const year = new Date(book.finished_at).getFullYear()
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(book)
    })

  // Convert to array and sort by year (newest first)
  return Object.entries(grouped)
    .map(([year, books]) => ({
      year: Number(year),
      books: books
    }))
    .sort((a, b) => b.year - a.year)
})

// Yearly goal calculations
const thisYearBooks = computed(() => {
  const now = new Date()
  return library.value.filter(book => {
    const d = new Date(book.finished_at)
    return d.getFullYear() === now.getFullYear()
  }).length
})

const daysLeftInYear = computed(() => {
  const now = new Date()
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
  return Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
})

const monthsLeftInYear = computed(() => {
  const now = new Date()
  return 12 - now.getMonth()
})

const booksNeededPerMonth = computed(() => {
  const remaining = yearlyGoal.value - thisYearBooks.value
  if (remaining <= 0) return 0
  return (remaining / monthsLeftInYear.value).toFixed(1)
})

const onTrack = computed(() => {
  const now = new Date()
  const monthsPassed = now.getMonth() + 1
  const expectedBooks = (yearlyGoal.value / 12) * monthsPassed
  return thisYearBooks.value >= expectedBooks
})

// Monthly progress chart data
const monthlyProgress = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()

  const months = []
  // Always show all 12 months (Jan-Dec), with 0 count for future/empty months
  for (let month = 0; month < 12; month++) {
    const count = library.value.filter(book => {
      const d = new Date(book.finished_at)
      return d.getFullYear() === currentYear && d.getMonth() === month
    }).length

    months.push({
      month: month + 1, // 1-12
      count,
      name: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'][month]
    })
  }

  return months
})

const maxMonthlyCount = computed(() => {
  return Math.max(...monthlyProgress.value.map(m => m.count), 1)
})

// Year-over-year growth
const lastYearBooks = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const lastYear = currentYear - 1
  const currentDayOfYear = Math.floor((now.getTime() - new Date(currentYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24))

  return library.value.filter(book => {
    const d = new Date(book.finished_at)
    if (d.getFullYear() !== lastYear) return false

    const dayOfYear = Math.floor((d.getTime() - new Date(lastYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    return dayOfYear <= currentDayOfYear
  }).length
})

const yearOverYearGrowth = computed(() => {
  if (lastYearBooks.value === 0) {
    return thisYearBooks.value > 0 ? 100 : 0
  }
  return Math.round(((thisYearBooks.value - lastYearBooks.value) / lastYearBooks.value) * 100)
})

// Goal achievement
const isGoalAchieved = computed(() => {
  return thisYearBooks.value >= yearlyGoal.value
})

// Streak calculations
const currentStreak = computed(() => {
  if (timeline.value.length === 0) return 0

  // Get unique dates with activity (using local timezone)
  const dates = [...new Set(timeline.value.map(item =>
    getLocalDateString(new Date(item.created_at))
  ))].sort().reverse()

  if (dates.length === 0) return 0

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = getLocalDateString(today)
  const yesterdayStr = getLocalDateString(yesterday)

  // Streak must start from today or yesterday
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0

  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const currentDate = new Date(dates[i - 1])
    const nextDate = new Date(dates[i])
    const diffDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
})

const longestStreak = computed(() => {
  if (timeline.value.length === 0) return 0

  const dates = [...new Set(timeline.value.map(item =>
    getLocalDateString(new Date(item.created_at))
  ))].sort()

  if (dates.length === 0) return 0

  let maxStreak = 1
  let currentStreakCount = 1

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1])
    const currDate = new Date(dates[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreakCount++
      maxStreak = Math.max(maxStreak, currentStreakCount)
    } else {
      currentStreakCount = 1
    }
  }

  return maxStreak
})

const nextMilestone = computed(() => {
  const milestones = [7, 14, 30, 50, 100, 200, 365]
  return milestones.find(m => m > currentStreak.value) || currentStreak.value + 100
})

const daysUntilNextMilestone = computed(() => {
  return nextMilestone.value - currentStreak.value
})

const daysLeftInMonth = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.getDate() - now.getDate()
})

// Book Detail Modal Computed
const bookTimeline = computed(() => {
  if (!selectedBook.value) return []
  // Filter by the specific group_book_id to show only records from this reading
  return timeline.value.filter(item => {
    // For reviews, check group_book_id directly
    if (item.type === 'review') {
      return item.group_book_id === selectedBook.value.groupBookId
    }
    // For comments, check groupBookId from the normalized data
    return item.groupBookId === selectedBook.value.groupBookId
  })
})

const bookReview = computed(() => {
  return bookTimeline.value.find(item => item.type === 'review')
})

const bookComments = computed(() => {
  return bookTimeline.value.filter(item => item.type === 'comment')
})

// Helper: Check if book is finished (for timeline navigation)
const isBookFinished = (groupBookId: string) => {
  const book = library.value.find(b => b.groupBookId === groupBookId)
  return book?.finished_at != null
}

// Initialization
onMounted(async () => {
  await userStore.fetchProfile()
  await fetchSubscription()
  if (userStore.profile) {
    editNickname.value = userStore.profile.nickname
    previewAvatar.value = userStore.profile.avatar_url || ''

    // Load notification settings from DB
    if (userStore.profile.notification_settings) {
      notificationSettings.value = userStore.profile.notification_settings
    }
  }
  await fetchData()
})

// Refresh data when page is activated (for cached pages)
onActivated(async () => {
  // Ensure profile is loaded before fetching data
  if (!userStore.profile) {
    await userStore.fetchProfile()
  }
  await fetchData()
})

// Auto-save notification settings on change
watch(notificationSettings, async (newSettings) => {
  if (!currentUserId.value) return

  try {
    const { error } = await client
      .from('users')
      .update({ notification_settings: newSettings })
      .eq('id', currentUserId.value)

    if (error) throw error

    // Silently update store without showing toast
    await userStore.fetchProfile(true) // Force refresh after settings update
  } catch (err: any) {
    console.error('Save notification settings error:', err)
    toast.error('알림 설정 저장 실패')
  }
}, { deep: true })

const fetchData = async () => {
  // Use direct reference instead of computed (fixes reactivity issue)
  const userId = userStore.profile?.id || userStore.user?.id

  console.log('[Profile fetchData] Called!')
  console.log('[Profile fetchData] userId:', userId)

  if (!userId) {
    console.error('[Profile fetchData] ❌ No user ID available!')
    loading.value = false
    toast.error('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.')
    return
  }

  loading.value = true

  try {
    console.log('[Profile] Starting fetchData for user:', userId)

    // 🔥 성능 최적화: 독립적인 쿼리 병렬 실행 (6개 쿼리 → 1.6초 → 0.5초)
    const [
      { data: commentsData, error: commentsError },
      { data: reviewsData, error: reviewsError },
      { data: progressData, error: progressError },
      { count: groupCount, error: groupCountError },
      { data: userData }
    ] = await Promise.all([
      // 1. Fetch Comments
      client
        .from('comments')
        .select(`
          id, content, anchor_text, position_pct, created_at,
          group_book:group_books (
            id,
            group:groups (name, id),
            book:books (title, cover_url, official_toc, draft_toc, total_pages, isbn)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),

      // 2. Fetch Reviews
      client
        .from('reviews')
        .select(`
          id, content, rating, created_at, group_book_id,
          group_book:group_books (
            id,
            group:groups (name, id),
            book:books (title, cover_url, isbn)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),

      // 3. Fetch Library (Reading Progress)
      client
        .from('user_reading_progress')
        .select(`
          finished_at,
          progress_pct,
          last_read_at,
          group_book:group_books (
            id,
            book:books (title, author, publisher, total_pages, cover_url, isbn)
          )
        `)
        .eq('user_id', userId)
        .order('last_read_at', { ascending: false }),

      // 4. Fetch Group Count
      client
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // 5. Fetch Yearly Goal
      client
        .from('users')
        .select('yearly_reading_goal')
        .eq('id', userId)
        .single()
    ])

    if (commentsError) {
      console.error('[Profile] Comments fetch error:', commentsError)
      throw commentsError
    }
    console.log('[Profile] Comments fetched:', commentsData?.length || 0, 'items')

    if (reviewsError) {
      console.error('[Profile] Reviews fetch error:', reviewsError)
      throw reviewsError
    }
    console.log('[Profile] Reviews fetched:', reviewsData?.length || 0, 'items')

    if (progressError) {
      console.error('[Profile] Progress fetch error:', progressError)
      throw progressError
    }
    console.log('[Profile] Library fetched:', progressData?.length || 0, 'books')

    if (groupCountError) {
      console.error('[Profile] Group count error:', groupCountError)
      throw groupCountError
    }
    console.log('[Profile] Group count:', groupCount)

    // Merge and Normalize
    const normalizedComments = (commentsData || []).map((c: any) => ({
      type: 'comment',
      id: c.id,
      created_at: c.created_at,
      content: c.content,
      anchor_text: c.anchor_text,
      position_pct: c.position_pct,

      // Metadata
      groupId: c.group_book?.group?.id,
      groupName: c.group_book?.group?.name || 'Unknown Group',
      bookTitle: c.group_book?.book?.title || 'Unknown Book',
      bookCover: c.group_book?.book?.cover_url,
      bookIsbn: c.group_book?.book?.isbn,

      // Navigation Data
      groupBookId: c.group_book?.id,

      // Chapter Name Calculation (Frontend side)
      chapter: calculateChapter(c.position_pct, c.group_book?.book)
    }))

    const normalizedReviews = (reviewsData || []).map((r: any) => ({
      type: 'review',
      id: r.id,
      created_at: r.created_at,
      content: r.content,
      rating: r.rating,
      group_book_id: r.group_book_id,

      // Metadata
      groupId: r.group_book?.group?.id,
      groupName: r.group_book?.group?.name || 'Unknown Group',
      bookTitle: r.group_book?.book?.title,
      bookCover: r.group_book?.book?.cover_url,

      // Navigation Data
      groupBookId: r.group_book_id,  // 일관된 필드명 사용
      bookIsbn: r.group_book?.book?.isbn
    }))

    const merged = [...normalizedComments, ...normalizedReviews].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    timeline.value = merged

    // 2. Process Library (All Books - Reading + Finished)
    library.value = (progressData || [])
      .filter((p: any) => {
        // 유효하지 않은 날짜만 제외 (1970년 같은 이상한 값)
        // 완독 안한 책(finished_at이 null)은 포함
        if (!p.finished_at) return true // 완독 안한 책도 포함
        const year = new Date(p.finished_at).getFullYear()
        return year >= 2000 && year <= new Date().getFullYear()
      })
      .map((p: any) => {
        const groupBookId = p.group_book?.id
        const myReview = reviewsData?.find((r: any) => r.group_book_id === groupBookId)

        return {
          id: p.group_book?.book?.isbn, // Use ISBN as ID
          groupBookId: groupBookId, // Store the specific group_book_id
          title: p.group_book?.book?.title,
          author: p.group_book?.book?.author,
          publisher: p.group_book?.book?.publisher,
          total_pages: p.group_book?.book?.total_pages,
          cover_url: p.group_book?.book?.cover_url,
          finished_at: p.finished_at,
          progress_pct: p.progress_pct, // 진행도 추가
          last_read_at: p.last_read_at, // 마지막 읽은 날짜
          // Find my rating for this specific group_book
          myRating: myReview?.rating || null
        }
      })

    // 3. Stats (중복 쿼리 없이 이미 조회한 데이터 사용)
    stats.value = {
      books: library.value.length,
      comments: (commentsData?.length || 0) + (reviewsData?.length || 0),
      streak: calculateStreakFromData(commentsData || [], reviewsData || []),
      groups: groupCount || 0
    }

    console.log('[Profile] Final stats:', stats.value)
    console.log('[Profile] Timeline items:', timeline.value.length)
    console.log('[Profile] Library items:', library.value.length)

    // 4. Yearly goal (이미 병렬로 조회됨)
    yearlyGoal.value = userData?.yearly_reading_goal || 50
    console.log('[Profile] Yearly goal:', yearlyGoal.value)

  } catch (err: any) {
    console.error('[Profile] Fetch profile data error:', err)
    toast.error('데이터를 불러오는데 실패했습니다: ' + err.message)
  } finally {
    loading.value = false
  }
}

const calculateChapter = (pct: number, book: any) => {
  if (!book) return null
  const toc = book.official_toc || book.draft_toc
  if (!toc || !Array.isArray(toc)) return null
  
  // Need to normalize TOC if stored as pages vs pct. 
  // Assuming TOC in DB is standardized or we just use raw if it looks like PCT.
  // Implementation specific. Let's return null to fallback to PCT display for now.
  return null 
}

// 🔥 성능 최적화: 중복 쿼리 제거 (이미 조회한 데이터를 재사용)
const calculateStreakFromData = (commentsData: any[], reviewsData: any[]) => {
  try {
    // 1. Extract dates (YYYY-MM-DD format) using local timezone
    const allDates = [
      ...(commentsData || []).map(c => getLocalDateString(new Date(c.created_at))),
      ...(reviewsData || []).map(r => getLocalDateString(new Date(r.created_at)))
    ]

    // 3. Remove duplicates and sort descending
    const uniqueDates = [...new Set(allDates)].sort().reverse()

    if (uniqueDates.length === 0) return 0

    // 4. Check if streak is still active (today or yesterday)
    const today = getLocalDateString(new Date())
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateString(yesterday)

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayStr) {
      return 0 // Streak broken
    }

    // 5. Count consecutive days
    let streak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1])
      const prevDate = new Date(uniqueDates[i])
      const diffDays = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / 86400000
      )

      if (diffDays === 1) {
        streak++
      } else {
        break // Streak broken
      }
    }

    return streak
  } catch (err) {
    console.error('Calculate streak error:', err)
    return 0
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

const formatDateSimple = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}`
}

// 하이브리드 포맷 (기록 탭용): "3시간 전" / "3일 전 (25.12.20 14:30)" / "25.12.20 14:30"
const formatTimeAgo = (dateStr: string) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // 24시간 이내: 상대 시간만
  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`

  // 날짜 + 시간 포맷 헬퍼
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const dateTimeFormat = `${year}.${month}.${day} ${hours}:${minutes}`

  // 1주일 이내: "n일 전 (날짜+시간)"
  if (diffDays < 7) {
    return `${diffDays}일 전 (${dateTimeFormat})`
  }

  // 그 이상: 날짜+시간만
  return dateTimeFormat
}

// 날짜 + 시간 포맷 (책 모달용): "25.12.20 14:30"
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}`
}

// 시간만 포맷 (Day Activity Modal용): "14:30"
const formatTimeOnly = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatMonthOnly = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}.${day}`
}

const formatCompletionDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const getStarType = (index: number, rating: number) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = (rating % 1) >= 0.3 // 0.3 이상이면 반별

  if (index <= fullStars) return 'full'
  if (index === fullStars + 1 && hasHalfStar) return 'half'
  return 'empty'
}

const navigateToItem = (item: any) => {
  if (item.groupId) {
    // Navigate to group page with specific book context
    const query: any = {}

    // Always pass the book ID to show the correct book
    if (item.groupBookId) {
      query.bookId = item.groupBookId
    }

    // For comments, also pass position and highlight
    if (item.type === 'comment') {
      query.jumpTo = item.position_pct
      query.highlightComment = item.id
    }

    router.push({
      path: `/group/${item.groupId}`,
      query
    })
  } else {
    toast.warning('해당 그룹을 찾을 수 없습니다.')
  }
}

const openBookDetail = (book: any) => {
  selectedBook.value = book
  bookDetailTab.value = 'all'
  showBookDetailModal.value = true
}

const closeBookDetail = () => {
  showBookDetailModal.value = false
  selectedBook.value = null
  bookDetailTab.value = 'all'
}

// Settings / Edit Profile Logic
const openSettings = () => {
  settingsModalOpen.value = true
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    avatarFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      previewAvatar.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const saveProfile = async () => {
  console.log('[Profile] Save profile called')
  console.log('[Profile] editNickname:', editNickname.value)
  console.log('[Profile] userStore.user:', userStore.user)
  console.log('[Profile] userStore.profile:', userStore.profile)
  console.log('[Profile] currentUserId:', currentUserId.value)

  if (!editNickname.value.trim()) {
    toast.error('닉네임을 입력해주세요.')
    return
  }

  // 🔥 성능 최적화: useSupabaseUser() 사용
  const userId = user.value?.id
  if (!userId) {
    console.error('[Profile] No authenticated user found')
    toast.error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
    return
  }

  console.log('[Profile] Authenticated user ID:', userId)

  isSaving.value = true

  try {
    let avatarUrl = userStore.profile?.avatar_url

    // Upload new avatar if selected
    if (avatarFile.value) {
      console.log('[Profile] Uploading avatar...')
      const fileExt = avatarFile.value.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      console.log('[Profile] Avatar file path:', fileName)

      const { error: uploadError } = await client.storage
        .from('avatars')
        .upload(fileName, avatarFile.value, { upsert: true })

      if (uploadError) {
        console.error('[Profile] Avatar upload error:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = client.storage
        .from('avatars')
        .getPublicUrl(fileName)

      avatarUrl = publicUrl
      console.log('[Profile] Avatar uploaded successfully:', avatarUrl)
    }

    // Update DB
    console.log('[Profile] Updating database...')
    console.log('[Profile] User ID for update:', user.id)
    console.log('[Profile] New nickname:', editNickname.value)
    console.log('[Profile] New avatar URL:', avatarUrl)

    const { error: updateError } = await client
      .from('users')
      .update({
        nickname: editNickname.value,
        avatar_url: avatarUrl
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Profile] Database update error:', updateError)
      throw updateError
    }

    console.log('[Profile] Profile updated successfully')

    await userStore.fetchProfile(true) // Force refresh after profile update
    toast.success('프로필이 업데이트되었습니다.')
    // settingsModalOpen.value = false // Keep open or close? Usually close is fine, or let user close.
    // Let's keep it open to show success, or close it? The user clicked save button next to nickname.
    // Let's not close the whole settings modal, just show toast.
    
  } catch (err: any) {
    console.error('Save profile error:', err)
    toast.error('프로필 저장 실패: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

// Day Activity Modal Handlers
const handleDayClick = (day: any) => {
  selectedDay.value = day
  showDayActivityModal.value = true
}

const closeDayActivity = () => {
  showDayActivityModal.value = false
  selectedDay.value = null
}

// Yearly Goal Handlers
const startEditGoal = () => {
  tempGoal.value = yearlyGoal.value
  editingGoal.value = true
}

const saveGoal = async () => {
  if (tempGoal.value <= 0) {
    toast.error('목표는 1권 이상이어야 합니다')
    return
  }

  // Get user ID more reliably
  const userId = userStore.profile?.id || userStore.user?.id

  if (!userId) {
    console.error('[Profile] saveGoal: No user ID available')
    console.log('[Profile] userStore.profile:', userStore.profile)
    console.log('[Profile] userStore.user:', userStore.user)
    toast.error('사용자 정보를 찾을 수 없습니다')
    return
  }

  try {
    console.log('[Profile] Saving yearly goal:', tempGoal.value, 'for user:', userId)

    // DB에 저장
    const { error } = await client
      .from('users')
      .update({ yearly_reading_goal: tempGoal.value })
      .eq('id', userId)

    if (error) {
      console.error('[Profile] Update goal error:', error)
      throw error
    }

    yearlyGoal.value = tempGoal.value
    editingGoal.value = false
    toast.success('목표가 저장되었습니다')

    console.log('[Profile] Goal saved successfully')
  } catch (err: any) {
    console.error('Save goal error:', err)
    toast.error('목표 저장에 실패했습니다: ' + err.message)
  }
}

const cancelEditGoal = () => {
  editingGoal.value = false
}

const showLogoutConfirm = ref(false)
const showDeleteAccountConfirm = ref(false)

const handleSignOut = () => {
  showLogoutConfirm.value = true
}

const handleDeleteAccount = () => {
  showDeleteAccountConfirm.value = true
}

const confirmLogout = async () => {
  showLogoutConfirm.value = false
  await userStore.signOut()
  router.push('/login')
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
}

const confirmDeleteAccount = async () => {
  showDeleteAccountConfirm.value = false

  try {
    const userId = userStore.profile?.id || userStore.user?.id

    if (!userId) {
      toast.error('사용자 정보를 찾을 수 없습니다.')
      return
    }

    // 1. 사용자 데이터 삭제 (Supabase는 CASCADE로 처리)
    const { error: deleteError } = await client
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('[Profile] Delete user error:', deleteError)
      throw deleteError
    }

    // 2. Auth 계정 삭제 (admin API 필요하므로 서버에서 처리하거나 RPC 함수 사용)
    // Supabase Auth는 클라이언트에서 직접 삭제 불가능하므로 로그아웃만 처리
    await userStore.signOut()

    toast.success('계정이 삭제되었습니다.')
    router.push('/login')
  } catch (err: any) {
    console.error('[Profile] Delete account error:', err)
    toast.error('계정 삭제 실패: ' + err.message)
  }
}

const cancelDeleteAccount = () => {
  showDeleteAccountConfirm.value = false
}

// Insight Tab Handler
const handleInsightTabClick = () => {
  if (!isPremium.value) {
    upgradeInsightOpen.value = true
    return
  }
  activeTab.value = 'insight'
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes scale-up {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-up {
  animation: scale-up 0.2s ease-out;
}

/* Goal Achievement - Subtle glow effect */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(163, 230, 53, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(163, 230, 53, 0);
  }
}
</style>