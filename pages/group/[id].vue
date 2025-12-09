<template>
  <div class="relative min-h-[100dvh] bg-background">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
      <div class="max-w-[480px] mx-auto flex justify-between items-center px-4 h-14">
        <div class="flex items-center gap-2">
          <button @click="router.push('/')" class="text-zinc-400 hover:text-white" title="홈으로">
            <ChevronLeft :size="24" />
          </button>
          <button @click="drawerOpen = true" class="text-zinc-400 hover:text-white" title="메뉴">
            <Menu :size="24" />
          </button>
        </div>
        <div class="flex flex-col items-center">
          <h1 class="text-sm font-bold text-zinc-100">{{ groupName }}</h1>
          <span v-if="currentBook" class="text-[10px] text-zinc-400">{{ bookTitle }}</span>
        </div>
        <button class="text-zinc-400 hover:text-white opacity-0 pointer-events-none">
          <Search :size="24" />
        </button>
      </div>
    </header>

    <!-- Timeline Content -->
    <div class="pt-16 pb-32 min-h-screen">
      <!-- 책이 없을 때 Empty State -->
      <div v-if="!currentBook" class="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div class="text-6xl mb-4">📖</div>
        <h2 class="text-xl font-bold text-white mb-2">책을 선택해주세요</h2>
        <p class="text-sm text-zinc-400 text-center mb-6 max-w-xs">
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
      <Timeline v-else :comments="comments" :readProgress="readProgress" />
    </div>

    <!-- Smart Slider (Footer) - 책이 있을 때만 표시 -->
    <SmartSlider
      v-if="currentBook"
      v-model="viewProgress"
      :toc="toc"
      @change="handleSliderChange"
      @write="handleWrite"
    />

    <!-- Comment Input Overlay -->
    <div v-if="showCommentInput" class="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="showCommentInput = false"></div>
      <div class="relative w-full max-w-[480px] bg-zinc-900 p-4 rounded-t-2xl shadow-2xl pointer-events-auto animate-slide-up">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm font-bold text-zinc-200">
            {{ Math.round(viewProgress) }}% 위치에 댓글 남기기
          </span>
          <button @click="showCommentInput = false" class="text-zinc-500 hover:text-white">
            <X :size="20" />
          </button>
        </div>
        <div class="flex gap-2">
          <textarea 
            v-model="newCommentContent"
            placeholder="이 부분에 대한 생각을 남겨보세요..."
            class="flex-1 bg-zinc-800 text-white rounded-xl p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
          ></textarea>
        </div>
        <div class="mt-3 flex justify-end">
          <button 
            @click="submitComment"
            class="bg-lime-400 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-lime-300 flex items-center gap-2"
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
      <div class="relative w-[80%] max-w-[320px] h-full bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col shadow-2xl animate-slide-right">
        
        <!-- Main Drawer View -->
        <div v-if="!showSettings" class="flex flex-col h-full">
          <div class="mb-8 flex justify-between items-start">
            <div>
              <h2 class="text-xl font-bold text-white mb-1">{{ groupName }}</h2>
              <p class="text-xs text-zinc-500">멤버 {{ members.length }}명</p>
            </div>
            <button v-if="isAdmin" @click="showSettings = true" class="text-zinc-400 hover:text-white p-1">
              <Settings :size="20" />
            </button>
          </div>

          <div class="mb-8">
            <h3 class="text-xs font-bold text-lime-400 mb-3 uppercase tracking-wider">Now Reading</h3>

            <!-- 책이 있을 때 -->
            <div v-if="currentBook" class="flex gap-3 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700 mb-4">
              <img :src="bookCover" class="w-12 h-16 object-cover rounded bg-zinc-700" />
              <div>
                <div class="font-bold text-zinc-200 text-sm">{{ bookTitle }}</div>
                <div class="text-xs text-zinc-400">{{ bookAuthor }}</div>
              </div>
            </div>

            <!-- 책이 없을 때 Empty State -->
            <div v-else class="flex flex-col items-center justify-center p-6 bg-zinc-800/30 rounded-xl border border-dashed border-zinc-700 mb-4">
              <div class="text-4xl mb-3">📚</div>
              <p class="text-sm text-zinc-400 text-center mb-4">아직 읽고 있는 책이 없어요</p>
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
                class="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex justify-between items-center group"
                :class="{ 'text-lime-400 bg-zinc-800/50': isCurrentChapter(chapter) }"
              >
                <span class="truncate">{{ chapter.title }}</span>
                <span class="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{{ chapter.start }}%</span>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <h3 class="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">History</h3>
            <div class="space-y-3">
              <div v-for="book in historyBooks" :key="book.id" class="flex gap-3 p-2 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group relative">
                <div class="w-8 h-12 bg-zinc-700 rounded flex-shrink-0"></div>
                <div>
                  <div class="text-sm text-zinc-300 font-medium">{{ book.title }}</div>
                  <div class="text-[10px] text-zinc-500">{{ book.date }}</div>
                </div>
                <!-- Edit Review Button (Visible on Hover) -->
                <button 
                  @click.stop="openReviewModalForEdit(book)"
                  class="absolute right-2 top-2 p-1.5 bg-zinc-700 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
              class="w-full py-3 bg-zinc-800 text-zinc-200 rounded-xl font-bold hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus :size="16" />
              새 책 시작하기
            </button>
            <button 
              @click="copyInviteLink"
              class="w-full py-3 border border-zinc-700 text-zinc-400 rounded-xl font-medium hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Share2 :size="16" />
              초대 링크 공유
            </button>
          </div>
        </div>

        <!-- Settings View -->
        <div v-else class="flex flex-col h-full">
          <div class="flex items-center gap-2 mb-6">
            <button @click="showSettings = false" class="text-zinc-400 hover:text-white">
              <ChevronLeft :size="24" />
            </button>
            <h2 class="text-lg font-bold text-white">그룹 설정</h2>
          </div>

          <div class="space-y-6 flex-1">
            <div>
              <label class="block text-xs font-bold text-zinc-500 mb-2 uppercase">그룹 이름</label>
              <input
                v-model="editingGroupName"
                type="text"
                class="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400 mb-3"
              />
              <button
                @click="saveGroupName"
                class="w-full bg-lime-400 text-black py-2.5 rounded-xl font-bold hover:bg-lime-300 transition-colors text-sm"
              >
                그룹 이름 저장
              </button>
            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-500 mb-2 uppercase">멤버 관리</label>
              <div class="bg-zinc-800/50 rounded-xl p-2 space-y-1">
                <div v-for="member in members" :key="member.id" class="relative flex justify-between items-center p-2 hover:bg-zinc-800 rounded-lg group">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden">
                      <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
                    </div>
                    <span class="text-sm text-zinc-200">{{ member.nickname }}</span>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span v-if="member.role === 'admin'" class="text-[10px] text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded">ADMIN</span>
                    
                    <!-- Admin Menu Trigger (Only for admins, not for self) -->
                    <button 
                      v-if="isAdmin && member.id !== currentUserId"
                      @click.stop="toggleMemberMenu(member.id)"
                      class="text-zinc-500 hover:text-white p-1"
                    >
                      <MoreVertical :size="16" />
                    </button>

                    <!-- Admin Menu Dropdown -->
                    <div 
                      v-if="activeMemberMenu === member.id" 
                      class="absolute right-0 top-8 w-32 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-10 overflow-hidden"
                    >
                      <button 
                        @click="promoteMember(member.id)"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                      >
                        <UserCheck :size="14" />
                        관리자 위임
                      </button>
                      <button 
                        @click="kickMember(member.id)"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 text-left"
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

          <div class="mt-auto pt-6 border-t border-zinc-800 space-y-3">
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import Timeline from '~/components/Timeline.vue'
import SmartSlider from '~/components/SmartSlider.vue'
import BookSearchModal from '~/components/BookSearchModal.vue'
import ReviewModal from '~/components/ReviewModal.vue'
import { Menu, Search, Plus, Settings, Share2, ChevronLeft, LogOut, MoreVertical, UserCheck, UserX, Edit2, Send, X } from 'lucide-vue-next'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()

