/**
 * Shared constants for the application
 */

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay',
} as const;

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPES.TRUE_FALSE]: 'True/False',
  [QUESTION_TYPES.SHORT_ANSWER]: 'Short Answer',
  [QUESTION_TYPES.ESSAY]: 'Essay',
};

export const DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const DIFFICULTY_LABELS = {
  [DIFFICULTIES.EASY]: 'Easy',
  [DIFFICULTIES.MEDIUM]: 'Medium',
  [DIFFICULTIES.HARD]: 'Hard',
};

export const QUESTION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;
