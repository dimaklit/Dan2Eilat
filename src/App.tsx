import { useState } from 'react';
import { AlertCircle, LogIn, Map as MapIcon, Moon, PanelRight, Sun, UserRound } from 'lucide-react';
import { AuthDialog } from './components/AuthDialog';
import { HeaderStats } from './components/HeaderStats';
import { SectionSidebar } from './components/SectionSidebar';
import { ShareModal } from './components/ShareModal';
import { TrailMap } from './components/TrailMap';
import { useAuth } from './hooks/useAuth';
import { useUserProgress } from './hooks/useUserProgress';
import { supabase } from './lib/supabase';
import type { TrailSection } from './types/trail';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { logs, updateLog, importLocalData, loading: progressLoading, error } = useUserProgress(authLoading ? undefined : user?.id ?? null);
  const [selected, setSelected] = useState<TrailSection | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
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
  async function signOut() {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  }

  return <div dir="rtl" className={`app ${dark ? 'dark' : ''}`}>
    <header className="app-header"><a href="#" className="brand" onClick={event => event.preventDefault()} aria-label="השביל שלי"><span className="trail-stripes" /><span><strong>השביל שלי<span className="brand-dot">.</span></strong><small>יומן המסע שלך בשביל ישראל</small></span></a>
      <div className="header-center"><span className="live-dot" />הדרך מתחילה בצעד אחד</div>
      <div className="header-actions"><span className="local-badge">{user ? user.email : 'נשמר במכשיר שלך'}</span><button className="mobile-view-toggle primary-button" onClick={() => setMobileList(!mobileList)}>{mobileList ? <MapIcon size={18} /> : <PanelRight size={18} />}{mobileList ? 'למפה' : 'למקטעים'}</button><button className="account-button secondary-button" title={user?.email ?? 'התחברות לחשבון'} aria-label={user ? `חשבון ${user.email ?? ''}` : 'התחברות לחשבון'} onClick={() => setAuthOpen(true)}>{user ? <UserRound size={18} /> : <LogIn size={18} />}<span className="account-label">{user ? 'החשבון שלי' : 'התחברות'}</span></button><button className="icon-button" title={dark ? 'מצב בהיר' : 'מצב כהה'} aria-label={dark ? 'מצב בהיר' : 'מצב כהה'} onClick={toggleTheme}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></div>
    </header>
    <HeaderStats logs={logs} onShare={() => setShareOpen(true)} />
    {error && <div className="storage-error" role="alert"><AlertCircle size={17} />{error}</div>}
    <main className={`workspace ${mobileList ? 'mobile-list-open' : ''}`}>
      <SectionSidebar selected={selected} logs={logs} onSelect={select} onUpdate={updateLog} />
      <div className="map-container"><TrailMap logs={logs} selectedId={selected?.id ?? null} onSelect={select} dark={dark} /></div>
    </main>
    {shareOpen && <ShareModal logs={logs} onClose={() => setShareOpen(false)} />}
    {authOpen && <AuthDialog user={user} loading={authLoading} progressLoading={progressLoading} onClose={() => setAuthOpen(false)} onSignOut={signOut} onImportLocal={importLocalData} />}
  </div>;
}