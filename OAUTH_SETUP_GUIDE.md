# OAuth 로그인 및 프로필 설정 구현 가이드

## 개요

이 문서는 구글/카카오 OAuth 로그인 시 신규/기존 사용자를 구분하여 처리하고, 자동 로그인을 지원하는 기능의 구현 내용을 설명합니다.

---

## 새로 추가된 파일

### 1. `/pages/auth/callback.vue`
**목적:** OAuth 인증 후 리다이렉트되는 콜백 페이지

**동작 플로우:**
```
1. OAuth 프로바이더에서 인증 완료 후 이 페이지로 리턴
2. Supabase가 자동으로 URL의 토큰을 추출하여 세션 설정
3. users 테이블에서 프로필 조회
   ├─ 프로필 있음 → 기존 사용자 → 홈(/)으로 리다이렉트
   └─ 프로필 없음 → 신규 사용자 → 온보딩(/onboarding)으로 리다이렉트
```

**주요 코드:**
```typescript
const { data: profile } = await client
  .from('users')
  .select('*')
  .eq('id', user.id)
  .maybeSingle() // 없으면 null 반환 (에러 안 남)

if (!profile) {
  router.push('/onboarding') // 신규 → 온보딩
} else {
  router.push('/') // 기존 → 홈
}
```

---

### 2. `/pages/onboarding.vue`
**목적:** 신규 사용자의 프로필 설정 (닉네임 + 아바타)

**UI 구성:**
- **환영 메시지:** 👋 + "환영합니다!"
- **아바타 업로드:**
  - 클릭하여 이미지 선택
  - OAuth 프로바이더의 기본 이미지 자동 표시
  - 5MB 이하 이미지만 허용
  - Supabase Storage `avatars` 버킷에 업로드
- **닉네임 입력:**
  - 2-20자 제한
  - OAuth에서 제공한 이름 자동 입력 (수정 가능)
- **이메일 표시:** 읽기 전용
- **시작하기 버튼:** 프로필 생성 후 홈으로 이동

**주요 기능:**

#### OAuth 프로바이더 정보 자동 채우기
```typescript
// 구글/카카오에서 제공한 이름 사용
if (user.value.user_metadata?.name) {
  nickname.value = user.value.user_metadata.name
}

// 구글/카카오 프로필 이미지 사용
if (user.value.user_metadata?.avatar_url) {
  avatarPreview.value = user.value.user_metadata.avatar_url
  avatarUrl.value = user.value.user_metadata.avatar_url
}
```

#### 이미지 업로드
```typescript
// 1. Supabase Storage에 업로드
const filePath = `avatars/${user.value.id}-${Date.now()}.${fileExt}`
await client.storage.from('avatars').upload(filePath, avatarFile.value)

// 2. Public URL 생성
const { data: { publicUrl } } = client.storage
  .from('avatars')
  .getPublicUrl(filePath)
```

#### 프로필 생성
```typescript
await client.from('users').insert({
  id: user.value.id,
  nickname: nickname.value.trim(),
  avatar_url: avatarUrl.value || null
})
```

---

### 3. `/stores/user.ts` (수정)

**변경 사항:**

#### OAuth 리다이렉트 경로 수정
```typescript
// 이전
redirectTo: window.location.origin

// 이후
redirectTo: `${window.location.origin}/auth/callback`
```

#### 새 메서드 추가: `updateProfile()`
```typescript
const updateProfile = async (nickname: string, avatarUrl?: string) => {
  const { error } = await client
    .from('users')
    .update({ nickname, avatar_url: avatarUrl })
    .eq('id', user.value.id)

  if (error) throw error
  await fetchProfile()
}
```

---

### 4. `/supabase/migrations/20251208000000_setup_storage.sql`
**목적:** Supabase Storage 버킷 생성 및 RLS 정책 설정

**생성 내용:**
1. **`avatars` 버킷 생성** (public)
2. **RLS 정책:**
   - 모든 사용자가 아바타 조회 가능
   - 인증된 사용자만 자신의 아바타 업로드/수정/삭제 가능

**정책 예시:**
```sql
-- 자신의 아바타만 업로드 가능
create policy "Users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 전체 플로우 다이어그램

```
┌─────────────────────┐
│   로그인 페이지     │
│   /login            │
└──────────┬──────────┘
           │
           │ "구글로 시작하기" 클릭
           │
           ▼
