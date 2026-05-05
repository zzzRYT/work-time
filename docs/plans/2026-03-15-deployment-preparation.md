# Deployment Preparation Implementation Plan

> **[archived 2026-05-05]** Superseded by `docs/plans/2026-05-05-launch-plan.md`.
> 이 plan은 Prisma+Express 시절 작성됨. 현재 stack은 NestJS+TypeORM+Apollo+Supabase로 변경됨.
> 신규 작업 진행 금지 — 참고용으로만 보존.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 서버(Railway)와 앱(Google Play Store) 배포를 위한 전체 인프라 준비

**Architecture:** SQLite→PostgreSQL 전환, 환경변수 분리(dev/prod), Express 미들웨어 통합(헬스체크, Rate Limiting), EAS Build 설정, GitHub Actions CI/CD, Expo Updates OTA, Sentry 에러 트래킹

**Tech Stack:** Prisma + PostgreSQL, Express + Apollo Server, EAS Build, GitHub Actions, expo-updates, @sentry/react-native, express-rate-limit

---

### Task 1: SQLite → PostgreSQL 전환

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/.env`
- Create: `server/.env.example`
- Modify: `server/package.json`

**Step 1: schema.prisma provider 변경**

`server/prisma/schema.prisma`에서 provider를 변경:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 2: .env 파일 업데이트**

로컬 개발용 PostgreSQL URL로 변경 (Docker 또는 로컬 PostgreSQL 사용):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worktime_dev"
TZ="Asia/Seoul"
PORT=4000
```

**Step 3: .env.example 생성**

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
TZ="Asia/Seoul"
PORT=4000
```

**Step 4: 기존 SQLite 마이그레이션 삭제 후 재생성**

Run:
```bash
cd server
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

Expected: PostgreSQL용 새 마이그레이션 생성, Prisma Client 재생성

**Step 5: 시드 실행 확인**

Run: `cd server && npm run db:seed`
Expected: 시드 데이터 정상 입력

**Step 6: 서버 실행 확인**

Run: `cd server && npm run dev`
Expected: `🚀 Server ready at http://localhost:4000/`

**Step 7: Commit**

```bash
git add server/prisma/schema.prisma server/.env.example
git commit -m "feat(server): migrate from SQLite to PostgreSQL"
```

---

### Task 2: Apollo Server를 Express 기반으로 전환 + 헬스체크 + Rate Limiting

standalone Apollo Server는 커스텀 미들웨어를 지원하지 않으므로 Express 기반으로 전환한다.

**Files:**
- Modify: `server/package.json` (express, express-rate-limit, cors 추가)
- Modify: `server/src/index.ts`

**Step 1: 의존성 설치**

Run:
```bash
cd server && npm install express cors express-rate-limit && npm install -D @types/express @types/cors
```

**Step 2: index.ts를 Express 기반으로 재작성**

`server/src/index.ts`:

```typescript
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";
import { createContext } from "./context.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

// CORS
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:8081"];
app.use(cors({ origin: allowedOrigins }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 1000, // 요청 제한
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use(
  "/graphql",
  express.json(),
  expressMiddleware(server, {
    context: async () => createContext(),
  })
);

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`❤️ Health check at http://localhost:${port}/health`);
});
```

**Step 3: .env에 CORS_ORIGINS 추가**

`.env` 및 `.env.example`에 추가:
```env
CORS_ORIGINS="http://localhost:8081"
```

**Step 4: 서버 실행 확인**

Run: `cd server && npm run dev`
Expected: 서버 정상 기동

**Step 5: 헬스체크 확인**

Run: `curl http://localhost:4000/health`
Expected: `{"status":"ok","timestamp":"..."}`

**Step 6: GraphQL 엔드포인트 확인**

Run: `curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{ members { id name } }"}'`
Expected: 멤버 목록 정상 응답

**Step 7: Commit**

```bash
git add server/
git commit -m "feat(server): switch to Express with health check and rate limiting"
```

---

### Task 3: 환경변수 분리 (Client)

**Files:**
- Modify: `app/src/shared/lib/apollo.ts`
- Modify: `app/app.json` → `app/app.config.ts`로 전환

**Step 1: app.config.ts로 전환**

`app/app.config.ts` 생성 (app.json의 내용을 동적 config로 전환):

