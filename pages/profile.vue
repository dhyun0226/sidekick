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

    <!-- Subscription Info Bar (Compact & Simple) -->
    <div class="px-4 pt-2 pb-4 border-b border-zinc-200 dark:border-zinc-800/50">
      <!-- Premium User (Compact Bar) -->
      <div
        v-if="isPremium"
        class="bg-zinc-900 rounded-xl p-3.5 relative overflow-hidden flex items-center justify-between border border-white/5 shadow-md shadow-zinc-200/50 dark:shadow-none"
      >
        <!-- Minimal Glow -->
        <div class="absolute -right-10 -top-10 w-24 h-24 bg-lime-500/10 blur-3xl rounded-full"></div>
        
        <div class="flex items-center gap-3 relative z-10">
          <div class="w-8 h-8 bg-gradient-to-tr from-lime-400 to-lime-500 rounded flex items-center justify-center shadow-lg shadow-lime-500/20">
            <Crown :size="16" class="text-black" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-white leading-none mb-1.5">프리미엄 회원</h3>
            <p v-if="subscriptionDetails" class="text-[10px] text-zinc-400 leading-none">
              {{ formatDate(subscriptionDetails.end_date) }}까지 이용 가능
            </p>
          </div>
        </div>

        <button
          @click="router.push('/subscription')"
          class="relative z-10 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all border border-white/10"
        >
          관리
        </button>
      </div>

      <!-- Free User (Compact Banner) -->
      <div
        v-else
        @click="router.push('/subscription')"
        class="bg-white dark:bg-zinc-900 rounded-xl p-3.5 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-lime-400 dark:hover:border-lime-500 transition-all flex items-center justify-between shadow-sm group"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-zinc-50 dark:bg-zinc-800 rounded flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
            <Lock :size="16" class="text-zinc-400 group-hover:text-lime-500 transition-colors" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1.5">프리미엄 혜택 보기</h3>
            <p class="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">더 많은 그룹과 상세 분석을 시작하세요</p>
          </div>
        </div>
        
        <div class="flex items-center gap-1 text-lime-600 dark:text-lime-400">
          <span class="text-xs font-bold">이동</span>
          <ChevronRight :size="14" />
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
                <div class="aspect-[1/1.5] overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">
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
                <div class="aspect-[1/1.5] overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">
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
        <div v-if="loading && timeline.length === 0" class="flex items-center justify-center py-12">
          <LoadingSpinner size="md" message="타임라인 불러오는 중..." />
        </div>

        <div v-else-if="timeline.length === 0 && !loading" class="py-12 flex flex-col items-center text-center">
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

        <div v-else class="space-y-8">
          <div v-for="monthGroup in timelineByMonth" :key="monthGroup.month" class="space-y-4">
            <!-- Monthly Divider -->
            <div class="flex items-center gap-3 sticky top-[49px] z-20 bg-gray-50/95 dark:bg-[#09090b]/95 py-2 backdrop-blur-sm">
              <span class="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{{ monthGroup.month }}</span>
              <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800/50"></div>
            </div>

            <div class="space-y-3">
              <div
                v-for="item in monthGroup.items"
                :key="item.id"
                @click="isBookFinished(item.groupBookId) ? navigateToItem(item) : null"
                class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all shadow-sm"
                :class="[isBookFinished(item.groupBookId) ? 'cursor-pointer hover:border-lime-400' : 'cursor-default opacity-60']"
              >
                <!-- Card Header: Mini Cover & Meta -->
                <div class="flex items-start gap-3 mb-3">
                  <!-- Mini Cover -->
                  <div class="w-8 h-11 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <img v-if="item.bookCover" :src="item.bookCover" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-zinc-400">No Cover</div>
                  </div>

                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-bold text-zinc-900 dark:text-white truncate mb-0.5 tracking-tight">
                      {{ item.bookTitle }}
                    </h4>
                    <div class="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                      <span>{{ item.groupName }}</span>
                      <span class="text-zinc-300 dark:text-zinc-700">·</span>
                      <span>{{ formatTimeAgo(item.created_at) }}</span>
                    </div>
                  </div>
                  
                  <div class="flex-shrink-0 ml-1">
                    <template v-if="item.type === 'review'">
                      <RatingBadge :rating="item.rating" size="sm" />
                    </template>
                    <Badge v-else variant="lime" size="sm">
                      {{ Math.round(item.position_pct) }}%
                    </Badge>
                  </div>
                </div>

                <!-- Reply Context -->
                <div v-if="item.isReply && item.parentData" class="mb-3 overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <div class="bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-3 text-left">
                    <div class="flex items-center gap-2 mb-2">
                      <Avatar
                        :src="item.parentData.avatar_url"
                        :fallback="item.parentData.nickname?.charAt(0) || 'U'"
                        size="xs"
                        className="w-4 h-4 shadow-xs"
                      />
                      <p class="text-[11px] font-bold text-zinc-400">{{ item.parentData.nickname }}님의 기록</p>
                    </div>
                    <!-- Larger & Bordered Anchor -->
                    <div v-if="item.parentData.anchor_text" class="mb-2 pl-2 border-l-2 border-zinc-300 dark:border-zinc-600">
                      <p class="text-[13px] text-zinc-500 dark:text-zinc-400 italic line-clamp-1 font-serif">
                        {{ item.parentData.anchor_text }}
                      </p>
                    </div>
                    <p class="text-[13px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {{ item.parentData.content }}
                    </p>
                  </div>
                </div>


                <!-- Quote -->
                <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed font-serif">
                    {{ item.anchor_text }}
                  </p>
                </div>

                <!-- Content -->
                <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed break-words">
                  {{ item.content }}
                </p>
              </div>
            </div>
          </div>

          <!-- Loading More Sentinel -->
          <div ref="timelineSentinel" class="h-10 flex items-center justify-center">
            <LoadingSpinner v-if="isLoadingMoreTimeline" size="sm" />
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
    <div v-if="settingsModalOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="settingsModalOpen = false"></div>
      <div class="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col">
        
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 class="text-lg font-black text-zinc-900 dark:text-white">설정</h3>
          <button @click="settingsModalOpen = false" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X :size="20" />
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <!-- 1. Profile Edit -->
          <section>
            <div class="flex items-center justify-between mb-4 px-1">
              <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">프로필 편집</h4>
            </div>
            
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50">
              <div class="flex flex-col items-center gap-4 mb-6">
                <div class="relative group cursor-pointer" @click="triggerFileInput">
                  <div class="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-700 shadow-xl relative">
                    <img v-if="previewAvatar" :src="previewAvatar" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600"><User :size="40"/></div>
                    <!-- Camera Overlay -->
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera :size="24" class="text-white" />
                    </div>
                  </div>
                  <!-- Camera Float Button -->
                  <div class="absolute bottom-0 right-0 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
                    <Camera :size="14" class="text-black" />
                  </div>
                </div>
                <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange" />
              </div>

              <div class="space-y-2">
                <label class="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">닉네임</label>
                <div class="flex gap-2">
                  <input
                    v-model="editNickname"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    class="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white transition-all"
                  />
                  <button
                    @click="saveProfile"
                    class="flex-shrink-0 p-3 bg-zinc-900 dark:bg-zinc-700 text-white rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all active:scale-95 disabled:opacity-50"
                    :disabled="isSaving"
                    title="닉네임 저장"
                  >
                    <div v-if="isSaving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <Save v-else :size="20" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 2. App Settings -->
          <section>
            <div class="flex items-center justify-between mb-4 px-1">
              <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">앱 설정</h4>
            </div>
            
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 divide-y divide-zinc-100 dark:divide-zinc-800">
              <!-- Dark Mode -->
              <div class="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors" @click="toggleTheme">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500">
                    <Moon v-if="isDark" :size="16" />
                    <Sun v-else :size="16" />
                  </div>
                  <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">다크 모드</span>
                </div>
                <div class="w-10 h-5 rounded-full transition-colors duration-300 relative" :class="isDark ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'">
                  <div class="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm" :class="isDark ? 'translate-x-5' : 'translate-x-0'"></div>
                </div>
              </div>

              <!-- Notifications -->
              <div class="p-4 space-y-4">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500">
                    <Bell :size="16" />
                  </div>
                  <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">알림 설정</span>
                </div>
                
                <div class="space-y-3.5 pl-11">
                  <div v-for="(enabled, type) in notificationSettings" :key="type" class="flex items-center justify-between cursor-pointer" @click="notificationSettings[type] = !notificationSettings[type]">
                    <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">{{ getNotificationLabel(type) }}</span>
                    <div class="w-8 h-4 rounded-full transition-colors duration-300 relative" :class="notificationSettings[type] ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'">
                      <div class="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm" :class="notificationSettings[type] ? 'translate-x-4' : 'translate-x-0'"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. Account -->
          <section class="pb-4">
            <div class="flex items-center justify-between mb-4 px-1">
              <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">계정</h4>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="handleSignOut"
                class="py-3.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 border border-zinc-100 dark:border-zinc-800"
              >
                <LogOut :size="14" />
                로그아웃
              </button>
              <button
                @click="handleDeleteAccount"
                class="py-3.5 bg-red-50/50 dark:bg-red-900/10 text-red-500/80 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 border border-red-100/50 dark:border-red-900/20"
              >
                <Trash2 :size="14" />
                계정 삭제
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Book Detail Modal -->
    <ProfileBookDetailModal
      :isOpen="showBookDetailModal"
      :book="selectedBook"
      @close="closeBookDetail"
      @navigate="navigateToItem"
    />

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

            <!-- Reply Context (Parent Comment) -->
            <div v-if="item.isReply" class="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border-l-4 border-zinc-200 dark:border-zinc-700">
              <div class="flex items-center gap-1.5 mb-1.5">
                <span class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                  {{ item.parentData?.nickname || '알 수 없는 사용자' }}님의 기록에 대한 답글
                </span>
              </div>
              <template v-if="item.parentData">
                <div v-if="item.parentData.anchor_text" class="mb-1.5 pl-2 border-l border-zinc-300 dark:border-zinc-600">
                  <p class="text-[11px] text-zinc-400 italic line-clamp-1">
                    {{ item.parentData.anchor_text }}
                  </p>
                </div>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {{ item.parentData.content || '기록 내용이 없습니다.' }}
                </p>
              </template>
              <p v-else class="text-xs text-zinc-400 italic">
                원본 기록을 불러올 수 없습니다.
              </p>
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
import { ref, computed, onMounted, onActivated, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { ChevronLeft, LogOut, User, Camera, Edit2, Star, StarHalf, Heart, Settings, Moon, Sun, Bell, X, Crown, Lock, ChevronRight, ArrowRight, Trash2, Save, CornerDownRight } from 'lucide-vue-next'
import ReadingHeatmap from '~/components/ReadingHeatmap.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import UpgradePromptModal from '~/components/UpgradePromptModal.vue'
import ProfileBookDetailModal from '~/components/ProfileBookDetailModal.vue'
import Avatar from '~/components/Avatar.vue'

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

// Pagination State
const timelineOffset = ref(0)
const hasMoreTimeline = ref(true)
const isLoadingMoreTimeline = ref(false)
const TIMELINE_PAGE_SIZE = 20
const timelineSentinel = ref<HTMLElement | null>(null)
let timelineObserver: IntersectionObserver | null = null

// Settings Modal State
const settingsModalOpen = ref(false)
const notificationSettings = ref({
  comment_reply: true,
  reaction: true,
  member_join: true,
  completion: true,
  book_added: true
})

// 알림 타입별 한글 라벨 변환 함수
const getNotificationLabel = (type: string) => {
  const labels: Record<string, string> = {
    comment_reply: '내 글에 달린 답글',
    reaction: '내 기록에 달린 반응',
    member_join: '새로운 멤버 가입',
    completion: '멤버의 완독 소식',
    book_added: '새로운 책 추가'
  }
  return labels[type] || type
}

// Book Detail Modal State
const showBookDetailModal = ref(false)
const selectedBook = ref<any>(null)

// Day Activity Modal State
const showDayActivityModal = ref(false)
const selectedDay = ref<any>(null)

// Yearly Goal State
const yearlyGoal = ref(50) 
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

// Helper function to get local date string (YYYY-MM-DD)
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
    if (!book.finished_at) return false
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

// Timeline grouped by month
const timelineByMonth = computed(() => {
  const grouped: Record<string, any[]> = {}

  timeline.value.forEach(item => {
    const date = new Date(item.created_at)
    const key = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(item)
  })

  return Object.entries(grouped)
    .map(([month, items]) => ({ month, items }))
    .sort((a, b) => b.month.localeCompare(a.month))
})

// Reading books (not finished yet)
const readingBooks = computed(() => {
  return library.value.filter(book => !book.finished_at)
})

// Library grouped by year
const libraryByYear = computed(() => {
  const grouped: Record<number, any[]> = {}
  library.value
    .filter(book => book.finished_at)
    .forEach(book => {
      const year = new Date(book.finished_at!).getFullYear()
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(book)
    })

  return Object.entries(grouped)
    .map(([year, books]) => ({ year: Number(year), books }))
    .sort((a, b) => b.year - a.year)
})

// Yearly goal calculations
const thisYearBooks = computed(() => {
  const now = new Date()
  return library.value.filter(book => {
    if (!book.finished_at) return false
    const d = new Date(book.finished_at)
    return d.getFullYear() === now.getFullYear()
  }).length
})

const daysLeftInYear = computed(() => {
  const now = new Date()
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
  return Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
})

const monthsLeftInYear = computed(() => 12 - new Date().getMonth())

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
  for (let month = 0; month < 12; month++) {
    const count = library.value.filter(book => {
      if (!book.finished_at) return false
      const d = new Date(book.finished_at)
      return d.getFullYear() === currentYear && d.getMonth() === month
    }).length
    months.push({ month: month + 1, count, name: `${month + 1}월` })
  }
  return months
})