┌─────────────────────┐
│  OAuth 프로바이더   │
│  (Google/Kakao)     │
│  인증 화면          │
└──────────┬──────────┘
           │
           │ 인증 완료
           │
           ▼
┌─────────────────────┐
│  /auth/callback     │◄─── Supabase가 토큰을 세션에 저장
└──────────┬──────────┘
           │
           │ users 테이블 조회
           │
      ┌────▼────┐
      │ 프로필? │
      └────┬────┘
           │
      ┌────┴────┐
      │         │
  있음 │         │ 없음
      │         │
      ▼         ▼
┌─────────┐  ┌──────────────┐
│  홈(/)  │  │ /onboarding  │
│         │  │ 프로필 설정   │
└─────────┘  └──────┬───────┘
                    │
                    │ 닉네임 + 아바타 입력
                    │
                    ▼
             ┌──────────────┐
             │ users INSERT │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │    홈(/)     │
             └──────────────┘
```

---

## 자동 로그인 동작 원리

### Supabase의 세션 관리

1. **localStorage 저장:**
   - OAuth 인증 성공 시 Supabase가 자동으로 JWT 토큰을 `localStorage`에 저장
   - Key: `sb-{project-ref}-auth-token`

2. **세션 유지 시간:**
   - **Access Token:** 1시간 (기본값)
   - **Refresh Token:** 7일 (기본값)
   - Refresh Token을 사용하여 자동으로 Access Token 갱신

3. **자동 로그인 동작:**
   ```typescript
   // Nuxt 앱 로드 시 자동 실행
   const user = useSupabaseUser() // localStorage에서 토큰 읽고 자동 인증

   if (user.value) {
     // 자동으로 로그인 상태
   }
   ```

4. **브라우저 닫아도 유지:**
   - localStorage는 영구적 (명시적 삭제 전까지)
   - 새 탭, 새 창 열어도 동일한 도메인이면 세션 공유

### 보안

- **HttpOnly Cookie 미사용:** Supabase는 기본적으로 localStorage 사용
- **XSS 방어:** Vue의 자동 이스케이프, RLS 정책
- **CSRF 방어:** JWT 토큰 기반 인증 (쿠키 미사용)

---

## 설정 방법

### 1. Supabase 대시보드 설정

#### 1.1 OAuth 프로바이더 활성화

**구글 OAuth:**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. "APIs & Services" → "Credentials" → "OAuth 2.0 Client IDs" 생성
4. Authorized redirect URIs:
   ```
   https://{your-project}.supabase.co/auth/v1/callback
   ```
5. Client ID와 Client Secret 복사
6. Supabase Dashboard → Authentication → Providers → Google
   - Enable 체크
   - Client ID, Client Secret 입력
   - Save

**카카오 OAuth:**
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 추가
3. "플랫폼" → "Web 플랫폼 추가"
   - Site Domain: `https://{your-project}.supabase.co`
4. "제품 설정" → "카카오 로그인"
   - Redirect URI 등록:
     ```
     https://{your-project}.supabase.co/auth/v1/callback
     ```
5. REST API 키 복사
6. Supabase Dashboard → Authentication → Providers → Kakao
   - Enable 체크
   - Client ID에 REST API 키 입력
   - Save

#### 1.2 Storage 버킷 생성

**SQL Editor 실행:**
```sql
-- 마이그레이션 파일 실행
-- supabase/migrations/20251208000000_setup_storage.sql
```

또는 **수동 생성:**
1. Supabase Dashboard → Storage → "Create bucket"
2. Name: `avatars`
3. Public bucket 체크
4. Create

**RLS 정책 추가:** (SQL Editor)
```sql
-- 위 마이그레이션 파일 내용 실행
```

