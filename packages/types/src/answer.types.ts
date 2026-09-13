// Owner: Person C (Attempt/Answer/Monitoring)
// Day-0 placeholder — Person C fills this in.

import { QuestionState } from './attempt.types';

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string; // FK to Person B's Question, id-only reference
  selectedOptionIds: string[];
  state: QuestionState;
}

export interface Submission {
  id: string;
  attemptId: string;
  submittedAt: string;
}

export interface Result {
  id: string;
  attemptId: string;
  score: number;
  published: boolean;
}
