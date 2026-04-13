# 📱 성지폰 트래커 (PhoneSell)

> 뽐뿌 핫딜 게시판을 크롤링하여 중고 스마트폰 최저가를 실시간 추적하고,  
> 목표가 도달 시 FCM 푸시 알림을 보내주는 풀스택 모바일 앱

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.4-6DB33F?logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-Expo_51-20232A?logo=react&logoColor=61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-k8s-326CE5?logo=kubernetes&logoColor=white)

---

## ✨ 주요 기능

- **실시간 가격 크롤링** — 뽐뿌 핫딜 게시판을 30분 주기로 자동 수집 (Jsoup)
- **가격 히스토리 차트** — 기간별 최저가 추이를 모바일에서 시각화
- **관심 목록 & 푸시 알림** — 목표가 등록 후 FCM으로 즉시 알림 수신
- **커뮤니티 게시판** — 게시글 작성 / 댓글 기능
- **JWT 인증** — 회원가입 · 로그인 · 토큰 기반 API 보호
- **실시간 모니터링** — Prometheus + Grafana 대시보드 (크롤러 성공률, API 응답시간 등)

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│           (Expo 51 · TypeScript · React Query)          │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API (JWT)
┌───────────────────────▼─────────────────────────────────┐
│               Spring Boot 3.2 (Java 17)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │Controller│  │ Service  │  │  Jsoup   │  │Firebase│  │
│  │  (REST)  │→ │ (비즈니스)│→ │ Crawler  │  │  FCM   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                      │                                   │
│              ┌───────▼───────┐                           │
│              │  Spring Data  │ ← Prometheus Actuator     │
│              │  JPA (MySQL)  │                           │
│              └───────────────┘                           │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │         MySQL 8.0             │
        └───────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │   Prometheus → Grafana        │
        └───────────────────────────────┘
