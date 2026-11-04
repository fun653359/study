import type { Register } from 'claude-code'

// The skill keeps each lesson's stage in ~/study/<topic>/lessons/NN.md as "상태: ...".
// While any lesson is mid-way, a guessed next prompt (the engine's or any plugin's) could give an answer away.
const ACTIVE = /^상태: (수업 중|문제 중|복습 중)\s*$/m

export const register: Register = on => {
  on('prompt.suggest', async ($, e, next) => {
    const root = `${await $.env.get('HOME')}/study`
    if (!(await $.fs.exists(root))) return next(e)

    for (const topic of await $.fs.list(root)) {
      if (topic.kind !== 'dir') continue
      const lessons = `${root}/${topic.name}/lessons`
      if (!(await $.fs.exists(lessons))) continue
      for (const file of await $.fs.list(lessons)) {
        if (file.kind !== 'file' || !file.name.endsWith('.md')) continue
        if (ACTIVE.test(await $.fs.read(`${lessons}/${file.name}`))) return { isShown: false }
      }
    }
    return next(e)
  }).catch(($, e, next) =>
    // A failed check hides the guess: a missing suggestion costs nothing, a spoiled answer does.
    next.called ? next(e) : { isShown: false },
  )
}