const drawerOpen = ref(false)
const showSettings = ref(false)
const searchModalOpen = ref(false)
const reviewModalOpen = ref(false)
const reviewInitialData = ref({ rating: 0, content: '' }) // For editing
const showCommentInput = ref(false)
const newCommentContent = ref('')

const readProgress = ref(0)
const viewProgress = ref(0)
const activeMemberMenu = ref<string | null>(null)

// Data Refs
const group = ref<any>(null)
const currentBook = ref<any>(null)
const members = ref<any[]>([])
const comments = ref<any[]>([])
const historyBooks = ref<any[]>([])

const groupId = route.params.id as string

// Computed
const groupName = computed(() => group.value?.name || 'Loading...')
const bookTitle = computed(() => currentBook.value?.book?.title || 'No Book Selected')
const bookAuthor = computed(() => currentBook.value?.book?.author || '')
const bookCover = computed(() => currentBook.value?.book?.cover_url || '')
const toc = computed(() => currentBook.value?.toc_snapshot || []) // Use snapshot or default
const currentUserId = computed(() => userStore.profile?.id)
const isAdmin = computed(() => {
  const userId = currentUserId.value
  if (!userId) return false
  const member = members.value.find(m => m.id === userId)
  console.log('[Group] isAdmin check:', { userId, member, role: member?.role })
  return member?.role === 'admin'
})
const editingGroupName = ref('')

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
  const { data: bookData } = await client
    .from('group_books')
    .select('*, book:books(*)')
    .eq('group_id', groupId)
    .eq('status', 'reading')
    .single()
  
  if (bookData) {
    currentBook.value = bookData
    // Fetch Comments for this book
    await fetchComments(bookData.id)
  }

  // 4. Fetch History
  const { data: historyData } = await client
    .from('group_books')
    .select('*, book:books(*)')
    .eq('group_id', groupId)
    .eq('status', 'done')
    .order('finished_at', { ascending: false })
  
  if (historyData) {
    historyBooks.value = historyData.map((gb: any) => ({
      id: gb.id,
      title: gb.book.title,
      date: new Date(gb.finished_at || gb.created_at).toLocaleDateString()
    }))
  }
}

