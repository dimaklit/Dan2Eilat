export type Region = 'north' | 'center' | 'south';
export type Difficulty = 'easy' | 'moderate' | 'hard';

export interface TrailPoint {
  name: string;
  lat: number;
  lng: number;
  wazeUrl: string;
}

export interface TrailSection {
  id: number;
  nameHe: string;
  region: Region;
  distanceKm: number;
  elevationGainM: number;
  difficulty: Difficulty;
  startPoint: TrailPoint;
  endPoint: TrailPoint;
  coordinates: [number, number][];
  routeSegments?: [number, number][][];
}