const maxMonthlyCount = computed(() => Math.max(...monthlyProgress.value.map(m => m.count), 1))

// Year-over-year growth
const lastYearBooks = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const lastYear = currentYear - 1
  const currentDayOfYear = Math.floor((now.getTime() - new Date(currentYear, 0, 0).getTime()) / 86400000)

  return library.value.filter(book => {
    if (!book.finished_at) return false
    const d = new Date(book.finished_at)
    if (d.getFullYear() !== lastYear) return false
    const dayOfYear = Math.floor((d.getTime() - new Date(lastYear, 0, 0).getTime()) / 86400000)
    return dayOfYear <= currentDayOfYear
  }).length
})

const yearOverYearGrowth = computed(() => {
  if (lastYearBooks.value === 0) return thisYearBooks.value > 0 ? 100 : 0
  return Math.round(((thisYearBooks.value - lastYearBooks.value) / lastYearBooks.value) * 100)
})

const isGoalAchieved = computed(() => thisYearBooks.value >= yearlyGoal.value)

// Streak calculations
const currentStreak = computed(() => {
  if (timeline.value.length === 0) return 0
  const dates = [...new Set(timeline.value.map(item => getLocalDateString(new Date(item.created_at))))].sort().reverse()
  if (dates.length === 0) return 0
  const today = getLocalDateString(new Date())
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)
  if (dates[0] !== today && dates[0] !== yesterdayStr) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const diffDays = Math.floor((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000)
    if (diffDays === 1) streak++ 
    else break
  }
  return streak
})

