'use client';

import { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { CHILD_SAFE_EMOJIS } from '@/types';

interface Props {
  onSend: (type: 'text' | 'emoji', content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSend('text', message.trim());
    setMessage('');
  };

  const handleEmojiClick = (emoji: string) => {
    // Insert emoji at cursor position or at end
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || message.length;
      const end = input.selectionEnd || message.length;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Focus back on input and set cursor after emoji
      setTimeout(() => {
        input.focus();
        const newCursorPos = start + emoji.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setMessage(message + emoji);
    }
  };

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-dark-800 rounded-xl border border-dark-700 p-3 max-h-64 overflow-y-auto">
          {CHILD_SAFE_EMOJIS.map((category) => (
            <div key={category.name} className="mb-3">
              <div className="text-xs text-gray-500 mb-1">{category.name}</div>
              <div className="grid grid-cols-8 gap-1">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-2 text-xl hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-3 rounded-xl transition-colors ${
            showEmojiPicker
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
          disabled={disabled}
        >
          <Smile size={20} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-dark-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={disabled}
          onFocus={() => setShowEmojiPicker(false)}
        />

        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
