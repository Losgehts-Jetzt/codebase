export type Lang = 'de' | 'en'

export type MathOperator = '+' | '-' | '×' | '÷'

export interface MathProblem {
  a: number
  b: number
  operator: MathOperator
  answer: number
}

export type AnswerState = 'idle' | 'correct' | 'wrong'

export type GamePhase = 'select' | 'mcq' | 'transition' | 'fillin' | 'results'

export interface MCQItem {
  problem: MathProblem
  choices: number[]
}

export interface FillInItem {
  problem: MathProblem
  /** Which slot is blanked: result → "a op b = ___", operand → "a op ___ = result" */
  blank: 'result' | 'operand'
  /** Always 5 parts: [a, ' op ', bOrBlank, ' = ', resultOrBlank] */
  displayParts: [string, string, string, string, string]
  /** The number the child must enter */
  answer: number
}
