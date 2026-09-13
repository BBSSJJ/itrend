# Manual Kubernetes deployment

이 문서는 노트북의 가상 머신으로 구성한 kubeadm 클러스터에 ITrend를 수동
배포하고 Cloudflare Tunnel로 공개하는 절차다. Cloudflare Tunnel이 Frontend의
ClusterIP Service로 직접 연결하므로 Ingress Controller, LoadBalancer와 공유기
포트 포워딩은 사용하지 않는다.

## 도메인 없는 시험 배포 (현재 선택)

현재 클러스터의 레지스트리 없는 시험은 `deploy/local-quick`을 사용한다.
로컬의 amd64 `itrend-{server,frontend,collector}:test` 이미지를 worker 1의
containerd `k8s.io` namespace에 import한 뒤 `kubectl apply -k deploy/local-quick`으로
배포한다. 이 구성은 앱을 worker 1에 고정하고 `imagePullPolicy: Never`를 사용한다.
이미지 준비 없이 적용하면 `ErrImageNeverPull`이 발생한다. 시험 태그를 다시 import한
뒤에는 해당 Deployment를 `kubectl rollout restart`해야 새 이미지가 반영된다.
노드 준비용 Pod의 containerd 소켓 접근은 관리자 권한이므로 준비 직후 제거한다.
현재 localhost API 전달 경로에서 큰 WebSocket 전송이 타임아웃될 수 있으므로,
이미지 tar를 gzip으로 압축하고 `KUBECTL_REMOTE_COMMAND_WEBSOCKETS=false`를 지정한
`kubectl exec -i`로 전송한다. 준비 Pod에서 압축을 풀어
`ctr --address /run/containerd/containerd.sock --namespace k8s.io images import --platform linux/amd64 -`
표준 입력으로 전달한다.
새 시험 DB를 사용하며 기존 노트북 DB는 자동 이전하지 않는다. Groq 키를 넣기 전까지
Collector는 중지된 상태로 유지한다.

`deploy/quick`은 기존 앱 구성을 재사용하고 Tunnel만 Quick Tunnel로 바꾼다.
Cloudflare 계정, 도메인, Tunnel 토큰 Secret은 필요 없다. DB와 Collector의 앱
Secret, 이미지 배포, worker 디스크 준비는 아래 절차대로 여전히 필요하다.
아래 명령은 앱 이미지와 저장소 준비를 완료한 뒤 실행한다.

```bash
kubectl apply -k deploy/quick
kubectl -n itrend rollout status deployment/cloudflared --timeout=120s
kubectl -n itrend logs deployment/cloudflared --tail=100
```

로그의 `https://…trycloudflare.com` 주소로 접속한다. Frontend가 준비된 뒤 화면과
`/api/articles?page=0&size=1` 응답을 확인한다. 이 모드에서는 아래의 Cloudflare
토큰 생성 및 공개 hostname 등록 절차를 건너뛰고 `apply -k deploy/k8s` 대신
`apply -k deploy/quick`을 사용한다. 기본 구성과 Quick 구성을 번갈아 적용하지 않는다.

Quick Tunnel은 프로세스마다 다른 주소를 발급하므로 복제본을 1개로 제한하고
Recreate 업데이트를 사용한다. 네트워크 일시 장애로 주소가 자주 바뀌지 않도록
연결 상태는 readiness만 검사한다. 프로세스 종료 시 Kubernetes가 재시작한다.
Pod 재생성 또는 노트북/VM 재시작 후에는 로그에서 새 주소를 확인한다.

임시 주소는 누구나 접속 가능한 공개 URL이다. 시험을 마치면 다음 명령으로 닫는다.
Quick 구성을 다시 적용하면 Tunnel이 다시 켜진다.

```bash
kubectl -n itrend scale deployment/cloudflared --replicas=0
```

