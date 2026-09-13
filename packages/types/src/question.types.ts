// Owner: Person B (Exam Content Domain)
// Day-0 placeholder — Person B fills this in.

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

export interface Option {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  marks: number;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionId: string;
  order: number;
}
