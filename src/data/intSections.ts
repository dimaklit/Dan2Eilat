import type { TrailPoint, TrailSection } from '../types/trail';
import routeData from './intRoute.json' with { type: 'json' };

export type { TrailSection } from '../types/trail';

function point(name: string, lng: number, lat: number): TrailPoint {
  return { name, lat, lng, wazeUrl: `https://www.waze.com/ul?ll=${lat}%2C${lng}&navigate=yes` };
}

function section(id: number, start: string, end: string, region: TrailSection['region'], distanceKm: number,
  elevationGainM: number, difficulty: TrailSection['difficulty'], coordinates: [number, number][]): TrailSection {
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  return { id, nameHe: `מקטע ${id}: ${start} עד ${end}`, region, distanceKm, elevationGainM, difficulty,
    startPoint: point(start, first[0], first[1]), endPoint: point(end, last[0], last[1]), coordinates };
}

export const TOTAL_SECTIONS = 56;
export const TOTAL_DISTANCE_KM = 1050;
export const REGION_LABELS = { north: 'צפון', center: 'מרכז', south: 'דרום' };
export const DIFFICULTY_LABELS = { easy: 'קל', moderate: 'בינוני', hard: 'קשה' };
export const DATA_NOTICE = 'תוואי OpenStreetMap · חלוקת מקטעים ונתוני טיפוס משוערים · לא לניווט';

const sampleSections: TrailSection[] = [
  section(1, 'החרמון', 'מג׳דל שמס', 'north', 13.5, 420, 'hard', [
    [35.773, 33.305], [35.766, 33.295], [35.758, 33.285], [35.751, 33.274], [35.76, 33.264], [35.769, 33.258], [35.771, 33.249], [35.769, 33.235],
  ]),
  section(2, 'מג׳דל שמס', 'בניאס', 'north', 16.8, 310, 'moderate', [
    [35.769, 33.235], [35.757, 33.229], [35.747, 33.218], [35.736, 33.217], [35.722, 33.223], [35.713, 33.235], [35.696, 33.244], [35.694, 33.248],
  ]),
  section(3, 'בניאס', 'תל דן', 'north', 12.4, 180, 'easy', [
    [35.694, 33.248], [35.685, 33.243], [35.678, 33.238], [35.671, 33.241], [35.663, 33.247], [35.655, 33.25], [35.652, 33.249],
  ]),
  section(4, 'תל דן', 'תל חי', 'north', 14.6, 360, 'moderate', [
    [35.652, 33.249], [35.637, 33.244], [35.623, 33.236], [35.611, 33.231], [35.599, 33.234], [35.585, 33.237], [35.579, 33.233],
  ]),
  section(9, 'הר מירון', 'נחל עמוד', 'north', 18.2, 540, 'hard', [
    [35.412, 32.997], [35.418, 32.983], [35.432, 32.974], [35.442, 32.966], [35.455, 32.957], [35.466, 32.947], [35.474, 32.929], [35.48, 32.908],
  ]),
  section(17, 'בית אורן', 'זכרון יעקב', 'north', 24.1, 610, 'hard', [
    [35.007, 32.73], [35.014, 32.714], [35.025, 32.695], [35.012, 32.677], [35.004, 32.652], [34.99, 32.628], [34.975, 32.603], [34.953, 32.574],
  ]),
  section(25, 'נחל הירקון', 'תל אפק', 'center', 14.7, 90, 'easy', [
    [34.816, 32.103], [34.835, 32.107], [34.853, 32.103], [34.875, 32.111], [34.892, 32.117], [34.91, 32.11], [34.929, 32.107],
  ]),
  section(32, 'סטף', 'בר גיורא', 'center', 16.3, 650, 'hard', [
    [35.126, 31.773], [35.12, 31.762], [35.111, 31.751], [35.101, 31.743], [35.09, 31.735], [35.081, 31.729], [35.072, 31.727],
  ]),
  section(42, 'מדרשת בן גוריון', 'עין עקב', 'south', 15.8, 430, 'moderate', [
    [34.779, 30.851], [34.789, 30.844], [34.795, 30.83], [34.806, 30.815], [34.812, 30.803], [34.817, 30.789], [34.812, 30.784],
  ]),
  section(46, 'מצפה רמון', 'חניון בארות', 'south', 21.5, 280, 'hard', [
    [34.802, 30.609], [34.815, 30.598], [34.828, 30.586], [34.849, 30.577], [34.872, 30.575], [34.892, 30.585], [34.913, 30.583], [34.926, 30.587],
  ]),
  section(55, 'תמנע', 'באר אורה', 'south', 22.4, 520, 'hard', [
    [34.984, 29.787], [34.971, 29.772], [34.961, 29.754], [34.949, 29.738], [34.96, 29.722], [34.978, 29.711], [34.986, 29.709],
  ]),
  section(56, 'באר אורה', 'אילת', 'south', 27.6, 780, 'hard', [
    [34.986, 29.709], [34.971, 29.693], [34.954, 29.675], [34.932, 29.656], [34.918, 29.631], [34.909, 29.609], [34.919, 29.587], [34.933, 29.568], [34.94, 29.548],
  ]),
];

type DemoStop = [name: string, lng: number, lat: number, viaLng: number, viaLat: number];

