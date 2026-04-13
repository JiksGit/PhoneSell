# 성지폰 트래커 — Kubernetes 배포 가이드

## 디렉터리 구조

```
k8s/
├── namespace.yaml
├── configmap/
│   ├── mysql-init-configmap.yaml
│   ├── backend-configmap.yaml
│   ├── prometheus-configmap.yaml
│   └── grafana-provisioning-configmap.yaml
├── secret/
│   ├── mysql-secret.yaml
│   ├── backend-secret.yaml
│   ├── grafana-secret.yaml
│   └── firebase-secret.yaml          # Firebase JSON 주입 전 수정 필요
├── pvc/
│   ├── mysql-pvc.yaml                # 10Gi
│   ├── prometheus-pvc.yaml           # 5Gi
│   └── grafana-pvc.yaml              # 2Gi
├── deployment/
│   ├── mysql-deployment.yaml
│   ├── backend-deployment.yaml       # replicas: 2
│   ├── prometheus-deployment.yaml
│   └── grafana-deployment.yaml
├── service/
│   ├── mysql-service.yaml            # ClusterIP :3306
│   ├── backend-service.yaml          # ClusterIP :8080
│   ├── prometheus-service.yaml       # ClusterIP :9090
│   └── grafana-service.yaml          # ClusterIP :3000
└── ingress/
    └── ingress.yaml                  # 비활성화 (주석 처리)
```

---

## 사전 준비

### 1. 백엔드 Docker 이미지 빌드

```bash
# backend/ 디렉터리에서 실행
./gradlew bootJar
docker build -t sungji-backend:latest ./backend

# minikube를 사용하는 경우 (이미지를 minikube 내부로 로드)
minikube image load sungji-backend:latest
```

### 2. Secret 수정

운영 환경에서는 `secret/` 디렉터리의 base64 플레이스홀더를 실제 값으로 교체하세요.

```bash
# base64 인코딩 예시
echo -n "your-actual-password" | base64

# 디코딩 확인
echo "base64문자열" | base64 --decode
```

| 파일 | 키 | 기본값 |
|------|-----|--------|
| mysql-secret.yaml | mysql-password | sungjipassword |
| mysql-secret.yaml | mysql-root-password | rootpassword |
| backend-secret.yaml | jwt-secret | **반드시 교체** (32자 이상) |
| grafana-secret.yaml | admin-password | admin |

### 3. Firebase Secret 주입

Firebase 서비스 계정 JSON 파일을 Secret으로 생성합니다.

```bash
# firebase-service-account.json 파일이 있는 경우 (권장)
kubectl create secret generic firebase-secret \
  --from-file=firebase-service-account.json=./firebase-service-account.json \
  -n sungji-phone \
  --dry-run=client -o yaml | kubectl apply -f -
```

또는 `k8s/secret/firebase-secret.yaml`의 `CHANGE_ME_...` 부분을 아래 명령어 출력값으로 교체:

```bash
# Linux/Mac
base64 -w 0 firebase-service-account.json

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-service-account.json"))
```

---

## 배포 순서

아래 순서를 반드시 지켜야 합니다. (의존 관계: Namespace → Secret/ConfigMap/PVC → MySQL → Backend → Prometheus → Grafana)

```bash
# 1. Namespace 생성
kubectl apply -f k8s/namespace.yaml

# 2. ConfigMap 생성
kubectl apply -f k8s/configmap/

# 3. Secret 생성 (firebase-secret은 위 '사전 준비 3' 참고)
kubectl apply -f k8s/secret/mysql-secret.yaml
kubectl apply -f k8s/secret/backend-secret.yaml
kubectl apply -f k8s/secret/grafana-secret.yaml
# kubectl apply -f k8s/secret/firebase-secret.yaml  # firebase-secret은 kubectl create로 생성 권장

# 4. PVC 생성
kubectl apply -f k8s/pvc/

# 5. MySQL 배포 및 Ready 대기
kubectl apply -f k8s/deployment/mysql-deployment.yaml
kubectl apply -f k8s/service/mysql-service.yaml
kubectl wait --for=condition=ready pod -l component=mysql -n sungji-phone --timeout=120s

# 6. Backend 배포
kubectl apply -f k8s/deployment/backend-deployment.yaml
kubectl apply -f k8s/service/backend-service.yaml

# 7. Prometheus 배포
kubectl apply -f k8s/deployment/prometheus-deployment.yaml
kubectl apply -f k8s/service/prometheus-service.yaml

# 8. Grafana 배포
kubectl apply -f k8s/deployment/grafana-deployment.yaml
kubectl apply -f k8s/service/grafana-service.yaml
```

또는 한 번에 전체 배포:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap/
kubectl apply -f k8s/secret/mysql-secret.yaml -f k8s/secret/backend-secret.yaml -f k8s/secret/grafana-secret.yaml
kubectl apply -f k8s/pvc/
kubectl apply -f k8s/deployment/ -f k8s/service/
```

---

## 배포 상태 확인

```bash
# Pod 상태 확인
kubectl get pods -n sungji-phone

# 전체 리소스 확인
kubectl get all -n sungji-phone

# 로그 확인
kubectl logs -f deployment/sungji-backend -n sungji-phone
kubectl logs -f deployment/mysql           -n sungji-phone
```

---

## 포트 포워딩 (로컬 접근)

ClusterIP 서비스는 클러스터 외부에서 접근할 수 없으므로, 개발/디버깅 시 port-forward를 사용합니다.

```bash
# Spring Boot API  →  http://localhost:8080
kubectl port-forward svc/sungji-backend 8080:8080 -n sungji-phone

# Prometheus       →  http://localhost:9090
kubectl port-forward svc/prometheus 9090:9090 -n sungji-phone

# Grafana          →  http://localhost:3000  (admin / admin)
kubectl port-forward svc/grafana 3000:3000 -n sungji-phone

# MySQL (DBeaver)  →  localhost:3307
kubectl port-forward svc/mysql 3307:3306 -n sungji-phone
```

---

## Ingress 활성화 (선택)

외부 도메인으로 노출하려면 `k8s/ingress/ingress.yaml`의 주석을 해제하고 host를 수정한 뒤 적용합니다.

```bash
# Nginx Ingress Controller 설치 (미설치 시)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Ingress 적용
kubectl apply -f k8s/ingress/ingress.yaml
```

---

## 전체 삭제

```bash
kubectl delete namespace sungji-phone
```

> **주의**: namespace 삭제 시 PVC를 포함한 모든 리소스가 삭제됩니다. 데이터를 보존하려면 먼저 백업하세요.
