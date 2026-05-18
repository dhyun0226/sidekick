<template>
  <main class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-white">
    <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header class="mb-6 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-black text-zinc-400">RECOMMENDATIONS v2</p>
          <h1 class="mt-1 text-2xl font-black tracking-tight sm:text-4xl">다음 책 추천</h1>
          <p class="mt-2 text-sm font-semibold leading-6 text-zinc-500 dark:text-zinc-400">
            내 세션, 완독, 위시리스트와 전체 독서 반응을 섞어 추천 이유를 함께 보여줍니다.
          </p>
        </div>
        <button
          type="button"
          class="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-white text-zinc-700 shadow-apple ring-1 ring-black/[0.04] transition hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/[0.06]"
          @click="router.push('/v2')"
        >
          <ArrowLeft :size="20" />
        </button>
      </header>

      <section v-if="pending" class="grid min-h-[420px] place-items-center">
        <div class="text-center">
          <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p class="text-sm font-bold text-zinc-500">추천을 계산하는 중입니다.</p>
        </div>
      </section>

      <template v-else>
        <section class="mb-4 rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
          <div class="flex flex-wrap items-center gap-2">
            <p class="mr-2 text-xs font-black text-zinc-400">READING SIGNALS</p>
            <span
              v-for="genre in data?.preferredGenres || []"
              :key="genre"
              class="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {{ genre }}
            </span>
            <span v-if="(data?.preferredGenres || []).length === 0" class="text-sm font-semibold text-zinc-400">
              아직 추천에 쓸 개인 장르 신호가 부족합니다.
            </span>
          </div>
        </section>

        <RecommendationSection title="나에게 맞는 다음 책" eyebrow="FOR YOU" :items="data?.forYou || []" />
        <RecommendationSection title="위시리스트에서 다시 볼 책" eyebrow="WISHLIST" :items="data?.wishlist || []" />
        <RecommendationSection title="요즘 반응이 좋은 책" eyebrow="MOMENTUM" :items="data?.momentum || []" />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Recommendations v2' })

const router = useRouter()
const { data, pending } = await useFetch<any>('/api/pages/v2-recommendations')

const RecommendationSection = defineComponent({
  props: {
    eyebrow: { type: String, required: true },
    title: { type: String, required: true },
    items: { type: Array, required: true }
  },
  setup(props) {
    return () => h('section', { class: 'mb-4 rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6' }, [
      h('div', { class: 'mb-4 flex items-center justify-between gap-3' }, [
        h('div', null, [
          h('p', { class: 'text-xs font-black text-zinc-400' }, props.eyebrow),
          h('h2', { class: 'text-lg font-black' }, props.title)
        ]),
        h(Sparkles, { size: 21, class: 'text-sky-500' })
      ]),
      props.items.length
        ? h('div', { class: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4' }, props.items.map((item: any) =>
          h(resolveComponent('NuxtLink'), {
            key: item.isbn,
            to: `/discover?isbn=${item.isbn}`,
            class: 'group rounded-2xl bg-zinc-50 p-3 transition hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800'
          }, {
            default: () => [
              h('div', { class: 'mb-3 aspect-[3/4] overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800' }, [
                item.coverUrl
                  ? h('img', { src: item.coverUrl, class: 'h-full w-full object-cover', alt: '' })
                  : h('div', { class: 'grid h-full w-full place-items-center text-zinc-400' }, [h(Sparkles, { size: 24 })])
              ]),
              h('div', { class: 'flex items-start justify-between gap-2' }, [
                h('div', { class: 'min-w-0' }, [
                  h('p', { class: 'line-clamp-2 text-sm font-black leading-5' }, item.title),
                  h('p', { class: 'mt-1 truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400' }, item.author || item.publisher || item.genre || '')
                ]),
                h(ChevronRight, { size: 17, class: 'mt-0.5 flex-shrink-0 text-zinc-400 transition group-hover:translate-x-0.5' })
              ]),
              h('div', { class: 'mt-3 flex flex-wrap gap-1.5' }, [
                item.genre ? h('span', { class: 'rounded-full bg-white px-2 py-1 text-[11px] font-black text-zinc-500 ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/[0.06]' }, item.genre) : null,
                h('span', { class: 'rounded-full bg-sky-50 px-2 py-1 text-[11px] font-black text-sky-700 ring-1 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20' }, `match ${Math.round(item.score || 0)}`)
              ]),
              h('div', { class: 'mt-3 grid gap-1.5' }, item.reasons.slice(0, 2).map((reason: string) =>
                h('p', { class: 'rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-zinc-500 ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/[0.06]' }, reason)
              ))
            ]
          })
        ))
        : h('div', { class: 'rounded-2xl bg-zinc-50 p-5 text-sm font-semibold leading-6 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400' }, '아직 추천할 책이 충분하지 않습니다.')
    ])
  }
})
</script>
