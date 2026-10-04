/** Algorithm Lab logic — no React, no DOM. The UI lives in pages/Labs/AlgorithmLab. */
export * from './types';
export { ALGORITHMS, runAlgorithm, type AlgorithmSpec } from './algorithms';
export { ARRAY_LIMITS, parseArray, randomArray, rng, toItems } from './arrays';
export { linearSearch, binarySearch } from './searches';
export { bubbleSort, selectionSort, insertionSort } from './sorts';
export { factorial, MAX_FACTORIAL_N } from './recursion';
export { QUIZZES, QUIZ_IDS, isQuizId, makeQuiz, optionLabel, type QuizId, type QuizOption, type QuizVariant, type QuizWork } from './quizzes';
