'use client';

import { useEffect, useState } from 'react';
import { ExamAssignment } from '@secure-exam/types';
import { listStudents, StudentWithUser } from '@/lib/api';

interface Props {
  examId: string;
  assignments: ExamAssignment[];
  onAssign: (studentId: string) => Promise<void>;
  onUnassign: (studentId: string) => Promise<void>;
}

/**
 * Shows all students in the system and lets the admin assign/unassign them
 * to the given exam.
 *
 * The exam_assignments.studentId column stores the user's UUID (= user.sub
 * in the JWT), NOT the students-table PK. So we always pass `s.userId` to
 * onAssign/onUnassign and compare assignedIds against `s.userId`.
 */
export function AssignStudents({ examId: _examId, assignments, onAssign, onUnassign }: Props) {
  const [allStudents, setAllStudents] = useState<StudentWithUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    listStudents()
      .then(setAllStudents)
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setLoadingStudents(false));
  }, []);

  // assignment.studentId is the user UUID (= student.userId)
  const assignedIds = new Set(assignments.map((a) => a.studentId));

  const filteredStudents = allStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.user.fullName.toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q) ||
      s.collegeId.toLowerCase().includes(q)
    );
  });

  async function handleAssign(userId: string) {
    setActionError(null);
    setPendingId(userId);
    try {
      await onAssign(userId);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  async function handleUnassign(userId: string) {
    setActionError(null);
    setPendingId(userId);
    try {
      await onUnassign(userId);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Already Assigned ────────────────────────────────────────── */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
          Assigned ({assignments.length})
        </h2>
        <ul className="divide-y divide-stone-100 rounded-md border border-stone-200 bg-white shadow-sm">
          {assignments.length === 0 && (
            <li className="px-4 py-3 text-sm text-stone-400">No students assigned yet.</li>
          )}
          {assignments.map((a) => {
            const student = allStudents.find((s) => s.userId === a.studentId);
            return (
              <li key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  {student ? (
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium text-stone-800">{student.user.fullName}</span>
                      <span className="text-stone-400">{student.user.email}</span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-500">
                        {student.collegeId}
                      </span>
                    </span>
                  ) : (
                    <span className="font-mono text-stone-600">{a.studentId}</span>
                  )}
                </div>
                <button
                  onClick={() => handleUnassign(a.studentId)}
                  disabled={pendingId === a.studentId}
                  className="ml-4 shrink-0 text-xs text-rose-600 hover:underline disabled:opacity-40"
                >
                  {pendingId === a.studentId ? 'Removing…' : 'Remove'}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Student Picker ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
          All Students
        </h2>
        <input
          type="text"
          placeholder="Search by name, email or college ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-3 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />

        {actionError && (
          <p className="mb-2 text-sm text-rose-600">{actionError}</p>
        )}

        {loadingStudents ? (
          <p className="text-sm text-stone-400">Loading students…</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-sm text-stone-400">
            {allStudents.length === 0
              ? 'No students in the system yet. Add students first via the Students page.'
              : 'No students match your search.'}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-md border border-stone-200 bg-white shadow-sm">
            {filteredStudents.map((s) => {
              const isAssigned = assignedIds.has(s.userId);
              const isPending = pendingId === s.userId;
              return (
                <li
                  key={s.id}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${isAssigned ? 'bg-indigo-50' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium text-stone-800">{s.user.fullName}</span>
                      <span className="text-stone-400">{s.user.email}</span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-500">
                        {s.collegeId}
                      </span>
                      {isAssigned && (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                          ✓ Assigned
                        </span>
                      )}
                      {!s.user.isActive && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                          Inactive
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="ml-4 shrink-0">
                    {isAssigned ? (
                      <button
                        onClick={() => handleUnassign(s.userId)}
                        disabled={isPending}
                        className="text-xs text-rose-600 hover:underline disabled:opacity-40"
                      >
                        {isPending ? 'Removing…' : 'Remove'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssign(s.userId)}
                        disabled={isPending || !s.user.isActive}
                        title={!s.user.isActive ? 'Cannot assign an inactive student' : undefined}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isPending ? 'Assigning…' : 'Assign'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
