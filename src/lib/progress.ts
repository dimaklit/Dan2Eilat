import { TOTAL_DISTANCE_KM, TOTAL_SECTIONS, intSections } from '../data/intSections';
import type { ProgressLogs, SectionUserLog } from '../types/userProgress';

export const STORAGE_KEY = 'my-shvil.progress.v1';
export const STATUS_LABELS = { not_started: 'טרם בוצע', partial: 'בוצע חלקית', completed: 'הושלם!' };

export function isPhotoUrl(url: string): boolean {
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(url)) return true;
  try { return ['https:', 'http:'].includes(new URL(url).protocol); } catch { return false; }
}

export function parseLogs(raw: string | null): ProgressLogs {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid progress');
  const logs: ProgressLogs = {};
  for (const section of intSections) {
    const value = (parsed as Record<string, unknown>)[section.id];
    if (!value || typeof value !== 'object') continue;
    const candidate = value as Record<string, unknown>;
    if (candidate.sectionId !== section.id || !['not_started', 'partial', 'completed'].includes(String(candidate.status))) continue;
    const log: SectionUserLog = { sectionId: section.id, status: candidate.status as SectionUserLog['status'] };
    if (typeof candidate.notes === 'string') log.notes = candidate.notes.slice(0, 5000);
    if (typeof candidate.completedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate.completedDate)) log.completedDate = candidate.completedDate;
    log.gpxUploaded = candidate.gpxUploaded === true;
    if (Array.isArray(candidate.photos)) {
      log.photos = candidate.photos.filter((photo): photo is NonNullable<SectionUserLog['photos']>[number] =>
        photo && typeof photo.id === 'string' && typeof photo.url === 'string' && isPhotoUrl(photo.url)
        && (photo.caption === undefined || typeof photo.caption === 'string')
        && (photo.lat === undefined || (typeof photo.lat === 'number' && Number.isFinite(photo.lat) && Math.abs(photo.lat) <= 90))
        && (photo.lng === undefined || (typeof photo.lng === 'number' && Number.isFinite(photo.lng) && Math.abs(photo.lng) <= 180))
      ).slice(0, 6);
    }
    logs[section.id] = log;
  }
  return logs;
}

export const localProgressRepository = {
  load(): ProgressLogs { return parseLogs(localStorage.getItem(STORAGE_KEY)); },
  save(logs: ProgressLogs): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },
};

export function calculateStats(logs: ProgressLogs) {
  const completed = intSections.filter(section => logs[section.id]?.status === 'completed');
  return {
    completed: completed.length,
    percentage: Math.round(completed.length / TOTAL_SECTIONS * 100),
    distanceKm: Math.round(completed.reduce((total, section) => total + section.distanceKm, 0) * 10) / 10,
    elevationGainM: completed.reduce((total, section) => total + section.elevationGainM, 0),
    totalSections: TOTAL_SECTIONS,
    totalDistanceKm: TOTAL_DISTANCE_KM,
  };
}