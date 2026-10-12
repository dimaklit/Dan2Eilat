import { useEffect, useRef, useState } from 'react';
import { localProgressRepository, STORAGE_KEY } from '../lib/progress';
import { loadCloudProgress, mergeLocalProgress, saveCloudProgress } from '../lib/cloudProgress';
import type { ProgressLogs, SectionUserLog } from '../types/userProgress';

function ownerKey(userId: string | null | undefined): string {
  return userId === undefined ? 'auth-pending' : userId ?? 'guest';
}

export function useUserProgress(userId: string | null | undefined) {
  const [logs, setLogs] = useState<ProgressLogs>({});
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const logsRef = useRef(logs);
  const loadedOwnerRef = useRef<string | null>(null);
  const activeOwnerRef = useRef(ownerKey(userId));
  const dirtyRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve());
  const saveTimerRef = useRef<number | null>(null);
  activeOwnerRef.current = ownerKey(userId);

  useEffect(() => {
    let active = true;
    const key = ownerKey(userId);
    dirtyRef.current = false;
    loadedOwnerRef.current = null;
    setLoadedOwner(null);
    logsRef.current = {};
    setLogs({});
    setError('');
    setLoading(true);

    if (userId === undefined) return () => { active = false; };

    if (userId === null) {
      try {
        const localLogs = localProgressRepository.load();
        logsRef.current = localLogs;
        setLogs(localLogs);
        loadedOwnerRef.current = key;
        setLoadedOwner(key);
      } catch {
        setError('לא ניתן לקרוא את היומן המקומי. הנתונים המקוריים לא נמחקו.');
      } finally {
        setLoading(false);
      }
      return () => { active = false; };
    }

    void loadCloudProgress(userId).then(remoteLogs => {
      if (!active) return;
      logsRef.current = remoteLogs;
      setLogs(remoteLogs);
      loadedOwnerRef.current = key;
      setLoadedOwner(key);
    }).catch(() => {
      if (active) setError('לא ניתן לטעון את יומן החשבון. בדקו את החיבור ונסו לרענן.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (userId !== null) return;
    function synchronize(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        const localLogs = localProgressRepository.load();
        logsRef.current = localLogs;
        setLogs(localLogs);
        setError('');
      }
      catch { setError('לא ניתן לטעון את השינוי מהחלון השני.'); }
    }
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, [userId]);

  useEffect(() => {
    if (userId === undefined || userId === null || loadedOwner !== ownerKey(userId) || !dirtyRef.current) return;
    const snapshot = logs;
    saveTimerRef.current = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.catch(() => undefined).then(async () => {
        if (activeOwnerRef.current !== userId) return;
        await saveCloudProgress(userId, snapshot);
        if (activeOwnerRef.current === userId && logsRef.current === snapshot) {
          dirtyRef.current = false;
          setError('');
        }
      }).catch(() => {
        if (activeOwnerRef.current === userId) setError('לא ניתן לשמור לענן. בדקו את החיבור; השינויים עדיין פתוחים במכשיר.');
      });
    }, 500);
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [logs, loadedOwner, userId]);

  function updateLog(sectionId: number, patch: Partial<Omit<SectionUserLog, 'sectionId'>>) {
    const key = ownerKey(userId);
    if (loadedOwnerRef.current !== key) {
      setError(userId === undefined ? 'בודקים את החשבון… נסו לשמור שוב בעוד רגע.' : 'היומן עדיין לא נטען, ולכן השינוי לא נשמר.');
      return;
    }
    const current = logsRef.current[sectionId] ?? { sectionId, status: 'not_started' as const };
    const next = { ...logsRef.current, [sectionId]: { ...current, ...patch } };
    logsRef.current = next;
    setLogs(next);
    if (userId === null) {
      try { localProgressRepository.save(next); setError(''); }
      catch { setError('השינוי נמצא בזיכרון בלבד. האחסון המקומי מלא או חסום; נסו להסיר תמונות לפני סגירת החלון.'); }
    } else {
      dirtyRef.current = true;
      setError('');
    }
  }

  async function importLocalData() {
    if (userId === undefined || userId === null || loadedOwnerRef.current !== userId) {
      throw new Error('טענו תחילה את יומן החשבון.');
    }
    const localLogs = localProgressRepository.load();
    if (!Object.keys(localLogs).length) throw new Error('אין יומן מקומי למיזוג.');
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    await saveQueueRef.current.catch(() => undefined);
    const currentCloud = await loadCloudProgress(userId);
    const merged = await mergeLocalProgress(userId, currentCloud, localLogs);
    localProgressRepository.clear();
    logsRef.current = merged;
    setLogs(merged);
    dirtyRef.current = false;
    setError('');
  }

  const visibleLogs = loadedOwner === ownerKey(userId) ? logs : {};
  return { logs: visibleLogs, updateLog, importLocalData, loading, error };
}