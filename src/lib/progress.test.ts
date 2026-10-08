import { describe, expect, it } from 'vitest';
import { intSections } from '../data/intSections';
import { calculateStats, isPhotoUrl, parseLogs } from './progress';

describe('trail data', () => {
  it('uses unique section IDs and Israeli longitude/latitude coordinates', () => {
    expect(new Set(intSections.map(section => section.id)).size).toBe(intSections.length);
    expect(intSections.length).toBe(56);
    for (const section of intSections) {
      expect(section.id).toBeGreaterThanOrEqual(1);
      expect(section.id).toBeLessThanOrEqual(56);
      expect(section.coordinates.length).toBeGreaterThan(2);
      expect(section.coordinates[0]).toEqual([section.startPoint.lng, section.startPoint.lat]);
      expect(section.coordinates.at(-1)).toEqual([section.endPoint.lng, section.endPoint.lat]);
      for (const [lng, lat] of section.coordinates) { expect(lng).toBeGreaterThan(34); expect(lng).toBeLessThan(36); expect(lat).toBeGreaterThan(29); expect(lat).toBeLessThan(34); }
    }
  });
  it('connects all 56 demonstration sections from Hermon to Eilat', () => {
    expect(intSections.map(section => section.id)).toEqual(Array.from({ length: 56 }, (_, index) => index + 1));
    for (let index = 1; index < intSections.length; index++) expect(intSections[index].coordinates[0]).toEqual(intSections[index - 1].coordinates.at(-1));
  });

  it('uses detailed mapped paths rather than straight demo connectors', () => {
    expect(intSections.reduce((total, section) => total + section.coordinates.length, 0)).toBeGreaterThan(40000);
    for (const section of intSections) {
      expect(section.coordinates.length).toBeGreaterThan(30);
      expect(section.distanceKm).toBeGreaterThanOrEqual(3);
      expect(section.distanceKm).toBeLessThan(50);
      expect(section.routeSegments?.length).toBeGreaterThan(0);
    }
  });
});

describe('progress', () => {
  it('counts completed sections only, against the official totals', () => {
    const stats = calculateStats({ 1: { sectionId: 1, status: 'completed' }, 2: { sectionId: 2, status: 'partial' }, 999: { sectionId: 999, status: 'completed' } });
    expect(stats).toMatchObject({ completed: 1, percentage: 2, distanceKm: intSections[0].distanceKm, elevationGainM: 420, totalSections: 56, totalDistanceKm: 1050 });
  });
  it('round-trips photos, notes and dates without introducing unknown sections', () => {
    const logs = { 1: { sectionId: 1, status: 'completed', completedDate: '2026-10-08', notes: 'מסע', photos: [{ id: 'photo', url: 'data:image/jpeg;base64,YQ==', lat: 33.25, lng: 35.7 }], gpxUploaded: true } };
    expect(parseLogs(JSON.stringify(logs))).toEqual(logs);
    expect(parseLogs(null)).toEqual({});
  });
  it('rejects corrupt storage and unsafe photo URLs', () => {
    expect(() => parseLogs('{broken')).toThrow();
    expect(() => parseLogs('[]')).toThrow();
    expect(isPhotoUrl('javascript:alert(1)')).toBe(false);
    expect(isPhotoUrl('data:image/svg+xml;base64,YQ==')).toBe(false);
    expect(parseLogs(JSON.stringify({ 1: { sectionId: 1, status: 'completed', photos: [{ id: 'bad', url: 'javascript:alert(1)' }] } }))[1].photos).toEqual([]);
  });
});