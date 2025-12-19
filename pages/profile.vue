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
          @click="activeTab = 'insight'"
          class="flex-1 py-3 text-sm font-bold transition-colors relative"
          :class="activeTab === 'insight' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
        >
          분석
          <div v-if="activeTab === 'insight'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="px-4 pt-3 min-h-[300px]">

      <!-- Tab 1: Library Grid -->
      <div v-if="activeTab === 'library'">
        <div v-if="loading" class="space-y-3">
          <SkeletonLoader type="list-item" />
          <SkeletonLoader type="list-item" />
          <SkeletonLoader type="list-item" />
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

        <div v-else class="grid grid-cols-4 gap-2">
          <div
            v-for="book in library"
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
      
      <!-- Tab 2: Timeline Feed -->
      <div v-if="activeTab === 'timeline'">
        <div v-if="loading" class="space-y-3">
          <SkeletonLoader type="list-item" />
          <SkeletonLoader type="list-item" />
          <SkeletonLoader type="list-item" />
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

        <div v-else class="divide-y divide-zinc-200 dark:divide-zinc-800">
          <div
            v-for="item in timeline"
            :key="item.id"
            @click="navigateToItem(item)"
            class="py-3 cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-900/50 transition-colors"
          >
            <!-- Header - One Line -->
            <div class="flex items-center justify-between mb-2 text-xs">
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <span class="text-base">📕</span>
                <span class="font-medium text-zinc-900 dark:text-white truncate">{{ item.bookTitle }}</span>
                <span class="text-zinc-400">·</span>
                <span class="text-zinc-500 truncate">{{ item.groupName }}</span>
              </div>
              <span class="text-zinc-400 ml-2 whitespace-nowrap">{{ formatTimeAgo(item.created_at) }}</span>
            </div>

            <!-- Type Badge -->
            <div class="mb-2 text-xs font-medium text-lime-600 dark:text-lime-400">
              {{ item.type === 'review' ? '⭐ 리뷰' : `💬 ${Math.round(item.position_pct)}%` }}
            </div>

            <!-- Quote -->
            <div v-if="item.anchor_text" class="mb-2 pl-2 text-xs text-zinc-500 dark:text-zinc-400 italic">
              "{{ item.anchor_text }}"
            </div>

            <!-- Content -->
            <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">{{ item.content }}</p>

            <!-- Rating -->
            <div v-if="item.type === 'review'" class="flex gap-0.5 mt-2">
              <template v-for="i in 5" :key="i">
                <Star v-if="getStarType(i, item.rating) === 'full'" :size="12" fill="#EAB308" class="text-yellow-500" />
                <StarHalf v-else-if="getStarType(i, item.rating) === 'half'" :size="12" fill="#EAB308" class="text-yellow-500" />
                <Star v-else :size="12" fill="none" class="text-yellow-500" />
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Insight -->
      <div v-if="activeTab === 'insight'">
        <div v-if="loading" class="space-y-3">
          <SkeletonLoader type="list-item" />
          <SkeletonLoader type="list-item" />
          <SkeletonLoader type="list-item" />
        </div>

        <div v-else class="space-y-3">
          <!-- Heatmap Component -->
          <ReadingHeatmap :activities="timeline" />

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

          <!-- Overall Stats -->
          <div class="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-3">전체 통계</h3>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div>
                <div class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.books }}</div>
                <div class="text-[10px] text-zinc-500">📚 완독</div>
              </div>
              <div>
                <div class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.comments }}</div>
                <div class="text-[10px] text-zinc-500">💬 생각</div>
              </div>
              <div>
                <div class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.groups }}</div>
                <div class="text-[10px] text-zinc-500">👥 그룹</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Settings Modal -->
    <div v-if="settingsModalOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
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
                  class="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white"
                />
                <button 
                  @click="saveProfile" 
                  class="px-4 py-2 bg-lime-400 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2" 
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
              </div>
            </div>
          </section>

          <!-- 3. Account -->
          <section>
            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-2 px-1">계정</h4>
            <button
              @click="handleSignOut"
              class="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut :size="18" />
              로그아웃
            </button>
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
                <h2 class="text-base font-bold text-zinc-900 dark:text-white mb-2 line-clamp-2 leading-tight">{{ selectedBook.title }}</h2>
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <div v-if="selectedBook.myRating" class="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                    <Star :size="12" fill="#EAB308" class="text-yellow-500" />
                    <span class="text-xs font-bold text-yellow-700 dark:text-yellow-400">{{ selectedBook.myRating }}</span>
                  </div>
                  <div class="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                    <span class="text-xs font-medium text-zinc-600 dark:text-zinc-400">{{ bookTimeline.length }}개 기록</span>
                  </div>
                </div>
                <div class="text-xs text-zinc-500">{{ formatMonthOnly(selectedBook.finished_at) }} 완독</div>
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
                서평
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
          <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">

            <!-- All Tab -->
            <div v-if="bookDetailTab === 'all'">
              <!-- My Review Section -->
              <div v-if="bookReview" class="mb-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-bold text-zinc-900 dark:text-white">내 서평</h3>
                </div>
                <div class="bg-lime-50 dark:bg-lime-900/10 border border-lime-200 dark:border-lime-800/50 rounded-xl p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="flex gap-0.5">
                      <template v-for="i in 5" :key="i">
                        <Star v-if="getStarType(i, bookReview.rating) === 'full'" :size="16" fill="#84cc16" class="text-lime-500" />
                        <StarHalf v-else-if="getStarType(i, bookReview.rating) === 'half'" :size="16" fill="#84cc16" class="text-lime-500" />
                        <Star v-else :size="16" fill="none" class="text-lime-500" />
                      </template>
                    </div>
                    <span class="text-sm font-bold text-lime-700 dark:text-lime-400">{{ bookReview.rating }}</span>
                  </div>
                  <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">{{ bookReview.content }}</p>
                  <div class="flex items-center gap-2 text-xs text-zinc-500">
                    <span class="bg-white dark:bg-zinc-800 px-2 py-1 rounded">{{ bookReview.groupName }}</span>
                    <span>·</span>
                    <span>{{ formatTimeAgo(bookReview.created_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Reading Records Section -->
              <div v-if="bookComments.length > 0">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-bold text-zinc-900 dark:text-white">독서 기록</h3>
                  <span class="text-xs text-zinc-500">{{ bookComments.length }}개</span>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="comment in bookComments"
                    :key="comment.id"
                    class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-lime-300 dark:hover:border-lime-700 transition-colors"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-bold text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-900/20 px-2 py-1 rounded">
                        {{ Math.round(comment.position_pct) }}% 지점
                      </span>
                      <button
                        @click="navigateToItem(comment)"
                        class="text-xs text-lime-600 dark:text-lime-400 hover:underline font-medium flex items-center gap-1"
                      >
                        그룹에서 보기 →
                      </button>
                    </div>
                    <div v-if="comment.anchor_text" class="mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border-l-2 border-lime-400">
                      <p class="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">"{{ comment.anchor_text }}"</p>
                    </div>
                    <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">{{ comment.content }}</p>
                    <div class="flex items-center gap-2 text-xs text-zinc-500">
                      <span class="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{{ comment.groupName }}</span>
                      <span>·</span>
                      <span>{{ formatTimeAgo(comment.created_at) }}</span>
                    </div>
                  </div>
                </div>
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
              <div v-if="bookReview" class="bg-lime-50 dark:bg-lime-900/10 border border-lime-200 dark:border-lime-800/50 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-3">
                  <div class="flex gap-0.5">
                    <template v-for="i in 5" :key="i">
                      <Star v-if="getStarType(i, bookReview.rating) === 'full'" :size="16" fill="#84cc16" class="text-lime-500" />
                      <StarHalf v-else-if="getStarType(i, bookReview.rating) === 'half'" :size="16" fill="#84cc16" class="text-lime-500" />
                      <Star v-else :size="16" fill="none" class="text-lime-500" />
                    </template>
                  </div>
                  <span class="text-sm font-bold text-lime-700 dark:text-lime-400">{{ bookReview.rating }}</span>
                </div>
                <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">{{ bookReview.content }}</p>
                <div class="flex items-center gap-2 text-xs text-zinc-500">
                  <span class="bg-white dark:bg-zinc-800 px-2 py-1 rounded">{{ bookReview.groupName }}</span>
                  <span>·</span>
                  <span>{{ formatTimeAgo(bookReview.created_at) }}</span>
                </div>
              </div>
              <div v-else class="py-12 text-center">
                <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                  ⭐
                </div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">서평이 없습니다</h3>
                <p class="text-xs text-zinc-500">이 책에 대한 서평을 남겨보세요</p>
              </div>
            </div>

            <!-- Comments Tab -->
            <div v-if="bookDetailTab === 'comments'">
              <div v-if="bookComments.length > 0" class="space-y-3">
                <div
                  v-for="comment in bookComments"
                  :key="comment.id"
                  class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-lime-300 dark:hover:border-lime-700 transition-colors"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-900/20 px-2 py-1 rounded">
                      {{ Math.round(comment.position_pct) }}% 지점
                    </span>
                    <button
                      @click="navigateToItem(comment)"
                      class="text-xs text-lime-600 dark:text-lime-400 hover:underline font-medium flex items-center gap-1"
                    >
                      그룹에서 보기 →
                    </button>
                  </div>
                  <div v-if="comment.anchor_text" class="mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border-l-2 border-lime-400">
                    <p class="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">"{{ comment.anchor_text }}"</p>
                  </div>
                  <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">{{ comment.content }}</p>
                  <div class="flex items-center gap-2 text-xs text-zinc-500">
                    <span class="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{{ comment.groupName }}</span>
                    <span>·</span>
                    <span>{{ formatTimeAgo(comment.created_at) }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="py-12 text-center">
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { ChevronLeft, LogOut, User, Camera, Edit2, Star, StarHalf, Heart, Settings, Moon, Sun, Bell, X } from 'lucide-vue-next'
import ReadingHeatmap from '~/components/ReadingHeatmap.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import SkeletonLoader from '~/components/SkeletonLoader.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const { isDark, toggleTheme } = useTheme()

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
  completion: true
})

// Book Detail Modal State
const showBookDetailModal = ref(false)
const selectedBook = ref<any>(null)
const bookDetailTab = ref<'all' | 'review' | 'comments'>('all')

// Edit Profile State
const editNickname = ref('')
const previewAvatar = ref('')
const avatarFile = ref<File | null>(null)
const isSaving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

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

// Initialization
onMounted(async () => {
  await userStore.fetchProfile()
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
    await userStore.fetchProfile()
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

    // 1. Fetch Timeline (Comments + Reviews)
    // Fetch Comments
    const { data: commentsData, error: commentsError } = await client
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
      .limit(100)

    if (commentsError) {
      console.error('[Profile] Comments fetch error:', commentsError)
      throw commentsError
    }
    console.log('[Profile] Comments fetched:', commentsData?.length || 0, 'items')

    // Fetch Reviews
    const { data: reviewsData, error: reviewsError } = await client
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
      .limit(50)

    if (reviewsError) {
      console.error('[Profile] Reviews fetch error:', reviewsError)
      throw reviewsError
    }
    console.log('[Profile] Reviews fetched:', reviewsData?.length || 0, 'items')

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
      bookIsbn: r.group_book?.book?.isbn
    }))

    const merged = [...normalizedComments, ...normalizedReviews].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    timeline.value = merged

    // 2. Fetch Library (Finished Books)
    const { data: progressData, error: progressError } = await client
      .from('user_reading_progress')
      .select(`
        finished_at,
        group_book:group_books (
          id,
          book:books (title, cover_url, isbn)
        )
      `)
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })

    if (progressError) {
      console.error('[Profile] Progress fetch error:', progressError)
      throw progressError
    }
    console.log('[Profile] Library fetched:', progressData?.length || 0, 'books')

    library.value = (progressData || []).map((p: any) => {
      const groupBookId = p.group_book?.id
      const myReview = reviewsData?.find((r: any) => r.group_book_id === groupBookId)

      return {
        id: p.group_book?.book?.isbn, // Use ISBN as ID
        groupBookId: groupBookId, // Store the specific group_book_id
        title: p.group_book?.book?.title,
        cover_url: p.group_book?.book?.cover_url,
        finished_at: p.finished_at,
        // Find my rating for this specific group_book
        myRating: myReview?.rating || null
      }
    })

    // 2.5 Fetch Group Count
    const { count: groupCount, error: groupCountError } = await client
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (groupCountError) {
      console.error('[Profile] Group count error:', groupCountError)
      throw groupCountError
    }
    console.log('[Profile] Group count:', groupCount)

    // 3. Stats
    stats.value = {
      books: library.value.length,
      comments: commentsData?.length || 0,
      streak: await calculateStreak(userId),
      groups: groupCount || 0
    }

    console.log('[Profile] Final stats:', stats.value)
    console.log('[Profile] Timeline items:', timeline.value.length)
    console.log('[Profile] Library items:', library.value.length)

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

