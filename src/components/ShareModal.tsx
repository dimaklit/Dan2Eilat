import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, Share2, X } from 'lucide-react';
import { calculateStats } from '../lib/progress';
import { intSections } from '../data/intSections';
import type { ProgressLogs } from '../types/userProgress';

export function ShareModal({ logs, onClose }: { logs: ProgressLogs; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [feedback, setFeedback] = useState('');
  const stats = calculateStats(logs);
  const completed = intSections.filter(section => logs[section.id]?.status === 'completed');
  const appUrl = 'https://dimaklit.github.io/Dan2Eilat/';
  const text = `השביל שלי 🥾\n${stats.completed} מתוך 56 מקטעים · ${stats.distanceKm} ק״מ · ${stats.elevationGainM} מ׳ טיפוס\n${completed.map(section => section.nameHe).join('\n')}\nנתוני הדגמה בלבד; המרחק כולל מקטעים שהושלמו.`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);

  async function share() {
    try {
      if (navigator.share) { await navigator.share({ title: 'השביל שלי', text, url: appUrl }); setFeedback('הסיכום שותף'); }
      else { await navigator.clipboard.writeText(`${text}\n${appUrl}`); setFeedback('הסיכום הועתק'); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setFeedback('השיתוף אינו זמין. אפשר לסמן ולהעתיק את הסיכום.'); }
  }

  return <dialog ref={dialogRef} className="share-dialog" aria-labelledby="share-title" onCancel={onClose} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="share-top"><span className="eyebrow">הדרך שעברתי</span><button className="icon-button" aria-label="סגירת סיכום" title="סגירה" onClick={onClose}><X size={21} /></button></div>
    <div className="share-cover"><span className="trail-stripes" /><h2 id="share-title">השביל שלי</h2><p>מהחרמון עד אילת. צעד אחר צעד.</p></div>
    <div className="share-stat-grid"><div><strong>{stats.completed}<small> / 56</small></strong><span>מקטעים</span></div><div><strong>{stats.distanceKm}</strong><span>ק״מ על השביל</span></div><div><strong>{stats.elevationGainM}</strong><span>מ׳ טיפוס</span></div></div>
    <div className="share-sections">{completed.length ? completed.map(section => <p key={section.id}><Check size={15} />{section.nameHe}</p>) : <p>המסע עוד לפנינו.</p>}</div>
    <p className="share-note">סיכום לקריאה בלבד · ללא תמונות או הערות אישיות · נתוני הדגמה</p>
    <a className="share-app-link" href={appUrl}><Link2 size={16} />פתיחת האפליקציה</a>
    <button className="primary-button w-full" onClick={share}>{typeof navigator.share === 'function' ? <Share2 size={17} /> : <Copy size={17} />}שיתוף הסיכום</button>
    <p className="share-feedback" role="status">{feedback}</p>
  </dialog>;
}