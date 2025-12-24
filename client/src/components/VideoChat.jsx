import React, { useState, useEffect, useRef } from 'react';
import { useChat, useLocalParticipant } from "@livekit/components-react";
import { Send, X, MessageSquare } from 'lucide-react';

const VideoChat = ({ isOpen, onClose }) => {
    const { send, chatMessages, isSending } = useChat();
    const { localParticipant } = useLocalParticipant();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatMessages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (message.trim() && !isSending) {
            await send(message);
            setMessage('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-4 z-50 w-80 h-96 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right-10 fade-in duration-200">
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    <span className="font-bold text-white text-sm">In-Call Messages</span>
                </div>
                <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {chatMessages.length === 0 ? (
                    <div className="text-center text-white/30 text-xs mt-10">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    chatMessages.map((msg) => {
                        const isMe = msg.from?.identity === localParticipant?.identity;
                        return (
                            <div key={msg.timestamp} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isMe
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                                    }`}>
                                    {msg.message}
                                </div>
                                <span className="text-[10px] text-white/30 mt-1 px-1">
                                    {msg.from?.name || msg.from?.identity || 'Guest'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5">
                <div className="relative">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || isSending}
                        className="absolute right-1 top-1 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VideoChat;
