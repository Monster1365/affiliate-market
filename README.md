# ELI 엘리마켓

쿠팡 파트너스 상품을 골라 보여주는 **제휴 쇼핑몰**입니다.
방문자는 상품을 둘러보고 비교한 뒤 "쿠팡에서 구매하기"를 눌러 쿠팡으로 이동하고, 구매가 일어나면 쿠팡 파트너스 수수료를 받습니다.
결제·장바구니·회원가입은 없으며, 구매는 모두 쿠팡에서 이뤄집니다.

## 주요 기능

### 사용자 페이지
- **홈**: 배너(없으면 기본 히어로), MD 추천 상품, 카테고리별 상품 섹션
- **카테고리**: 추천·최신·낮은 가격·높은 가격·할인율 정렬, 페이지네이션
- **상품 상세**: 가격·할인율·로켓배송 표시, 쿠팡 구매 버튼, 같은 카테고리 상품
- **검색**: 상품명 부분 검색 (검색엔진 색인 제외)
- **클릭 추적**: 구매 버튼은 `/go/[id]`를 거쳐 클릭을 기록한 뒤 쿠팡 제휴 링크로 이동 (봇 요청은 집계 제외)

### 관리자 페이지 (`/admin`)
- 이메일/비밀번호 로그인
- 상품·카테고리·배너 관리, 노출/추천 설정
- 쿠팡 파트너스 API로 상품 검색 후 가져오기 + 직접 등록
- 클릭 통계 대시보드

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Cache Components, TypeScript) |
| DB | Neon PostgreSQL + `@neondatabase/serverless` |
| ORM | Drizzle ORM / drizzle-kit |
| 인증 | Auth.js (Credentials, JWT 세션) + bcrypt |
| UI | Tailwind CSS v4 + shadcn/ui, 메인 컬러 파란색 `#2563EB` |
| 배포 | Vercel |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다. `.env.local`은 git에 올라가지 않습니다.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | Neon 접속 주소 (Neon 콘솔 → Connect에서 복사) |
| `AUTH_SECRET` | Auth.js 세션 암호화 키. `openssl rand -base64 32`로 생성 |
| `AUTH_TRUST_HOST` | 로컬에서 `npm start`(프로덕션 모드)로 실행할 때만 `true`. Vercel에서는 필요 없음 |
| `COUPANG_ACCESS_KEY` | 쿠팡 파트너스 API Access Key (없으면 수동 등록만 사용) |
| `COUPANG_SECRET_KEY` | 쿠팡 파트너스 API Secret Key |

### 3. DB 준비

```bash
npm run db:migrate   # 테이블 생성
npm run db:seed      # 카테고리 8개 + [샘플] 상품 13개 (여러 번 실행해도 중복 없음)
npm run admin:create -- 이메일 비밀번호 이름   # 관리자 계정 생성
```

### 4. 개발 서버

```bash
npm run dev
```

- 쇼핑몰: http://localhost:3000
- 관리자: http://localhost:3000/admin

## npm 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm run db:generate` | 스키마 변경 후 마이그레이션 SQL 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:studio` | 브라우저에서 DB 조회 (Drizzle Studio) |
| `npm run db:seed` | 개발용 카테고리·샘플 상품 넣기 |
| `npm run admin:create` | 관리자 계정 생성 (이미 있으면 비밀번호·이름 갱신) |

## 폴더 구조

```
src/
  app/
    (shop)/              사용자 페이지 (헤더·푸터 공통 레이아웃)
      page.tsx           홈
      category/[slug]/   카테고리별 목록
      product/[id]/      상품 상세
      search/            검색
    admin/               관리자 페이지
      login/             로그인
      (protected)/       로그인해야 들어갈 수 있는 영역
    go/[id]/route.ts     클릭 기록 후 쿠팡으로 리다이렉트
    api/auth/            Auth.js 엔드포인트
  components/
    shop/                사용자 페이지 컴포넌트
    admin/               관리자 페이지 컴포넌트
    ui/                  shadcn/ui 컴포넌트
  lib/
    db/                  Drizzle 스키마와 DB 클라이언트
    queries/shop.ts      사용자 페이지 조회 함수 (캐시 + 태그)
    auth.ts              Auth.js 설정
    site.ts              사이트 이름 등 기본 정보
  proxy.ts               /admin 접근 제어 (Next.js 16의 middleware)
drizzle/                 마이그레이션 SQL
scripts/                 시드·관리자 생성 스크립트
```

## DB 테이블

| 테이블 | 설명 |
|---|---|
| `categories` | 카테고리 (이름, slug, 정렬 순서) |
| `products` | 상품 (가격, 할인율, 로켓배송, 제휴 링크, 노출/추천 여부, 등록 경로 `api`/`manual`) |
| `click_logs` | 구매 버튼 클릭 기록 |
| `banners` | 홈 배너 |
| `admin_users` | 관리자 계정 (비밀번호는 bcrypt 해시) |

