import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang, MathProblem, AnswerState, GamePhase, MCQItem, FillInItem } from '../types'
import { class2Topics } from '../data/curriculum/class2'
import type { Class2Topic, Class2TopicId } from '../data/curriculum/class2'
import { Celebration } from '../components/math/Celebration'
import { DrawingCanvas } from '../components/math/DrawingCanvas'
import { LangToggle } from '../components/LangToggle'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeChoices(answer: number, spread: number): number[] {
  const set = new Set([answer])
  let tries = 0
  while (set.size < 4 && tries < 300) {
    const delta = Math.floor(Math.random() * spread) + 1
    const candidate = answer + (Math.random() > 0.5 ? delta : -delta)
    if (candidate > 0) set.add(candidate)
    tries++
  }
  let pad = 1
  while (set.size < 4) { set.add(answer + pad); pad++ }
  const arr = [...set]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateFillInItems(topic: Class2Topic, count = 5): FillInItem[] {
  return Array.from({ length: count }, () => {
    const problem = topic.generate()
    const { a, b, operator, answer } = problem
    const blankOperand = operator !== '÷' && Math.random() < 0.4
    const op = ` ${operator} `
    const displayParts: FillInItem['displayParts'] = blankOperand
      ? [String(a), op, '___', ' = ', String(answer)]
      : [String(a), op, String(b), ' = ', '___']
    return {
      problem,
      blank: blankOperand ? 'operand' : 'result',
      displayParts,
      answer: blankOperand ? b : answer,
    }
  })
}

type HighScores = Partial<Record<Class2TopicId, number>>

// ── Number Pad ────────────────────────────────────────────────────────────────

function NumberPad({
  disabled,
  onDigit,
  onBackspace,
  onClear,
}: {
  disabled: boolean
  onDigit: (d: string) => void
  onBackspace: () => void
  onClear: () => void
}) {
  const cls =
    'min-h-[60px] rounded-2xl bg-white text-2xl font-bold text-indigo-700 border-2 border-indigo-200 active:scale-95 transition-transform disabled:opacity-40'
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(d => (
        <button key={d} disabled={disabled} onClick={() => onDigit(d)} className={cls}>
          {d}
        </button>
      ))}
      <button disabled={disabled} onClick={onClear} className={`${cls} text-lg text-gray-400`}>✕</button>
      <button disabled={disabled} onClick={() => onDigit('0')} className={cls}>0</button>
      <button disabled={disabled} onClick={onBackspace} className={`${cls} text-xl`}>⌫</button>
    </div>
  )
}

// ── Fade wrapper for phase transitions ────────────────────────────────────────

function FadeView({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex flex-col flex-1 min-h-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  )
}

// ── MathScreen ────────────────────────────────────────────────────────────────

