import React, { useState } from 'react';
import { useData } from '../lib/dataContext.tsx';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const { submitMessage } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bot trap
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (honeypot) {
      // Silently pretend success to bots
      setStatus('success');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      setStatus('error');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    if (!message.trim() || message.length < 5) {
      setErrorMessage('Please enter a message (at least 5 characters).');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      await submitMessage(name.trim(), email.trim(), message.trim());
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMessage('Unable to send message right now. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }} noValidate>
      {/* Bot honeypot field - visually hidden */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="website_url_hp"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          className="form-input"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === 'submitting'}
          required
        />
      </div>

      <div className="form-group">
        <input
          type="email"
          className="form-input"
          placeholder="Enter your e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          required
        />
      </div>

      <div className="form-group">
        <textarea
          className="form-input form-textarea"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === 'submitting'}
          rows={4}
          required
        />
      </div>

      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontSize: '0.88rem', marginBottom: '16px' }}>
          <CheckCircle2 size={18} />
          <span>Thank you! Your message has been sent successfully.</span>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          type="submit"
          className="btn"
          disabled={status === 'submitting'}
          style={{ width: '100%', maxWidth: '280px' }}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>SENDING...</span>
            </>
          ) : (
            'SEND MESSAGE'
          )}
        </button>
      </div>
    </form>
  );
};