스키마를 바꿀 때는 `src/lib/db/schema.ts`를 수정한 뒤 `npm run db:generate` → `npm run db:migrate` 순서로 실행합니다.

## 알아둘 점

### 캐싱 (Next.js 16 Cache Components)
사용자 페이지의 조회 함수(`src/lib/queries/shop.ts`)는 `'use cache'`로 캐시되고 `products`·`categories`·`banners` 태그가 붙어 있습니다.
관리자가 데이터를 바꾸면 Server Action에서 해당 태그를 무효화(`updateTag`)해 사용자 페이지에 바로 반영합니다.
조회 함수를 새로 만들 때도 같은 태그를 붙여야 관리자 수정이 반영됩니다.

### 관리자 권한 확인 (중요)
`/admin`은 세 겹으로 보호됩니다.

1. `src/proxy.ts`: 로그인 쿠키가 없으면 로그인 화면으로 보냅니다 (빠른 1차 확인).
2. `requireAdmin()` (`src/lib/admin/session.ts`): 세션을 확인하고 DB에서 계정이 아직 있는지 조회합니다. 계정을 지우면 남아 있는 세션도 바로 막힙니다.
3. 이 `requireAdmin()`을 **관리자 레이아웃, 모든 관리자 페이지, 모든 관리자 Server Action의 첫 줄**에서 호출합니다.

레이아웃과 페이지는 동시에 렌더링되기 때문에, 레이아웃에서만 확인하면 페이지가 조회한 데이터가 응답에 섞여 나갈 수 있습니다.
관리자 페이지나 Server Action을 새로 만들 때 `await requireAdmin()`을 빠뜨리지 마세요.

그 밖의 보호 장치:
- 로그인 실패 시 이메일이 틀렸는지 비밀번호가 틀렸는지 구분하지 않습니다 (응답 시간도 같게 맞춤).
- 로그인 후 이동 경로는 `/admin` 하위만 허용합니다 (외부 사이트로의 리다이렉트 방지).
- 세션 유효 시간은 8시간입니다 (`src/lib/auth.config.ts`).

### 쿠팡 파트너스 정책
- 모든 페이지 하단과 상품 상세에 수수료 고지문이 표시됩니다 (`src/components/shop/affiliate-disclosure.tsx`).
- 구매 링크에는 `rel="sponsored nofollow"`가 붙습니다.

### 샘플 데이터
`npm run db:seed`로 넣은 상품은 실제 쿠팡 상품이 아닙니다 (제목에 `[샘플]`, 링크는 쿠팡 홈).
운영 전에 아래 SQL로 지우세요.

```sql
DELETE FROM products WHERE coupang_product_id LIKE 'sample-%';
```

### 이미지
`*.coupangcdn.com`, `placehold.co` 이미지는 Next.js 이미지 최적화를 거칩니다.
그 외 주소의 이미지는 최적화 없이 원본을 그대로 보여줍니다. 허용 호스트를 추가하려면 `next.config.ts`와 `src/lib/image.ts`를 함께 수정하세요.

## 배포 (Vercel)

1. Vercel에서 GitHub 저장소를 연결합니다. `main` = 운영, 그 외 브랜치 = 미리보기 배포입니다.
2. Settings → Environment Variables에 `DATABASE_URL`, `AUTH_SECRET`(, `COUPANG_*`)을 Production·Preview 모두 등록합니다.
   `AUTH_SECRET`이 없으면 관리자 로그인이 동작하지 않습니다. 로컬과 다른 값을 써도 됩니다.
   빌드 중에도 DB를 읽어 페이지를 미리 만들기 때문에 `DATABASE_URL`이 없으면 빌드가 실패합니다.
3. Settings → Functions → Region을 DB와 같은 싱가포르(`sin1`)로 두면 응답이 빠릅니다.

## 브랜치

- `develop`: 개발 브랜치
- `main`: 운영 브랜치 (`develop`에서 merge)

## 진행 상황

- [x] 1단계: 프로젝트 셋업 (Next.js, shadcn/ui, 파란색 테마, Neon)
- [x] 2단계: DB 스키마, 마이그레이션, 시드
- [x] 3단계: 사용자 페이지, 클릭 추적
- [x] 4단계: 관리자 로그인
- [ ] 5단계: 관리자 상품·카테고리·배너 관리
- [ ] 6단계: 쿠팡 파트너스 API 연동
- [ ] 7단계: 대시보드, SEO (sitemap, JSON-LD)
- [ ] 8단계: 배포 마무리