const longestStreak = computed(() => {
  if (timeline.value.length === 0) return 0
  const dates = [...new Set(timeline.value.map(item => getLocalDateString(new Date(item.created_at))))].sort()
  let maxStreak = 1, currentStreakCount = 1
  for (let i = 1; i < dates.length; i++) {
    const diffDays = Math.floor((new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000)
    if (diffDays === 1) { currentStreakCount++; maxStreak = Math.max(maxStreak, currentStreakCount) }
    else currentStreakCount = 1
  }
  return maxStreak
})

// Initialization
onMounted(async () => {
  await userStore.fetchProfile()
  await fetchSubscription()
  if (userStore.profile) {
    editNickname.value = userStore.profile.nickname
    previewAvatar.value = userStore.profile.avatar_url || ''
    if (userStore.profile.notification_settings) notificationSettings.value = userStore.profile.notification_settings
  }
  await fetchData()
  setupTimelineObserver()
})

onActivated(async () => {
  if (!userStore.profile) await userStore.fetchProfile()
  await fetchData()
})

onUnmounted(() => {
  if (timelineObserver) timelineObserver.disconnect()
})

// Timeline pagination observer
const setupTimelineObserver = () => {
  if (timelineObserver) timelineObserver.disconnect()
  timelineObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMoreTimeline.value && !isLoadingMoreTimeline.value && activeTab.value === 'timeline') {
      loadMoreTimeline()
    }
  }, { threshold: 0.1 })
  if (timelineSentinel.value) timelineObserver.observe(timelineSentinel.value)
}

