import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CloudUpload, LogIn, LogOut, Mail, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface Props {
  user: User | null;
  loading: boolean;
  progressLoading: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
  onImportLocal: () => Promise<void>;
}

export function AuthDialog({ user, loading, progressLoading, onClose, onSignOut, onImportLocal }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      const redirectTo = new URL(window.location.pathname, window.location.origin).toString();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMessage('שלחנו קישור התחברות לכתובת המייל. אפשר לסגור את החלון ולפתוח אותו מהמכשיר הזה.');
    } catch {
      setMessage('לא ניתן לשלוח קישור התחברות. בדקו את כתובת המייל והגדרות Supabase.');
    } finally {
      setBusy(false);
    }
  }

  async function importLocal() {
    setBusy(true);
    setMessage('');
    try {
      await onImportLocal();
      setMessage('יומן המכשיר מוזג לחשבון. הנתונים שבחשבון נשמרו במקטעים שבהם כבר היו קיימים.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'לא ניתן למזג את היומן המקומי.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setMessage('');
    try { await onSignOut(); onClose(); }
    catch { setMessage('לא ניתן להתנתק כרגע. נסו שוב.'); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="auth-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="auth-dialog-top"><div><span className="eyebrow">היומן שלך, בכל מכשיר</span><h2 id="auth-title">חשבון אישי</h2></div><button className="icon-button" aria-label="סגירה" title="סגירה" onClick={onClose}><X size={20} /></button></div>
    {!supabaseConfigured ? <div className="auth-setup-message" role="status"><p>התחברות לענן עדיין לא הוגדרה. היומן המקומי ממשיך לעבוד במכשיר הזה.</p><p>כדי להפעיל חשבונות, הגדירו את כתובת Supabase ומפתח הפרסום ב־<code>.env.local</code>, והריצו את <code>supabase/schema.sql</code> בפרויקט Supabase.</p></div>
      : loading ? <p className="auth-status">בודקים את מצב ההתחברות…</p>
        : user ? <div className="auth-account">
          <p className="auth-email"><span className="auth-avatar"><Mail size={18} /></span><span><small>מחובר בתור</small><strong dir="ltr">{user.email ?? 'חשבון'}</strong></span></p>
          <p className="auth-help">ההתקדמות, ההערות והתמונות נשמרות בחשבון הפרטי שלך.</p>
          <button className="secondary-button w-full" disabled={busy || progressLoading} onClick={importLocal}><CloudUpload size={17} />מיזוג יומן מהמכשיר הזה</button>
          <p className="auth-help">המקטעים שכבר קיימים בחשבון נשארים ללא שינוי. אחרי מיזוג מוצלח, העותק המקומי נמחק מהמכשיר.</p>
          <button className="auth-signout" disabled={busy} onClick={signOut}><LogOut size={16} />התנתקות</button>
        </div>
          : <form className="auth-form" onSubmit={sendLink}>
            <p className="auth-help">התחברו בקישור חד־פעמי למייל. כל חשבון רואה רק את היומן שלו.</p>
            <label htmlFor="auth-email">כתובת מייל</label>
            <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" />
            <button className="primary-button w-full" disabled={busy}><LogIn size={17} />{busy ? 'שולחים…' : 'שליחת קישור התחברות'}</button>
          </form>}
    {message && <p className="auth-message" role="status">{message}</p>}
  </dialog>;
}