export default function MathScreen() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<Lang>('de')

  // Phase state machine
  const [phase, setPhase] = useState<GamePhase>('select')
  const [topic, setTopic] = useState<Class2Topic | null>(null)

  // Pre-generated question banks
  const [mcqItems, setMcqItems] = useState<MCQItem[]>([])
  const [fillinItems, setFillinItems] = useState<FillInItem[]>([])

  // Progress within current section (0–4)
  const [questionIndex, setQuestionIndex] = useState(0)

  // Scores
  const [mcqScore, setMcqScore] = useState(0)
  const [fillinScore, setFillinScore] = useState(0)

  // Per-question interaction
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selected, setSelected] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [clearSignal, setClearSignal] = useState(0) // increments to wipe canvas

  // UI
  const [showCelebration, setShowCelebration] = useState(false)
  const [hintIndex, setHintIndex] = useState<number | null>(null)

  // Persistence — best total /10 per topic
  const [highScores, setHighScores] = useLocalStorage<HighScores>('mathhelp:class2:hs', {})

  const t = (de: string, en: string) => (lang === 'de' ? de : en)

  // ── section transition: auto-advance after 2 s ───────────────────────────

  useEffect(() => {
    if (phase !== 'transition') return
    const id = setTimeout(() => {
      setPhase('fillin')
      setQuestionIndex(0)
      setInputValue('')
      setClearSignal(s => s + 1)
      setAnswerState('idle')
      setHintIndex(null)
    }, 2200)
    return () => clearTimeout(id)
  }, [phase])

  // ── topic selection ──────────────────────────────────────────────────────

  const selectTopic = useCallback((chosen: Class2Topic) => {
    const newMcq: MCQItem[] = Array.from({ length: 5 }, () => {
      const p = chosen.generate()
      return { problem: p, choices: makeChoices(p.answer, chosen.choiceSpread) }
    })
    setTopic(chosen)
    setMcqItems(newMcq)
    setFillinItems(generateFillInItems(chosen, 5))
    setQuestionIndex(0)
    setMcqScore(0)
    setFillinScore(0)
    setAnswerState('idle')
    setSelected(null)
    setInputValue('')
    setClearSignal(s => s + 1)
    setHintIndex(null)
    setPhase('mcq')
  }, [])

  const goToSelect = () => {
    setPhase('select')
    setTopic(null)
  }

  // ── MCQ advance ──────────────────────────────────────────────────────────

  const advanceMCQ = useCallback(
    (wasCorrect: boolean) => {
      const nextScore = mcqScore + (wasCorrect ? 1 : 0)
      setMcqScore(nextScore)
      setAnswerState('idle')
      setSelected(null)
      setHintIndex(null)
      if (questionIndex >= 4) {
        setQuestionIndex(0)
        setPhase('transition')
      } else {
        setQuestionIndex(q => q + 1)
      }
    },
    [mcqScore, questionIndex],
  )

  const handleMCQAnswer = (choice: number) => {
    if (answerState !== 'idle') return
    const correct = choice === mcqItems[questionIndex].problem.answer
    setSelected(choice)
    setAnswerState(correct ? 'correct' : 'wrong')
    if (correct) {
      setShowCelebration(true)
    } else {
      setTimeout(() => advanceMCQ(false), 1800)
    }
  }

  const handleMCQCelebrationDone = useCallback(() => {
    setShowCelebration(false)
    advanceMCQ(true)
  }, [advanceMCQ])

  // ── Fill-in advance ──────────────────────────────────────────────────────

  const advanceFillin = useCallback(
    (wasCorrect: boolean) => {
      const nextFillin = fillinScore + (wasCorrect ? 1 : 0)
      setFillinScore(nextFillin)
      setAnswerState('idle')
      setInputValue('')
      setClearSignal(s => s + 1)
      setHintIndex(null)
      if (questionIndex >= 4) {
        const total = mcqScore + nextFillin
        if (topic) {
          setHighScores(prev => ({
            ...prev,
            [topic.id]: Math.max(prev[topic.id] ?? 0, total),
          }))
        }
        setPhase('results')
      } else {
        setQuestionIndex(q => q + 1)
      }
    },
    [fillinScore, questionIndex, mcqScore, topic, setHighScores],
  )

  const handleFillinSubmit = () => {
    if (answerState !== 'idle' || inputValue === '') return
    const correct = parseInt(inputValue, 10) === fillinItems[questionIndex].answer
    setAnswerState(correct ? 'correct' : 'wrong')
    if (correct) {
      setShowCelebration(true)
    } else {
      setTimeout(() => advanceFillin(false), 1800)
    }
  }

  const handleFillinCelebrationDone = useCallback(() => {
    setShowCelebration(false)
    advanceFillin(true)
  }, [advanceFillin])

  // ── shared MCQ button style ──────────────────────────────────────────────

  const mcqBtnClass = (choice: number, problem: MathProblem): string => {
    const base =
      'w-full min-h-[68px] rounded-2xl text-2xl font-bold border-2 active:scale-95 transition-transform'
    if (answerState === 'idle') return `${base} bg-white text-indigo-700 border-indigo-200`
    if (choice === problem.answer) return `${base} bg-green-100 text-green-700 border-green-400`
    if (answerState === 'wrong' && choice === selected)
      return `${base} bg-red-100 text-red-600 border-red-400`
    return `${base} bg-white text-gray-300 border-gray-100`
  }

  // ── fill-in input display colour ─────────────────────────────────────────

  const inputDisplayClass = () => {
    if (answerState === 'correct') return 'text-green-600 border-green-400'
    if (answerState === 'wrong') return 'text-red-500 border-red-400'
    return 'text-indigo-700 border-indigo-300'
  }

  // ── progress bar (shared between MCQ and fill-in) ───────────────────────

  const overallQuestion =
    phase === 'mcq' ? questionIndex + 1 : phase === 'fillin' ? questionIndex + 6 : null

  // ── performance tier for results ─────────────────────────────────────────

  const resultsTier = (total: number) => {
    if (total === 10) return { emoji: '🏆', de: 'Perfekt!', en: 'Perfect!' }
    if (total >= 8)   return { emoji: '⭐', de: 'Super!', en: 'Great!' }
    if (total >= 6)   return { emoji: '😊', de: 'Gut gemacht!', en: 'Well done!' }
    if (total >= 4)   return { emoji: '💪', de: 'Weiter üben!', en: 'Keep practicing!' }
    return             { emoji: '🌱', de: 'Nicht aufgeben!', en: "Don't give up!" }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-svh bg-gradient-to-b from-violet-100 to-indigo-100 flex flex-col overflow-hidden">

      {/* ── Shared top bar (hidden on results) ── */}
      {phase !== 'results' && phase !== 'transition' && (
        <div className="flex items-center justify-between px-5 pt-10 pb-2 flex-shrink-0">
          <button
            onClick={phase === 'select' ? () => navigate('/') : goToSelect}
            className="flex items-center gap-1 text-indigo-600 font-semibold text-base min-h-[48px] px-1"
          >
            ← {phase === 'select' ? t('Start', 'Home') : t('Themen', 'Topics')}
          </button>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
      )}

      {/* ── Phase content ── */}
      <AnimatePresence mode="wait">

        {/* ══ TOPIC SELECTOR ══════════════════════════════════════════════════ */}
        {phase === 'select' && (
          <FadeView key="select">
            <div className="px-5 pb-4">
              <h1 className="text-3xl font-bold text-indigo-800">
                {t('Mathe – Klasse 2', 'Maths – Year 2')}
              </h1>
              <p className="text-indigo-400 mt-1 text-sm">{t('Wähle ein Thema', 'Choose a topic')}</p>
            </div>
            <div className="flex-1 px-4 pb-6 grid grid-cols-2 gap-4 content-start overflow-y-auto">
              {class2Topics.map((tp, i) => {
                const best = highScores[tp.id] ?? 0
                return (
                  <motion.button
                    key={tp.id}
                    onClick={() => selectTopic(tp)}
                    className="bg-white rounded-3xl p-4 flex flex-col items-center gap-2 shadow-md border border-indigo-100 active:scale-95 transition-transform min-h-[140px] justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <span className="text-4xl">{tp.emoji}</span>
                    <p className="font-bold text-indigo-700 text-center text-sm leading-tight">
                      {lang === 'de' ? tp.label.de : tp.label.en}
                    </p>
                    <p className="text-xs text-gray-400 text-center leading-tight">
                      {lang === 'de' ? tp.description.de : tp.description.en}
                    </p>
                    {best > 0 && (
                      <span className="text-xs font-semibold text-amber-500 mt-0.5">
                        ⭐ {t('Bestpunktzahl', 'Best')}: {best}/10
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </FadeView>
        )}

        {/* ══ MCQ SECTION ═════════════════════════════════════════════════════ */}
        {phase === 'mcq' && topic && mcqItems.length > 0 && (
          <FadeView key="mcq">
            {/* Progress */}
            <div className="px-5 pb-1 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-indigo-500">
                  {t('Teil 1 – Antwort wählen', 'Part 1 – Choose the answer')}
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {overallQuestion} / 10
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      i < (overallQuestion ?? 0) ? 'bg-indigo-500' : 'bg-indigo-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Topic + score */}
            <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{topic.emoji}</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {lang === 'de' ? topic.label.de : topic.label.en}
                </span>
              </div>
              <span className="text-sm font-bold text-indigo-700">🏆 {mcqScore}</span>
            </div>

            {/* Problem card + answers */}
            <div className="flex-1 flex flex-col justify-center px-5 gap-4 pb-4 min-h-0">
              <motion.div
                key={questionIndex}
                className="w-full bg-white rounded-3xl shadow-lg py-10 px-6 flex items-center justify-center flex-shrink-0"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                {(() => {
                  const { a, operator, b } = mcqItems[questionIndex].problem
                  return (
                    <p className="text-5xl font-bold text-gray-800 tracking-wide text-center">
                      {a}&thinsp;{operator}&thinsp;{b}&thinsp;=&thinsp;?
                    </p>
                  )
                })()}
              </motion.div>

              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {mcqItems[questionIndex].choices.map(choice => (
                  <button
                    key={choice}
                    onClick={() => handleMCQAnswer(choice)}
                    disabled={answerState !== 'idle'}
                    className={mcqBtnClass(choice, mcqItems[questionIndex].problem)}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              {/* Hint */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <AnimatePresence mode="wait">
                  {hintIndex !== null && (
                    <motion.div
                      key={hintIndex}
                      className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-800 text-sm font-medium text-center"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      💡 {lang === 'de' ? topic.hints[hintIndex].de : topic.hints[hintIndex].en}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() =>
                    setHintIndex(prev =>
                      prev === null ? 0 : (prev + 1) % topic.hints.length,
                    )
                  }
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
          </FadeView>
        )}

        {/* ══ SECTION TRANSITION ══════════════════════════════════════════════ */}
        {phase === 'transition' && (
          <FadeView key="transition">
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
              <motion.span
                className="text-8xl"
                animate={{ scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.6 }}
              >
                ✏️
              </motion.span>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-700">
                  {t('Super gemacht!', 'Well done!')}
                </p>
                <p className="text-lg text-indigo-400 mt-2">
                  {t('Jetzt Teil 2: Schreibe die Antwort!', 'Now Part 2: Write the answer!')}
                </p>
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-2 rounded-full ${i < 5 ? 'bg-indigo-500' : 'bg-indigo-100'}`}
                  />
                ))}
              </div>
            </div>
            <div className="px-5 pb-6 flex-shrink-0 flex items-center justify-between">
              <LangToggle lang={lang} onChange={setLang} />
            </div>
          </FadeView>
        )}

        {/* ══ FILL-IN SECTION ═════════════════════════════════════════════════ */}
        {phase === 'fillin' && topic && fillinItems.length > 0 && (
          <FadeView key="fillin">
            {/* Progress */}
            <div className="px-5 pb-1 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-indigo-500">
                  {t('Teil 2 – Antwort schreiben', 'Part 2 – Write the answer')}
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {overallQuestion} / 10
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      i < (overallQuestion ?? 0) ? 'bg-indigo-500' : 'bg-indigo-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Topic + score */}
            <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{topic.emoji}</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {lang === 'de' ? topic.label.de : topic.label.en}
                </span>
              </div>
              <span className="text-sm font-bold text-indigo-700">
                🏆 {mcqScore + fillinScore}
              </span>
            </div>

            {/* Problem display — shows live inputValue inline in the blank */}
            <div className="px-5 flex-shrink-0">
              <motion.div
                key={questionIndex}
                className="w-full bg-white rounded-3xl shadow-lg py-6 px-4 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <p className="text-4xl font-bold text-gray-800 tracking-wide flex items-center justify-center flex-wrap gap-1">
                  {fillinItems[questionIndex].displayParts.map((part, i) =>
                    part === '___' ? (
                      <span
                        key={i}
                        className={`inline-block min-w-[60px] text-center border-b-4 pb-0.5 transition-colors ${inputDisplayClass()}`}
                      >
                        {inputValue || '\u00a0\u00a0\u00a0'}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    ),
                  )}
                </p>
                {/* Wrong: show correct answer */}
                {answerState === 'wrong' && (
                  <p className="absolute text-sm text-green-600 font-semibold mt-2">
                    {t('Richtig wäre', 'Answer')}: {fillinItems[questionIndex].answer}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Drawing canvas */}
            <div className="px-5 pt-3 flex-shrink-0 relative">
              <DrawingCanvas
                clearSignal={clearSignal}
                className="w-full h-[160px] rounded-2xl bg-white/80 border-2 border-dashed border-indigo-300"
              />
              <button
                onClick={() => setClearSignal(s => s + 1)}
                className="absolute top-5 right-7 text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-2 py-1 min-h-[32px]"
              >
                ✕ {t('Löschen', 'Clear')}
              </button>
            </div>

            {/* Number pad + submit */}
            <div className="flex-1 flex flex-col justify-end px-5 pb-4 gap-3 min-h-0">
              <NumberPad
                disabled={answerState !== 'idle'}
                onDigit={d => setInputValue(v => (v.length >= 4 ? v : v + d))}
                onBackspace={() => setInputValue(v => v.slice(0, -1))}
                onClear={() => setInputValue('')}
              />
              <button
                onClick={handleFillinSubmit}
                disabled={answerState !== 'idle' || inputValue === ''}
                className="w-full min-h-[56px] rounded-2xl bg-indigo-600 text-white text-xl font-bold active:scale-95 transition-transform disabled:opacity-40"
              >
                {t('Prüfen', 'Check')}
              </button>

              {/* Hint */}
              <div className="flex flex-col items-center gap-1">
                <AnimatePresence mode="wait">
                  {hintIndex !== null && (
                    <motion.div
                      key={hintIndex}
                      className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-amber-800 text-sm font-medium text-center"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      💡 {lang === 'de' ? topic.hints[hintIndex].de : topic.hints[hintIndex].en}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() =>
                    setHintIndex(prev =>
                      prev === null ? 0 : (prev + 1) % topic.hints.length,
                    )
                  }
                  className="text-indigo-400 text-sm font-medium min-h-[44px] px-4 active:text-indigo-700"
                >
                  {t('💡 Tipp', '💡 Hint')}
                  {hintIndex !== null && (
                    <span className="ml-1 text-indigo-300">
                      ({hintIndex + 1}/{topic.hints.length})
                    </span>
                  )}
                </button>
              </div>
            </div>
          </FadeView>
        )}

        {/* ══ RESULTS ═════════════════════════════════════════════════════════ */}
        {phase === 'results' && topic && (
          <FadeView key="results">
            <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
              {/* Score */}
              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              >
                {(() => {
                  const total = mcqScore + fillinScore
                  const tier = resultsTier(total)
                  return (
                    <>
                      <span className="text-7xl">{tier.emoji}</span>
                      <p className="text-5xl font-bold text-indigo-700">
                        {total} / 10
                      </p>
                      <p className="text-2xl font-semibold text-indigo-500">
                        {lang === 'de' ? tier.de : tier.en}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-400 mt-1">
                        <span>{t('Teil 1', 'Part 1')}: {mcqScore}/5</span>
                        <span>·</span>
                        <span>{t('Teil 2', 'Part 2')}: {fillinScore}/5</span>
                      </div>
                      {(highScores[topic.id] ?? 0) > 0 && (
                        <p className="text-sm text-amber-500 font-semibold">
                          ⭐ {t('Bestpunktzahl', 'Best score')}: {highScores[topic.id]}/10
                        </p>
                      )}
                    </>
                  )
                })()}
              </motion.div>
            </div>

            {/* CTAs */}
            <div className="px-6 pb-10 flex flex-col gap-3 flex-shrink-0">
              <button
                onClick={() => selectTopic(topic)}
                className="w-full min-h-[60px] rounded-2xl bg-indigo-600 text-white text-xl font-bold active:scale-95 transition-transform"
              >
                {t('Nochmal', 'Again')}
              </button>
              <button
                onClick={goToSelect}
                className="w-full min-h-[60px] rounded-2xl bg-white text-indigo-600 text-xl font-bold border-2 border-indigo-200 active:scale-95 transition-transform"
              >
                {t('Okay', 'Okay')}
              </button>
            </div>
          </FadeView>
        )}

      </AnimatePresence>

      {/* ── Celebration overlay (both sections) ── */}
      <Celebration
        visible={showCelebration}
        lang={lang}
        onDone={phase === 'mcq' ? handleMCQCelebrationDone : handleFillinCelebrationDone}
      />
    </div>
  )
}