// Helper: Check if book is finished
const isBookFinished = (groupBookId: string) => {
  const book = library.value.find(b => b.groupBookId === groupBookId)
  return book?.finished_at != null
}

watch(activeTab, (newTab) => {
  if (newTab === 'timeline') {
    nextTick(() => setupTimelineObserver())
  }
})

const fetchData = async () => {
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) { loading.value = false; return }

  loading.value = true
  timeline.value = []
  timelineOffset.value = 0
  hasMoreTimeline.value = true

  try {
        // 🔥 Parallel fetch for stats, library, and reviews
        const [
          { data: progressData },
          { data: userReviewsData },
          { count: groupCount },
          { data: userData }
        ] = await Promise.all([
          client.from('user_reading_progress').select('finished_at, progress_pct, last_read_at, group_book:group_books (id, book:books (*))').eq('user_id', userId).order('last_read_at', { ascending: false }),
          client.from('reviews').select('group_book_id, rating').eq('user_id', userId),
          client.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          client.from('users').select('yearly_reading_goal').eq('id', userId).single()
        ])
    
        // Create a map for quick rating lookup
        const ratingsMap = new Map(userReviewsData?.map(r => [r.group_book_id, r.rating]) || [])
    
        // Process Library
        library.value = (progressData || []).map((p: any) => ({
          id: p.group_book?.book?.isbn,
          groupBookId: p.group_book?.id,
          title: p.group_book?.book?.title,
          author: p.group_book?.book?.author,
          publisher: p.group_book?.book?.publisher,
          total_pages: p.group_book?.book?.total_pages,
          cover_url: p.group_book?.book?.cover_url,
          genre: p.group_book?.book?.official_genre || p.group_book?.book?.draft_genre,
          finished_at: p.finished_at,
          progress_pct: p.progress_pct,
          last_read_at: p.last_read_at,
          myRating: ratingsMap.get(p.group_book?.id) || null // 🎯 Restore rating mapping
        }))
    stats.value.books = library.value.filter(b => b.finished_at).length
    stats.value.groups = groupCount || 0
    yearlyGoal.value = userData?.yearly_reading_goal || 50

    await loadMoreTimeline()

    const [ { count: tc }, { count: tr } ] = await Promise.all([
      client.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ])
    stats.value.comments = (tc || 0) + (tr || 0)

  } catch (err) { console.error(err) } finally { loading.value = false }
}

