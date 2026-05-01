// Beispielcurriculum Mathematik – Klasse 2
// Bildungsplan 2016 Baden-Württemberg · Grundschule
// Scope: ZR bis 100 (+ / −), Einmaleins (1×, 2×, 5×, 10×), Division (÷2, ÷5, ÷10)

import type { MathProblem } from '../../types'

export type Class2TopicId =
  | 'zr20_add'
  | 'zr20_sub'
  | 'zr100_add'
  | 'zr100_sub'
  | 'times_tables'
  | 'division'

export interface BilingualText {
  de: string
  en: string
}

export interface Class2Topic {
  id: Class2TopicId
  emoji: string
  label: BilingualText
  description: BilingualText
  /** Short one-liner hints shown when Aarohi is stuck. Rotate through on each tap. */
  hints: BilingualText[]
  generate: () => MathProblem
  /** Controls how spread out the wrong answer choices are */
  choiceSpread: number
}

function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const class2Topics: Class2Topic[] = [
  {
    id: 'zr20_add',
    emoji: '➕',
    label: { de: 'Plus bis 20', en: 'Add to 20' },
    description: {
      de: 'Addieren im Zahlenraum bis 20',
      en: 'Addition within 20',
    },
    hints: [
      { de: 'Fang bei der größeren Zahl an!', en: 'Start from the bigger number!' },
      { de: 'Zähle mit den Fingern weiter!', en: 'Count on with your fingers!' },
      { de: 'Was ergibt zusammen 10?', en: 'What makes 10 together?' },
    ],
    generate() {
      const a = ri(1, 18)
      const b = ri(1, 20 - a)
      return { a, b, operator: '+', answer: a + b }
    },
    choiceSpread: 4,
  },
  {
    id: 'zr20_sub',
    emoji: '➖',
    label: { de: 'Minus bis 20', en: 'Subtract to 20' },
    description: {
      de: 'Subtrahieren im Zahlenraum bis 20',
      en: 'Subtraction within 20',
    },
    hints: [
      { de: 'Zähle rückwärts!', en: 'Count backwards!' },
      { de: 'Wie viel fehlt noch?', en: 'How much is missing?' },
      { de: 'Denk an die Plus-Aufgabe dazu!', en: 'Think of the matching addition!' },
    ],
    generate() {
      const a = ri(3, 20)
      const b = ri(1, a - 1)
      return { a, b, operator: '-', answer: a - b }
    },
    choiceSpread: 4,
  },
  {
    id: 'zr100_add',
    emoji: '🔢',
    label: { de: 'Plus bis 100', en: 'Add to 100' },
    description: {
      de: 'Addieren im Zahlenraum bis 100',
      en: 'Addition within 100',
    },
    hints: [
      { de: 'Erst die Zehner, dann die Einer!', en: 'Add tens first, then ones!' },
      { de: 'Zerlege die Zahl in Zehner und Einer!', en: 'Split into tens and ones!' },
      { de: 'Runde auf die nächste Zehnerzahl!', en: 'Round to the nearest ten first!' },
    ],
    generate() {
      const a = ri(10, 89)
      const b = ri(1, 100 - a)
      return { a, b, operator: '+', answer: a + b }
    },
    choiceSpread: 10,
  },
  {
    id: 'zr100_sub',
    emoji: '💯',
    label: { de: 'Minus bis 100', en: 'Subtract to 100' },
    description: {
      de: 'Subtrahieren im Zahlenraum bis 100',
      en: 'Subtraction within 100',
    },
    hints: [
      { de: 'Erst die Zehner abziehen!', en: 'Subtract the tens first!' },
      { de: 'Wie weit ist es bis zur nächsten Zehnerzahl?', en: 'How far is the next ten?' },
      { de: 'Prüfe mit der Umkehraufgabe!', en: 'Check with the addition reverse!' },
    ],
    generate() {
      const a = ri(11, 99)
      const b = ri(1, a - 1)
      return { a, b, operator: '-', answer: a - b }
    },
    choiceSpread: 10,
  },
  {
    id: 'times_tables',
    emoji: '✖️',
    label: { de: 'Einmaleins', en: 'Times Tables' },
    description: {
      de: '1×, 2×, 5×, 10× üben',
      en: 'Practice 1×, 2×, 5×, 10×',
    },
    hints: [
      { de: 'Denk an die Malreihe!', en: 'Think of the times table row!' },
      { de: 'Die 5er-Reihe endet immer auf 0 oder 5!', en: 'The 5× table always ends in 0 or 5!' },
      { de: '2× heißt: die Zahl zweimal addieren!', en: '2× means: add the number twice!' },
    ],
    generate() {
      const tables: number[] = [1, 2, 5, 10]
      const a = tables[Math.floor(Math.random() * tables.length)]
      const b = ri(1, 10)
      return { a, b, operator: '×', answer: a * b }
    },
    choiceSpread: 6,
  },
  {
    id: 'division',
    emoji: '➗',
    label: { de: 'Teilen', en: 'Division' },
    description: {
      de: 'Aufteilen durch 2, 5 und 10',
      en: 'Divide by 2, 5, and 10',
    },
    hints: [
      { de: 'Welche Malaufgabe passt dazu?', en: 'Which times table fits?' },
      { de: 'Teile in gleich große Gruppen!', en: 'Make equal groups!' },
      { de: 'Denk rückwärts: ? × Teiler = Zahl', en: 'Think backwards: ? × divisor = number' },
    ],
    generate() {
      const divisors: number[] = [2, 5, 10]
      const b = divisors[Math.floor(Math.random() * divisors.length)]
      const quotient = ri(1, 10)
      return { a: b * quotient, b, operator: '÷', answer: quotient }
    },
    choiceSpread: 3,
  },
]