```

---

## 🛠️ 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| **Frontend** | React Native (Expo), TypeScript | Expo 51 |
| **상태관리** | TanStack React Query | 5.x |
| **네비게이션** | React Navigation (Bottom Tabs + Stack) | 6.x |
| **Backend** | Spring Boot, Spring Security, Spring Data JPA | 3.2.4 |
| **언어** | Java | 17 |
| **빌드** | Gradle | 8.7 |
| **데이터베이스** | MySQL | 8.0 |
| **크롤링** | Jsoup | 1.17.2 |
| **인증** | JWT (jjwt) | 0.12.5 |
| **푸시 알림** | Firebase Admin SDK (FCM) | 9.2.0 |
| **모니터링** | Prometheus + Grafana, Micrometer | latest |
| **인프라** | Docker Compose, Kubernetes | - |

---

## 📁 프로젝트 구조

```
PhoneSell/
├── backend/                        # Spring Boot 백엔드
│   └── src/main/java/com/sungji/
│       ├── controller/             # REST 컨트롤러 + DTO
│       │   ├── PhoneController.java
│       │   ├── PostController.java
│       │   ├── AuthController.java
│       │   ├── UserController.java
│       │   └── dto/                # 요청/응답 DTO 클래스
│       ├── service/                # 비즈니스 로직
│       │   ├── CrawlerService.java # 뽐뿌 크롤러 (30분 주기)
│       │   ├── AlertService.java   # FCM 알림 발송
│       │   ├── PhoneService.java
│       │   ├── PostService.java
│       │   └── AuthService.java
│       ├── entity/                 # JPA 엔티티
│       │   ├── Phone.java
│       │   ├── PriceRecord.java
│       │   ├── User.java
│       │   ├── Post.java
│       │   ├── Comment.java
│       │   └── UserWatchlist.java
│       ├── repository/             # Spring Data JPA Repository
│       ├── metrics/
│       │   └── AppMetrics.java     # Micrometer 커스텀 메트릭
│       └── config/
│           ├── SecurityConfig.java # JWT + Prometheus IP 제한
│           ├── JwtAuthFilter.java
│           ├── CorsConfig.java
│           └── FirebaseConfig.java
│
├── frontend/                       # React Native 앱
│   ├── App.tsx                     # 네비게이션 루트
│   └── src/
│       ├── screens/
│       │   ├── HomeScreen.tsx      # 폰 목록
│       │   ├── SearchScreen.tsx    # 검색
│       │   ├── PhoneDetailScreen.tsx # 가격 차트 + 관심 등록
│       │   ├── WatchlistScreen.tsx # 관심 목록
│       │   ├── BoardScreen.tsx     # 게시판
│       │   ├── LoginScreen.tsx
│       │   ├── RegisterScreen.tsx
│       │   ├── MyPageScreen.tsx
│       │   └── MonitoringScreen.tsx # Grafana WebView
│       ├── api/
│       │   ├── client.ts           # axios 인스턴스 (JWT 자동 첨부)
│       │   ├── phones.ts
│       │   ├── board.ts
│       │   ├── auth.ts
│       │   └── me.ts
│       ├── context/
│       │   └── AuthContext.tsx     # 전역 인증 상태
│       └── hooks/
│           └── useDeviceToken.ts   # FCM 디바이스 토큰 관리
│
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/provisioning/       # Grafana 자동 프로비저닝
│       ├── datasources/
│       └── dashboards/
│
├── k8s/                            # Kubernetes 매니페스트
│   ├── namespace.yaml
│   ├── deployment/
│   ├── service/
│   ├── configmap/
│   ├── secret/
│   ├── pvc/
│   └── ingress/
│
├── mysql/
│   └── init.sql                    # DB 초기화 스크립트
│
├── docker-compose.yml
└── .gitignore
```

---

## 🚀 로컬 실행 방법

### 사전 요구사항

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- [Node.js](https://nodejs.org/) 20+
- [Java 17](https://adoptium.net/) (로컬 백엔드 실행 시)
- [Expo Go](https://expo.dev/go) (모바일 앱 테스트용)

---

### 1단계 — 환경변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
# MySQL
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_USER=sungji
MYSQL_PASSWORD=sungjipassword

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# Prometheus 접근 허용 IP (내부망 CIDR)
PROMETHEUS_ALLOWED_IP=172.16.0.0/12

# Firebase 서비스 계정 키 경로
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

---

### 2단계 — Firebase 설정 (선택)

FCM 푸시 알림 기능을 사용하려면:

1. [Firebase Console](https://console.firebase.google.com/) → 프로젝트 생성
2. **프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성**
3. 다운로드한 JSON 파일을 프로젝트 루트에 `firebase-service-account.json`으로 저장

> ⚠️ `firebase-service-account.json`은 `.gitignore`에 포함되어 있습니다. **절대 커밋하지 마세요.**  
> 파일이 없으면 백엔드는 정상 시작되지만 FCM 알림 기능만 비활성화됩니다.

---

### 3단계 — 백엔드 & 인프라 실행 (Docker Compose)

```bash
# 프로젝트 루트에서
docker compose up -d

# 로그 확인
docker compose logs -f spring-boot-app
```

| 서비스 | 접속 주소 |
|--------|-----------|
| 백엔드 API | http://localhost:8080 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin / admin) |
| MySQL | localhost:**3307** (DBeaver 등 클라이언트 사용 시) |

---

### 4단계 — React Native 앱 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에서 API_URL을 로컬 머신 IP로 변경
# 예: EXPO_PUBLIC_API_URL=http://192.168.1.100:8080

# 앱 실행
npm start
```

Expo Go 앱으로 QR 코드를 스캔하거나 `a`(Android) / `i`(iOS 시뮬레이터)를 눌러 실행합니다.

---

## ⚙️ 환경변수 목록

