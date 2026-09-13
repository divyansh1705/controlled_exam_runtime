// Owner: Person B (Exam Content Domain)
// Day-0 placeholder shape so Person C can compile FK references (Attempt.examId)
// before Person B's real Exam module lands. Person B fills this in.

export enum ExamStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  status: ExamStatus;
}
