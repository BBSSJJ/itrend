# Manual Kubernetes deployment

## 사용자 문제와 범위

ITrend를 노트북의 가상 머신으로 구성한 kubeadm 클러스터에 수동 배포하고,
공유기나 VM 네트워크에 인바운드 포트 포워딩을 추가하지 않은 채 Cloudflare
Tunnel로 웹 UI만 공개한다.

이번 작업은 다음을 포함한다.

- Collector, Server, Frontend의 재현 가능한 컨테이너 이미지
- 현재 클러스터의 로컬 디스크를 사용하는 PostgreSQL과 Collector 상태 저장소
- Cloudflare Tunnel이 Frontend Service로 직접 연결하는 Kubernetes 리소스
- Frontend Nginx의 React 정적 파일 제공과 `/api` 내부 프록시
- 이미지 빌드, 비밀 생성, 배포, 검증 및 롤백 수동 절차

클러스터 업그레이드, 도메인 구입, Cloudflare 계정 설정 자동화, 고가용성
데이터베이스와 CI 이미지 배포는 범위에 포함하지 않는다.

## 구현 전 확인한 근거

- 클러스터는 control-plane 1대와 worker 2대로 구성되며 모두 amd64이다.
- 노트북은 arm64이고 클러스터 노드는 VM 전용 `192.168.45.0/24` 대역을 사용한다.
- 클러스터에는 StorageClass, PV/PVC, IngressClass와 애플리케이션 리소스가 없다.
- Frontend는 상대 `/api` URL을 사용하지만 프로덕션 웹 서버 설정은 없다.
- Server는 PostgreSQL 연결 환경변수와 멱등 `schema.sql`을 이미 제공한다.
- Collector 제어 HTTP API에는 인증이 없고 수집 상태를 `state.json`에 저장한다.

## 구현 단계

1. 각 구성요소에 최소 권한 멀티스테이지 Dockerfile과 build context 제외 파일을
   추가한다.
2. Frontend 이미지에 Nginx 설정을 포함해 정적 자산, 상태 확인, `/api` 프록시를
   제공한다.
3. `deploy/k8s`에 namespace, 로컬 PV/PVC, PostgreSQL, Server, Frontend,
   Collector Job 템플릿과 cloudflared Deployment를 추가한다.
4. 실제 값이 없는 Secret 예제와 수동 명령만 버전 관리하고 토큰과 API 키는 절대
   파일로 저장하지 않는다.
5. 루트 문서와 아키텍처에 선택된 배포 경계, 준비, 검증 및 롤백 절차를 반영한다.
6. 정적 매니페스트 검사, 컨테이너 빌드와 저장소 전체 검증을 실행한다.

## 중요한 결정

- SSH 없이 kubectl 임시 준비 Pod로 worker 1에 로컬 이미지를 import한다.
  `deploy/local-quick`은 해당 노드에 앱을 고정하고 레지스트리 pull을 하지 않는다.
  준비 Pod는 작업 후 삭제하고 시험 데이터베이스는 기존 로컬 DB와 분리한다.

- 도메인 없는 초기 시험은 `deploy/quick` overlay를 사용한다. Tunnel 토큰 참조를
  제거하고 단일 복제본과 Recreate 업데이트로 임시 공개 주소를 관리한다.

- 외부 진입점은 Cloudflare Tunnel 하나만 사용하고 Ingress Controller와
  LoadBalancer는 설치하지 않는다.
- Frontend Nginx가 `/api`를 Server ClusterIP로 전달하므로 브라우저는 동일 출처만
  사용한다.
- Collector는 외부 서비스가 아니라 세 단계가 순차 실행되는 Kubernetes Job으로
  실행한다.
- 현재 StorageClass가 없으므로 `k8s-worker-1`의 명시적 local PersistentVolume을
  사용하고 `Retain` 정책을 적용한다. 이는 단일 노드 장애 시 자동 복구되지 않는
  초기 배포용 선택이다.
- 노트북과 노드 아키텍처가 다르므로 이미지는 `linux/amd64`로 빌드한다.

## 완료 조건

- 세 애플리케이션 이미지가 `linux/amd64`로 빌드된다.
- `kubectl kustomize deploy/k8s`가 유효한 단일 매니페스트를 생성한다.
- Frontend만 cloudflared의 공개 라우트 대상이고 Server, Collector, PostgreSQL은
  ClusterIP 또는 Job으로만 존재한다.
- PostgreSQL과 Collector 상태가 Pod 재생성 후에도 유지된다.
- 저장소에 비밀값이나 생성된 런타임 파일이 추가되지 않는다.
- `./scripts/check`가 통과하거나 환경 차단 원인이 정확히 기록된다.

## 후속 작업

- 시험 배포는 완료했다. 상시 운영 전 지원 중인 Kubernetes 버전으로 순차 업그레이드한다.
- 로컬 PV의 정기 외부 백업과 복원 훈련을 추가한다.
- 운영 경험이 쌓이면 Collector 스케줄을 분리된 CronJob과 DB 기반 수집 상태로
  전환한다.

## 완료 결과와 검증 경계

- 세 amd64 이미지를 빌드하고 `deploy/local-quick`으로 실제 클러스터에 배포했다.
- Frontend, Server, PostgreSQL과 Quick Tunnel 기동 및 공개 HTTPS 상태 확인과
  기사 목록 API 응답을 검증했다. 배포 DB는 신규 기사 0건으로 시작하며 Collector는
  자동 실행 중지 상태다.
- 세 Kustomization 렌더링과 저장소 전체 검증을 통과했다.
- PV/PVC 연결은 확인했지만 데이터가 있는 상태의 Pod 재생성 및 외부 백업 복원
  시험은 아직 수행하지 않았다. Groq를 포함한 배포 환경 수집도 후속 검증 대상이다.
