<template>
  <div class="relative min-h-[100dvh] bg-gray-50 dark:bg-background">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-300 dark:border-zinc-800">
      <div class="max-w-[480px] mx-auto flex justify-between items-center px-4 h-14">
        <div class="flex items-center gap-2">
          <button @click="router.push('/')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" title="홈으로">
            <ChevronLeft :size="24" />
          </button>
          <button @click="drawerOpen = true" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" title="메뉴">
            <Menu :size="24" />
          </button>
        </div>
        <div class="flex flex-col items-center">
          <h1 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">{{ groupName }}</h1>
          <span v-if="currentBook" class="text-[10px] text-zinc-600 dark:text-zinc-400">
            {{ bookTitle }}
            <span v-if="bookRoundLabel" class="text-lime-400 ml-1">{{ bookRoundLabel }}</span>
          </span>
        </div>
        <button class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 pointer-events-none">
          <Search :size="24" />
        </button>
      </div>
    </header>

    <!-- Timeline Content -->
    <div class="pt-16 pb-32 min-h-screen">
      <!-- Member Progress Section (책이 있을 때만 표시) -->
      <div v-if="currentBook" class="max-w-[480px] mx-auto px-4 mt-4 mb-4">
        <div class="bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
          <button
            @click="showMemberProgress = !showMemberProgress"
            class="w-full flex justify-between items-center"
          >
            <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">멤버 진행도</span>
            <ChevronDown :class="{ 'rotate-180': showMemberProgress }" :size="16" class="text-zinc-600 dark:text-zinc-400 transition-transform" />
          </button>

          <div v-if="showMemberProgress" class="mt-4 space-y-3">
            <div v-for="member in sortedMembersWithProgress" :key="member.id" class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-zinc-700 dark:text-zinc-300">{{ member.nickname }}</span>
                  <span class="text-lime-400 font-mono">{{ member.progress }}%</span>
                </div>
                <div class="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full bg-lime-400 transition-all duration-300" :style="{ width: `${member.progress}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 책이 없을 때 Empty State -->
      <div v-if="!currentBook" class="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div class="text-6xl mb-4">📖</div>
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">책을 선택해주세요</h2>
        <p class="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6 max-w-xs">
          왼쪽 상단 메뉴에서<br />"새 책 시작하기"를 눌러 함께 읽을 책을 선택하세요!
        </p>
        <button
          @click="drawerOpen = true"
          class="px-6 py-3 bg-lime-400 text-black font-bold rounded-xl hover:bg-lime-300 transition-colors flex items-center gap-2"
        >
          <Menu :size="20" />
          메뉴 열기
        </button>
      </div>

      <!-- 책이 있을 때 Timeline 표시 -->
      <Timeline
        v-else
        :comments="comments"
        :readProgress="readProgress"
        :viewProgress="viewProgress"
        :currentUserId="currentUserId"
        @modalOpen="commentModalOpen = true"
        @modalClose="commentModalOpen = false"
        @writeComment="handleWriteFromModal"
      />
    </div>

    <!-- Smart Slider (Footer) - 책이 있을 때만 표시, 모달 열렸을 때는 숨김 -->
    <SmartSlider
      v-if="currentBook && !commentModalOpen"
      v-model="viewProgress"
      :toc="toc"
      @change="handleSliderChange"
      @write="handleWrite"
    />

    <!-- Comment Input Overlay -->
    <div v-if="showCommentInput" class="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="showCommentInput = false"></div>
      <div class="relative z-10 w-full max-w-[480px] bg-white dark:bg-zinc-900 p-6 rounded-t-2xl shadow-2xl pointer-events-auto animate-slide-up border-t border-zinc-300 dark:border-zinc-800">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">댓글 작성</h3>
            <p class="text-xs text-zinc-600 dark:text-zinc-500 mt-1">{{ currentChapterName }} · {{ Math.round(viewProgress) }}%</p>
          </div>
          <button @click="closeCommentInput" class="text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X :size="20" />
          </button>
        </div>

        <!-- Anchor Text (Optional) -->
        <div class="mb-3">
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            인용 텍스트 {{ anchorTextLocked ? '' : '(선택사항)' }}
          </label>
          <div class="relative">
            <input
              v-model="newAnchorText"
              type="text"
              :readonly="anchorTextLocked"
              :placeholder="anchorTextLocked ? '' : '예: &quot;주인공은 결국 돌아왔다&quot;'"
              :class="[
                'w-full rounded-lg px-3 py-2 text-sm focus:outline-none',
                anchorTextLocked
                  ? 'bg-lime-100 dark:bg-zinc-800/50 text-lime-600 dark:text-lime-400 font-serif italic cursor-not-allowed border border-lime-400/30'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-lime-400'
              ]"
            />
            <div v-if="anchorTextLocked" class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded">
              고정됨
            </div>
          </div>
          <p v-if="!anchorTextLocked" class="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1">인용하고 싶은 문구를 입력하세요</p>
        </div>

        <!-- Comment Content -->
        <div class="mb-3">
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">댓글 내용 *</label>
          <textarea
            v-model="newCommentContent"
            placeholder="이 부분에 대한 생각을 남겨보세요..."
            class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
            maxlength="500"
          ></textarea>
          <div class="flex justify-between items-center mt-1">
            <p class="text-[10px] text-zinc-500 dark:text-zinc-600">최대 500자</p>
            <p class="text-[10px]" :class="newCommentContent.length > 500 ? 'text-red-400' : 'text-zinc-500 dark:text-zinc-600'">
              {{ newCommentContent.length }} / 500
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            @click="closeCommentInput"
            class="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            @click="submitComment"
            :disabled="!newCommentContent.trim() || newCommentContent.length > 500"
            class="flex-1 py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send :size="16" />
            등록
          </button>
        </div>
      </div>
    </div>

    <!-- Side Drawer -->
    <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-start">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="drawerOpen = false"></div>
      
      <!-- Drawer Content -->
      <div class="relative w-[80%] max-w-[320px] h-full bg-white dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-800 p-6 flex flex-col shadow-2xl animate-slide-right">

        <!-- Main Drawer View -->
        <div v-if="!showSettings" class="flex flex-col h-full">
          <div class="mb-8 flex justify-between items-start">
            <div>
              <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-1">{{ groupName }}</h2>
              <p class="text-xs text-zinc-600 dark:text-zinc-500">멤버 {{ members.length }}명</p>
            </div>
            <button v-if="isAdmin" @click="showSettings = true" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1">
              <Settings :size="20" />
            </button>
          </div>

          <div class="mb-8">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-xs font-bold text-lime-400 uppercase tracking-wider">Now Reading</h3>
              <!-- Admin Menu Button -->
              <div v-if="currentBook && isAdmin" class="relative">
                <button
                  @click="bookMenuOpen = !bookMenuOpen"
                  class="p-1 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
                >
                  <MoreVertical :size="16" />
                </button>

                <!-- Backdrop to close menu -->
                <div
                  v-if="bookMenuOpen"
                  class="fixed inset-0 z-40"
                  @click="bookMenuOpen = false"
                ></div>

                <!-- Dropdown Menu -->
                <div
                  v-if="bookMenuOpen"
                  class="absolute right-0 top-8 w-48 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-xl z-50"
                >
                  <button
                    @click="openEditDatesModal"
                    class="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 rounded-t-lg"
                  >
                    <Edit2 :size="14" />
                    독서 기간 수정
                  </button>
                  <button
                    @click="openEditTocModal"
                    class="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    📑 목차 수정
                  </button>
                  <button
                    @click="openMarkCompletedModal"
                    class="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    ✅ 완독 처리
                  </button>
                  <div class="border-t border-zinc-300 dark:border-zinc-700"></div>
                  <button
                    @click="openDeleteBookModal"
                    class="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 rounded-b-lg"
                  >
                    🗑️ 책 삭제
                  </button>
                </div>
              </div>
            </div>

            <!-- 책이 있을 때 -->
            <div v-if="currentBook" class="flex gap-3 bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 mb-4">
              <img :src="bookCover" class="w-12 h-16 object-cover rounded bg-zinc-200 dark:bg-zinc-700" />
              <div class="flex-1 min-w-0">
                <div class="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                  {{ bookTitle }}
                  <span v-if="bookRoundLabel" class="text-lime-400 ml-1 text-xs">{{ bookRoundLabel }}</span>
                </div>
                <div class="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{{ bookAuthor }}</div>

                <!-- Reading Period Info -->
                <div v-if="formattedDateRange" class="space-y-1">
                  <div class="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-500">
                    <span>📅</span>
                    <span>{{ formattedDateRange }}</span>
                    <span v-if="totalReadingDays" class="text-zinc-500 dark:text-zinc-600">({{ totalReadingDays }}일)</span>
                  </div>
                  <div v-if="daysRemaining !== null" class="flex items-center gap-1 text-xs">
                    <span
                      class="font-bold"
                      :class="{
                        'text-red-400': daysRemaining <= 7 && daysRemaining > 0,
                        'text-orange-400': daysRemaining > 7 && daysRemaining <= 14,
                        'text-lime-400': daysRemaining > 14,
                        'text-red-500': daysRemaining <= 0
                      }"
                    >
                      {{ daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day!' : `D+${Math.abs(daysRemaining)}` }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 책이 없을 때 Empty State -->
            <div v-else class="flex flex-col items-center justify-center p-6 bg-zinc-100 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 mb-4">
              <div class="text-4xl mb-3">📚</div>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-4">아직 읽고 있는 책이 없어요</p>
              <button
                @click="openSearchModal"
                class="px-4 py-2 bg-lime-400 text-black text-xs font-bold rounded-lg hover:bg-lime-300 transition-colors flex items-center gap-1"
              >
                <Plus :size="14" />
                책 시작하기
              </button>
            </div>

            <!-- Chapter Navigation (책이 있을 때만 표시) -->
            <div v-if="currentBook && toc.length > 0" class="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              <button
                v-for="(chapter, index) in toc"
                :key="index"
                @click="jumpToChapter(chapter.start)"
                class="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors flex justify-between items-center group"
                :class="{ 'text-lime-400 bg-zinc-100 dark:bg-zinc-800/50': isCurrentChapter(chapter) }"
              >
                <span class="truncate">{{ chapter.title }}</span>
                <span class="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{{ chapter.start }}%</span>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <button
              @click="groupStatsModalOpen = true"
              class="w-full flex items-center justify-between mb-3 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
            >
              <h3 class="text-xs font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">History</h3>
              <BarChart3 :size="14" class="text-zinc-500 dark:text-zinc-600 group-hover:text-lime-400 transition-colors" />
            </button>
            <div class="space-y-3">
              <div v-for="book in historyBooks" :key="book.id" class="flex gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group relative">
                <div class="w-8 h-12 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0"></div>
                <div>
                  <div class="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    {{ book.title }}
                    <span v-if="book.round" class="text-lime-400 ml-1 text-xs">[{{ book.round }}회]</span>
                  </div>
                  <div class="text-[10px] text-zinc-600 dark:text-zinc-500">{{ book.date }}</div>
                </div>
                <!-- Edit Review Button (Visible on Hover) -->
                <button
                  @click.stop="openReviewModalForEdit(book)"
                  class="absolute right-2 top-2 p-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="리뷰 수정"
                >
                  <Edit2 :size="12" />
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <button
              @click="openSearchModal"
              class="w-full py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-xl font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus :size="16" />
              새 책 시작하기
            </button>
            <button
              @click="copyInviteLink"
              class="w-full py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl font-medium hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Share2 :size="16" />
              초대 링크 공유
            </button>
          </div>
        </div>

        <!-- Settings View -->
        <div v-else class="flex flex-col h-full">
          <div class="flex items-center gap-2 mb-6">
            <button @click="showSettings = false" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <ChevronLeft :size="24" />
            </button>
            <h2 class="text-lg font-bold text-zinc-900 dark:text-white">그룹 설정</h2>
          </div>

          <div class="space-y-6 flex-1">
            <div>
              <label class="block text-xs font-bold text-zinc-600 dark:text-zinc-500 mb-2 uppercase">그룹 이름</label>
              <input
                v-model="editingGroupName"
                type="text"
                class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400 mb-3"
              />
              <button
                @click="saveGroupName"
                class="w-full bg-lime-400 text-black py-2.5 rounded-xl font-bold hover:bg-lime-300 transition-colors text-sm"
              >
                그룹 이름 저장
              </button>
            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-600 dark:text-zinc-500 mb-2 uppercase">멤버 관리</label>
              <div class="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-2 space-y-1">
                <div v-for="member in members" :key="member.id" class="relative flex justify-between items-center p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg group">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
                    </div>
                    <span class="text-sm text-zinc-800 dark:text-zinc-200">{{ member.nickname }}</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <span v-if="member.role === 'admin'" class="text-[10px] text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded">ADMIN</span>

                    <!-- Admin Menu Trigger (Only for admins, not for self) -->
                    <button
                      v-if="isAdmin && member.id !== currentUserId"
                      @click.stop="toggleMemberMenu(member.id)"
                      class="text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1"
                    >
                      <MoreVertical :size="16" />
                    </button>

                    <!-- Admin Menu Dropdown -->
                    <div
                      v-if="activeMemberMenu === member.id"
                      class="absolute right-0 top-8 w-32 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-xl z-10 overflow-hidden"
                    >
                      <button
                        @click="promoteMember(member.id)"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white text-left"
                      >
                        <UserCheck :size="14" />
                        관리자 위임
                      </button>
                      <button
                        @click="kickMember(member.id)"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 text-left"
                      >
                        <UserX :size="14" />
                        강제 퇴장
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-auto pt-6 border-t border-zinc-300 dark:border-zinc-800 space-y-3">
            <!-- 그룹 삭제 (관리자만) -->
            <button
              v-if="isAdmin"
              @click="deleteGroup"
              class="w-full py-3 text-red-500 bg-red-500/10 rounded-xl font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20"
            >
              <X :size="16" />
              그룹 영구 삭제
            </button>

            <!-- 그룹 나가기 -->
            <button
              @click="leaveGroup"
              class="w-full py-3 text-red-400 bg-red-400/10 rounded-xl font-medium hover:bg-red-400/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut :size="16" />
              그룹 나가기
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Book Search Modal -->
    <BookSearchModal 
      :isOpen="searchModalOpen" 
      @close="searchModalOpen = false"
      @confirm="handleBookAdd"
    />

    <!-- Review Modal -->
    <ReviewModal
      :isOpen="reviewModalOpen"
      :initialRating="reviewInitialData.rating"
      :initialContent="reviewInitialData.content"
      @close="reviewModalOpen = false"
      @submit="handleReviewSubmit"
    />

    <!-- Group Stats Modal -->
    <GroupStatsModal
      :isOpen="groupStatsModalOpen"
      :groupId="groupId"
      :groupName="groupName"
      @close="groupStatsModalOpen = false"
    />

    <!-- Edit Dates Modal -->
    <div v-if="editDatesModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="editDatesModalOpen = false"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">독서 기간 수정</h2>
          <button @click="editDatesModalOpen = false" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">시작일</label>
            <input
              v-model="editStartDate"
              type="date"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">종료일</label>
            <input
              v-model="editEndDate"
              type="date"
              :min="editStartDate"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div v-if="editStartDate && editEndDate" class="p-3 bg-lime-400/10 border border-lime-400/30 rounded-lg">
            <p class="text-sm text-lime-400 text-center">
              💡 {{ calculateEditDays() }}일 독서 계획
            </p>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="editDatesModalOpen = false"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="saveEditedDates"
            class="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl hover:bg-lime-300 transition-colors"
            :disabled="!editStartDate || !editEndDate"
          >
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- Mark Completed Modal -->
    <div v-if="markCompletedModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="markCompletedModalOpen = false"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">✅ 완독 처리</h2>
          <button @click="markCompletedModalOpen = false" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-zinc-700 dark:text-zinc-300">정말 이 책을 완독 처리하시겠습니까?</p>
          <div class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
            <p class="font-bold text-zinc-800 dark:text-zinc-200">{{ bookTitle }}</p>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ bookAuthor }}</p>
          </div>
          <p class="text-sm text-zinc-600 dark:text-zinc-500">완독 처리하면 히스토리로 이동하며, 새로운 책을 시작할 수 있습니다.</p>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="markCompletedModalOpen = false"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="markAsCompleted"
            class="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl hover:bg-lime-300 transition-colors"
          >
            완독 처리
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Book Modal -->
    <div v-if="deleteBookModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="deleteBookModalOpen = false"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-red-400">⚠️ 책 삭제 확인</h2>
          <button @click="deleteBookModalOpen = false" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-zinc-700 dark:text-zinc-300">정말 이 책을 삭제하시겠습니까?</p>
          <div class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
            <p class="font-bold text-zinc-800 dark:text-zinc-200">{{ bookTitle }}</p>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ bookAuthor }}</p>
          </div>
          <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p class="text-sm text-red-400 font-medium mb-2">다음 데이터가 함께 삭제됩니다:</p>
            <ul class="text-sm text-red-400 space-y-1">
              <li>• 모든 멤버의 독서 진행도</li>
              <li>• 이 책의 모든 댓글 ({{ commentCount }}개)</li>
              <li>• 이 책의 모든 반응</li>
            </ul>
          </div>
          <p class="text-sm text-zinc-600 dark:text-zinc-500 font-bold">⚠️ 이 작업은 되돌릴 수 없습니다</p>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="deleteBookModalOpen = false"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="deleteBook"
            class="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>

    <!-- Edit TOC Modal -->
    <div v-if="editTocModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="editTocModalOpen = false"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">📑 목차 수정</h2>
          <button @click="editTocModalOpen = false" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-4">
            <p class="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{{ bookTitle }}</p>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">{{ bookAuthor }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">전체 페이지 수</label>
            <input
              v-model.number="editTotalPages"
              type="number"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">챕터 설정</label>
            <div class="space-y-2">
              <div v-for="(chapter, idx) in editChapters" :key="idx" class="flex gap-2">
                <input
                  v-model="chapter.title"
                  type="text"
                  placeholder="챕터명"
                  class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <input
                  v-model.number="chapter.startPage"
                  type="number"
                  placeholder="시작 쪽"
                  class="w-20 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <button
                  @click="removeEditChapter(idx)"
                  class="text-zinc-600 dark:text-zinc-500 hover:text-red-400 px-2"
                  :disabled="editChapters.length === 1"
                >
                  <X :size="18" />
                </button>
              </div>
              <button
                @click="addEditChapter"
                class="text-sm text-lime-400 font-medium hover:underline"
              >
                + 챕터 추가
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="editTocModalOpen = false"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="saveEditedToc"
            class="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl hover:bg-lime-300 transition-colors"
            :disabled="!editTotalPages || editTotalPages <= 0"
          >
            저장
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import Timeline from '~/components/Timeline.vue'
import SmartSlider from '~/components/SmartSlider.vue'
import BookSearchModal from '~/components/BookSearchModal.vue'
import ReviewModal from '~/components/ReviewModal.vue'
import { Menu, Search, Plus, Settings, Share2, ChevronLeft, ChevronDown, LogOut, MoreVertical, UserCheck, UserX, Edit2, Send, X, BarChart3 } from 'lucide-vue-next'
import GroupStatsModal from '~/components/GroupStatsModal.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()
const { getBookRound } = useBookRound()

const drawerOpen = ref(false)
const showSettings = ref(false)
const searchModalOpen = ref(false)
const reviewModalOpen = ref(false)
const commentModalOpen = ref(false)
const groupStatsModalOpen = ref(false)
const reviewInitialData = ref({ rating: 0, content: '' }) // For editing
const showCommentInput = ref(false)
const newCommentContent = ref('')
const newAnchorText = ref('')
const anchorTextLocked = ref(false)

// Admin book management
const bookMenuOpen = ref(false)
const editDatesModalOpen = ref(false)
const editTocModalOpen = ref(false)
const markCompletedModalOpen = ref(false)
const deleteBookModalOpen = ref(false)
const editStartDate = ref('')
const editEndDate = ref('')
const editTotalPages = ref<number | null>(null)
const editChapters = ref<{ title: string; startPage: number }[]>([{ title: 'Chapter 1', startPage: 1 }])

const readProgress = ref(0)
const viewProgress = ref(0)
const activeMemberMenu = ref<string | null>(null)
const showMemberProgress = ref(false)

// Data Refs
const group = ref<any>(null)
const currentBook = ref<any>(null)
const currentBookRound = ref<number | null>(null)
const members = ref<any[]>([])
const comments = ref<any[]>([])
const historyBooks = ref<any[]>([])
const memberProgress = ref<any[]>([])

const groupId = route.params.id as string

// Computed
const groupName = computed(() => group.value?.name || 'Loading...')
const bookTitle = computed(() => currentBook.value?.book?.title || 'No Book Selected')
const bookRoundLabel = computed(() => {
  if (currentBookRound.value === null) return ''
  return `[${currentBookRound.value}회]`
})
const bookAuthor = computed(() => currentBook.value?.book?.author || '')
const bookCover = computed(() => currentBook.value?.book?.cover_url || '')
const toc = computed(() => currentBook.value?.toc_snapshot || []) // Use snapshot or default
const currentChapterName = computed(() => {
  const pct = viewProgress.value
  const chapters = toc.value

  if (!chapters || chapters.length === 0) return 'Reading'

  const found = chapters.find((c: any, index: number) => {
    const isLast = index === chapters.length - 1
    if (isLast) {
      return pct >= c.start && pct <= c.end
    } else {
      return pct >= c.start && pct < c.end
    }
  })

  if (!found && pct < chapters[0]?.start) {
    return chapters[0]?.title || 'Start'
  }

  return found ? found.title : 'End'
})

// Reading period computed properties
const targetStartDate = computed(() => currentBook.value?.target_start_date)
const targetEndDate = computed(() => currentBook.value?.target_end_date)
const totalReadingDays = computed(() => {
  if (!targetStartDate.value || !targetEndDate.value) return null
  const start = new Date(targetStartDate.value)
  const end = new Date(targetEndDate.value)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})
const daysSinceStart = computed(() => {
  if (!targetStartDate.value) return null
  const start = new Date(targetStartDate.value)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})
const daysRemaining = computed(() => {
  if (!targetEndDate.value) return null
  const end = new Date(targetEndDate.value)
  const today = new Date()
  const diffTime = end.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})
const progressStatus = computed(() => {
  if (!totalReadingDays.value || !daysSinceStart.value) return 'unknown'
  const expectedProgress = (daysSinceStart.value / totalReadingDays.value) * 100
  const actualProgress = readProgress.value
  if (actualProgress >= expectedProgress + 10) return 'ahead'
  if (actualProgress < expectedProgress - 10) return 'behind'
  return 'on-track'
})
const formattedDateRange = computed(() => {
  if (!targetStartDate.value || !targetEndDate.value) return null
  const start = new Date(targetStartDate.value)
  const end = new Date(targetEndDate.value)
  const formatDate = (date: Date) => {
    const year = date.getFullYear() % 100
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}.${month}.${day}`
  }
  return `${formatDate(start)} - ${formatDate(end)}`
})

const currentUserId = computed(() => userStore.profile?.id)
const isAdmin = computed(() => {
  const userId = currentUserId.value
  if (!userId) return false
  const member = members.value.find(m => m.id === userId)
  console.log('[Group] isAdmin check:', { userId, member, role: member?.role })
  return member?.role === 'admin'
})
const commentCount = computed(() => comments.value.length)
const editingGroupName = ref('')

// Sorted members with progress
const sortedMembersWithProgress = computed(() => {
  return members.value.map(member => {
    const progressData = memberProgress.value.find(p => p.user_id === member.id)
    return {
      ...member,
      progress: progressData?.progress_pct || 0
    }
  }).sort((a, b) => b.progress - a.progress) // Sort by progress descending
})

// Fetch Data
const fetchData = async () => {
  if (!userStore.user) return

  // 1. Fetch Group Info
  const { data: groupData } = await client.from('groups').select('*').eq('id', groupId).single()
  if (groupData) {
    group.value = groupData
    editingGroupName.value = groupData.name
  }

  // 2. Fetch Members
  const { data: memberData } = await client
    .from('group_members')
    .select('*, user:users(*)')
    .eq('group_id', groupId)
  
  if (memberData) {
    members.value = memberData.map((m: any) => ({
      id: m.user.id,
      nickname: m.user.nickname,
      avatar_url: m.user.avatar_url,
      role: m.role
    }))
  }

  // 3. Fetch Current Book
  const { data: bookData, error: bookError } = await client
    .from('group_books')
    .select('*, book:books(*)')
    .eq('group_id', groupId)
    .eq('status', 'reading')
    .maybeSingle()

  if (bookError) {
    console.error('Fetch current book error:', bookError)
    currentBook.value = null
  } else if (bookData) {
    currentBook.value = bookData
    // Fetch Comments for this book
    await fetchComments(bookData.id)

    // Note: Member progress는 섹션 열렸을 때 fetch (조건부 로딩)

    // 3-1. Load user's reading progress
    const userId = currentUserId.value
    if (userId) {
      const { data: progressData, error: progressError } = await client
        .from('user_reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('group_book_id', bookData.id)
        .maybeSingle()

      if (progressError) {
        console.error('Progress load error:', progressError)
      }

      if (progressData) {
        console.log('Progress loaded:', progressData)
        readProgress.value = progressData.progress_pct
        viewProgress.value = progressData.progress_pct
      } else {
        console.log('No progress data found for user')
      }
    }
  } else {
    // No reading book found
    currentBook.value = null
    comments.value = []
    memberProgress.value = []
    readProgress.value = 0
    viewProgress.value = 0
  }

  // 4. Fetch History
  const { data: historyData } = await client
    .from('group_books')
    .select('*, book:books(*)')
    .eq('group_id', groupId)
    .eq('status', 'done')
    .order('finished_at', { ascending: false })

  if (historyData) {
    // Calculate round numbers for history books
    const historyBooksWithRounds = await Promise.all(
      historyData.map(async (gb: any) => {
        const round = await getBookRound(groupId, gb.isbn, gb.id)
        return {
          id: gb.id,
          isbn: gb.isbn,
          title: gb.book.title,
          date: new Date(gb.finished_at || gb.created_at).toLocaleDateString(),
          round
        }
      })
    )
    historyBooks.value = historyBooksWithRounds
  }
}

const fetchComments = async (groupBookId: string) => {
  const { data } = await client
    .from('comments')
    .select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)')
    .eq('group_book_id', groupBookId)
    .order('position_pct', { ascending: true })
    .order('created_at', { ascending: true })

  if (data) {
    // Fetch reactions for all comments
    const commentIds = data.map(c => c.id)

    // Get reaction counts for all comments
    const { data: reactionCounts } = await client
      .from('reactions')
      .select('comment_id')
      .in('comment_id', commentIds)
      .eq('type', 'like')

    // Get user's likes
    const userId = currentUserId.value
    const { data: userLikes } = userId ? await client
      .from('reactions')
      .select('comment_id')
      .in('comment_id', commentIds)
      .eq('user_id', userId)
      .eq('type', 'like') : { data: [] }

    // Count likes per comment
    const likeCounts: Record<string, number> = {}
    reactionCounts?.forEach(r => {
      likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1
    })

    // Check which comments user liked
    const userLikedSet = new Set(userLikes?.map(r => r.comment_id) || [])

    // Add likes and isLiked to comments
    comments.value = data.map(comment => ({
      ...comment,
      likes: likeCounts[comment.id] || 0,
      isLiked: userLikedSet.has(comment.id)
    }))
  }
}

// Realtime Subscription
let realtimeChannel: any = null
let progressChannel: any = null

onMounted(async () => {
  await userStore.fetchProfile()
  await fetchData()

  // Subscribe to new comments
  realtimeChannel = client.channel('public:comments')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      async (payload) => {
        console.log('New comment received!', payload)
        if (currentBook.value && payload.new.group_book_id === currentBook.value.id) {
          // Check if comment already exists (prevent duplicates)
          const exists = comments.value.find(c => c.id === payload.new.id)
          if (exists) {
            console.log('Comment already exists, skipping')
            return
          }

          // Fetch user info for the new comment
          const { data: user } = await client
            .from('users')
            .select('*')
            .eq('id', payload.new.user_id)
            .single()

          if (user) {
            // Add new comment to the list
            const newComment = {
              ...payload.new,
              user: user
            }

            comments.value.push(newComment)

            // Sort by position_pct and created_at
            comments.value.sort((a, b) => {
              if (a.position_pct !== b.position_pct) {
                return a.position_pct - b.position_pct
              }
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            })
          }
        }
      }
    )
    .subscribe()

  // Note: Member progress subscription은 섹션 열렸을 때만 시작 (조건부 구독)
})

// 조건부 구독: 멤버 진행도 섹션 열렸을 때만 Realtime 구독
watch(showMemberProgress, async (isOpen) => {
  if (isOpen && currentBook.value && !progressChannel) {
    console.log('[Progress Realtime] 🔔 구독 시작')

    // 섹션 열림 → 최신 데이터 fetch
    const { data: progressData } = await client
      .from('user_reading_progress')
      .select('*')
      .eq('group_book_id', currentBook.value.id)

    if (progressData) {
      memberProgress.value = progressData
      console.log('[Progress Realtime] 최신 데이터 로드:', progressData.length, '명')
    }

    // Realtime 구독 시작
    progressChannel = client.channel('public:user_reading_progress')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
          schema: 'public',
          table: 'user_reading_progress',
          filter: `group_book_id=eq.${currentBook.value.id}`
        },
        async (payload) => {
          console.log('[Progress Realtime] 업데이트 받음:', payload)

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedProgress = payload.new

            // Update memberProgress array
            const index = memberProgress.value.findIndex(p => p.user_id === updatedProgress.user_id)
            if (index >= 0) {
              // Update existing (본인 것은 이미 optimistic으로 업데이트됨)
              if (updatedProgress.user_id !== currentUserId.value) {
                memberProgress.value[index] = updatedProgress
              }
            } else {
              // Add new
              memberProgress.value.push(updatedProgress)
            }
          }
        }
      )
      .subscribe()

  } else if (!isOpen && progressChannel) {
    console.log('[Progress Realtime] 🔇 구독 해제')

    // 섹션 닫힘 → 구독 해제
    client.removeChannel(progressChannel)
    progressChannel = null
  }
})

onUnmounted(() => {
  if (realtimeChannel) client.removeChannel(realtimeChannel)
  if (progressChannel) client.removeChannel(progressChannel)
})

// Actions
let progressSaveTimeout: NodeJS.Timeout | null = null
const handleSliderChange = async (val: number) => {
  viewProgress.value = val
  if (val > readProgress.value) {
    readProgress.value = val
    if (val >= 100) {
      // Check for existing review before opening modal
      setTimeout(async () => {
        if (!currentBook.value || !currentUserId.value) return

        // Check for existing review for this group_book
        const { data: existingReview } = await client
          .from('reviews')
          .select('*')
          .eq('user_id', currentUserId.value)
          .eq('group_book_id', currentBook.value.id)
          .maybeSingle()

        reviewInitialData.value = existingReview
          ? { rating: existingReview.rating, content: existingReview.content || '' }
          : { rating: 0, content: '' }

        reviewModalOpen.value = true
      }, 500)
    }
  }

  // Optimistic Update: 즉시 memberProgress 업데이트
  if (currentBook.value && currentUserId.value) {
    const roundedProgress = Math.round(val)
    const index = memberProgress.value.findIndex(p => p.user_id === currentUserId.value)

    if (index >= 0) {
      // 기존 진행도 업데이트
      memberProgress.value[index].progress_pct = roundedProgress
      memberProgress.value[index].last_read_at = new Date().toISOString()
    } else {
      // 새 진행도 추가 (첫 진행도 기록)
      memberProgress.value.push({
        user_id: currentUserId.value,
        group_book_id: currentBook.value.id,
        progress_pct: roundedProgress,
        last_read_at: new Date().toISOString(),
        finished_at: null
      })
    }
  }

  // Save progress to DB (debounced)
  if (progressSaveTimeout) clearTimeout(progressSaveTimeout)
  progressSaveTimeout = setTimeout(async () => {
    await saveProgress(val)
  }, 2000) // Save after 2 seconds (DB 부담 절감)
}

const saveProgress = async (progress: number) => {
  if (!currentBook.value || !currentUserId.value) {
    console.log('Cannot save progress:', { hasBook: !!currentBook.value, hasUser: !!currentUserId.value })
    return
  }

  const roundedProgress = Math.round(progress)
  const finishedAt = roundedProgress >= 100 ? new Date().toISOString() : null

  // 현재 값 백업 (Rollback용)
  const index = memberProgress.value.findIndex(p => p.user_id === currentUserId.value)
  const previousProgress = index >= 0 ? memberProgress.value[index].progress_pct : 0

  try {
    console.log('[Progress] Saving to DB:', {
      user_id: currentUserId.value,
      group_book_id: currentBook.value.id,
      progress_pct: roundedProgress
    })

    const { data, error } = await client
      .from('user_reading_progress')
      .upsert({
        user_id: currentUserId.value,
        group_book_id: currentBook.value.id,
        progress_pct: roundedProgress,
        last_read_at: new Date().toISOString(),
        finished_at: finishedAt
      }, {
        onConflict: 'user_id,group_book_id'
      })
      .select()

    if (error) {
      console.error('[Progress] Save failed:', error)

      // Rollback: 실패하면 이전 값으로 복구
      if (index >= 0) {
        memberProgress.value[index].progress_pct = previousProgress
        console.log('[Progress] Rolled back to:', previousProgress)
      }

      // 사용자에게 알림 (조용히)
      console.warn('⚠️ 진행도 저장 실패. 다음 업데이트에서 재시도됩니다.')
    } else {
      console.log('[Progress] Saved successfully:', data)
      // Optimistic update가 이미 되어있으므로 추가 업데이트 불필요
    }
  } catch (error) {
    console.error('[Progress] Save error:', error)

    // Rollback on exception
    if (index >= 0) {
      memberProgress.value[index].progress_pct = previousProgress
      console.log('[Progress] Rolled back to:', previousProgress)
    }
  }
}

// Fetch book round number when current book changes
watch(currentBook, async (newBook) => {
  if (newBook && newBook.id && newBook.isbn) {
    currentBookRound.value = await getBookRound(groupId, newBook.isbn, newBook.id)
  } else {
    currentBookRound.value = null
  }
}, { immediate: true })

// Real-time scroll as slider moves
let scrollTimeout: NodeJS.Timeout | null = null
watch(viewProgress, (newVal) => {
  // Throttle scroll updates for performance
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    scrollToPosition(Math.round(newVal))
  }, 100) // 100ms throttle for smoother experience
})

const scrollToPosition = (targetPct: number) => {
  // Find the closest comment group by position
  const groups = document.querySelectorAll('[data-position]')
  if (groups.length === 0) return

  let closestGroup: Element | null = null
  let closestDistance = Infinity

  groups.forEach(group => {
    const position = parseInt(group.getAttribute('data-position') || '0')
    const distance = Math.abs(position - targetPct)
    if (distance < closestDistance) {
      closestDistance = distance
      closestGroup = group
    }
  })

  if (closestGroup) {
    // Center the group in viewport for better visual alignment
    closestGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }
}

const handleWrite = () => {
  showCommentInput.value = true
  anchorTextLocked.value = false
}

const handleWriteFromModal = (data: { anchorText: string, position: number }) => {
  // Pre-fill anchor text and position from modal
  newAnchorText.value = data.anchorText
  viewProgress.value = data.position
  anchorTextLocked.value = true
  showCommentInput.value = true
}

const closeCommentInput = () => {
  showCommentInput.value = false
  anchorTextLocked.value = false
  newCommentContent.value = ''
  newAnchorText.value = ''
}

const { validateComment } = useValidation()

const submitComment = async () => {
  if (!newCommentContent.value.trim() || !currentBook.value || !currentUserId.value) return

  // Validate comment content
  const validation = validateComment(newCommentContent.value)
  if (!validation.valid) {
    alert(validation.message)
    return
  }

  const { data, error } = await client.from('comments').insert({
    group_book_id: currentBook.value.id,
    user_id: currentUserId.value,
    content: newCommentContent.value.trim(),
    position_pct: Math.round(viewProgress.value),
    anchor_text: newAnchorText.value.trim() || null
  }).select('id, user_id, content, anchor_text, position_pct, created_at, parent_id, group_book_id, user:users(*)').single()

  if (error) {
    alert('댓글 작성 실패: ' + error.message)
  } else if (data) {
    // Immediately add comment to UI (don't wait for realtime)
    comments.value.push(data)

    // Sort by position_pct and created_at
    comments.value.sort((a, b) => {
      if (a.position_pct !== b.position_pct) {
        return a.position_pct - b.position_pct
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    closeCommentInput()
  }
}

const handleReviewSubmit = async (data: any) => {
  if (!currentBook.value || !userStore.user) return

  try {
    if (!currentUserId.value) return

    // Upsert review (insert or update)
    const { error } = await client
      .from('reviews')
      .upsert({
        user_id: currentUserId.value,
        group_book_id: currentBook.value.id,
        rating: data.rating,
        content: data.content
      }, {
        onConflict: 'user_id,group_book_id'
      })

    if (error) {
      console.error('Review save error:', error)
      throw error
    }

    reviewModalOpen.value = false
    alert('리뷰가 저장되었습니다! 🎉')

  } catch (error: any) {
    console.error('Review error:', error)
    alert('리뷰 저장 실패: ' + (error.message || '알 수 없는 오류'))
  }
}

// ... (Keep existing helper functions: jumpToChapter, isCurrentChapter, openReviewModalForEdit, etc.) ...
// We need to keep the existing functions but ensure they use the new data refs if needed.
// Since we replaced the whole script block, I need to include them back.

const openSearchModal = () => {
  drawerOpen.value = false
  searchModalOpen.value = true
}

// Admin book management handlers
const openEditDatesModal = () => {
  bookMenuOpen.value = false
  // Pre-fill with current dates
  editStartDate.value = currentBook.value?.target_start_date || ''
  editEndDate.value = currentBook.value?.target_end_date || ''
  editDatesModalOpen.value = true
}

const openEditTocModal = () => {
  bookMenuOpen.value = false

  // Pre-fill with current TOC data
  const currentToc = currentBook.value?.toc_snapshot || []
  const totalPagesFromBook = currentBook.value?.book?.total_pages || null

  // Convert TOC from percentage back to pages
  if (currentToc.length > 0 && totalPagesFromBook) {
    editTotalPages.value = totalPagesFromBook
    editChapters.value = currentToc.map((chapter: any) => ({
      title: chapter.title,
      startPage: Math.round((chapter.start / 100) * totalPagesFromBook)
    }))
  } else {
    editTotalPages.value = totalPagesFromBook
    editChapters.value = [{ title: 'Chapter 1', startPage: 1 }]
  }

  editTocModalOpen.value = true
}

const openMarkCompletedModal = () => {
  bookMenuOpen.value = false
  markCompletedModalOpen.value = true
}

const openDeleteBookModal = () => {
  bookMenuOpen.value = false
  deleteBookModalOpen.value = true
}

const calculateEditDays = () => {
  if (!editStartDate.value || !editEndDate.value) return 0
  const start = new Date(editStartDate.value)
  const end = new Date(editEndDate.value)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const saveEditedDates = async () => {
  if (!currentBook.value || !editStartDate.value || !editEndDate.value) return

  try {
    const { error } = await client
      .from('group_books')
      .update({
        target_start_date: editStartDate.value,
        target_end_date: editEndDate.value
      })
      .eq('id', currentBook.value.id)

    if (error) throw error

    // Update local data
    currentBook.value.target_start_date = editStartDate.value
    currentBook.value.target_end_date = editEndDate.value

    editDatesModalOpen.value = false
    alert('독서 기간이 수정되었습니다! 📅')
  } catch (error) {
    console.error('Edit dates error:', error)
    alert('독서 기간 수정에 실패했습니다.')
  }
}

const markAsCompleted = async () => {
  if (!currentBook.value) return

  try {
    const { error } = await client
      .from('group_books')
      .update({
        status: 'done',
        finished_at: new Date().toISOString()
      })
      .eq('id', currentBook.value.id)

    if (error) throw error

    markCompletedModalOpen.value = false
    alert('완독 처리되었습니다! 🎉\n히스토리로 이동합니다.')

    // Refresh data to update UI
    await fetchData()
  } catch (error) {
    console.error('Mark completed error:', error)
    alert('완독 처리에 실패했습니다.')
  }
}

const deleteBook = async () => {
  if (!currentBook.value) return

  try {
    const { error } = await client
      .from('group_books')
      .delete()
      .eq('id', currentBook.value.id)

    if (error) throw error

    deleteBookModalOpen.value = false
    alert('책이 삭제되었습니다.')

    // Refresh data to update UI
    await fetchData()
  } catch (error) {
    console.error('Delete book error:', error)
    alert('책 삭제에 실패했습니다.')
  }
}

const addEditChapter = () => {
  editChapters.value.push({ title: '', startPage: 0 })
}

const removeEditChapter = (idx: number) => {
  if (editChapters.value.length > 1) {
    editChapters.value.splice(idx, 1)
  }
}

const saveEditedToc = async () => {
  if (!currentBook.value || !editTotalPages.value || editTotalPages.value <= 0) return

  try {
    // Convert pages to percentage for TOC
    const toc = editChapters.value.map((c, i) => {
      const nextStart = editChapters.value[i + 1]?.startPage || editTotalPages.value!
      const startPct = (c.startPage / editTotalPages.value!) * 100
      const endPct = (nextStart / editTotalPages.value!) * 100
      return {
        title: c.title,
        start: startPct,
        end: endPct
      }
    })

    // Update group_books with new TOC
    const { error } = await client
      .from('group_books')
      .update({
        toc_snapshot: toc
      })
      .eq('id', currentBook.value.id)

    if (error) throw error

    // Update local data
    currentBook.value.toc_snapshot = toc

    editTocModalOpen.value = false
    alert('목차가 수정되었습니다! 📑')
  } catch (error) {
    console.error('Save TOC error:', error)
    alert('목차 수정에 실패했습니다.')
  }
}

const handleBookAdd = async (data: any) => {
  console.log('[Group] Adding book:', data)

  try {
    // 1. books 테이블에 책이 없으면 추가
    const { data: existingBook, error: bookCheckError } = await client
      .from('books')
      .select('*')
      .eq('isbn', data.book.isbn)
      .maybeSingle()

    if (bookCheckError) {
      console.error('Book check error:', bookCheckError)
    }

    if (!existingBook) {
      // 새 책 추가
      const { error: bookInsertError } = await client
        .from('books')
        .insert({
          isbn: data.book.isbn,
          title: data.book.title,
          author: data.book.author,
          publisher: data.book.publisher,
          cover_url: data.book.cover,
          total_pages: data.totalPages,
          official_toc: data.toc
        })

      if (bookInsertError) {
        console.error('Book insert error:', bookInsertError)
        throw new Error('책 정보 저장에 실패했습니다.')
      }
    }

    // 2. 현재 읽고 있는 책을 'done'으로 변경
    await client
      .from('group_books')
      .update({ status: 'done', finished_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('status', 'reading')

    // 3. group_books에 새 책 추가
    const { error: groupBookError } = await client
      .from('group_books')
      .insert({
        group_id: groupId,
        isbn: data.book.isbn,
        toc_snapshot: data.toc,
        status: 'reading',
        target_start_date: data.startDate,
        target_end_date: data.endDate
      })

    if (groupBookError) {
      console.error('Group book insert error:', groupBookError)
      throw new Error('그룹에 책 추가에 실패했습니다.')
    }

    console.log('[Group] Book added successfully')

    // 4. 데이터 새로고침
    await fetchData()

    alert('새 책이 추가되었습니다! 🎉')

  } catch (error: any) {
    console.error('[Group] Book add error:', error)
    alert(error.message || '책 추가 중 오류가 발생했습니다.')
  }
}

const saveGroupName = async () => {
  if (!editingGroupName.value.trim()) {
    alert('그룹 이름을 입력해주세요.')
    return
  }

  if (editingGroupName.value.trim().length < 2) {
    alert('그룹 이름은 2글자 이상이어야 합니다.')
    return
  }

  try {
    const { error } = await client
      .from('groups')
      .update({ name: editingGroupName.value.trim() })
      .eq('id', groupId)

    if (error) {
      console.error('Group name update error:', error)
      alert('그룹 이름 변경에 실패했습니다: ' + error.message)
      return
    }

    group.value.name = editingGroupName.value.trim()
    alert('그룹 이름이 변경되었습니다!')
    showSettings.value = false
  } catch (err) {
    console.error('Unexpected error:', err)
    alert('예상치 못한 오류가 발생했습니다.')
  }
}

const toggleMemberMenu = (memberId: string) => {
  activeMemberMenu.value = activeMemberMenu.value === memberId ? null : memberId
}

const promoteMember = async (memberId: string) => {
  if (!confirm('이 멤버를 관리자로 승격하시겠습니까?')) return

  const { error } = await client
    .from('group_members')
    .update({ role: 'admin' })
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) {
    alert('권한 변경에 실패했습니다.')
  } else {
    await fetchData()
    alert('관리자로 승격되었습니다.')
  }
  activeMemberMenu.value = null
}

const kickMember = async (memberId: string) => {
  if (!confirm('정말로 이 멤버를 강제 퇴장시키겠습니까?')) return

  const { error } = await client
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) {
    alert('멤버 강퇴에 실패했습니다.')
  } else {
    await fetchData()
    alert('멤버가 퇴장되었습니다.')
  }
  activeMemberMenu.value = null
}

const copyInviteLink = async () => {
  if (!group.value?.invite_code) {
    alert('초대 코드를 불러올 수 없습니다.')
    return
  }

  const inviteLink = `${window.location.origin}/join/${group.value.invite_code}`

  try {
    await navigator.clipboard.writeText(inviteLink)
    alert('초대 링크가 복사되었습니다!\n친구들에게 공유해보세요.')
  } catch (err) {
    console.error('Clipboard error:', err)
    // Fallback: show link in alert
    prompt('초대 링크를 복사하세요:', inviteLink)
  }
}

const jumpToChapter = (startPct: number) => {
  viewProgress.value = startPct
  drawerOpen.value = false
}

const isCurrentChapter = (chapter: any) => {
  return viewProgress.value >= chapter.start && viewProgress.value < chapter.end
}

const openReviewModalForEdit = async (book: any) => {
  if (!userStore.user) return

  if (!currentUserId.value) return

  // Fetch existing review for this group_book
  const { data: existingReview } = await client
    .from('reviews')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('group_book_id', book.id)
    .maybeSingle()

  reviewInitialData.value = existingReview
    ? { rating: existingReview.rating, content: existingReview.content || '' }
    : { rating: 0, content: '' }

  reviewModalOpen.value = true
  drawerOpen.value = false
}

const deleteGroup = async () => {
  if (!isAdmin.value) {
    alert('관리자만 그룹을 삭제할 수 있습니다.')
    return
  }

  // 멤버 수 확인
  const memberCount = members.value.length

  // 첫 번째 확인
  const confirmMsg = memberCount > 1
    ? `이 그룹에는 ${memberCount}명의 멤버가 있습니다.\n그룹을 삭제하면 모든 데이터(책, 댓글, 리뷰 등)가 영구적으로 삭제됩니다.\n\n정말로 삭제하시겠습니까?`
    : `그룹을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.\n\n정말로 삭제하시겠습니까?`

  if (!confirm(confirmMsg)) return

  // 두 번째 확인 (안전장치)
  const groupNameToConfirm = group.value?.name || ''
  const userInput = prompt(`정말로 삭제하려면 그룹 이름을 입력하세요:\n\n"${groupNameToConfirm}"`)

  if (userInput !== groupNameToConfirm) {
    alert('그룹 이름이 일치하지 않습니다. 삭제가 취소되었습니다.')
    return
  }

  try {
    console.log('[Group] Deleting group:', groupId)

    const { error } = await client
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Group delete error:', error)
      alert('그룹 삭제에 실패했습니다: ' + error.message)
      return
    }

    alert('그룹이 삭제되었습니다.')
    router.push('/')
  } catch (err) {
    console.error('Unexpected error:', err)
    alert('예상치 못한 오류가 발생했습니다.')
  }
}

const leaveGroup = async () => {
  if (!currentUserId.value) return

  // Check if user is the only admin
  const admins = members.value.filter(m => m.role === 'admin')
  if (admins.length === 1 && admins[0].id === currentUserId.value) {
    alert('그룹의 유일한 관리자입니다. 다른 멤버를 관리자로 지정한 후 나가주세요.')
    return
  }

  if (!confirm('정말로 이 그룹에서 나가시겠습니까?')) return

  try {
    const { error } = await client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', currentUserId.value)

    if (error) throw error

    alert('그룹에서 나갔습니다.')
    router.push('/')

  } catch (error) {
    console.error('Leave group error:', error)
    alert('그룹 나가기에 실패했습니다.')
  }
}
</script>

<style>
/* Global smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>

<style scoped>
@keyframes slide-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.animate-slide-right {
  animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