```typescript
import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "WorkTime (Dev)" : "WorkTime",
  slug: "work-time",
  scheme: "work-time",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? "com.worktime.dev" : "com.worktime.app",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    package: IS_DEV ? "com.worktime.dev" : "com.worktime.app",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-asset"],
  extra: {
    apiUrl: process.env.API_URL || "http://localhost:4000/graphql",
  },
});
```

**Step 2: apollo.ts에서 환경변수 사용**

`app/src/shared/lib/apollo.ts`:

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import Constants from "expo-constants";

const apiUrl = Constants.expoConfig?.extra?.apiUrl || "http://localhost:4000/graphql";

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: apiUrl }),
  cache: new InMemoryCache(),
});
```

**Step 3: 기존 app.json 삭제**

app.config.ts가 app.json을 대체하므로 app.json 삭제.

**Step 4: 앱 실행 확인**

Run: `cd app && npm start`
Expected: Expo 정상 기동, GraphQL 연결 확인

**Step 5: Commit**

```bash
git add app/
git commit -m "feat(app): switch to dynamic config with environment-based API URL"
```

---

### Task 4: 번들 ID 확정 + EAS Build 설정

**Files:**
- Create: `app/eas.json`
- Modify: `app/app.config.ts` (이전 태스크에서 생성됨)

**Step 1: EAS CLI 설치 (글로벌)**

Run: `npm install -g eas-cli`

**Step 2: eas.json 생성**

`app/eas.json`:

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development",
        "API_URL": "http://localhost:4000/graphql"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "production",
        "API_URL": "https://your-railway-app.railway.app/graphql"
      }
    },
    "production": {
      "env": {
        "APP_VARIANT": "production",
        "API_URL": "https://your-railway-app.railway.app/graphql"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Step 3: EAS 프로젝트 초기화**

Run: `cd app && eas init`
Expected: Expo 프로젝트에 EAS 연결

**Step 4: .gitignore에 서비스 계정 키 추가**

`.gitignore`에 추가:
```
google-service-account.json
```

**Step 5: Commit**

```bash
git add app/eas.json .gitignore
git commit -m "feat(app): add EAS Build configuration for Google Play"
```

---

### Task 5: Railway 배포 준비

**Files:**
- Create: `server/Dockerfile`
- Create: `server/.dockerignore`
- Modify: `server/package.json` (start 스크립트에 prisma generate 추가)

**Step 1: Dockerfile 작성**

`server/Dockerfile`:

```dockerfile
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE ${PORT:-4000}
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

**Step 2: .dockerignore 작성**

`server/.dockerignore`:

```
node_modules
dist
*.db
*.db-journal
.env
.env.local
```

**Step 3: package.json start 스크립트 업데이트**

`server/package.json`의 scripts에 추가:
```json
"start:prod": "prisma migrate deploy && node dist/index.js"
```

**Step 4: 로컬 Docker 빌드 테스트**

Run:
```bash
cd server && docker build -t worktime-server .
```
Expected: 빌드 성공

**Step 5: Commit**

```bash
git add server/Dockerfile server/.dockerignore server/package.json
git commit -m "feat(server): add Dockerfile for Railway deployment"
```

---

### Task 6: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/server-ci.yml`
- Create: `.github/workflows/app-build.yml`

**Step 1: 서버 CI 워크플로우 작성**

`.github/workflows/server-ci.yml`:

```yaml
name: Server CI

on:
  push:
    branches: [main]
    paths: [server/**]
  pull_request:
    branches: [main]
    paths: [server/**]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        run: cd server && npm ci

      - name: Generate Prisma Client
        run: cd server && npx prisma generate

      - name: Build
        run: cd server && npm run build
```

**Step 2: 앱 빌드 워크플로우 작성**

`.github/workflows/app-build.yml`:

```yaml
name: App Build

on:
  push:
    branches: [main]
    paths: [app/**]
  pull_request:
    branches: [main]
    paths: [app/**]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: app/package-lock.json

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: cd app && npm ci

      - name: Build Android (preview)
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: cd app && eas build --platform android --profile preview --non-interactive
```

**Step 3: Commit**

```bash
git add .github/
git commit -m "feat: add GitHub Actions CI/CD for server and app"
```

---

### Task 7: Expo Updates (OTA) 설정

**Files:**
- Modify: `app/app.config.ts`
- Modify: `app/eas.json`

