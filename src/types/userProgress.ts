export type SectionStatus = 'not_started' | 'partial' | 'completed';

export interface TrailPhoto {
  id: string;
  url: string;
  caption?: string;
  lat?: number;
  lng?: number;
  storagePath?: string;
}

export interface SectionUserLog {
  sectionId: number;
  status: SectionStatus;
  completedDate?: string;
  notes?: string;
  photos?: TrailPhoto[];
  gpxUploaded?: boolean;
}

export type ProgressLogs = Record<number, SectionUserLog>;