const loadMoreTimeline = async () => {
  if (isLoadingMoreTimeline.value || !hasMoreTimeline.value) return
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) return

  isLoadingMoreTimeline.value = true
  const from = timelineOffset.value, to = from + TIMELINE_PAGE_SIZE - 1

  try {
    const [ { data: cd }, { data: rd } ] = await Promise.all([
      client
        .from('comments')
        .select(`
          id, content, anchor_text, position_pct, created_at, parent_id,
          parent:parent_id (
            content,
            anchor_text,
            user:users (nickname, avatar_url)
          ),
          group_book:group_books (id, group:groups (name, id), book:books (title, cover_url, isbn))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to),
      client
        .from('reviews')
        .select(`
          id, content, rating, created_at, group_book_id,
          group_book:group_books (id, group:groups (name, id), book:books (title, cover_url, isbn))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)
    ])

    const nc = (cd || []).map((c: any) => {
      const parent = Array.isArray(c.parent) ? c.parent[0] : c.parent
      let pd = null
      if (parent) {
        const pu = Array.isArray(parent.user) ? parent.user[0] : parent.user
        pd = {
          nickname: pu?.nickname || '알 수 없는 사용자',
          avatar_url: pu?.avatar_url,
          content: parent.content || '내용 없음',
          anchor_text: parent.anchor_text
        }
      }
      return { 
        type: 'comment', 
        id: c.id, 
        created_at: c.created_at, 
        content: c.content, 
        anchor_text: c.anchor_text, 
        position_pct: c.position_pct, 
        isReply: !!c.parent_id, 
        parentData: pd, 
        groupId: c.group_book?.group?.id, 
        groupName: c.group_book?.group?.name, 
        bookTitle: c.group_book?.book?.title, 
        bookCover: c.group_book?.book?.cover_url, 
        groupBookId: c.group_book?.id 
      }
    })

    const nr = (rd || []).map((r: any) => ({ type: 'review', id: r.id, created_at: r.created_at, content: r.content, rating: r.rating, groupId: r.group_book?.group?.id, groupName: r.group_book?.group?.name, bookTitle: r.group_book?.book?.title, bookCover: r.group_book?.book?.cover_url, groupBookId: r.group_book?.id }))

    const combined = [...nc, ...nr].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (combined.length === 0) hasMoreTimeline.value = false
    else {
      timeline.value = [...timeline.value, ...combined]
      timelineOffset.value += TIMELINE_PAGE_SIZE
      stats.value.streak = calculateStreakFromData(timeline.value.filter(i => i.type === 'comment'), timeline.value.filter(i => i.type === 'review'))
    }
  } catch (err) { console.error(err) } finally { isLoadingMoreTimeline.value = false }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
}

