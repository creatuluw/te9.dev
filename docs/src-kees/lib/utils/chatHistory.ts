/**
 * Chat history management with localStorage persistence
 * 
 * Stores chat conversations including messages and created tasks
 */

import type { ChatMessage } from '$lib/services/tinyTalkService';
import type { Task } from '$lib/schemas/task';

export interface ChatHistoryMessage {
	text: string;
	isBot: boolean;
	timestamp: string; // ISO string for serialization
}

export interface ChatHistory {
	mode: 'chat' | 'task';
	messages: ChatHistoryMessage[];
	conversationHistory: ChatMessage[];
	createdTasks: Task[];
	lastUpdated: string; // ISO string
}

const STORAGE_KEY = 'chat_history';
const MAX_MESSAGES_BEFORE_HINT = 50; // Suggest clearing after 50 messages
const MAX_STORAGE_SIZE_KB = 500; // Suggest clearing if storage > 500KB

/**
 * Load chat history from localStorage
 */
export function loadChatHistory(): ChatHistory | null {
	if (typeof window === 'undefined') return null;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;

		const history: ChatHistory = JSON.parse(stored);
		
		// Convert timestamp strings back to Date objects for messages
		const messages = history.messages.map(msg => ({
			...msg,
			timestamp: new Date(msg.timestamp)
		}));

		return {
			...history,
			messages: messages as any // Type assertion needed due to Date serialization
		};
	} catch (error) {
		console.error('[chatHistory] Error loading chat history:', error);
		return null;
	}
}

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(history: {
	mode: 'chat' | 'task';
	messages: Array<{ text: string; isBot: boolean; timestamp: Date }>;
	conversationHistory: ChatMessage[];
	createdTasks: Task[];
}): void {
	if (typeof window === 'undefined') return;

	try {
		// Convert Date objects to ISO strings for serialization
		const serializableHistory: ChatHistory = {
			mode: history.mode,
			messages: history.messages.map(msg => ({
				text: msg.text,
				isBot: msg.isBot,
				timestamp: msg.timestamp.toISOString()
			})),
			conversationHistory: history.conversationHistory,
			createdTasks: history.createdTasks,
			lastUpdated: new Date().toISOString()
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableHistory));
	} catch (error) {
		console.error('[chatHistory] Error saving chat history:', error);
		
		// If quota exceeded, suggest clearing
		if (error instanceof DOMException && error.name === 'QuotaExceededError') {
			console.warn('[chatHistory] Storage quota exceeded - consider clearing history');
		}
	}
}

/**
 * Clear chat history from localStorage
 */
export function clearChatHistory(): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if chat history should be cleared (based on size or message count)
 */
export function shouldSuggestClearingHistory(): boolean {
	if (typeof window === 'undefined') return false;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return false;

		// Check storage size
		const sizeKB = new Blob([stored]).size / 1024;
		if (sizeKB > MAX_STORAGE_SIZE_KB) {
			return true;
		}

		// Check message count
		const history: ChatHistory = JSON.parse(stored);
		if (history.messages.length > MAX_MESSAGES_BEFORE_HINT) {
			return true;
		}

		return false;
	} catch (error) {
		console.error('[chatHistory] Error checking history size:', error);
		return false;
	}
}

/**
 * Get storage size in KB
 */
export function getChatHistorySize(): number {
	if (typeof window === 'undefined') return 0;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return 0;
		return new Blob([stored]).size / 1024;
	} catch (error) {
		return 0;
	}
}

