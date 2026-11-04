# study

Claude Code에서 주제별 커리큘럼을 차시로 나눠 공부하는 플러그인. 매 차시는 수업 → 문제 → 복습 순서로 진행하고, 진도와 약점을 `~/study/<주제>/`에 마크다운으로 기록해서 다음 세션에 그대로 이어 한다.

- `/study:study new <주제>`: 목표, 수준, 자료를 묻고 커리큘럼을 짠다
- `/study:study`: 다음 차시 진행 (수업 → 문제 → 복습 → 마무리)
- `/study:study status`: 진도와 복습 대기 중인 약점만 보기

문제는 그 차시 수업에서 실제로 다룬 내용과 헷갈려한 부분에서만 낸다. 틀린 개념은 1, 3, 7차시 뒤에 다시 나온다(간격 반복). 수업, 문제, 복습 중에는 입력창의 추천 문구를 숨겨서 정답이 미리 보이지 않게 한다.

## 설치

Claude Code 프롬프트에서:

```
/plugin install study --marketplace fun653359/study
```

셸에서:

```
claude plugin install study --marketplace fun653359/study
```

`Add marketplace?`에는 `y`, 범위는 user를 고른다.

비공개 저장소라서 설치하는 컴퓨터에 github.com용 git 인증이 있어야 한다(설치 중에 따로 묻지 않는다). 먼저 `gh auth login`, `gh auth setup-git`을 해 둔다.

## 기록 구조

```
~/study/<주제>/
├── curriculum.md   # 목표, 수준, 차시 목록, 진도
├── lessons/NN.md   # 차시별 수업 기록과 상태
├── quiz/NN.md      # 문제, 답, 채점
└── weak.md         # 약점과 복습 일정
```
