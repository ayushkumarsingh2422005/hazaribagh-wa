'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/providers/ToastProvider';

interface Message {
    _id: string;
    phoneNumber: string;
    message: string;
    direction: 'incoming' | 'outgoing';
    timestamp: string;
    status?: string;
}

export default function ChatView({ phoneNumber }: { phoneNumber: string }) {
    const toast = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();
    }, [phoneNumber]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        setLoadError('');
        try {
            const res = await fetch(`/api/chats/${encodeURIComponent(phoneNumber)}`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
            } else {
                setLoadError(data.error || 'Failed to load messages');
            }
        } catch {
            setLoadError('Could not load messages.');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const text = newMessage.trim();

        try {
            const res = await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: phoneNumber, message: text }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [
                    ...prev,
                    {
                        _id: data.messageId || Date.now().toString(),
                        phoneNumber,
                        message: text,
                        direction: 'outgoing',
                        timestamp: new Date().toISOString(),
                        status: 'sent',
                    },
                ]);
                setNewMessage('');
                setTimeout(fetchMessages, 500);
            } else {
                toast.error(data.error || 'Failed to send message');
            }
        } catch {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <ListSkeleton rows={4} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {loadError && (
                <AlertBanner variant="error" className="mb-4">
                    {loadError}
                </AlertBanner>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100dvh-12rem)] lg:max-h-[calc(100dvh-8rem)]">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[200px] text-slate-500 dark:text-slate-400 text-sm">
                            No messages yet. Send the first reply below.
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg._id}
                                className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                                        msg.direction === 'outgoing'
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                    <p
                                        className={`text-xs mt-1 ${
                                            msg.direction === 'outgoing'
                                                ? 'text-blue-100'
                                                : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {msg.direction === 'outgoing' && msg.status && (
                                            <span className="ml-1">· {msg.status}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900">
                    <form onSubmit={sendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            disabled={sending}
                            aria-label="Message text"
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="px-4 sm:px-6 flex items-center gap-2 shrink-0"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="hidden sm:inline">Sending</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span className="hidden sm:inline">Send</span>
                                </>
                            )}
                        </Button>
                    </form>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Sent via WhatsApp Cloud API to {phoneNumber}
                    </p>
                </div>
            </div>
        </div>
    );
}
