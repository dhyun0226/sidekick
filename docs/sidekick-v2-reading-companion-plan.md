# Sidekick v2 Reading Companion Plan

> Working draft for v2 product direction.
> v2 turns Sidekick from a reading log/group app into a reading companion that users keep open while they read.

## Product Direction

Sidekick v2 is a character-based reading room.

The core experience is:

1. Pick a book to read.
2. Enter a wallpaper-style reading room.
3. Read with a chosen companion character.
4. Start a timer.
5. Capture notes, quotes, pages, or progress whenever needed.
6. End the session and get a summary.
7. Feed that session into recaps, share cards, badges, and recommendations.

The product loop is:

```text
Read with character
  -> timer session
  -> quick note/progress input
  -> session summary
  -> share card / badge / recap
  -> next book recommendation
```

This keeps the current Sidekick strengths, including groups, reading progress, comments, reviews, and profile stats, but gives the app a stronger reason to be open during actual reading.

## Why This Fits Sidekick

Current Sidekick already has:

- Solo reading through My Library.
- Group reading through social groups.
- Progress, comments, reviews, and completion records.
- Profile stats and future recap plans.

v2 should not replace those systems. It should add a new layer above them:

- A reading session connects to an existing `group_book`.
- Notes created during a session become comments.
- Progress changes update `user_reading_progress`.
- Completed sessions power recaps and badges.
- Character reactions make the input loop feel lighter and more personal.

## v2 Feature Pillars

### 1. Reading Session

Reading Session is the foundation of v2.

Each session records:

- Which book the user read.
- Whether the session was solo or group.
- Start and end time.
- Duration.
- Starting and ending progress.
- Pages read.
- Notes and quote count.
- Optional mood/focus metadata.

Proposed table:

```sql
reading_sessions (
  id uuid primary key,
  user_id uuid not null,
  group_book_id uuid not null,
  group_id uuid,
  mode text not null, -- solo | group
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer default 0,
  start_progress numeric,
  end_progress numeric,
  pages_read integer default 0,
  memo_count integer default 0,
  quote_count integer default 0,
  focus_rating integer,
  mood text,
  created_at timestamptz default now()
)
```

Initial UI:

- Start/pause/end timer.
- Quick progress input.
- Quick note input.
- Quick quote input.
- End session summary.

### 2. Character Reading Room

The reading room is a full-screen or near-full-screen experience with:

- Wallpaper background.
- Current book info.
- Chosen companion character.
- Timer controls.
- Quick input controls.
- Recent notes from the session.

The character should be functional, not just decorative. It reacts to:

- Timer start.
- Timer pause.
- Long focus streak.
- Note creation.
- Progress update.
- Session completion.
- Badge unlock.

Core character states:

- `idle`: waiting with the user.
- `focus`: reading together while timer runs.
- `thinking`: note or quote input is open.
- `cheer`: progress milestone or session completed.
- `sleepy`: long inactivity or late-night reading.
- `celebrate`: badge, streak, or completion.

Implementation should start with lightweight CSS/Lottie/SVG animation states before moving to complex animation.

### 3. Share Cards

Share cards turn reading activity into visual artifacts.

First card types:

- Session card: time read, pages read, book, companion.
- Completion card: book cover, rating, review, completion date.
- Quote card: quote, user note, book title.
- Recap card: year/month stats.
- Group finish card: group name, book, members, completion rate.

Initial implementation can generate cards client-side. Later, shared cards can become public links.

Future table:

```sql
shared_cards (
  id uuid primary key,
  user_id uuid not null,
  card_type text not null,
  source_type text not null, -- session | book | quote | recap | group
  source_id uuid,
  image_url text,
  public_slug text unique,
  created_at timestamptz default now()
)
```

### 4. Badges

Badges should reward actual reading behavior, especially session behavior.

Initial badge categories:

- Reading time.
- Completion.
- Notes and quotes.
- Streak.
- Group participation.
- Character affinity.

Badge examples:

- First Session: completed first timed reading session.
- Deep Focus 25: read for 25 minutes in one session.
- Seven Day Reader: completed sessions on 7 consecutive days.
- Quote Collector: saved 10 quotes.
- First Finish: completed first book.
- Group Finisher: completed a book with a group.
- Morning Reader: completed 5 morning sessions.
- Night Reader: completed 5 late-night sessions.
- Companion Bond 1: read 300 minutes with one character.

Proposed tables:

```sql
badges (
  id uuid primary key,
  code text unique not null,
  name text not null,
  description text not null,
  category text not null,
  icon_url text,
  created_at timestamptz default now()
)

user_badges (
  id uuid primary key,
  user_id uuid not null,
  badge_id uuid not null,
  earned_at timestamptz default now(),
  source_type text,
  source_id uuid,
  unique(user_id, badge_id)
)
```

Start with server-side recalculation after session completion. Event-based badge awarding can come later.

### 5. Recap v2

The existing yearly recap v2 plan should be expanded with session data.

Add to yearly/monthly recap:

- Total reading time.
- Total sessions.
- Average session length.
- Best reading day.
- Most active weekday.
- Most active time of day.
- Longest focus session.
- Most-read companion character.
- Books completed.
- Pages read.
- Comments, quotes, and reviews.

This builds on `docs/yearly-recap-v2-migration-guide.md`.

### 6. Recommendations

Recommendations should come after sessions and recaps because v2 will have better behavioral signals.

Start with data-based recommendations:

- Popular in wishlist.
- High completion rate.
- High average rating.
- Similar genre to completed books.
- Books completed by users with similar reading patterns.
- Books read by group members.
- Shorter books for users who prefer shorter sessions.
- Memo-heavy books for users who write many notes.

AI recommendations can come later, using:

- Completed genres.
- Ratings.
- Reviews.
- Quote/comment themes.
- Session behavior.

Recommendation should explain why:

- "You often finish short essay books."
- "Your group members read this after the last book."
- "You saved many quotes from similar books."

## Companion Character System

The first version should offer five companions. Users pick one as their active reading partner, but can change anytime.

Each companion should have:

- Name.
- Personality.
- Visual theme.
- Reading style.
- Animation states.
- Favorite session behavior.
- Unlockable cosmetic variants.

### Character 1: Pipi, the Spark Reader

Role:
Energetic starter character.

Personality:
Bright, fast-reacting, encouraging, slightly playful.

Core fantasy:
Pipi is the companion that says, "Let's just start for five minutes." It should reduce the friction of beginning a session and make short reading wins feel rewarding.

Best for:
Users who need motivation to start reading.

Visual direction:
Small round character with a bookmark scarf and bright accent colors.

Reading room mood:
Bright desk, morning light, colorful tabs, small sparks around the timer. Pipi's room should feel light and easy to enter, not serious or heavy.

Voice and copy tone:
Short, energetic, and action-oriented.

Examples:

- "5 minutes is enough to begin."
- "Nice. One page became a session."
- "You saved progress. Keep the rhythm."

States:

- idle: bounces lightly.
- focus: sits with a tiny book.
- thinking: tilts head with a pencil.
- cheer: jumps when progress is saved.
- sleepy: droops after inactivity.
- celebrate: throws tiny bookmark confetti.

Session hooks:

- Reacts strongly to starting a timer.
- Celebrates first 5, 10, 25 minutes.
- Good default for onboarding.

Unlock ideas:

- Starter Scarf: complete the first session.
- Five Minute Spark: complete five 5-minute sessions.
- Morning Pipi wallpaper: complete three morning sessions.

Product role:
Pipi should be the default onboarding character because it clearly teaches the timer, progress save, and quick note loop.

### Character 2: Momo, the Calm Librarian

Role:
Quiet focus companion.

Personality:
Calm, patient, organized, warm.

Core fantasy:
Momo is the companion that creates a quiet library around the user. It should make reading feel stable, soft, and protected.

Best for:
Users who want a quiet reading atmosphere.

Visual direction:
Soft librarian-like character with glasses, cardigan, and book stack motifs.

Reading room mood:
Warm lamp, wooden desk, muted shelves, paper texture, soft shadows. The room should feel like a calm private library.

Voice and copy tone:
Gentle, composed, and low-pressure.