const calculateStreak = async (userId: string) => {
  // Streak based on comments and reviews (activity days)
  if (!userId) return 0

  try {
    // 1. Fetch all comments and reviews
    const { data: commentsData } = await client
      .from('comments')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const { data: reviewsData } = await client
      .from('reviews')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 2. Extract dates (YYYY-MM-DD format)
    const allDates = [
      ...(commentsData || []).map(c => c.created_at.split('T')[0]),
      ...(reviewsData || []).map(r => r.created_at.split('T')[0])
    ]

    // 3. Remove duplicates and sort descending
    const uniqueDates = [...new Set(allDates)].sort().reverse()

    if (uniqueDates.length === 0) return 0

    // 4. Check if streak is still active (today or yesterday)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
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
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

const formatDateSimple = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}`
}

const formatTimeAgo = (dateStr: string) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금'
  if (diffMins < 60) return `${diffMins}분전`
  if (diffHours < 24) return `${diffHours}시간전`
  if (diffDays < 7) return `${diffDays}일전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주전`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월전`
  return `${Math.floor(diffDays / 365)}년전`
}

const formatMonthOnly = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}.${day}`
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
    // Navigate to group page (works for both comments and reviews)
    router.push({
      path: `/group/${item.groupId}`,
      query: item.type === 'comment' ? {
        jumpTo: item.position_pct,
        highlightComment: item.id
      } : {}
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

  // 사용자 정보 다시 가져오기 (혹시 모를 초기화 문제 방지)
  const { data: { user } } = await client.auth.getUser()

  if (!user) {
    console.error('[Profile] No authenticated user found')
    toast.error('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
    return
  }

  console.log('[Profile] Authenticated user ID:', user.id)

  isSaving.value = true

  try {
    let avatarUrl = userStore.profile?.avatar_url

    // Upload new avatar if selected
    if (avatarFile.value) {
      console.log('[Profile] Uploading avatar...')
      const fileExt = avatarFile.value.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

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

    await userStore.fetchProfile() // Refresh store
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

const showLogoutConfirm = ref(false)

const handleSignOut = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = async () => {
  showLogoutConfirm.value = false
  await userStore.signOut()
  router.push('/login')
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
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
</style>