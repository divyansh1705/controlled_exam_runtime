/**
 * Dev Seed Script — creates an admin user, 3 test students, a course they are
 * enrolled in, and an active, published exam registered to that course.
 *
 * Run once after migrations:
 *   npm run db:seed --workspace=apps/api
 *
 * Idempotent: skips rows that already exist.
 * NEVER run in production — this is a development-only convenience tool.
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import * as bcrypt from 'bcrypt';
import cliDataSource from './data-source';
import {
  MERGE_INTERVALS_MARKS,
  MERGE_INTERVALS_REFERENCE,
  MERGE_INTERVALS_STARTER,
  MERGE_INTERVALS_STATEMENT,
  MERGE_INTERVALS_TEST_CASES,
  MERGE_INTERVALS_TITLE,
} from './seed-data/merge-intervals';
import { EASY_CODING_QUESTIONS, EASY_CODING_TAGS, EASY_CODING_TOPIC } from './seed-data/easy-coding';

// ── Seed data ──────────────────────────────────────────────────────────────

const ADMIN = {
  email: 'admin@secure-exam.dev',
  fullName: 'Admin User',
  password: 'Admin@1234',
  role: 'admin' as const,
};

const STUDENTS = [
  {
    collegeId: 'CS2024001',
    fullName: 'Alice Johnson',
    email: 'alice@secure-exam.dev',
    password: 'Student@1234',
  },
  {
    collegeId: 'CS2024002',
    fullName: 'Bob Smith',
    email: 'bob@secure-exam.dev',
    password: 'Student@1234',
  },
  {
    collegeId: 'CS2024003',
    fullName: 'Carol Williams',
    email: 'carol@secure-exam.dev',
    password: 'Student@1234',
  },
];

// Must be a v4 UUID: StartAttemptDto rejects any other version.
const SAMPLE_EXAM_ID = '11111111-1111-4111-8111-111111111111';

const SAMPLE_COURSE = { code: 'CS201', name: 'Operating Systems & Networks' };

const BCRYPT_ROUNDS = 10;

// ── DB setup ───────────────────────────────────────────────────────────────

// Outside production the API runs with synchronize: true (app.module.ts), and
// the entities don't exactly match the migrations. Sync the schema the same way
// before inserting, so the tables the seed writes to (including Phase 4's
// courses and exam_registrations) exist with the shape the API expects.
const ds = new DataSource({
  ...(cliDataSource.options as PostgresConnectionOptions),
  url: process.env.DATABASE_URL ?? 'postgres://exam_user:exam_pass@localhost:5432/secure_exam',
  migrations: [],
  synchronize: process.env.NODE_ENV !== 'production',
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function upsertUser(
  ds: DataSource,
  email: string,
  fullName: string,
  password: string,
  role: 'admin' | 'student',
): Promise<{ id: string; created: boolean }> {
  const existing = await ds.query<{ id: string }[]>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );

  if (existing.length > 0) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await ds.query(
      `UPDATE users SET "passwordHash" = $1, "isActive" = true WHERE id = $2`,
      [passwordHash, existing[0].id],
    );
    return { id: existing[0].id, created: false };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [row] = await ds.query<{ id: string }[]>(
    `INSERT INTO users ("email", "fullName", "passwordHash", "role", "isActive")
     VALUES ($1, $2, $3, $4, true)
     RETURNING id`,
    [email, fullName, passwordHash, role],
  );

  return { id: row.id, created: true };
}

async function upsertStudent(
  ds: DataSource,
  userId: string,
  collegeId: string,
): Promise<{ id: string; created: boolean }> {
  const existing = await ds.query<{ id: string }[]>(
    `SELECT id FROM students WHERE "collegeId" = $1 LIMIT 1`,
    [collegeId],
  );

  if (existing.length > 0) {
    return { id: existing[0].id, created: false };
  }

  const [row] = await ds.query<{ id: string }[]>(
    `INSERT INTO students ("userId", "collegeId") VALUES ($1, $2) RETURNING id`,
    [userId, collegeId],
  );

  return { id: row.id, created: true };
}

/** A course with every seeded student enrolled, assigned to the sample exam (Phase 4). */
async function seedCourse(ds: DataSource, studentIds: string[]) {
  console.log('\n🏫 Seeding course…');
  const [course] = await ds.query<{ id: string }[]>(
    `INSERT INTO courses ("code", "name") VALUES ($1, $2)
     ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name"
     RETURNING id`,
    [SAMPLE_COURSE.code, SAMPLE_COURSE.name],
  );
  for (const studentId of studentIds) {
    await ds.query(
      `INSERT INTO course_enrollments ("courseId", "studentId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [course.id, studentId],
    );
  }
  await ds.query(
    `INSERT INTO exam_courses ("examId", "courseId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [SAMPLE_EXAM_ID, course.id],
  );
  for (const studentId of studentIds) {
    await ds.query(
      `INSERT INTO exam_registrations ("examId", "studentId", "source", "courseId")
       VALUES ($1, $2, 'COURSE', $3) ON CONFLICT DO NOTHING`,
      [SAMPLE_EXAM_ID, studentId, course.id],
    );
  }
  console.log(`   ✅ ${SAMPLE_COURSE.code} with ${studentIds.length} students, assigned to the sample exam`);
}

async function seedActiveExam(ds: DataSource) {
  console.log('\n📝 Seeding active exam…');

  const existingExam = await ds.query<{ id: string }[]>(
    `SELECT id FROM exams WHERE id = $1 LIMIT 1`,
    [SAMPLE_EXAM_ID],
  );

  const now = new Date();
  const startTime = new Date(now.getTime() - 30 * 60 * 1000); // started 30 mins ago
  const endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // valid for next 48 hours

  if (existingExam.length === 0) {
    await ds.query(
      `INSERT INTO exams ("id", "title", "description", "duration_minutes", "start_time", "end_time", "status", "published_at", "pass_percentage")
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), 40)`,
      [
        SAMPLE_EXAM_ID,
        'Midterm Evaluation - OS & Networking',
        'Midterm examination covering CPU scheduling, memory management, and Transport layer protocols.',
        60,
        startTime,
        endTime,
        'ACTIVE',
      ],
    );
    console.log(`   ✅ Created active exam: ${SAMPLE_EXAM_ID}`);
  } else {
    // Keep it active and within time window
    await ds.query(
      `UPDATE exams SET "status" = 'ACTIVE', "start_time" = $1, "end_time" = $2,
              "published_at" = COALESCE("published_at", now()) WHERE id = $3`,
      [startTime, endTime, SAMPLE_EXAM_ID],
    );
    console.log(`   ✅ Refreshed active exam: ${SAMPLE_EXAM_ID}`);
  }

  // Seed sample questions if not present
  const existingQuestions = await ds.query<{ count: string }[]>(
    `SELECT count(*) as count FROM exam_questions WHERE exam_id = $1`,
    [SAMPLE_EXAM_ID],
  );

  if (parseInt(existingQuestions[0]?.count || '0', 10) === 0) {
    console.log('   📚 Adding questions to exam…');

    // Q1: MCQ Single
    const [q1] = await ds.query<{ id: string }[]>(
      `INSERT INTO questions ("text", "type", "marks", "negative_marks")
       VALUES ('Which scheduling algorithm can lead to starvation if lower priority processes arrive continuously?', 'MCQ_SINGLE', 2.0, 0.5)
       RETURNING id`,
    );
    await ds.query(
      `INSERT INTO options ("question_id", "text", "is_correct", "order") VALUES
       ($1, 'Round Robin (RR)', false, 1),
       ($1, 'Priority Scheduling (non-preemptive)', true, 2),
       ($1, 'First-Come, First-Served (FCFS)', false, 3),
       ($1, 'Aging Scheduler', false, 4)`,
      [q1.id],
    );
    await ds.query(`INSERT INTO exam_questions ("exam_id", "question_id", "order") VALUES ($1, $2, 1)`, [
      SAMPLE_EXAM_ID,
      q1.id,
    ]);

    // Q2: MCQ Multi
    const [q2] = await ds.query<{ id: string }[]>(
      `INSERT INTO questions ("text", "type", "marks", "negative_marks")
       VALUES ('Select all protocols that operate at the Transport Layer of the OSI model:', 'MCQ_MULTI', 3.0, 1.0)
       RETURNING id`,
    );
    await ds.query(
      `INSERT INTO options ("question_id", "text", "is_correct", "order") VALUES
       ($1, 'Transmission Control Protocol (TCP)', true, 1),
       ($1, 'User Datagram Protocol (UDP)', true, 2),
       ($1, 'Internet Protocol (IP)', false, 3),
       ($1, 'Address Resolution Protocol (ARP)', false, 4)`,
      [q2.id],
    );
    await ds.query(`INSERT INTO exam_questions ("exam_id", "question_id", "order") VALUES ($1, $2, 2)`, [
      SAMPLE_EXAM_ID,
      q2.id,
    ]);

    // Q3: True / False
    const [q3] = await ds.query<{ id: string }[]>(
      `INSERT INTO questions ("text", "type", "marks", "negative_marks")
       VALUES ('A deadlock can occur even if the mutual exclusion condition is not satisfied.', 'TRUE_FALSE', 1.0, 0.25)
       RETURNING id`,
    );
    await ds.query(
      `INSERT INTO options ("question_id", "text", "is_correct", "order") VALUES
       ($1, 'True', false, 1),
       ($1, 'False', true, 2)`,
      [q3.id],
    );
    await ds.query(`INSERT INTO exam_questions ("exam_id", "question_id", "order") VALUES ($1, $2, 3)`, [
      SAMPLE_EXAM_ID,
      q3.id,
    ]);

    // Q4: MCQ Single
    const [q4] = await ds.query<{ id: string }[]>(
      `INSERT INTO questions ("text", "type", "marks", "negative_marks")
       VALUES ('What is the primary purpose of virtual memory in modern operating systems?', 'MCQ_SINGLE', 2.0, 0.5)
       RETURNING id`,
    );
    await ds.query(
      `INSERT INTO options ("question_id", "text", "is_correct", "order") VALUES
       ($1, 'To allow processes to share the CPU cache efficiently', false, 1),
       ($1, 'To provide contiguous address space and allow execution larger than RAM', true, 2),
       ($1, 'To completely eliminate page faults during disk I/O', false, 3),
       ($1, 'To convert dynamic RAM into static RAM dynamically', false, 4)`,
      [q4.id],
    );
    await ds.query(`INSERT INTO exam_questions ("exam_id", "question_id", "order") VALUES ($1, $2, 4)`, [
      SAMPLE_EXAM_ID,
      q4.id,
    ]);

    // Q5: MCQ Multi
    const [q5] = await ds.query<{ id: string }[]>(
      `INSERT INTO questions ("text", "type", "marks", "negative_marks")
       VALUES ('Which of the following are valid private network IP address ranges (RFC 1918)?', 'MCQ_MULTI', 3.0, 0.5)
       RETURNING id`,
    );
    await ds.query(
      `INSERT INTO options ("question_id", "text", "is_correct", "order") VALUES
       ($1, '10.0.0.0/8', true, 1),
       ($1, '172.16.0.0/12', true, 2),
       ($1, '8.8.8.8/32', false, 3),
       ($1, '192.168.0.0/16', true, 4)`,
      [q5.id],
    );
    await ds.query(`INSERT INTO exam_questions ("exam_id", "question_id", "order") VALUES ($1, $2, 5)`, [
      SAMPLE_EXAM_ID,
      q5.id,
    ]);

    console.log('   ✅ 5 questions linked to exam');
  }
}

// ── Question bank (not linked to any exam) ─────────────────────────────────
// Easy DSA + Python questions for testing. Admins add them to an exam from the
// exam's Questions tab. Matched by text, so re-running the seed never duplicates.

type BankQuestion = {
  text: string;
  type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE';
  marks: number;
  negativeMarks: number;
  explanation: string;
  /** [text, isCorrect] in display order. */
  options: [string, boolean][];
};

const BANK_QUESTIONS: BankQuestion[] = [
  // ---- Single choice ----
  {
    text: 'Which data structure follows the Last-In, First-Out (LIFO) principle?',
    type: 'MCQ_SINGLE', marks: 1, negativeMarks: 0.25,
    explanation: 'A stack removes the most recently added item first.',
    options: [['Queue', false], ['Stack', true], ['Linked list', false], ['Binary tree', false]],
  },
  {
    text: 'What is the time complexity of binary search on a sorted array of n elements?',
    type: 'MCQ_SINGLE', marks: 1, negativeMarks: 0.25,
    explanation: 'Each step halves the search range, giving O(log n).',
    options: [['O(n)', false], ['O(log n)', true], ['O(n log n)', false], ['O(1)', false]],
  },
  {
    text: 'In Python, what does len([10, 20, 30]) return?',
    type: 'MCQ_SINGLE', marks: 1, negativeMarks: 0.25,
    explanation: 'len() returns the number of items in the list: 3.',
    options: [['2', false], ['3', true], ['30', false], ['60', false]],
  },
  {
    text: 'In Python, what is the output of print(7 // 2)?',
    type: 'MCQ_SINGLE', marks: 1, negativeMarks: 0.25,
    explanation: '// is floor division, so 7 // 2 is 3.',
    options: [['3.5', false], ['3', true], ['4', false], ['1', false]],
  },
  {
    text: 'Which Python data type is used to store key-value pairs?',
    type: 'MCQ_SINGLE', marks: 1, negativeMarks: 0.25,
    explanation: 'A dict maps keys to values.',
    options: [['list', false], ['tuple', false], ['dict', true], ['set', false]],
  },
  {
    text: 'What is the index of the first element of a Python list?',
    type: 'MCQ_SINGLE', marks: 1, negativeMarks: 0.25,
    explanation: 'Python sequences are zero-indexed.',
    options: [['0', true], ['1', false], ['-1', false], ['It depends on the list', false]],
  },

  // ---- Multiple choice ----
  {
    text: 'Which of the following are linear data structures?',
    type: 'MCQ_MULTI', marks: 2, negativeMarks: 0.5,
    explanation: 'Arrays, stacks and queues store elements in a sequence; a tree is hierarchical.',
    options: [['Array', true], ['Stack', true], ['Queue', true], ['Binary tree', false]],
  },
  {
    text: 'Which of the following Python types are mutable?',
    type: 'MCQ_MULTI', marks: 2, negativeMarks: 0.5,
    explanation: 'Lists and dicts can be changed in place; tuples and strings cannot.',
    options: [['list', true], ['tuple', false], ['dict', true], ['str', false]],
  },
  {
    text: 'Which of these sorting algorithms have an average time complexity of O(n log n)?',
    type: 'MCQ_MULTI', marks: 2, negativeMarks: 0.5,
    explanation: 'Merge sort and quick sort average O(n log n); bubble sort is O(n²).',
    options: [['Merge sort', true], ['Bubble sort', false], ['Quick sort', true], ['Insertion sort', false]],
  },
  {
    text: 'Which of the following are valid ways to create an empty list in Python?',
    type: 'MCQ_MULTI', marks: 2, negativeMarks: 0.5,
    explanation: '[] and list() both create an empty list; {} creates an empty dict.',
    options: [['[]', true], ['list()', true], ['{}', false], ['()', false]],
  },
  {
    text: 'Which operations does a queue support in its standard form?',
    type: 'MCQ_MULTI', marks: 2, negativeMarks: 0.5,
    explanation: 'A queue adds at the rear (enqueue) and removes from the front (dequeue).',
    options: [['Enqueue at the rear', true], ['Dequeue from the front', true], ['Pop from the rear', false], ['Insert in the middle', false]],
  },
  {
    text: 'Which of the following are Python keywords?',
    type: 'MCQ_MULTI', marks: 2, negativeMarks: 0.5,
    explanation: 'def, return and lambda are keywords; print is a built-in function.',
    options: [['def', true], ['return', true], ['print', false], ['lambda', true]],
  },

  // ---- True / False ----
  {
    text: 'A queue follows the First-In, First-Out (FIFO) principle.',
    type: 'TRUE_FALSE', marks: 1, negativeMarks: 0.25,
    explanation: 'The first element added is the first removed.',
    options: [['True', true], ['False', false]],
  },
  {
    text: 'Binary search can be used on an unsorted array.',
    type: 'TRUE_FALSE', marks: 1, negativeMarks: 0.25,
    explanation: 'Binary search relies on the data being sorted.',
    options: [['True', false], ['False', true]],
  },
  {
    text: 'In Python, tuples are immutable.',
    type: 'TRUE_FALSE', marks: 1, negativeMarks: 0.25,
    explanation: "A tuple's elements cannot be reassigned after creation.",
    options: [['True', true], ['False', false]],
  },
  {
    text: 'Accessing an element of an array by its index takes O(n) time.',
    type: 'TRUE_FALSE', marks: 1, negativeMarks: 0.25,
    explanation: 'Index access in an array is O(1).',
    options: [['True', false], ['False', true]],
  },
  {
    text: 'In Python, indentation is used to define code blocks.',
    type: 'TRUE_FALSE', marks: 1, negativeMarks: 0.25,
    explanation: 'Python uses indentation instead of braces.',
    options: [['True', true], ['False', false]],
  },
  {
    text: 'A linked list stores its elements in contiguous memory locations.',
    type: 'TRUE_FALSE', marks: 1, negativeMarks: 0.25,
    explanation: 'Linked list nodes can be anywhere in memory; each points to the next.',
    options: [['True', false], ['False', true]],
  },
];

async function seedQuestionBank(ds: DataSource) {
  console.log('\n📚 Seeding question bank…');
  let created = 0;
  for (const q of BANK_QUESTIONS) {
    const existing = await ds.query<{ id: string }[]>(`SELECT id FROM questions WHERE "text" = $1 LIMIT 1`, [q.text]);
    if (existing.length > 0) continue;

    await ds.transaction(async (manager) => {
      const [row] = await manager.query<{ id: string }[]>(
        `INSERT INTO questions ("text", "type", "marks", "negative_marks", "explanation")
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [q.text, q.type, q.marks, q.negativeMarks, q.explanation],
      );
      for (const [index, [text, isCorrect]] of q.options.entries()) {
        await manager.query(
          `INSERT INTO options ("question_id", "text", "is_correct", "order") VALUES ($1, $2, $3, $4)`,
          [row.id, text, isCorrect, index],
        );
      }
    });
    created++;
  }
  const skipped = BANK_QUESTIONS.length - created;
  console.log(`   ✅ ${created} question(s) added to the bank${skipped ? `, ${skipped} already present` : ''}`);
}

/**
 * A medium coding question (Merge Intervals) in the sample exam, so the code editor, the
 * runner and the grading can be tried. Separate from the MCQs above so that it is also
 * added to a database that already has them. Idempotent: skipped when the exam has a coding question.
 */
async function seedCodingQuestion(ds: DataSource) {
  const existing = await ds.query<{ id: string }[]>(
    `SELECT q.id FROM questions q JOIN exam_questions eq ON eq."question_id" = q.id
      WHERE eq."exam_id" = $1 AND q."type" = 'CODING' LIMIT 1`,
    [SAMPLE_EXAM_ID],
  );
  if (existing.length > 0) {
    console.log('   ⏭  Coding question already in the sample exam');
    return;
  }

  console.log('   💻 Adding the coding question…');
  const [question] = await ds.query<{ id: string }[]>(
    `INSERT INTO questions ("text", "type", "marks", "negative_marks", "difficulty", "status")
     VALUES ($1, 'CODING', $2, 0, 'MEDIUM', 'READY') RETURNING id`,
    [MERGE_INTERVALS_TITLE, MERGE_INTERVALS_MARKS],
  );
  await ds.query(
    `INSERT INTO coding_problems
       ("question_id", "statement_md", "starter_code", "allowed_languages", "time_limit_ms", "memory_limit_mb", "comparison_mode", "reference_solution")
     VALUES ($1, $2, $3::jsonb, '{python}', 2000, 256, 'TRIM', $4)`,
    [question.id, MERGE_INTERVALS_STATEMENT, JSON.stringify({ python: MERGE_INTERVALS_STARTER }), MERGE_INTERVALS_REFERENCE],
  );
  let order = 0;
  for (const t of MERGE_INTERVALS_TEST_CASES) {
    await ds.query(
      `INSERT INTO coding_test_cases ("question_id", "input", "expected_output", "is_sample", "weight", "order")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [question.id, t.input, t.expectedOutput, t.isSample, t.weight, order++],
    );
  }
  const [{ next }] = await ds.query<{ next: number }[]>(
    `SELECT COALESCE(MAX("order"), 0) + 1 AS next FROM exam_questions WHERE "exam_id" = $1`,
    [SAMPLE_EXAM_ID],
  );
  await ds.query(`INSERT INTO exam_questions ("exam_id", "question_id", "order") VALUES ($1, $2, $3)`, [
    SAMPLE_EXAM_ID,
    question.id,
    next,
  ]);
  console.log(`   ✅ "${MERGE_INTERVALS_TITLE}" (${MERGE_INTERVALS_MARKS} marks, ${MERGE_INTERVALS_TEST_CASES.length} test cases) added as question ${next}`);
}

/**
 * Easy coding questions in the question bank, not linked to any exam, so an admin can
 * add them to an exam from the bank. Idempotent: a question is skipped when a coding
 * question with the same title already exists.
 */
async function seedBankCodingQuestions(ds: DataSource) {
  console.log('\n📚 Seeding easy coding questions into the question bank…');
  let [topic] = await ds.query<{ id: string }[]>(
    `SELECT id FROM topics WHERE "course_id" IS NULL AND "name" = $1 LIMIT 1`,
    [EASY_CODING_TOPIC],
  );
  if (!topic) {
    [topic] = await ds.query<{ id: string }[]>(`INSERT INTO topics ("name") VALUES ($1) RETURNING id`, [
      EASY_CODING_TOPIC,
    ]);
  }

  for (const q of EASY_CODING_QUESTIONS) {
    const existing = await ds.query<{ id: string }[]>(
      `SELECT id FROM questions WHERE "text" = $1 AND "type" = 'CODING' LIMIT 1`,
      [q.title],
    );
    if (existing.length > 0) {
      console.log(`   ⏭  "${q.title}" already in the bank`);
      continue;
    }

    await ds.transaction(async (tx) => {
      const [question] = await tx.query<{ id: string }[]>(
        `INSERT INTO questions ("text", "type", "marks", "negative_marks", "difficulty", "status", "topic_id")
         VALUES ($1, 'CODING', $2, 0, 'EASY', 'READY', $3) RETURNING id`,
        [q.title, q.marks, topic.id],
      );
      await tx.query(
        `INSERT INTO coding_problems
           ("question_id", "statement_md", "starter_code", "allowed_languages", "time_limit_ms", "memory_limit_mb", "comparison_mode", "reference_solution")
         VALUES ($1, $2, $3::jsonb, '{python}', 2000, 256, 'TRIM', $4)`,
        [question.id, q.statement, JSON.stringify({ python: q.starter }), q.reference],
      );
      let order = 0;
      for (const t of q.testCases) {
        await tx.query(
          `INSERT INTO coding_test_cases ("question_id", "input", "expected_output", "is_sample", "weight", "order")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [question.id, t.input, t.expectedOutput, t.isSample, t.weight, order++],
        );
      }
      for (const tag of EASY_CODING_TAGS) {
        await tx.query(`INSERT INTO question_tags ("question_id", "tag") VALUES ($1, $2)`, [question.id, tag]);
      }
    });
    console.log(`   ✅ "${q.title}" (${q.marks} marks, ${q.testCases.length} test cases)`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to database…');
  await ds.initialize();
  console.log('✅ Connected\n');

  // ── Admin ──────────────────────────────────────────────────────────────
  console.log('👤 Seeding admin…');
  const adminResult = await upsertUser(ds, ADMIN.email, ADMIN.fullName, ADMIN.password, 'admin');
  if (adminResult.created) {
    console.log(`   ✅ Created admin: ${ADMIN.email} / ${ADMIN.password}`);
  } else {
    console.log(`   ⏭  Admin already exists: ${ADMIN.email}`);
  }

  // ── Students ───────────────────────────────────────────────────────────
  console.log('\n🎓 Seeding students…');
  const studentIds: string[] = [];

  for (const s of STUDENTS) {
    const userResult = await upsertUser(ds, s.email, s.fullName, s.password, 'student');
    const studentResult = await upsertStudent(ds, userResult.id, s.collegeId);
    studentIds.push(studentResult.id);

    if (userResult.created || studentResult.created) {
      console.log(`   ✅ Created  ${s.fullName.padEnd(20)} | ${s.email.padEnd(28)} | password: ${s.password} | collegeId: ${s.collegeId}`);
    } else {
      console.log(`   ⏭  Exists   ${s.fullName.padEnd(20)} | ${s.email}`);
    }
  }

  // ── Active Exam ────────────────────────────────────────────────────────
  await seedActiveExam(ds);
  await seedCodingQuestion(ds);
  await seedBankCodingQuestions(ds);
  await seedQuestionBank(ds);
  await seedCourse(ds, studentIds);

  console.log('\n──────────────────────────────────────────────────────');
  console.log('📋 Credentials & Exam Summary:');
  console.log('');
  console.log('  Web app — one login for both roles (http://localhost:3003)');
  console.log('  Legacy admin portal (http://localhost:3001)');
  console.log(`    Email:    ${ADMIN.email}`);
  console.log(`    Password: ${ADMIN.password}`);
  console.log('');
  console.log('  Students (web app, or legacy exam client on http://localhost:3002)');
  for (const s of STUDENTS) {
    console.log(`    ${s.fullName.padEnd(18)} → ${s.email} / ${s.password}`);
  }
  console.log('');
  console.log('  The sample exam has 5 multiple-choice questions and 1 coding question (Merge Intervals, 10 marks).');
  console.log(
    `  The question bank also has ${EASY_CODING_QUESTIONS.length} easy coding questions (topic "${EASY_CODING_TOPIC}", tag "sample") to add to new exams.`,
  );
  console.log('  Active Exam ID for Testing:');
  console.log(`    ${SAMPLE_EXAM_ID}`);
  console.log('──────────────────────────────────────────────────────\n');

  await ds.destroy();
  console.log('✅ Seed complete.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