**Step 1: expo-updates 설치**

Run: `cd app && npx expo install expo-updates`

**Step 2: app.config.ts에 updates 설정 추가**

`app.config.ts`의 ExpoConfig에 추가:

```typescript
updates: {
  url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID}`,
  fallbackToCacheTimeout: 0,
},
runtimeVersion: {
  policy: "appVersion",
},
```

**Step 3: eas.json의 production 프로필에 channel 추가**

`eas.json`의 각 프로필에 추가:

```json
"preview": {
  "channel": "preview",
  ...
},
"production": {
  "channel": "production",
  ...
}
```

**Step 4: Commit**

```bash
git add app/
git commit -m "feat(app): add Expo Updates for OTA deployment"
```

---

### Task 8: Sentry 에러 트래킹 준비

**Files:**
- Modify: `app/package.json` (sentry 설치)
- Create: `app/src/shared/lib/sentry.ts`
- Modify: `app/app.config.ts` (sentry plugin)
- Modify: `server/package.json` (sentry 설치)
- Create: `server/src/sentry.ts`
- Modify: `server/src/index.ts`

**Step 1: 클라이언트 Sentry 설치**

Run: `cd app && npx expo install @sentry/react-native`

**Step 2: 클라이언트 Sentry 초기화 모듈 생성**

`app/src/shared/lib/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react-native";

export function initSentry() {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: process.env.APP_VARIANT || "development",
  });
}

export { Sentry };
```

**Step 3: app.config.ts에 sentry plugin 추가**

plugins 배열에 추가:
```typescript
plugins: [
  "expo-router",
  "expo-asset",
  [
    "@sentry/react-native/expo",
    { organization: "your-org", project: "worktime-app" },
  ],
],
```

**Step 4: 서버 Sentry 설치**

Run: `cd server && npm install @sentry/node`

**Step 5: 서버 Sentry 초기화 모듈 생성**

`server/src/sentry.ts`:

```typescript
import * as Sentry from "@sentry/node";

export function initSentry() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: process.env.NODE_ENV || "development",
  });
}

export { Sentry };
```

**Step 6: index.ts에 Sentry import 추가**

`server/src/index.ts` 최상단에 추가:
```typescript
import { initSentry } from "./sentry.js";
initSentry();
```

**Step 7: .env.example에 Sentry DSN 추가**

```env
SENTRY_DSN=""
```

**Step 8: Commit**

```bash
git add app/ server/
git commit -m "feat: add Sentry error tracking for client and server"
```

---

### Task 9: 스토어 배포 메타데이터 준비

**Files:**
- Create: `docs/store/privacy-policy.md`
- Create: `docs/store/google-play-metadata.md`

**Step 1: 개인정보 처리방침 초안 작성**

`docs/store/privacy-policy.md` — 앱에서 수집하는 데이터 기준으로 작성:
- 수집 정보: 이름(닉네임), 출석 기록, 스터디 시간
- 개인 식별 정보: 수집하지 않음 (현재 인증 없음)
- 데이터 저장 위치: 서버 (Railway 호스팅)
- 제3자 공유: 없음

**Step 2: Google Play 메타데이터 정리**

`docs/store/google-play-metadata.md`:
- 앱 이름: WorkTime
- 짧은 설명 (80자)
- 긴 설명 (4000자)
- 카테고리: 생산성
- 콘텐츠 등급: 전체이용가
- 필요 스크린샷 목록

**Step 3: Commit**

```bash
git add docs/store/
git commit -m "docs: add store metadata and privacy policy drafts"
```

---

## 실행 순서 요약

| Task | 작업 | 의존성 |
|------|------|--------|
| 1 | SQLite → PostgreSQL | 없음 |
| 2 | Express 전환 + 헬스체크 + Rate Limiting | Task 1 |
| 3 | 환경변수 분리 (Client) | 없음 |
| 4 | 번들 ID + EAS Build | Task 3 |
| 5 | Railway 배포 준비 (Dockerfile) | Task 2 |
| 6 | GitHub Actions CI/CD | Task 4, 5 |
| 7 | Expo Updates OTA | Task 4 |
| 8 | Sentry 에러 트래킹 | Task 2, 3 |
| 9 | 스토어 메타데이터 | 없음 |

**병렬 가능:** Task 1+3+9 → Task 2+4 → Task 5+7+8 → Task 6
