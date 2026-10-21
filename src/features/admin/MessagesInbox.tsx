import React from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { Mail, Check, Trash2, Calendar } from 'lucide-react';

interface MessagesInboxProps {
  onNotify: (msg: string) => void;
}

export const MessagesInbox: React.FC<MessagesInboxProps> = ({ onNotify }) => {
  const { messages, markMessageRead, deleteMessage } = useData();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Client Messages & Inquiries</h2>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>
          Submissions received from the contact form (FIFA accreditations, print sales, documentary assignments).
        </p>
      </div>

      <div className="admin-card">
        {messages.length === 0 ? (
          <p style={{ color: '#777', padding: '30px 0', textAlign: 'center' }}>No messages yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  background: msg.read ? '#191919' : '#222222',
                  borderLeft: msg.read ? '3px solid #444' : '3px solid var(--color-gold)',
                  padding: '20px',
                  borderRadius: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: '#FFF', fontWeight: 600 }}>{msg.name}</h4>
                    <a
                      href={`mailto:${msg.email}`}
                      style={{ fontSize: '0.82rem', color: 'var(--color-gold)', textDecoration: 'none' }}
                    >
                      {msg.email}
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '0.75rem' }}>
                      <Calendar size={13} />
                      <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>

                    {!msg.read && (
                      <button
                        onClick={() => {
                          markMessageRead(msg.id);
                          onNotify('Message marked as read.');
                        }}
                        className="btn btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                      >
                        <Check size={13} /> Mark Read
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm('Delete this message?')) {
                          deleteMessage(msg.id);
                          onNotify('Message deleted.');
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p style={{ color: '#DDD', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
