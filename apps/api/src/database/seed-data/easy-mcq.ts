/**
 * Easy DSA + Python objective questions (6 single choice, 6 multiple choice,
 * 6 true/false) for the main instructor's question bank. They are not linked to
 * any exam; an instructor adds them to an exam from the exam's Questions tab.
 * The seed matches them by text, so re-running it never duplicates them.
 */

export const EASY_MCQ_TOPIC = 'DSA & Python basics';
export const EASY_MCQ_TAGS = ['sample', 'easy'];

export type EasyMcqQuestion = {
  text: string;
  type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE';
  marks: number;
  negativeMarks: number;
  explanation: string;
  /** [text, isCorrect] in display order. */
  options: [string, boolean][];
};

export const EASY_MCQ_QUESTIONS: EasyMcqQuestion[] = [
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