function connectSections(startId: number, firstId: number, region: TrailSection['region'], stops: DemoStop[]): TrailSection[] {
  const start = sampleSections.find(item => item.id === startId)!.endPoint;
  let previous = start;
  return stops.map(([name, lng, lat, viaLng, viaLat], index) => {
    const coordinates: [number, number][] = [[previous.lng, previous.lat], [viaLng, viaLat], [lng, lat]];
    const radians = Math.PI / 180;
    const directKm = coordinates.slice(1).reduce((total, coordinate, coordinateIndex) => {
      const from = coordinates[coordinateIndex];
      const latitudeDelta = (coordinate[1] - from[1]) * radians;
      const longitudeDelta = (coordinate[0] - from[0]) * radians;
      const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(from[1] * radians)
        * Math.cos(coordinate[1] * radians) * Math.sin(longitudeDelta / 2) ** 2;
      return total + 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }, 0);
    const distanceKm = Math.round(directKm * 1.25 * 10) / 10;
    const elevationGainM = region === 'center' && lat > 32 ? 120 : region === 'south' ? 460 : 380;
    const result = section(firstId + index, previous.name, name, region, distanceKm, elevationGainM,
      distanceKm > 22 ? 'hard' : distanceKm < 12 ? 'easy' : 'moderate', coordinates);
    previous = result.endPoint;
    return result;
  });
}

export const demoSections: TrailSection[] = [
  ...sampleSections,
  ...connectSections(4, 5, 'north', [
    ['מצודת כ״ח', 35.568, 33.115, 35.548, 33.174],
    ['נחל דישון', 35.489, 33.061, 35.543, 33.078],
    ['ברעם', 35.432, 33.043, 35.459, 33.05],
    ['הר מירון', 35.412, 32.997, 35.405, 33.022],
  ]),
  ...connectSections(9, 10, 'north', [
    ['חוקוק', 35.479, 32.88, 35.486, 32.894],
    ['ארבל', 35.496, 32.824, 35.478, 32.849],
    ['פוריה', 35.543, 32.741, 35.517, 32.777],
    ['ירדנית', 35.571, 32.711, 35.558, 32.725],
    ['כפר תבור', 35.421, 32.687, 35.498, 32.662],
    ['אלון הגליל', 35.22, 32.756, 35.32, 32.732],
    ['בית אורן', 35.007, 32.73, 35.112, 32.75],
  ]),
  ...connectSections(17, 18, 'center', [
    ['בנימינה', 34.951, 32.519, 34.943, 32.547],
    ['קיסריה', 34.899, 32.5, 34.92, 32.512],
    ['חדרה', 34.89, 32.44, 34.877, 32.47],
    ['בית ינאי', 34.864, 32.379, 34.872, 32.411],
    ['נתניה', 34.846, 32.323, 34.848, 32.35],
    ['געש', 34.825, 32.23, 34.835, 32.276],
    ['נחל הירקון', 34.816, 32.103, 34.8, 32.165],
  ]),
  ...connectSections(25, 26, 'center', [
    ['אלעד', 34.95, 32.052, 34.946, 32.077],
    ['שוהם', 34.952, 31.998, 34.957, 32.023],
    ['תל חדיד', 34.942, 31.964, 34.949, 31.979],
    ['לטרון', 34.981, 31.838, 34.939, 31.894],
    ['שער הגיא', 35.025, 31.8, 35.001, 31.819],
    ['סטף', 35.126, 31.773, 35.083, 31.796],
  ]),
  ...connectSections(32, 33, 'center', [
    ['עמק האלה', 34.955, 31.684, 35.012, 31.708],
    ['בית גוברין', 34.895, 31.601, 34.939, 31.643],
    ['תל קשת', 34.889, 31.537, 34.874, 31.572],
    ['דביר', 34.825, 31.412, 34.876, 31.469],
    ['יער להב', 34.861, 31.373, 34.839, 31.391],
    ['מיתר', 34.941, 31.326, 34.903, 31.355],
    ['ערד', 35.212, 31.259, 35.064, 31.31],
    ['המכתש הקטן', 35.156, 30.94, 35.2, 31.105],
    ['מדרשת בן גוריון', 34.779, 30.851, 34.986, 30.91],
  ]),
  ...connectSections(42, 43, 'south', [
    ['חוד עקב', 34.803, 30.766, 34.797, 30.781],
    ['נחל חווה', 34.884, 30.703, 34.849, 30.734],
    ['מצפה רמון', 34.802, 30.609, 34.861, 30.655],
  ]),
  ...connectSections(46, 47, 'south', [
    ['הר סהרונים', 34.944, 30.571, 34.938, 30.58],
    ['נחל נקרות', 34.97, 30.523, 34.949, 30.551],
    ['ספיר', 35.183, 30.613, 35.079, 30.553],
    ['צופר', 35.181, 30.559, 35.166, 30.586],
    ['נחל ברק', 35.128, 30.381, 35.158, 30.474],
    ['ציחור', 35.011, 30.219, 35.064, 30.301],
    ['שחרות', 35.001, 29.904, 34.995, 30.066],
    ['תמנע', 34.984, 29.787, 34.98, 29.846],
  ]),
].sort((first, second) => first.id - second.id);

interface RouteGeometry { id: number; coordinates: number[][]; segments: number[][][]; distanceKm: number; startName: string; endName: string; region: string }

export const intSections: TrailSection[] = demoSections.map(section => {
  const geometry = (routeData.sections as RouteGeometry[]).find(item => item.id === section.id);
  if (!geometry) return section;
  const coordinates = geometry.coordinates as [number, number][];
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  return { ...section, nameHe: `מקטע ${section.id}: ${geometry.startName} עד ${geometry.endName}`, region: geometry.region as TrailSection['region'],
    coordinates, routeSegments: geometry.segments as [number, number][][], distanceKm: geometry.distanceKm,
    startPoint: point(geometry.startName, first[0], first[1]), endPoint: point(geometry.endName, last[0], last[1]) };
});