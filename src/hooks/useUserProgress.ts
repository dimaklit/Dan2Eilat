import { useEffect, useState } from 'react';
import { localProgressRepository, STORAGE_KEY } from '../lib/progress';
import type { ProgressLogs, SectionUserLog } from '../types/userProgress';

export function useUserProgress() {
  const [initial] = useState(() => {
    try { return { logs: localProgressRepository.load(), error: '' }; }
    catch { return { logs: {} as ProgressLogs, error: 'לא ניתן לקרוא את היומן השמור. הנתונים המקוריים לא נמחקו.' }; }
  });
  const [logs, setLogs] = useState(initial.logs);
  const [error, setError] = useState(initial.error);

  useEffect(() => {
    function synchronize(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try { setLogs(localProgressRepository.load()); setError(''); }
      catch { setError('לא ניתן לטעון את השינוי מהחלון השני.'); }
    }
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);

  function updateLog(sectionId: number, patch: Partial<Omit<SectionUserLog, 'sectionId'>>) {
    const current = logs[sectionId] ?? { sectionId, status: 'not_started' as const };
    const next = { ...logs, [sectionId]: { ...current, ...patch } };
    try { localProgressRepository.save(next); setError(''); }
    catch { setError('השינוי נמצא בזיכרון בלבד. האחסון המקומי מלא או חסום; נסו להסיר תמונות לפני סגירת החלון.'); }
    setLogs(next);
  }

  return { logs, updateLog, error };
}