Examples:

- "We can read slowly."
- "A quiet session still counts."
- "Your thoughts are neatly saved."

States:

- idle: quietly turns a page.
- focus: reads beside the user.
- thinking: opens a note card.
- cheer: smiles and stamps a record.
- sleepy: closes the book slowly.
- celebrate: places a gold label on the finished book.

Session hooks:

- Rewards long uninterrupted sessions.
- Fits Pomodoro/focus timer mode.
- Good for night reading wallpaper.

Unlock ideas:

- Library Stamp: finish one 25-minute session.
- Quiet Desk wallpaper: finish three sessions without pausing.
- Archive Card skin: write reviews for five completed books.

Product role:
Momo should anchor the serious focus mode. This is the best character for users who treat the app like a reading timer and habit tool.

### Character 3: Rumi, the Quote Collector

Role:
Note and quote companion.

Personality:
Curious, observant, expressive.

Core fantasy:
Rumi helps users catch sentences before they disappear. It should make note-taking and quote-saving feel immediate and satisfying.

Best for:
Users who like highlights, quotes, and reflective notes.

Visual direction:
Character with sticky notes, ink marks, and floating quote cards.

Reading room mood:
Desk full of paper slips, highlighter marks, pinned note cards, soft ink accents. The room should feel like an idea board.

Voice and copy tone:
Curious, reflective, and slightly excited by good sentences.

Examples:

- "That line sounds worth keeping."
- "Want to turn this into a quote card?"
- "Your note found its place."

States:

- idle: sorts small note cards.
- focus: watches quietly.
- thinking: writes fast.
- cheer: pins a quote card.
- celebrate: creates a tiny gallery.
- sleepy: stacks notes and waits.

Session hooks:

- Reacts when the user saves quotes.
- Unlocks variants through note/quote activity.
- Strong fit for shareable quote cards.

Unlock ideas:

- First Quote Pin: save the first quote.
- Quote Wall wallpaper: save 20 quotes.
- Ink Rumi skin: create 50 notes.

Product role:
Rumi should own the quick input flow. If v2 wants users to capture quotes, thoughts, and review seeds while reading, Rumi makes that behavior feel central.

### Character 4: Toto, the Focus Coach

Role:
Timer and streak companion.

Personality:
Steady, disciplined, supportive.

Core fantasy:
Toto is the companion that helps users keep a promise to themselves. It should make goals, timers, and streaks feel clear without becoming stressful.

Best for:
Users who want structure, goals, and streaks.

Visual direction:
Minimal coach-like character with stopwatch, checklist, and clean shapes.

Reading room mood:
Clean focus desk, timer dial, simple progress markers, calm contrast. The room should feel focused and practical.

Voice and copy tone:
Clear, steady, and goal-oriented.

Examples:

- "Timer started. Stay with the page."
- "25 minutes complete."
- "You protected your streak today."

States:

- idle: checks a tiny timer.
- focus: holds a stopwatch.
- thinking: reviews a checklist.
- cheer: raises a flag.
- celebrate: shows a streak banner.
- sleepy: lowers the stopwatch and suggests ending cleanly.

Session hooks:

- Best companion for timer-first flow.
- Rewards consecutive sessions.
- Connects naturally to badges.

Unlock ideas:

- Focus Flag: complete one 25-minute session.
- Streak Banner wallpaper: complete a 7-day reading streak.
- Marathon Timer skin: reach 1,000 total reading minutes.

Product role:
Toto should make the timer system legible. This is the character that connects most directly to badges, streaks, and habit loops.

### Character 5: Nori, the Dream Reader

Role:
Atmospheric wallpaper companion.

Personality:
Imaginative, dreamy, quiet, immersive.

Core fantasy:
Nori turns reading into an ambient room. It should make users want to leave the app open beside them because the space feels beautiful.

Best for:
Users who want a beautiful ambient reading room.

Visual direction:
Soft fantasy-inspired character with stars, moonlight, or floating pages.

Reading room mood:
Moonlit window, floating pages, quiet particles, deep but gentle colors. Nori should own the wallpaper-first experience.

Voice and copy tone:
Poetic, short, and calm.