### 2. 로컬 테스트

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 3. 개발 서버 실행
npm run dev
```

**테스트 플로우:**
1. http://localhost:3000/login 접속
2. "구글로 시작하기" 클릭
3. 구글 계정 선택 및 인증
4. `/auth/callback`으로 리다이렉트 (자동)
5. 신규 사용자: `/onboarding` 표시
6. 닉네임 입력, 아바타 선택 (선택 사항)
7. "시작하기" 클릭
8. 홈(`/`) 표시
9. 브라우저 새로고침 → 자동 로그인 확인
10. 브라우저 닫고 다시 열기 → 여전히 로그인 상태

### 3. 배포 시 주의사항

#### 3.1 OAuth 리다이렉트 URI 업데이트

**프로덕션 도메인으로 변경:**
- Google Cloud Console: `https://yourdomain.com/auth/callback` 추가
- Kakao Developers: `https://yourdomain.com/auth/callback` 추가

#### 3.2 Supabase 설정

Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://yourdomain.com`
- **Redirect URLs:** `https://yourdomain.com/auth/callback` 추가

---

## 코드 예시

### 프로필 페이지에서 아바타 수정

```vue
<template>
  <div>
    <input type="file" @change="handleAvatarUpdate" />
    <button @click="saveProfile">저장</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const client = useSupabaseClient()
const newAvatar = ref(null)

const handleAvatarUpdate = (event) => {
  newAvatar.value = event.target.files[0]
}

const saveProfile = async () => {
  if (!newAvatar.value) return

  // 1. Storage 업로드
  const filePath = `avatars/${userStore.user.id}-${Date.now()}.jpg`
  await client.storage.from('avatars').upload(filePath, newAvatar.value)

  // 2. Public URL 생성
  const { data } = client.storage.from('avatars').getPublicUrl(filePath)

  // 3. users 테이블 업데이트
  await userStore.updateProfile(userStore.profile.nickname, data.publicUrl)

  alert('프로필이 업데이트되었습니다!')
}
</script>
```

---

## 문제 해결

### 1. OAuth 리다이렉트 무한 루프

**증상:** `/auth/callback`과 `/onboarding` 사이를 계속 왕복

**원인:** 프로필 생성 실패

**해결:**
1. 브라우저 콘솔에서 에러 확인
2. Supabase Dashboard → Database → Logs 확인
3. RLS 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

### 2. 아바타 업로드 실패

**증상:** "Upload failed" 에러

**원인:**
- Storage 버킷이 생성되지 않음
- RLS 정책 문제

**해결:**
1. Supabase Dashboard → Storage 확인
2. `avatars` 버킷 존재 여부 확인
3. 마이그레이션 재실행:
   ```sql
   -- supabase/migrations/20251208000000_setup_storage.sql
   ```

### 3. 자동 로그인 안 됨

**증상:** 브라우저 새로고침 시 로그아웃됨

**원인:**
- localStorage가 비활성화됨 (시크릿 모드)
- 토큰 만료

**해결:**
1. 시크릿 모드가 아닌지 확인
2. 브라우저 개발자 도구 → Application → Local Storage 확인
   - `sb-{project-ref}-auth-token` 키 존재 여부
3. Supabase Dashboard → Authentication → Users에서 세션 확인

---

## 추가 개선 사항

### 1. 이메일 인증

현재는 OAuth만 구현되었으나, 이메일 회원가입도 온보딩 페이지를 거치도록 수정 가능:

```typescript
// stores/user.ts - signUp 수정
const signUp = async (email: string, password: string, nickname: string) => {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) throw error

  // 이메일 인증 후 콜백 페이지에서 온보딩 처리
}
```

### 2. 프로필 편집 페이지

기존 `/profile` 페이지에서도 아바타 업로드 기능 활성화:

```typescript
// pages/profile.vue
const handleAvatarUpload = async (file: File) => {
  const filePath = `avatars/${userStore.user.id}-${Date.now()}.jpg`
  await client.storage.from('avatars').upload(filePath, file, {
    upsert: true // 기존 파일 덮어쓰기
  })

  const { data } = client.storage.from('avatars').getPublicUrl(filePath)
  await userStore.updateProfile(nickname.value, data.publicUrl)
}
```

### 3. 이미지 리사이징

업로드 전 클라이언트에서 리사이징하여 저장 공간 절약:

```typescript
// 라이브러리: browser-image-compression
import imageCompression from 'browser-image-compression'

const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 512,
    useWebWorker: true
  }
  return await imageCompression(file, options)
}
```

---

## 참고 자료

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Kakao OAuth Setup](https://developers.kakao.com/docs/latest/ko/kakaologin/common)

---

**작성일:** 2024-12-08
**버전:** 1.0.0