const formatTimeAgo = (dateStr: string) => {
  const now = new Date(), date = new Date(dateStr), diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMs / 3600000), diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  const y = String(date.getFullYear()).slice(-2), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0')
  return diffDays < 7 ? `${diffDays}일 전 (${y}.${m}.${d})` : `${y}.${m}.${d}`
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const y = String(date.getFullYear()).slice(-2), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0'), hh = String(date.getHours()).padStart(2, '0'), mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${d} ${hh}:${mm}`
}

const formatTimeOnly = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatMonthOnly = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const formatCompletionDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getFullYear()).slice(-2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const navigateToItem = (item: any) => {
  if (item.groupId) {
    const query: any = {}
    if (item.groupBookId) query.bookId = item.groupBookId
    if (item.type === 'comment') { query.jumpTo = item.position_pct; query.highlightComment = item.id }
    router.push({ path: `/group/${item.groupId}`, query })
  } else toast.warning('해당 그룹을 찾을 수 없습니다.')
}

const openBookDetail = (book: any) => { selectedBook.value = book; showBookDetailModal.value = true }
const closeBookDetail = () => { showBookDetailModal.value = false; selectedBook.value = null }
const openSettings = () => settingsModalOpen.value = true
const triggerFileInput = () => fileInput.value?.click()

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement, file = target.files?.[0]
  if (!file) return
  isSaving.value = true
  try {
    const { data: { user: authUser } } = await client.auth.getUser()
    if (!authUser) throw new Error('로그인이 필요합니다.')
    const userId = authUser.id, fileExt = file.name.split('.').pop(), fileName = `${userId}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await client.storage.from('avatars').upload(fileName, file, { upsert: true, contentType: file.type })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = client.storage.from('avatars').getPublicUrl(fileName)
    const { error: updateError } = await client.from('users').update({ avatar_url: publicUrl }).eq('id', userId)
    if (updateError) throw updateError
    previewAvatar.value = publicUrl
    await userStore.fetchProfile(true)
    toast.success('프로필 사진이 변경되었습니다! ✨')
  } catch (err: any) { toast.error('사진 업로드 실패') } finally { isSaving.value = false; target.value = '' }
}

const saveProfile = async () => {
  if (!editNickname.value.trim()) { toast.error('닉네임을 입력해주세요.'); return }
  isSaving.value = true
  try {
    const { data: { user: authUser } } = await client.auth.getUser()
    if (!authUser) throw new Error('로그인이 필요합니다.')
    const { error } = await client.from('users').update({ nickname: editNickname.value.trim() }).eq('id', authUser.id)
    if (error) throw error
    await userStore.fetchProfile(true)
    toast.success('닉네임이 변경되었습니다! ✨')
  } catch (err) { toast.error('저장 실패') } finally { isSaving.value = false }
}

const handleDayClick = (day: any) => { selectedDay.value = day; showDayActivityModal.value = true }
const closeDayActivity = () => { showDayActivityModal.value = false; selectedDay.value = null }
const startEditGoal = () => { tempGoal.value = yearlyGoal.value; editingGoal.value = true }

const saveGoal = async () => {
  if (tempGoal.value <= 0) { toast.error('목표는 1권 이상이어야 합니다'); return }
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) return
  try {
    const { error = null } = await client.from('users').update({ yearly_reading_goal: tempGoal.value }).eq('id', userId)
    if (error) throw error
    yearlyGoal.value = tempGoal.value; editingGoal.value = false
    toast.success('목표가 저장되었습니다')
  } catch (err: any) { toast.error('목표 저장 실패') }
}

const cancelEditGoal = () => editingGoal.value = false
const handleSignOut = () => showLogoutConfirm.value = true
const handleDeleteAccount = () => showDeleteAccountConfirm.value = true
const confirmLogout = async () => { showLogoutConfirm.value = false; await userStore.signOut(); router.push('/login') }
const cancelLogout = () => showLogoutConfirm.value = false

const confirmDeleteAccount = async () => {
  showDeleteAccountConfirm.value = false
  try {
    const userId = userStore.profile?.id || userStore.user?.id
    if (!userId) return
    const { error } = await client.from('users').delete().eq('id', userId)
    if (error) throw error
    await userStore.signOut()
    toast.success('계정이 삭제되었습니다.'); router.push('/login')
  } catch (err: any) { toast.error('계정 삭제 실패') }
}

const cancelDeleteAccount = () => showDeleteAccountConfirm.value = false
const handleInsightTabClick = () => { if (!isPremium.value) { upgradeInsightOpen.value = true; return } activeTab.value = 'insight' }

const calculateStreakFromData = (commentsData: any[], reviewsData: any[]) => {
  try {
    const allDates = [...(commentsData || []).map(c => getLocalDateString(new Date(c.created_at))), ...(reviewsData || []).map(r => getLocalDateString(new Date(r.created_at)))]
    const uniqueDates = [...new Set(allDates)].sort().reverse()
    if (uniqueDates.length === 0) return 0
    const today = getLocalDateString(new Date()), yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateString(yesterday)
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayStr) return 0
    let streak = 1
    for (let i = 1; i < dates.length; i++) {
      const diffDays = Math.floor((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000)
      if (diffDays === 1) streak++ 
      else break
    }
    return streak
  } catch (err) { return 0 }
}

const getStarType = (index: number, rating: number) => {
  const fullStars = Math.floor(rating), hasHalfStar = (rating % 1) >= 0.3
  if (index <= fullStars) return 'full'
  if (index === fullStars + 1 && hasHalfStar) return 'half'
  return 'empty'
}

const calculateChapter = (pct: number, book: any) => null

// Auto-save notification settings
watch(notificationSettings, async (newSettings) => {
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) return
  try {
    await client.from('users').update({ notification_settings: newSettings }).eq('id', userId)
    await userStore.fetchProfile(true)
  } catch (err) { console.error(err) }
}, { deep: true })

const showLogoutConfirm = ref(false)
const showDeleteAccountConfirm = ref(false)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.animate-scale-up { animation: scale-up 0.2s ease-out; }
</style>