Examples:

- "The room is ready."
- "A page can become a little world."
- "Your reading light is still on."

States:

- idle: floats gently.
- focus: dims the room and reads.
- thinking: creates a small thought bubble.
- cheer: lights up the wallpaper.
- sleepy: curls under a moon lamp.
- celebrate: fills the room with soft stars.

Session hooks:

- Strongest tie to wallpapers and ambience.
- Good for themed reading rooms.
- Could support seasonal wallpapers.

Unlock ideas:

- Moon Lamp wallpaper: complete a night reading session.
- Star Page effect: finish a book with Nori active.
- Dream Library skin: complete 10 sessions with Nori.

Product role:
Nori should sell the emotional side of v2. If users want Sidekick to feel like a cozy reading space rather than a utility, Nori is the anchor.

## Character Selection Model

All five base characters should be available from the start. The product should not lock the user's preferred companion behind progression.

Progression should unlock:

- Character skins.
- Wallpaper variants.
- Timer sounds.
- Special reactions.
- Character-specific badges.

Recommended onboarding:

1. Ask the user what kind of reading partner they want.
2. Show the five characters as choices.
3. Let the user switch anytime in settings or the reading room.
4. Use the selected character in session summaries, badges, and share cards.

Selection prompts:

- "I need help getting started." -> Pipi.
- "I want a calm reading space." -> Momo.
- "I save quotes and thoughts." -> Rumi.
- "I like timers and goals." -> Toto.
- "I want an immersive atmosphere." -> Nori.

## Character Customization

Keep customization simple for v2-alpha:

- Active character.
- Wallpaper theme.
- Light/dark room mode.
- Timer sound on/off.
- Character reaction intensity.

Later:

- Character skins.
- Seasonal wallpapers.
- Book genre wallpapers.
- Character affinity level.
- Character-specific badges.

Proposed tables:

```sql
user_companion_settings (
  user_id uuid primary key,
  active_companion_code text not null default 'pipi',
  active_wallpaper_code text default 'default',
  reaction_intensity text default 'normal',
  sound_enabled boolean default true,
  updated_at timestamptz default now()
)

user_companion_stats (
  id uuid primary key,
  user_id uuid not null,
  companion_code text not null,
  total_duration_seconds integer default 0,
  session_count integer default 0,
  note_count integer default 0,
  completed_books_count integer default 0,
  affinity_level integer default 1,
  updated_at timestamptz default now(),
  unique(user_id, companion_code)
)
```

## Global Strategy

Global should be planned from the beginning but shipped progressively.

### Global Product Fit

The personal reading room works globally better than group reading as an entry point.

Global MVP should emphasize:

- Personal reading sessions.
- Character companion.
- Timer.
- Notes and quotes.
- Share cards.
- Recaps.

Group reading can remain a strong differentiator after the personal loop works.

### Global Requirements

Required for v2 global readiness:

- i18n keys for Korean and English.
- Locale-aware dates and times.
- Book search source abstraction.
- Global book sources such as Google Books and Open Library.
- Region-specific sources like Naver/Kakao kept as Korean providers.
- Share cards with language-specific templates.

Suggested provider interface:

```ts
interface BookSearchProvider {
  code: string
  search(query: string, locale: string): Promise<BookSearchResult[]>
  lookupByIsbn(isbn: string, locale: string): Promise<BookSearchResult | null>
}
```

## Screen Integration

### Home

Add:

- Continue reading room card.
- Today's timer goal.
- Recent session summary.
- Recap/banner slot.

### My Library

Add:

- Start reading session on current book.
- Session history per book.
- Notes and quotes from sessions.
- Completion card generation.

### Group Detail

Add:

- Start group reading session.
- Session note becomes group comment.
- Group progress summary.
- Group finish card.

### Profile

Add:

- Companion stats.
- Badges.
- Recap tab.
- Share card history.

### Settings

Add:

- Companion selection.
- Wallpaper selection.
- Timer preferences.
- Language.
- Book source region.

### Discover

Add:

- Recommended next read.
- Popular by completion rate.
- Popular by wishlist.
- Similar to your completed books.

