import { useRef, useState, type ChangeEvent } from 'react';
import { ArrowRight, ArrowUpLeft, Camera, Check, ChevronLeft, FileUp, MapPin, Mountain, Route, Search, Trash2, X } from 'lucide-react';
import { DATA_NOTICE, DIFFICULTY_LABELS, intSections, REGION_LABELS } from '../data/intSections';
import { isPhotoUrl, STATUS_LABELS } from '../lib/progress';
import type { Region, TrailSection } from '../types/trail';
import type { ProgressLogs, SectionStatus, SectionUserLog, TrailPhoto } from '../types/userProgress';

interface Props {
  selected: TrailSection | null;
  logs: ProgressLogs;
  onSelect: (section: TrailSection | null) => void;
  onUpdate: (id: number, patch: Partial<Omit<SectionUserLog, 'sectionId'>>) => void;
}

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image conversion failed');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')); };
    image.src = url;
  });
}

function SectionDetails({ section, log, onBack, onUpdate }: { section: TrailSection; log: SectionUserLog; onBack: () => void; onUpdate: Props['onUpdate'] }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(log.photos ?? []);
  photosRef.current = log.photos ?? [];
  const update = (patch: Partial<Omit<SectionUserLog, 'sectionId'>>) => onUpdate(section.id, patch);

  function addPhoto(url: string) {
    if (photosRef.current.length >= 6) { setError('אפשר לשמור עד 6 תמונות למקטע.'); return; }
    const photo: TrailPhoto = { id: crypto.randomUUID(), url, caption: caption.trim() };
    const next = [...photosRef.current, photo];
    photosRef.current = next;
    update({ photos: next });
    setPhotoUrl(''); setCaption(''); setError('');
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 6 * 1024 * 1024) { setError('בחרו תמונת JPG, PNG, WebP או GIF עד 6MB.'); return; }
    setUploading(true);
    try { addPhoto(await resizePhoto(file)); }
    catch { setError('לא ניתן לפתוח את התמונה. נסו קובץ אחר.'); }
    finally { setUploading(false); }
  }

  return <div className="detail-view">
    <button className="back-button" onClick={onBack}><ArrowRight size={17} />כל המקטעים</button>
    <div className="detail-heading"><span className="eyebrow">{REGION_LABELS[section.region]} · מקטע {section.id} · גבולות ושמות משוערים</span><h2>{section.startPoint.name}<br /><span className="muted">עד {section.endPoint.name}</span></h2><span className={`difficulty ${section.difficulty}`}>{DIFFICULTY_LABELS[section.difficulty]}</span></div>
    <div className="detail-metrics"><span><Route size={18} /><strong>{section.distanceKm}</strong> ק״מ</span><span><Mountain size={18} /><strong>{section.elevationGainM}</strong> מ׳ טיפוס</span></div>
    <div className="navigation-links">{[section.startPoint, section.endPoint].map((point, index) => <a key={index} href={point.wazeUrl} target="_blank" rel="noopener noreferrer"><MapPin size={16} /><span><small>{index === 0 ? 'נקודת התחלה' : 'נקודת סיום'}</small>{point.name}</span><ArrowUpLeft size={16} /><span className="sr-only">ניווט ב-Waze</span></a>)}</div>
    <section className="log-section"><h3>ההתקדמות שלי</h3><div className="status-control" role="group" aria-label="מצב המקטע">{(Object.keys(STATUS_LABELS) as SectionStatus[]).map(status => <button key={status} className={log.status === status ? `chosen ${status}` : ''} aria-pressed={log.status === status} onClick={() => update({ status })}>{status === 'completed' && <Check size={14} />}{STATUS_LABELS[status]}</button>)}</div></section>
    <section className="log-section"><h3>היומן שלי</h3><label className="field-label" htmlFor="hike-date">תאריך הטיול</label><input id="hike-date" type="date" value={log.completedDate ?? ''} onChange={event => update({ completedDate: event.target.value })} />
      <label className="field-label" htmlFor="hike-notes">רגעים מהדרך</label><textarea id="hike-notes" rows={4} maxLength={5000} placeholder="הנוף, האנשים, הקפה של הבוקר..." value={log.notes ?? ''} onChange={event => update({ notes: event.target.value })} />
    </section>
    <section className="log-section"><div className="flex items-center justify-between"><h3>תמונות מהמסע</h3><span className="muted text-xs">{log.photos?.length ?? 0} / 6</span></div>
      {!!log.photos?.length && <div className="photo-grid">{log.photos.map(photo => <figure key={photo.id}><img src={photo.url} alt={photo.caption || 'תמונה מהמסע'} loading="lazy" onError={event => { event.currentTarget.style.opacity = '0.25'; }} /><button className="photo-delete" aria-label="מחיקת תמונה" title="מחיקת תמונה" onClick={() => update({ photos: log.photos?.filter(item => item.id !== photo.id) })}><Trash2 size={14} /></button>{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>)}</div>}
      <label className="field-label" htmlFor="photo-caption">כיתוב לתמונה</label><input id="photo-caption" value={caption} maxLength={160} onChange={event => setCaption(event.target.value)} placeholder="רגע ששווה לזכור" />
      <label className="field-label" htmlFor="photo-url">קישור לתמונה</label><div className="url-row"><input id="photo-url" type="url" dir="ltr" value={photoUrl} onChange={event => setPhotoUrl(event.target.value)} placeholder="https://…" /><button className="icon-button bordered" title="הוספת תמונה מקישור" aria-label="הוספת תמונה מקישור" disabled={!photoUrl.trim() || uploading} onClick={() => { const url = photoUrl.trim(); if (isPhotoUrl(url)) addPhoto(url); else setError('הזינו קישור HTTP או HTTPS תקין לתמונה.'); }}><Check size={18} /></button></div>
      <input className="sr-only" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="בחירת תמונה" onChange={upload} />
      <button className="secondary-button w-full mt-3" disabled={uploading || (log.photos?.length ?? 0) >= 6} onClick={() => fileRef.current?.click()}><Camera size={17} />{uploading ? 'התמונה נטענת…' : 'העלאת תמונה'}</button>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
    <button className="sync-button" aria-pressed={!!log.gpxUploaded} onClick={() => update({ gpxUploaded: !log.gpxUploaded })}><FileUp size={18} /><span>{log.gpxUploaded ? 'סנכרון הדגמה הושלם' : 'ייבוא GPX / סנכרון Strava'}<small>{log.gpxUploaded ? 'סימון בלבד; לא יובא מסלול' : 'הדגמה בלבד · ללא חיבור לחשבון'}</small></span>{log.gpxUploaded && <Check size={17} />}</button>
  </div>;
}

