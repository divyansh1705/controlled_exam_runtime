// Owner: Person C (Attempt/Answer/Monitoring)
// Day-0 placeholder — Person C fills this in.

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  AUTO_SUBMITTED = 'AUTO_SUBMITTED',
  EXPIRED = 'EXPIRED',
}

export enum QuestionState {
  NOT_VISITED = 'NOT_VISITED',
  VISITED = 'VISITED',
  ANSWERED = 'ANSWERED',
  MARKED_REVIEW = 'MARKED_REVIEW',
  ANSWERED_AND_MARKED_REVIEW = 'ANSWERED_AND_MARKED_REVIEW',
}

export interface Attempt {
  id: string;
  examId: string; // FK to Person B's Exam, id-only reference
  studentId: string;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
}