const fetchComments = async (groupBookId: string) => {
  const { data } = await client
    .from('comments')
    .select('*, user:users(*)')
    .eq('group_book_id', groupBookId)
    .order('position_pct', { ascending: true })
    .order('created_at', { ascending: true })

  if (data) {
    comments.value = data
  }
}

// Realtime Subscription
let realtimeChannel: any = null

onMounted(async () => {
  await userStore.fetchProfile()
  await fetchData()

  // Subscribe to new comments
  realtimeChannel = client.channel('public:comments')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => {
        console.log('New comment received!', payload)
        if (currentBook.value && payload.new.group_book_id === currentBook.value.id) {
          // Fetch user info for the new comment (since payload only has raw data)
          // Or just re-fetch all comments for simplicity in MVP
          fetchComments(currentBook.value.id)
        }
      }
    )
    .subscribe()
})

onUnmounted(() => {
  if (realtimeChannel) client.removeChannel(realtimeChannel)
})

// Actions
const handleSliderChange = (val: number) => {
  viewProgress.value = val
  if (val > readProgress.value) {
    readProgress.value = val
    if (val >= 100) {
      setTimeout(() => { reviewModalOpen.value = true }, 500)
    }
  }
}

const handleWrite = () => {
  showCommentInput.value = true
}

const submitComment = async () => {
  if (!newCommentContent.value.trim() || !currentBook.value || !currentUserId.value) return

  const { error } = await client.from('comments').insert({
    group_book_id: currentBook.value.id,
    user_id: currentUserId.value,
    content: newCommentContent.value,
    position_pct: viewProgress.value, // Comment at current view position
    anchor_text: null // MVP: No text selection yet
  })

  if (error) {
    alert('댓글 작성 실패: ' + error.message)
  } else {
    newCommentContent.value = ''
    showCommentInput.value = false
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
        book_id: currentBook.value.isbn, // ISBN is the book_id
        rating: data.rating,
        content: data.content
      }, {
        onConflict: 'user_id,book_id'
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
        status: 'reading'
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

  // Fetch existing review
  const { data: existingReview } = await client
    .from('reviews')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('book_id', book.id)
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

<style scoped>
@keyframes slide-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.animate-slide-right {
  animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
