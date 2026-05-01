import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang, MathProblem, AnswerState } from '../types'
import { class2Topics } from '../data/curriculum/class2'
import type { Class2TopicId, Class2Topic } from '../data/curriculum/class2'
import { Celebration } from '../components/math/Celebration'
import { LangToggle } from '../components/LangToggle'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeChoices(answer: number, spread: number): number[] {
  const set = new Set([answer])
  let tries = 0
  while (set.size < 4 && tries < 300) {
    const delta = Math.floor(Math.random() * spread) + 1
    const candidate = answer + (Math.random() > 0.5 ? delta : -delta)
    if (candidate > 0) set.add(candidate)
    tries++
  }
  // Fallback: pad with consecutive values if spread is too narrow
  let pad = 1
  while (set.size < 4) {
    set.add(answer + pad)
    pad++
  }
  const arr = [...set]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

type HighScores = Partial<Record<Class2TopicId, number>>

// ── MathScreen ───────────────────────────────────────────────────────────────

export default function MathScreen() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<Lang>('de')

  // Topic selector state
  const [topic, setTopic] = useState<Class2Topic | null>(null)

  // Game state (only active when a topic is selected)
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [choices, setChoices] = useState<number[]>([])
  const [problemId, setProblemId] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [hintIndex, setHintIndex] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const [highScores, setHighScores] = useLocalStorage<HighScores>('mathhelp:class2:hs', {})

  const t = (de: string, en: string) => (lang === 'de' ? de : en)

  // ── game logic ──────────────────────────────────────────────────────────

  const loadNextProblem = useCallback((t: Class2Topic) => {
    const p = t.generate()
    setProblem(p)
    setChoices(makeChoices(p.answer, t.choiceSpread))
    setProblemId(prev => prev + 1)
    setAnswerState('idle')
    setSelected(null)
    setHintIndex(null)
  }, [])

  const selectTopic = (chosen: Class2Topic) => {
    setTopic(chosen)
    setScore(0)
    setStreak(0)
    loadNextProblem(chosen)
  }

  const handleBack = () => {
    if (topic && score > 0) {
      setHighScores(prev => ({
        ...prev,
        [topic.id]: Math.max(prev[topic.id] ?? 0, score),
      }))
    }
    setTopic(null)
    setProblem(null)
  }

  const handleAnswer = (choice: number) => {
    if (answerState !== 'idle' || !topic || !problem) return
    setSelected(choice)

    if (choice === problem.answer) {
      setScore(s => s + 1)
      setStreak(s => s + 1)
      setAnswerState('correct')
      setShowCelebration(true)
    } else {
      setStreak(0)
      setAnswerState('wrong')
      // Show correct answer highlight for 1.8 s, then advance
      setTimeout(() => {
        if (topic) loadNextProblem(topic)
      }, 1800)
    }
  }

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false)
    if (topic) loadNextProblem(topic)
  }, [topic, loadNextProblem])

  const handleHint = () => {
    if (!topic) return
    setHintIndex(prev => (prev === null ? 0 : (prev + 1) % topic.hints.length))
  }

  // ── answer button styling ───────────────────────────────────────────────

  const btnClass = (choice: number): string => {
    const base =
      'w-full min-h-[68px] rounded-2xl text-2xl font-bold transition-colors border-2 active:scale-95 transition-transform'
    if (answerState === 'idle') {
      return `${base} bg-white text-indigo-700 border-indigo-200`
    }
    if (choice === problem?.answer) {
      return `${base} bg-green-100 text-green-700 border-green-400`
    }
    if (answerState === 'wrong' && choice === selected) {
      return `${base} bg-red-100 text-red-600 border-red-400`
    }
    return `${base} bg-white text-gray-300 border-gray-100`
  }

  // ── TOPIC SELECTOR ───────────────────────────────────────────────────────

  if (!topic || !problem) {
    return (
      <div className="min-h-svh bg-gradient-to-b from-violet-100 to-indigo-100 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-10 pb-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-indigo-600 font-semibold text-lg min-h-[48px] px-1"
          >
            ← {t('Start', 'Home')}
          </button>
          <LangToggle lang={lang} onChange={setLang} />
        </div>

        <div className="px-5 pb-5">
          <h1 className="text-3xl font-bold text-indigo-800">
            {t('Mathe – Klasse 2', 'Maths – Year 2')}
          </h1>
          <p className="text-indigo-400 mt-1 text-sm">
            {t('Wähle ein Thema', 'Choose a topic')}
          </p>
        </div>

        <div className="flex-1 px-4 pb-8 grid grid-cols-2 gap-4 content-start">
          {class2Topics.map((tp, i) => {
            const best = highScores[tp.id] ?? 0
            return (
              <motion.button
                key={tp.id}
                onClick={() => selectTopic(tp)}
                className="bg-white rounded-3xl p-4 flex flex-col items-center gap-2 shadow-md border border-indigo-100 active:scale-95 transition-transform min-h-[140px] justify-center"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <span className="text-4xl">{tp.emoji}</span>
                <p className="font-bold text-indigo-700 text-center text-sm leading-tight">
                  {lang === 'de' ? tp.label.de : tp.label.en}
                </p>
                <p className="text-xs text-gray-400 text-center leading-tight">
                  {lang === 'de' ? tp.description.de : tp.description.en}
                </p>
                {best > 0 && (
                  <span className="text-xs font-semibold text-amber-500 mt-1">
                    ⭐ {t('Bestpunktzahl', 'Best')}: {best}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── GAME SCREEN ──────────────────────────────────────────────────────────

  const currentHint = hintIndex !== null ? topic.hints[hintIndex] : null

  return (
    <div className="min-h-svh bg-gradient-to-b from-violet-100 to-indigo-100 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-10 pb-2">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-indigo-600 font-semibold text-base min-h-[48px] px-1"
        >
          ← {t('Themen', 'Topics')}
        </button>
        <LangToggle lang={lang} onChange={setLang} />
      </div>

      {/* Topic badge + score row */}
      <div className="flex items-center justify-between px-5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{topic.emoji}</span>
          <span className="text-sm font-semibold text-indigo-600">
            {lang === 'de' ? topic.label.de : topic.label.en}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold text-indigo-700">
          <span>🏆 {score}</span>
          <span>🔥 {streak}</span>
        </div>
      </div>

      {/* Problem card + answers + hint */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 pb-6">
        {/* Problem */}
        <motion.div
          key={problemId}
          className="w-full bg-white rounded-3xl shadow-lg py-10 px-6 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <p className="text-5xl font-bold text-gray-800 tracking-wide text-center">
            {problem.a}&thinsp;{problem.operator}&thinsp;{problem.b}&thinsp;=&thinsp;?
          </p>
        </motion.div>

        {/* Answer buttons 2 × 2 */}
        <div className="w-full grid grid-cols-2 gap-3">
          {choices.map(choice => (
            <button
              key={choice}
              onClick={() => handleAnswer(choice)}
              disabled={answerState !== 'idle'}
              className={btnClass(choice)}
            >
              {choice}
            </button>
          ))}
        </div>

        {/* Hint area */}
        <div className="w-full flex flex-col items-center gap-2">
          <AnimatePresence mode="wait">
            {currentHint && (
              <motion.div
                key={hintIndex}
                className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-800 text-sm font-medium text-center"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                💡 {lang === 'de' ? currentHint.de : currentHint.en}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleHint}
            className="text-indigo-400 text-sm font-medium min-h-[48px] px-4 active:text-indigo-700"
          >
            {t('💡 Tipp anzeigen', '💡 Show hint')}
            {hintIndex !== null && (
              <span className="ml-1 text-indigo-300">
                ({hintIndex + 1}/{topic.hints.length})
              </span>
            )}
          </button>
        </div>
      </div>

      <Celebration visible={showCelebration} lang={lang} onDone={handleCelebrationDone} />
    </div>
  )
}
