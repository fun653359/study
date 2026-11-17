import type { Register } from 'claude-code'

// The skill keeps each lesson's stage in ~/study/<topic>/lessons/NN.md as "상태: ...".
// While a lesson is mid-way, a guessed next prompt (the engine's or any plugin's) could give an answer away.
const ACTIVE = /^상태: (수업 중|문제 중|복습 중)\s*$/m

// The skill writes to a topic at every step: the lesson file while teaching, quiz/NN.md for each
// question and grade, weak.md during review. A topic untouched for an hour was left mid-way rather
// than being studied, and must not hide guesses in every later conversation.
const IDLE_MS = 60 * 60 * 1000

export const register: Register = on => {
  on('prompt.suggest', async ($, e, next) => {
    const root = `${await $.env.get('HOME')}/study`
    if (!(await $.fs.exists(root))) return next(e)

    const since = (await $.clock.now()) - IDLE_MS
    for (const topic of await $.fs.list(root)) {
      if (topic.kind !== 'dir') continue
      const dir = `${root}/${topic.name}`
      if (!(await $.fs.exists(`${dir}/lessons`))) continue

      const lessons = (await $.fs.list(`${dir}/lessons`)).filter(f => f.kind === 'file' && f.name.endsWith('.md'))
      const quizzes = (await $.fs.exists(`${dir}/quiz`)) ? await $.fs.list(`${dir}/quiz`) : []
      const touched = [...(await $.fs.list(dir)), ...lessons, ...quizzes].some(f => f.mtimeMs >= since)
      if (!touched) continue

      for (const file of lessons) {
        if (ACTIVE.test(await $.fs.read(`${dir}/lessons/${file.name}`))) return { isShown: false }
      }
    }
    return next(e)
  }).catch(($, e, next) =>
    // A failed check hides the guess: a missing suggestion costs nothing, a spoiled answer does.
    next.called ? next(e) : { isShown: false },
  )
}