Quick Tunnel은 가용성 보장이 없는 개발·시험용이며 동시 요청 200개 제한과 SSE
미지원 제약이 있다. [Cloudflare 공식 안내](https://developers.cloudflare.com/tunnel/setup/).

현재 클러스터의 Kubernetes 1.31은 지원이 종료됐다. 내부 검증에는 사용할 수 있지만
현재 Quick Tunnel 시험 공개와 별개로, 상시 운영 전에 지원되는 버전으로 순차
업그레이드한다.

## 배포 구조

```text
Internet
   |
Cloudflare Tunnel
   |
cloudflared Deployment
   |
Frontend Nginx :8080
   |-- /       React static files
   `-- /api    Server :8080
                     |
                 PostgreSQL

Collector Job ------'
```

PostgreSQL과 Collector 상태는 `k8s-worker-1`의 로컬 디스크를 사용한다. 노드가
중단되면 데이터가 자동으로 다른 노드에 복제되지 않는다. `Retain` 정책은 Kubernetes
리소스를 잘못 지워도 호스트 데이터를 자동 삭제하지 않지만 별도 백업을 대신하지
않는다.

## 사전 준비

- 정식 Tunnel 모드에서만 Cloudflare에서 관리하는 도메인과 remotely-managed Tunnel
- GitHub Container Registry에 push할 수 있는 계정
- Docker Buildx, kubectl
- 클러스터 노드가 GHCR, RSS 출처, Groq와 Cloudflare에 outbound HTTPS로 연결 가능

이미지 태그가 정확한 소스를 가리키도록 커밋이 끝난 깨끗한 working tree에서
빌드한다.

worker 1에 영구 데이터 디렉터리를 만든다.

```bash
sudo install -d -m 0770 -o 70 -g 70 /var/lib/itrend/postgres
sudo install -d -m 0770 -o 1000 -g 1000 /var/lib/itrend/collector
```

이 명령은 `k8s-worker-1` 안에서 실행해야 한다.

## 이미지 빌드와 push

노트북은 arm64, 클러스터 노드는 amd64이므로 플랫폼을 명시한다. GHCR에 먼저
로그인하고 저장소 루트에서 실행한다.

```bash
export ITREND_DEPLOY_TAG="$(git rev-parse --short HEAD)"

docker buildx build --platform linux/amd64 \
  -f collector/Dockerfile \
  -t ghcr.io/bbssjj/itrend-collector:manual \
  -t "ghcr.io/bbssjj/itrend-collector:${ITREND_DEPLOY_TAG}" \
  --push .

docker buildx build --platform linux/amd64 \
  -f server/Dockerfile \
  -t ghcr.io/bbssjj/itrend-server:manual \
  -t "ghcr.io/bbssjj/itrend-server:${ITREND_DEPLOY_TAG}" \
  --push .

docker buildx build --platform linux/amd64 \
  -f frontend/Dockerfile \
  -t ghcr.io/bbssjj/itrend-frontend:manual \
  -t "ghcr.io/bbssjj/itrend-frontend:${ITREND_DEPLOY_TAG}" \
  --push .
```

패키지가 private이면 `ghcr-credentials` Secret을 만들고 각 Pod template에
`imagePullSecrets`를 추가해야 한다. 초기 수동 배포에서는 패키지를 public으로
두는 구성이 가장 단순하다.

## Secret 생성

namespace를 먼저 만들고 터미널에서 비밀값을 입력한다. 입력값은 Git 파일에 쓰지
않는다.

```bash
kubectl apply -f deploy/k8s/namespace.yaml

read -rs "ITREND_DB_PASSWORD?DB password: "; echo
read -rs "ITREND_COLLECTOR_KEY?Collector API key: "; echo
read -rs "ITREND_GROQ_KEY?Groq API key: "; echo

kubectl -n itrend create secret generic itrend-secrets \
  --from-literal=DB_NAME=itrend \
  --from-literal=DB_USER=itrend \
  --from-literal=DB_PASSWORD="$ITREND_DB_PASSWORD" \
  --from-literal=COLLECTOR_API_KEY="$ITREND_COLLECTOR_KEY" \
  --from-literal=GROQ_API_KEY="$ITREND_GROQ_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

unset ITREND_DB_PASSWORD ITREND_COLLECTOR_KEY ITREND_GROQ_KEY
```

Cloudflare Zero Trust 대시보드에서 Tunnel을 만든 뒤 Docker 설치 명령 전체가 아니라
토큰 값만 복사한다.

```bash
read -rs "ITREND_TUNNEL_TOKEN?Cloudflare Tunnel token: "; echo

kubectl -n itrend create secret generic cloudflare-tunnel-token \
  --from-literal=token="$ITREND_TUNNEL_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -

unset ITREND_TUNNEL_TOKEN
```

## 애플리케이션 배포

```bash
kubectl kustomize deploy/k8s >/dev/null
kubectl apply -k deploy/k8s

kubectl -n itrend set image deployment/itrend-server \
  server="ghcr.io/bbssjj/itrend-server:${ITREND_DEPLOY_TAG}"
kubectl -n itrend set image deployment/itrend-frontend \
  frontend="ghcr.io/bbssjj/itrend-frontend:${ITREND_DEPLOY_TAG}"
kubectl -n itrend set image cronjob/itrend-collector \
  collector="ghcr.io/bbssjj/itrend-collector:${ITREND_DEPLOY_TAG}"

kubectl -n itrend rollout status statefulset/itrend-postgres --timeout=5m
kubectl -n itrend rollout status deployment/itrend-server --timeout=5m
kubectl -n itrend rollout status deployment/itrend-frontend --timeout=5m
kubectl -n itrend rollout status deployment/cloudflared --timeout=5m
```

`SPRING_SQL_INIT_MODE=always`가 이미지 안의 멱등 `schema.sql`을 Server 시작 전에
적용한다. 이후 JPA의 `ddl-auto=validate`가 스키마와 엔티티 일치를 검사한다.

## 기존 로컬 데이터 이전

Docker Compose PostgreSQL의 기존 기사를 유지하려면 공개 전에 한 번 이전한다.
백업 파일은 비밀 또는 운영 데이터로 취급하며 저장소 밖에 만들고 작업 후 안전하게
보관하거나 삭제한다.

```bash
docker compose exec -T postgres \
  pg_dump -U itrend -d itrend --clean --if-exists --no-owner --no-privileges \
  > /tmp/itrend-before-kubernetes.sql

kubectl -n itrend scale deployment/itrend-server --replicas=0
kubectl -n itrend exec -i statefulset/itrend-postgres -- \
  psql -U itrend -d itrend \
  < /tmp/itrend-before-kubernetes.sql
kubectl -n itrend scale deployment/itrend-server --replicas=1
kubectl -n itrend rollout status deployment/itrend-server --timeout=5m
```

이전 전후 `articles`, `sources`, `tags` 행 수를 비교한다. 운영 DB에 이미 새 데이터가
있다면 `--clean` 복원은 사용하지 말고 병합 계획을 별도로 세운다.

## Cloudflare 공개 hostname

Cloudflare Tunnel의 Public Hostname에 사용할 도메인을 등록하고 Service를 다음과
같이 설정한다.

```text
Type: HTTP
URL:  itrend-frontend.itrend.svc.cluster.local:80
```

브라우저는 Cloudflare가 발급한 HTTPS hostname으로 접속한다. Server, PostgreSQL과
Collector에는 공개 hostname을 만들지 않는다.

## 검증

먼저 Tunnel을 거치지 않고 Frontend와 내부 API를 확인한다.

```bash
kubectl -n itrend get pods,svc,pvc
kubectl -n itrend port-forward service/itrend-frontend 8080:80
```

다른 터미널에서 확인한다.

```bash
curl --fail http://127.0.0.1:8080/healthz
curl --fail 'http://127.0.0.1:8080/api/articles?page=0&size=1'
kubectl -n itrend logs deployment/cloudflared --tail=100
```

위 검증 후 공개 hostname에서도 `/healthz`와 기사 목록을 확인한다.

## Collector 수동 실행

CronJob은 기본적으로 `suspend: true`이므로 자동 실행되지 않는다. 필요할 때 현재
템플릿으로 일회성 Job을 만든다.

```bash
export ITREND_JOB_NAME="itrend-collector-$(date +%Y%m%d%H%M%S)"
kubectl -n itrend create job \
  --from=cronjob/itrend-collector "$ITREND_JOB_NAME"
kubectl -n itrend logs -f "job/$ITREND_JOB_NAME"
kubectl -n itrend wait --for=condition=complete \
  --timeout=6h "job/$ITREND_JOB_NAME"
```

자동 수집을 승인한 뒤에는 스케줄과 실행 비용을 다시 검토하고 `suspend: false`로
변경한다.

## 업데이트와 롤백

새 커밋 태그로 이미지를 push한 뒤 `kubectl set image`와 `rollout status`를 다시
실행한다. 문제가 생기면 직전 정상 커밋 태그를 명시한다.

```bash
export ITREND_PREVIOUS_TAG="<previous-tag>"
kubectl -n itrend set image deployment/itrend-frontend \
  frontend="ghcr.io/bbssjj/itrend-frontend:${ITREND_PREVIOUS_TAG}"
kubectl -n itrend rollout status deployment/itrend-frontend --timeout=5m
```

StatefulSet이나 PVC를 삭제하는 방식으로 롤백하지 않는다. DB 변경 전에는
PostgreSQL 백업을 먼저 만들고 복원 가능 여부를 확인한다.
