import type { ProgressLogs, TrailPhoto } from '../types/userProgress';
import { mergeProgressLogs, parseLogs } from './progress';
import { supabase, TRAIL_PHOTOS_BUCKET } from './supabase';

function requireSupabase() {
  if (!supabase) throw new Error('התחברות לענן לא הוגדרה. הגדירו את משתני Supabase לפני שמירת נתונים בחשבון.');
  return supabase;
}

function getStoragePaths(logs: ProgressLogs): Set<string> {
  return new Set(Object.values(logs).flatMap(log => (log.photos ?? []).flatMap(photo => photo.storagePath ? [photo.storagePath] : [])));
}

function dataUrlBlob(url: string): { blob: Blob; extension: string } {
  const match = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(url);
  if (!match) throw new Error('תמונה מקומית אינה בפורמט נתמך.');
  const mime = `image/${match[1]}`;
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  return { blob: new Blob([bytes.buffer as ArrayBuffer], { type: mime }), extension };
}

async function signPhoto(photo: TrailPhoto): Promise<TrailPhoto> {
  if (!photo.storagePath) return photo;
  const client = requireSupabase();
  const { data, error } = await client.storage.from(TRAIL_PHOTOS_BUCKET).createSignedUrl(photo.storagePath, 3600);
  if (error) throw error;
  return { ...photo, url: data.signedUrl };
}

export async function loadCloudProgress(userId: string): Promise<ProgressLogs> {
  const client = requireSupabase();
  const { data, error } = await client.from('user_progress').select('logs').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const logs = parseLogs(JSON.stringify(data?.logs ?? {}));
  const signedLogs: ProgressLogs = {};
  for (const [id, log] of Object.entries(logs)) {
    signedLogs[Number(id)] = {
      ...log,
      photos: await Promise.all((log.photos ?? []).map(signPhoto)),
    };
  }
  return signedLogs;
}

async function prepareCloudLogs(userId: string, logs: ProgressLogs): Promise<{ logs: ProgressLogs; uploadedPaths: string[] }> {
  const client = requireSupabase();
  const prepared: ProgressLogs = {};
  const uploadedPaths: string[] = [];
  try {
    for (const [id, log] of Object.entries(logs)) {
      const photos: TrailPhoto[] = [];
      for (const photo of log.photos ?? []) {
        if (photo.storagePath) {
          photos.push({ ...photo, url: '' });
        } else if (photo.url.startsWith('data:image/')) {
          const { blob, extension } = dataUrlBlob(photo.url);
          const path = `${userId}/${id}/${photo.id}.${extension}`;
          const { error } = await client.storage.from(TRAIL_PHOTOS_BUCKET).upload(path, blob, {
            contentType: blob.type,
            cacheControl: '3600',
            upsert: true,
          });
          if (error) throw error;
          uploadedPaths.push(path);
          photos.push({ ...photo, url: '', storagePath: path });
        } else {
          photos.push(photo);
        }
      }
      prepared[Number(id)] = { ...log, photos };
    }
    return { logs: prepared, uploadedPaths };
  } catch (error) {
    if (uploadedPaths.length) await client.storage.from(TRAIL_PHOTOS_BUCKET).remove(uploadedPaths);
    throw error;
  }
}

export async function saveCloudProgress(userId: string, logs: ProgressLogs): Promise<void> {
  const client = requireSupabase();
  const { data: previous, error: readError } = await client.from('user_progress').select('logs').eq('user_id', userId).maybeSingle();
  if (readError) throw readError;
  const previousLogs = parseLogs(JSON.stringify(previous?.logs ?? {}));
  const { logs: cloudLogs, uploadedPaths } = await prepareCloudLogs(userId, logs);
  const { error: saveError } = await client.from('user_progress').upsert({
    user_id: userId,
    logs: cloudLogs,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (saveError) {
    if (uploadedPaths.length) await client.storage.from(TRAIL_PHOTOS_BUCKET).remove(uploadedPaths);
    throw saveError;
  }
  const retainedPaths = getStoragePaths(cloudLogs);
  const removedPaths = [...getStoragePaths(previousLogs)].filter(path => !retainedPaths.has(path));
  if (removedPaths.length) {
    const { error } = await client.storage.from(TRAIL_PHOTOS_BUCKET).remove(removedPaths);
    if (error) throw error;
  }
}

export async function mergeLocalProgress(userId: string, cloudLogs: ProgressLogs, localLogs: ProgressLogs): Promise<ProgressLogs> {
  const merged = mergeProgressLogs(localLogs, cloudLogs);
  await saveCloudProgress(userId, merged);
  return loadCloudProgress(userId);
}