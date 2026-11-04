import { expect, test } from 'claude-code/testing'

function seed(on: any, lesson: string) {
  on('env.get', () => ({ value: '/h' }))
  on('fs.exists', () => ({ value: true }))
  on('fs.list', (_: unknown, e: { path?: string }) => ({
    value: e.path === '/h/study'
      ? [{ name: 'backend', kind: 'dir', size: 0, mtimeMs: 0, isLink: false }]
      : [{ name: '01.md', kind: 'file', size: 1, mtimeMs: 0, isLink: false }],
  }))
  on('fs.read', () => ({ value: `# 01. 제목\n${lesson}\n\n## 다룬 내용\n` }))
  on('prompt.suggest', () => ({ isShown: true }))
}

test('a guess is hidden while a lesson is in its quiz', async ($, on) => {
  seed(on, '상태: 문제 중')
  expect(await $.prompt.suggest({ text: '정답은 JVM' })).toEqual({ isShown: false })
})

test('a guess is hidden during the lesson and review too', async ($, on) => {
  seed(on, '상태: 수업 중')
  expect((await $.prompt.suggest({ text: '다음' })).isShown).toBe(false)
})

test('a guess shows once every lesson is done', async ($, on) => {
  seed(on, '상태: 완료')
  expect((await $.prompt.suggest({ text: '다음' })).isShown).toBe(true)
})
