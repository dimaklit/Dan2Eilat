import { Footprints, Mountain, Route, Share2 } from 'lucide-react';
import { calculateStats } from '../lib/progress';
import type { ProgressLogs } from '../types/userProgress';

interface Props { logs: ProgressLogs; onShare: () => void }
const number = new Intl.NumberFormat('he-IL');

export function HeaderStats({ logs, onShare }: Props) {
  const stats = calculateStats(logs);
  return <section className="stats-bar" aria-label="ההתקדמות שלי">
    <div className="progress-stat">
      <div className="flex items-baseline justify-between gap-3"><span className="stat-label">כל צעד הוא חלק מהדרך</span><strong className="progress-number">{stats.percentage}<small>%</small></strong></div>
      <div className="progress-track" role="progressbar" aria-label="אחוז המקטעים שהושלמו" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.percentage}><div style={{ width: `${stats.percentage}%` }} /></div>
    </div>
    <div className="stat-item"><span className="stat-icon"><Route size={20} /></span><div><strong><bdi>{stats.completed} / 56</bdi></strong><span>מקטעים הושלמו</span></div></div>
    <div className="stat-item"><span className="stat-icon"><Footprints size={20} /></span><div><strong><bdi>{number.format(stats.distanceKm)} / 1,050</bdi> <small>ק״מ</small></strong><span>מרחק ממקטעים שהושלמו</span></div></div>
    <div className="stat-item"><span className="stat-icon"><Mountain size={20} /></span><div><strong>{number.format(stats.elevationGainM)} <small>מ׳</small></strong><span>טיפוס מצטבר</span></div></div>
    <button className="primary-button share-button" aria-label="שיתוף המפה שלי" onClick={onShare}><Share2 size={17} /><span className="share-label-desktop">שיתוף המפה שלי</span><span className="share-label-mobile">שיתוף</span></button>
  </section>;
}