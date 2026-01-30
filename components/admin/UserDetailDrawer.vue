<template>
  <Teleport to="body">
    <div v-if="show" class="relative z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <!-- Background backdrop -->
      <Transition
        enter-active-class="ease-in-out duration-500"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="ease-in-out duration-500"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="show" class="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" @click="close" />
      </Transition>

      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <!-- Slide-over panel -->
            <Transition
              enter-active-class="transform transition ease-in-out duration-500 sm:duration-700"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition ease-in-out duration-500 sm:duration-700"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div v-if="show" class="pointer-events-auto w-screen max-w-md">
                <div class="flex h-full flex-col overflow-y-scroll bg-white dark:bg-zinc-900 shadow-xl border-l border-zinc-200 dark:border-zinc-800">
                  <div class="px-4 py-6 sm:px-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div class="flex items-start justify-between">
                      <h2 class="text-base font-semibold leading-6 text-zinc-900 dark:text-white" id="slide-over-title">
                        사용자 상세 정보
                      </h2>
                      <div class="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          class="relative rounded-md text-zinc-400 hover:text-zinc-500 focus:outline-none"
                          @click="close"
                        >
                          <span class="absolute -inset-2.5" />
                          <span class="sr-only">Close panel</span>
                          <X :size="24" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-if="user" class="relative flex-1 py-6 px-4 sm:px-6">
                    <!-- Profile Header -->
                    <div class="flex flex-col items-center mb-8">
                      <div class="h-20 w-20 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg overflow-hidden">
                         <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover" />
                         <span v-else>{{ getUserInitial(user.username) }}</span>
                      </div>
                      <h2 class="text-xl font-bold text-zinc-900 dark:text-white">{{ user.username }}</h2>
                      <p class="text-sm text-zinc-500">{{ user.email }}</p>
                      
                      <div class="mt-4 flex items-center gap-2">
                         <span 
                           class="px-2.5 py-1 rounded-full text-xs font-bold"
                           :class="{
                             'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400': user.subscription_tier === 'free',
                             'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': user.subscription_tier === 'premium',
                             'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400': user.subscription_tier === 'admin'
                           }"
                         >
                           {{ getTierLabel(user.subscription_tier) }}
                         </span>
                         <span class="text-xs text-zinc-400">•</span>
                         <span class="text-xs text-zinc-500">가입일: {{ formatDate(user.created_at) }}</span>
                      </div>
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-2 mb-8">
                       <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-center">
                          <p class="text-xs text-zinc-500 mb-1">참여 그룹</p>
                          <p class="text-lg font-bold text-zinc-900 dark:text-white">{{ user.group_count || 0 }}</p>
                       </div>
                       <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-center">
                          <p class="text-xs text-zinc-500 mb-1">완독</p>
                          <p class="text-lg font-bold text-zinc-900 dark:text-white">{{ user.read_count || 0 }}</p>
                       </div>
                       <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-center">
                          <p class="text-xs text-zinc-500 mb-1">댓글</p>
                          <p class="text-lg font-bold text-zinc-900 dark:text-white">{{ user.comment_count || 0 }}</p>
                       </div>
                    </div>

                    <!-- Recent Payments -->
                    <div class="mb-8">
                      <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                        <CreditCard :size="16" /> 최근 결제
                      </h3>
                      <div v-if="loadingPayments" class="text-center py-4">
                        <div class="inline-block w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div v-else-if="payments.length === 0" class="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-lg text-center">
                        결제 내역이 없습니다.
                      </div>
                      <div v-else class="space-y-2">
                        <div 
                          v-for="payment in payments" 
                          :key="payment.id" 
                          class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm"
                        >
                          <div>
                            <p class="font-bold text-zinc-900 dark:text-white">₩{{ payment.amount.toLocaleString() }}</p>
                            <p class="text-xs text-zinc-500">{{ formatDateTime(payment.approved_at || payment.created_at) }}</p>
                          </div>
                          <span 
                            class="px-2 py-0.5 rounded text-[10px] font-bold"
                            :class="{
                              'bg-green-100 text-green-700': payment.status === 'done',
                              'bg-red-100 text-red-700': payment.status === 'failed',
                              'bg-yellow-100 text-yellow-700': payment.status === 'pending'
                            }"
                          >
                            {{ payment.status }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div>
                       <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-3">계정 관리</h3>
                       <div class="space-y-2">
                          <button 
                            @click="copyEmail"
                            class="w-full flex items-center gap-3 p-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                          >
                             <Copy :size="16" /> 이메일 복사
                          </button>
                          <!-- Future actions like Reset Password, Ban, etc. -->
                       </div>
                    </div>

                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, CreditCard, Copy } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  show: boolean
  user: any
}>()

const emit = defineEmits(['close'])

const payments = ref<any[]>([])
const loadingPayments = ref(false)
const client = useSupabaseClient()
const toast = useToastStore()

watch(() => props.show, (val) => {
  if (val && props.user) {
    fetchUserDetails(props.user.id)
  }
})

const close = () => {
  emit('close')
}

const fetchUserDetails = async (userId: string) => {
  loadingPayments.value = true
  try {
     const { data, error } = await client
       .from('payments')
       .select('*')
       .eq('user_id', userId)
       .order('created_at', { ascending: false })
       .limit(5)
       
     if (error) throw error
     payments.value = data || []
  } catch (e) {
     console.error('Fetch user details error', e)
  } finally {
     loadingPayments.value = false
  }
}

const copyEmail = () => {
   if (props.user?.email) {
      navigator.clipboard.writeText(props.user.email)
      toast.success('이메일이 복사되었습니다.')
   }
}

const getUserInitial = (name: string) => name?.charAt(0).toUpperCase() || '?'

const getTierLabel = (tier: string) => {
  const map: any = { free: '무료', premium: '프리미엄', admin: '관리자' }
  return map[tier] || tier
}

const formatDate = (str: string) => {
   if (!str) return '-'
   return new Date(str).toLocaleDateString('ko-KR')
}

const formatDateTime = (str: string) => {
   if (!str) return '-'
   return new Date(str).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})
}
</script>
