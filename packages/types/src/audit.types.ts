// Owner: Person A (Identity/Auth/Security)
// Person B and Person C emit events of this shape via AuditService.logEvent().

export enum AuditEventType {
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',

  STUDENT_CREATED = 'STUDENT_CREATED',
  STUDENT_UPDATED = 'STUDENT_UPDATED',
  STUDENT_BULK_IMPORTED = 'STUDENT_BULK_IMPORTED',

  // Reserved for Person B / Person C — same enum, additive only.
  EXAM_CREATED = 'EXAM_CREATED',
  EXAM_UPDATED = 'EXAM_UPDATED',
  EXAM_STATUS_CHANGED = 'EXAM_STATUS_CHANGED',
  EXAM_STARTED = 'EXAM_STARTED',
  ANSWER_SAVED = 'ANSWER_SAVED',
  SUBMITTED = 'SUBMITTED',
  AUTO_SUBMITTED = 'AUTO_SUBMITTED',
  SECURITY_CHECK_FAILED = 'SECURITY_CHECK_FAILED',
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actorId: string | null; // user id who performed the action, null for system
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}