export function SectionSidebar({ selected, logs, onSelect, onUpdate }: Props) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'remaining'>('all');
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [query, setQuery] = useState('');
  const visible = intSections.filter(section => (region === 'all' || section.region === region)
    && (filter === 'all' || (filter === 'completed' ? logs[section.id]?.status === 'completed' : logs[section.id]?.status !== 'completed'))
    && section.nameHe.includes(query.trim()));

  return <aside className={`sidebar ${selected ? 'has-selection' : ''}`} aria-label="מקטעי השביל">
    {selected ? <SectionDetails key={selected.id} section={selected} log={logs[selected.id] ?? { sectionId: selected.id, status: 'not_started' }} onBack={() => onSelect(null)} onUpdate={onUpdate} /> : <>
      <div className="sidebar-heading"><div><span className="eyebrow">המסע שלך, בקצב שלך</span><h2>מקטעי השביל<span>{intSections.length}</span></h2></div><Route size={23} /></div>
      <div className="sidebar-filters"><div className="search-field"><Search size={17} /><input aria-label="חיפוש מקטע" placeholder="לאן הולכים הפעם?" value={query} onChange={event => setQuery(event.target.value)} />{query && <button className="icon-button" title="ניקוי חיפוש" aria-label="ניקוי חיפוש" onClick={() => setQuery('')}><X size={15} /></button>}</div>
        <div className="filter-tabs" role="group" aria-label="סינון לפי התקדמות">{([['all', 'הכול'], ['completed', 'הושלמו'], ['remaining', 'נותרו']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <div className="region-filter"><label htmlFor="region">אזור בארץ</label><select id="region" value={region} onChange={event => setRegion(event.target.value as Region | 'all')}><option value="all">כל הארץ</option>{Object.entries(REGION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      <div className="section-list">{visible.map(section => {
        const status = logs[section.id]?.status ?? 'not_started';
        return <button className={`section-row ${status}`} key={section.id} onClick={() => onSelect(section)}><span className="section-number">{status === 'completed' ? <Check size={18} /> : String(section.id).padStart(2, '0')}</span><span className="section-row-body"><span className="row-region">{REGION_LABELS[section.region]} <span className={`status-dot ${status}`} /></span><strong>{section.startPoint.name} <span className="muted">עד</span> {section.endPoint.name}</strong><span className="row-metrics">{section.distanceKm} ק״מ <span>·</span> {section.elevationGainM} מ׳ טיפוס <span>·</span> {DIFFICULTY_LABELS[section.difficulty]}</span></span><ChevronLeft size={17} className="muted" /></button>;
      })}{visible.length === 0 && <div className="empty-state"><Route size={30} /><h3>אין מקטעים בתצוגה הזו</h3><p>נסו לשנות את החיפוש או הסינון.</p><button className="secondary-button" onClick={() => { setQuery(''); setRegion('all'); setFilter('all'); }}>ניקוי מסננים</button></div>}</div>
      <div className="sidebar-footer"><span className="trail-stripes small" /><p>{DATA_NOTICE}</p></div>
    </>}
  </aside>;
}