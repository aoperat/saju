# GitHub Secrets 설정 가이드

GitHub Pages 배포를 위해 다음 환경 변수들을 GitHub Secrets에 추가해야 합니다.

## 설정 방법

1. GitHub 저장소로 이동
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 버튼 클릭
4. 다음 3개의 Secret을 각각 추가:

### 1. VITE_OPENAI_API_KEY
- **Name**: `VITE_OPENAI_API_KEY`
- **Value**: OpenAI API 키 (예: `sk-...`)

### 2. VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Supabase 프로젝트 URL (예: `https://xxxxx.supabase.co`)

### 3. VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Supabase Anon (공개) 키

## 확인 방법

Secrets를 추가한 후:
1. **Actions** 탭으로 이동
2. 최신 워크플로우 실행을 확인하거나
3. **Actions** → **Deploy to GitHub Pages** → **Run workflow** 클릭하여 수동 실행

빌드가 성공하면 환경 변수가 정상적으로 주입된 것입니다.

## 참고

- Secrets는 저장소 설정에서만 볼 수 있으며, 값은 다시 확인할 수 없습니다
- Secrets를 수정하면 다음 배포부터 적용됩니다
- 로컬 개발을 위해서는 `.env` 파일에 동일한 변수들을 설정하세요