### 백엔드 (`application.yml` / Docker 환경변수)

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `SPRING_DATASOURCE_URL` | MySQL JDBC URL | `jdbc:mysql://localhost:3306/sungji_phone` |
| `SPRING_DATASOURCE_USERNAME` | DB 사용자명 | `sungji` |
| `SPRING_DATASOURCE_PASSWORD` | DB 비밀번호 | `sungjipassword` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase 서비스 계정 키 경로 | `./firebase-service-account.json` |
| `PROMETHEUS_ALLOWED_IP` | Prometheus 접근 허용 CIDR | `172.16.0.0/12` |
| `JWT_SECRET` | JWT 서명 키 (32자 이상) | `sungji-phone-secret-key-...` |

### 프론트엔드 (`.env`)

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `EXPO_PUBLIC_API_URL` | 백엔드 API URL | `http://localhost:8080` |
| `EXPO_PUBLIC_GRAFANA_URL` | Grafana 대시보드 URL | `http://localhost:3000` |

---

## 📡 API 명세

### 인증

```
POST /api/auth/register        # 회원가입
POST /api/auth/login           # 로그인 → JWT 발급
```

### 폰 가격

```
GET  /api/phones                        # 전체 폰 목록 (페이지네이션)
GET  /api/phones/{id}/prices            # 가격 히스토리 (최근 100건)
GET  /api/phones/{id}/prices/latest     # 현재 최저가
GET  /api/phones/search?keyword=갤럭시  # 키워드 검색
```

### 관심 목록

```
POST   /api/watchlist           # 관심 등록 (목표가 포함)
DELETE /api/watchlist/{id}      # 관심 해제
GET    /api/watchlist           # 내 관심 목록 조회
```

### 게시판

```
GET    /api/posts               # 게시글 목록
POST   /api/posts               # 게시글 작성 (인증 필요)
GET    /api/posts/{id}          # 게시글 상세
DELETE /api/posts/{id}          # 게시글 삭제 (작성자만)
POST   /api/posts/{id}/comments # 댓글 작성
```

**공통 응답 형식:**
```json
{
  "success": true,
  "data": { ... },
  "message": null
}
```

---

## 📊 모니터링

### Prometheus 커스텀 메트릭

| 메트릭 | 타입 | 설명 |
|--------|------|------|
| `crawler_success_count_total` | Counter | 크롤링 성공 횟수 |
| `crawler_fail_count_total` | Counter | 크롤링 실패 횟수 |
| `crawler_duration_seconds` | Timer | 크롤링 소요시간 |
| `alert_sent_count_total` | Counter | FCM 알림 발송 횟수 |
| `api_active_users` | Gauge | 관심 목록 등록 사용자 수 |

### Grafana 대시보드

`http://localhost:3000` 접속 시 자동 프로비저닝된 대시보드 확인 가능:

- 크롤링 성공/실패율 (라인 차트)
- API 응답시간 p99 (게이지)
- 활성 관심 사용자 수 (스탯)
- JVM 힙 사용률 (라인 차트)
- FCM 알림 발송 추이 (바 차트)
- HTTP 5xx 에러율 (라인 차트)

---

## ☸️ Kubernetes 배포

```bash
# 네임스페이스 생성
kubectl apply -f k8s/namespace.yaml

# Secret 적용 (민감 정보 base64 인코딩 필요)
kubectl apply -f k8s/secret/

# ConfigMap, PVC, Deployment, Service 순서로 적용
kubectl apply -f k8s/configmap/
kubectl apply -f k8s/pvc/
kubectl apply -f k8s/deployment/
kubectl apply -f k8s/service/
kubectl apply -f k8s/ingress/

# 상태 확인
kubectl get pods -n sungji-phone
```

자세한 내용은 [`k8s/README.md`](./k8s/README.md)를 참고하세요.

---

## 🔒 보안 주의사항

다음 파일들은 `.gitignore`에 등록되어 있으며 **절대 커밋하면 안 됩니다:**

- `firebase-service-account.json` — Firebase 서비스 계정 키
- `.env` — 환경변수 파일
- `k8s/secret/*.yaml` — Kubernetes 시크릿 (실제 값 포함 시)

---

## 📜 라이선스

MIT License © 2024 JiksGit