## Implementation Roadmap

### v2-alpha.1: Reading Sessions

Goal:
Create the data foundation.

Scope:

- `reading_sessions` table.
- Start/pause/end timer.
- Session summary.
- Connect session to solo/group book.
- Save progress at session end.
- Build minimal API/composable.

### v2-alpha.2: Character Reading Room

Goal:
Make the new v2 experience visible.

Scope:

- Reading room page or modal.
- Five selectable companions.
- Basic wallpaper.
- Character states: idle, focus, thinking, cheer.
- Quick note and progress input.
- Companion settings.

### v2-alpha.3: Share Cards

Goal:
Make reading activity shareable.

Scope:

- Session card.
- Completion card.
- Quote card.
- Client-side image export.
- Later: public shared card link.

### v2-alpha.4: Badges

Goal:
Reward repeated reading.

Scope:

- `badges` and `user_badges`.
- Session-based badge rules.
- Badge display on profile.
- Badge unlock character reaction.

### v2-alpha.5: Recap v2

Goal:
Turn sessions into yearly/monthly memories.

Scope:

- Expand `yearly_stats` with session fields.
- Monthly recap view.
- Yearly recap view.
- Recap card templates.

### v2-beta.1: Recommendations

Goal:
Suggest the next read using real behavior.

Scope:

- Data-based recommendation API.
- Discover sections.
- Completion-next-book suggestions.
- Recommendation explanations.

### v2-beta.2: Global Readiness

Goal:
Prepare for non-Korean users.

Scope:

- Korean/English i18n.
- Locale handling.
- Book provider abstraction.
- Google Books/Open Library support.
- Global share card templates.

## First Build Slice

The smallest meaningful v2 slice is:

1. Add `reading_sessions`.
2. Add a reading room entry from My Library.
3. Show one wallpaper and five selectable static companions.
4. Start/end timer.
5. Save progress and one note.
6. Show session summary.

This gives the product a new identity without requiring every v2 system to be complete.

## Open Decisions

- Should the reading room be a full page (`/read/[groupBookId]`) or an overlay from My Library/Group?
- Should timer support pause/resume in the first alpha?
- Should notes during solo sessions become comments, or a separate note type?
- Should users unlock characters, or should all five be available from the start?
- Should wallpapers be free-form assets or tied to character themes?
- Should share cards be image-only first, or public web pages from the beginning?

## Recommendation

Start v2 with the reading room and timer. Recaps, badges, share cards, and recommendations should all consume session data afterward.

The five companion characters should be available from the start so users can immediately feel ownership over the experience. Unlocks should apply to skins, wallpapers, and special reactions rather than the base characters.

## Implementation Snapshot

Implemented in the current v2 work slice:

- Reading room route: `/read/[bookId]`.
- Character companion component with five selectable companions.
- Five selectable reading room wallpapers with persisted user preference.
- Timer start, pause, end flow.
- Session save API backed by `reading_sessions`.
- Companion preference API backed by `user_companion_settings`.
- Companion stat accumulation backed by `user_companion_stats`.
- Share card UI component.
- Session summary share card preview in the reading room.
- PNG share card download from the reading room session summary.
- PNG share card download from the v2 hub recent session preview.
- Share text copy action after a session ends.
- Public share link creation from a completed reading session.
- Public shared session page at `/share/session/[token]`.
- v2 companion hub route: `/v2`.
- v2 hub API with aggregate session stats, persisted MVP badges, recent sessions, and next-read recommendations.
- v2 hub recent session log, earned badge summary, full badge progress, and recommendation explanations.
- Desktop sidebar entry and home entry for the v2 hub.
- Mobile home entry for the v2 hub.

Still intentionally MVP-level:

- Public share links exist for session cards only; completion, quote, recap, and group finish cards are still planned.
- Wallpapers are CSS-based scenes, not final illustrated assets yet.
- Badge rules are persisted and awarded for MVP session behaviors, but the visual badge system and profile integration are still early.
- Recommendations are rule-based from current reading activity, not AI or catalog-driven yet.
- Recap views are not wired to session data yet.
- Global/i18n support is planned but not implemented in this slice.
