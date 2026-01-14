# GitHub Push 가이드

## 방법 1: Personal Access Token 사용 (추천)

1. GitHub에서 Personal Access Token 생성
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token
   - 권한 선택: `repo` (전체 선택)
   - 토큰 복사

2. Push 실행
```bash
cd /home/user/ibk
git remote set-url origin https://YOUR_TOKEN@github.com/everyholiday1230/ibk.git
git push -u origin main
```

## 방법 2: SSH Key 사용

1. SSH Key 설정 (이미 설정되어 있다면 스킵)
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# 출력된 키를 GitHub → Settings → SSH keys에 추가
```

2. Push 실행
```bash
cd /home/user/ibk
git remote set-url origin git@github.com:everyholiday1230/ibk.git
git push -u origin main
```

## 현재 상태

✅ 첫 커밋 완료
✅ 16개 파일 ready
✅ 프로젝트 구조 완성

Push만 하시면 GitHub에서 확인 가능합니다!
