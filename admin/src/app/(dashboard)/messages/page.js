'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Send, Trash2 } from 'lucide-react';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread');
  const [drafts, setDrafts] = useState({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages;
    if (filter === 'replied') return messages.filter((message) => message.reply);
    if (filter === 'read') return messages.filter((message) => message.isRead && !message.reply);
    return messages.filter((message) => !message.isRead);
  }, [messages, filter]);

  async function loadMessages() {
    try {
      setLoading(true);
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages);
        const nextDrafts = {};
        data.messages.forEach((message) => {
          nextDrafts[message._id] = message.reply || '';
        });
        setDrafts(nextDrafts);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateMessage(message, body) {
    const res = await fetch(`/api/messages/${message._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setNotice(res.ok && data.success ? data.msg : data.error || 'Could not update message.');
    if (res.ok && data.success) await loadMessages();
  }

  async function deleteMessage(message) {
    if (!confirm(`Delete message from ${message.name}?`)) return;
    const res = await fetch(`/api/messages/${message._id}`, { method: 'DELETE' });
    const data = await res.json();
    setNotice(res.ok && data.success ? data.message : data.error || 'Could not delete message.');
    if (res.ok && data.success) await loadMessages();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Contact Messages</h1>
          <p className="text-slate-400 mt-1">Read employee inquiries and record HR replies.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white capitalize">
          {['unread', 'read', 'replied', 'all'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {notice && <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">{notice}</div>}

      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" /></div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm"><Mail className="w-12 h-12 mx-auto mb-3 text-slate-600" /><p>No messages in this queue.</p></div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredMessages.map((message) => (
              <div key={message._id} className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 hover:bg-slate-900/30">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{message.name}</p>
                      {!message.isRead && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">Unread</span>}
                    </div>
                    <p className="text-xs text-slate-500">{message.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{message.subject}</p>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">{message.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMessage(message, { isRead: true })} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200">Mark Read</button>
                    <button onClick={() => deleteMessage(message)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <textarea value={drafts[message._id] || ''} onChange={(e) => setDrafts((prev) => ({ ...prev, [message._id]: e.target.value }))} rows={5} placeholder="Record a reply or resolution note..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white placeholder-slate-600 resize-none" />
                  <button onClick={() => updateMessage(message, { reply: drafts[message._id] || '' })} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white">
                    <Send className="w-4 h-4" /> Save Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
