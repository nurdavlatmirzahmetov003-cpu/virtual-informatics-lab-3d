/**
 * AI assistant service (MASTER_PROMPT §18–19, §32). UI code imports only
 * from here; all parsing, selection, explanation and server fallback logic
 * lives in this folder, separate from components.
 */
export { askAssistant, resetAssistantServerState, AI_ENDPOINT, type AssistantContext } from './client';
export { suggestSetup, isValidBuild, diffBuilds } from './engine';
export { parseRequest, defaultRequest } from './parse';
export { sanitizeLlmAnswer, mergeAnswer, type LlmAnswer } from './validate';
export type * from './types';
