export type Lang = 'de' | 'en'

export type MathOperator = '+' | '-' | '×' | '÷'

export interface MathProblem {
  a: number
  b: number
  operator: MathOperator
  answer: number
}

export type AnswerState = 'idle' | 'correct' | 'wrong'
