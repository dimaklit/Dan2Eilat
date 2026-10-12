import { useState } from 'react';
import { AlertCircle, Map as MapIcon, Moon, PanelRight, Sun } from 'lucide-react';
import { HeaderStats } from './components/HeaderStats';
import { SectionSidebar } from './components/SectionSidebar';
import { ShareModal } from './components/ShareModal';
import { TrailMap } from './components/TrailMap';
import { useUserProgress } from './hooks/useUserProgress';
import type { TrailSection } from './types/trail';

export default function App() {
  const { logs, updateLog, error } = useUserProgress();
  const [selected, setSelected] = useState<TrailSection | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileList, setMobileList] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('my-shvil.theme') === 'dark'; } catch { return false; }
  });

  function select(section: TrailSection | null) { setSelected(section); if (section) setMobileList(true); }
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem('my-shvil.theme', next ? 'dark' : 'light'); } catch { return; }
  }

  return <div dir="rtl" className={`app ${dark ? 'dark' : ''}`}>
    <header className="app-header"><a href="#" className="brand" onClick={event => event.preventDefault()} aria-label="השביל שלי"><span className="trail-stripes" /><span><strong>השביל שלי<span className="brand-dot">.</span></strong><small>יומן המסע שלך בשביל ישראל</small></span></a>
      <div className="header-center"><span className="live-dot" />הדרך מתחילה בצעד אחד</div>
      <div className="header-actions"><span className="local-badge">נשמר במכשיר שלך</span><button className="mobile-view-toggle primary-button" onClick={() => setMobileList(!mobileList)}>{mobileList ? <MapIcon size={18} /> : <PanelRight size={18} />}{mobileList ? 'למפה' : 'למקטעים'}</button><button className="icon-button" title={dark ? 'מצב בהיר' : 'מצב כהה'} aria-label={dark ? 'מצב בהיר' : 'מצב כהה'} onClick={toggleTheme}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></div>
    </header>
    <HeaderStats logs={logs} onShare={() => setShareOpen(true)} />
    {error && <div className="storage-error" role="alert"><AlertCircle size={17} />{error}</div>}
    <main className={`workspace ${mobileList ? 'mobile-list-open' : ''}`}>
      <SectionSidebar selected={selected} logs={logs} onSelect={select} onUpdate={updateLog} />
      <div className="map-container"><TrailMap logs={logs} selectedId={selected?.id ?? null} onSelect={select} dark={dark} /></div>
    </main>
    {shareOpen && <ShareModal logs={logs} onClose={() => setShareOpen(false)} />}
  </div>;
}