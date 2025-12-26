'use client';

import { useState, KeyboardEvent } from 'react';
import { Icon } from '@iconify/react';

interface ChatInputProps {
    onSend: (message: string) => void;
    onStop?: () => void;
    disabled?: boolean;
    isStreaming?: boolean;
}

export default function ChatInput({ onSend, onStop, disabled = false, isStreaming = false }: ChatInputProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    disabled={disabled}
                    rows={1}
                    className="flex-1 w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-hidden"
                    style={{
                        height: '48px',
                    }}
                />
                {isStreaming ? (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onStop?.();
                        }}
                        className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        type="button"
                        title="중지"
                    >
                        <Icon icon="ion:stop" className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        disabled={disabled || !message.trim()}
                        className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        type="button"
                    >
                        <Icon icon="ion:send" className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
