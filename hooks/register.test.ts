import { expect, mock, test } from 'claude-code/testing'

const NOW = 1_800_000_000_000
const MIN = 60 * 1000
const DAY = 24 * 60 * MIN

// ageMs: when the lesson file was last written. quizAgeMs: when its quiz file was, if it has one.
type Lesson = { topic: string; status: string; ageMs: number; quizAgeMs?: number }

function seed(on: any, lessons: Lesson[], { unreadable = false } = {}) {
  const named = lessons.map((l, i) => ({ ...l, name: `${String(i + 1).padStart(2, '0')}.md` }))
  const entry = (name: string, kind: string, ageMs: number) => ({ name, kind, size: 1, mtimeMs: NOW - ageMs, isLink: false })

  mock.clock(on, { now: NOW })
  on('env.get', () => ({ value: '/h' }))
  on('fs.exists', () => ({ value: true }))
  on('fs.list', (_: unknown, e: { path?: string }) => {
    const [, topic, sub] = e.path?.match(/^\/h\/study(?:\/([^/]+))?(?:\/(lessons|quiz))?$/) ?? []
    if (!topic) return { value: [...new Set(lessons.map(l => l.topic))].map(name => entry(name, 'dir', DAY)) }
    const mine = named.filter(l => l.topic === topic)
    if (sub === 'lessons') return { value: mine.map(l => entry(l.name, 'file', l.ageMs)) }
    if (sub === 'quiz') return { value: mine.filter(l => l.quizAgeMs !== undefined).map(l => entry(l.name, 'file', l.quizAgeMs!)) }
    return { value: [entry('curriculum.md', 'file', DAY), entry('weak.md', 'file', DAY)] }
  })
  on('fs.read', (_: unknown, e: { path?: string }) => {
    if (unreadable) throw new Error('unreadable')
    const lesson = named.find(l => e.path === `/h/study/${l.topic}/lessons/${l.name}`)
    return { value: `# 제목\n상태: ${lesson?.status}\n\n## 다룬 내용\n` }
  })
  on('prompt.suggest', () => ({ isShown: true }))
}

test('a guess is hidden while a lesson is in its quiz', async ($, on) => {
  seed(on, [{ topic: 'backend', status: '문제 중', ageMs: 2 * MIN }])
  expect(await $.prompt.suggest({ text: '정답은 JVM' })).toEqual({ isShown: false })
})

test('a guess is hidden during the lesson and review too', async ($, on) => {
  seed(on, [{ topic: 'backend', status: '수업 중', ageMs: 0 }, { topic: 'backend', status: '복습 중', ageMs: 0 }])
  expect((await $.prompt.suggest({ text: '다음' })).isShown).toBe(false)
})

test('a guess shows once every lesson is done', async ($, on) => {
  seed(on, [{ topic: 'backend', status: '완료', ageMs: 0 }])
  expect((await $.prompt.suggest({ text: '다음' })).isShown).toBe(true)
})

test('a lesson left mid-way for over an hour no longer hides guesses', async ($, on) => {
  seed(on, [{ topic: '리눅스', status: '문제 중', ageMs: 4 * DAY, quizAgeMs: 4 * DAY }])
  expect((await $.prompt.suggest({ text: 'Steam 왜 꺼짐' })).isShown).toBe(true)
})

test('a long quiz keeps hiding guesses while only the quiz file is being written', async ($, on) => {
  seed(on, [{ topic: 'backend', status: '문제 중', ageMs: 2 * 60 * MIN, quizAgeMs: MIN }])
  expect((await $.prompt.suggest({ text: '정답' })).isShown).toBe(false)
})

test('a lesson in use in one topic hides guesses beside an abandoned one in another', async ($, on) => {
  seed(on, [
    { topic: '리눅스', status: '문제 중', ageMs: 90 * MIN },
    { topic: 'backend', status: '문제 중', ageMs: 59 * MIN },
  ])
  expect((await $.prompt.suggest({ text: '정답' })).isShown).toBe(false)
})

test('a failed check hides the guess', async ($, on) => {
  seed(on, [{ topic: 'backend', status: '문제 중', ageMs: 0 }], { unreadable: true })
  expect((await $.prompt.suggest({ text: '정답' })).isShown).toBe(false)
})
