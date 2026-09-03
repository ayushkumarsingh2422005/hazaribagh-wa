'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, User, AlertCircle } from 'lucide-react';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardBody, ListRow } from '@/components/ui/Card';
import { AlertBanner } from '@/components/ui/AlertBanner';

interface Contact {
    _id: string;
    phoneNumber: string;
    name?: string;
    lastMessageAt: string;
    unreadCount: number;
}

export default function ContactsList() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setError('');
        try {
            const res = await fetch('/api/contacts');
            const data = await res.json();
            if (data.success) {
                setContacts(data.contacts);
            } else {
                setError(data.error || 'Failed to load conversations');
            }
        } catch {
            setError('Could not load conversations. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <ListSkeleton rows={6} />
            </Card>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <AlertBanner variant="error">{error}</AlertBanner>
                <button
                    type="button"
                    onClick={() => {
                        setLoading(true);
                        fetchContacts();
                    }}
                    className="text-sm text-indigo-600 dark:text-indigo-400 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                description="Messages from WhatsApp will appear here once users start chatting."
            />
        );
    }

    return (
        <Card>
            <CardBody divided>
                {contacts.map(contact => (
                    <ListRow key={contact._id} href={`/dashboard/chats/${encodeURIComponent(contact.phoneNumber)}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {contact.name ? (
                                        contact.name.charAt(0).toUpperCase()
                                    ) : (
                                        <User className="w-4 h-4" aria-hidden />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {contact.name || contact.phoneNumber}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{contact.phoneNumber}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                                    {new Date(contact.lastMessageAt).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                                {contact.unreadCount > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-blue-600 rounded-full">
                                        {contact.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </ListRow>
                ))}
            </CardBody>
        </Card>
    );
}
