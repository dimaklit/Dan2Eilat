import { readFile, writeFile } from 'node:fs/promises';
import { demoSections } from '../src/data/intSections.ts';

const input = process.argv[2];
if (!input) throw new Error('Usage: node --experimental-strip-types scripts/import-osm-trail.mjs <osm-relation-full.json>');
const osm = JSON.parse(await readFile(input, 'utf8'));
const relation = osm.elements.find(element => element.type === 'relation' && element.id === 282071);
if (!relation) throw new Error('Expected OSM relation 282071');
const nodes = new Map(osm.elements.filter(element => element.type === 'node').map(node => [node.id, node]));
const ways = new Map(osm.elements.filter(element => element.type === 'way').map(way => [way.id, way]));

function distance(first, second) {
  const radians = Math.PI / 180;
  const latitudeDelta = (second[1] - first[1]) * radians;
  const longitudeDelta = (second[0] - first[0]) * radians;
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(first[1] * radians)
    * Math.cos(second[1] * radians) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

const route = [];
let disconnectedWays = 0;
for (const member of relation.members) {
  if (member.type !== 'way') continue;
  const way = ways.get(member.ref);
  if (!way) throw new Error(`Missing way ${member.ref}`);
  let points = way.nodes.map(id => {
    const node = nodes.get(id);
    if (!node) throw new Error(`Missing node ${id}`);
    return { id, coordinate: [node.lon, node.lat] };
  });
  const previous = route.at(-1);
  if (previous && distance(previous.coordinate, points.at(-1).coordinate) < distance(previous.coordinate, points[0].coordinate)) points = points.reverse();
  if (previous?.id === points[0].id) points = points.slice(1);
  else if (previous) { points[0].breakBefore = true; disconnectedWays++; }
  route.push(...points);
}

const cumulativeKm = [0];
for (let index = 1; index < route.length; index++) cumulativeKm.push(cumulativeKm[index - 1] + (route[index].breakBefore ? 0 : distance(route[index - 1].coordinate, route[index].coordinate)));
const routeLengthKm = cumulativeKm.at(-1);
const weights = demoSections.map(section => Math.max(8, Math.min(28, section.distanceKm)));
const totalWeight = weights.reduce((total, weight) => total + weight, 0);
const landmarks = [demoSections[0].startPoint, ...demoSections.map(section => section.endPoint)];
function endpointName(coordinate) {
  let nearest = landmarks[0];
  let nearestKm = Infinity;
  for (const landmark of landmarks) {
    const separation = distance(coordinate, [landmark.lng, landmark.lat]);
    if (separation < nearestKm) { nearest = landmark; nearestKm = separation; }
  }
  return nearestKm < 0.5 ? nearest.name : `${nearestKm < 5 ? 'ליד' : 'אזור'} ${nearest.name}`;
}
let cumulativeWeight = 0;
let startIndex = 0;
const sections = demoSections.map((section, sectionIndex) => {
  cumulativeWeight += weights[sectionIndex];
  let endIndex = route.length - 1;
  if (sectionIndex < demoSections.length - 1) {
    const expectedKm = routeLengthKm * cumulativeWeight / totalWeight;
    let nearestDistance = Infinity;
    const end = [section.endPoint.lng, section.endPoint.lat];
    const maximum = route.length - (demoSections.length - sectionIndex) * 3;
    for (let index = startIndex + 2; index <= maximum; index++) {
      if (cumulativeKm[index] < Math.max(cumulativeKm[startIndex] + 3, expectedKm - 6)) continue;
      if (cumulativeKm[index] > expectedKm + 6) break;
      const candidate = distance(end, route[index].coordinate) + Math.abs(cumulativeKm[index] - expectedKm) * 0.5;
      if (candidate < nearestDistance) { nearestDistance = candidate; endIndex = index; }
    }
    if (!Number.isFinite(nearestDistance)) throw new Error(`Cannot assign a reasonable boundary for section ${section.id}`);
  }
  const points = route.slice(startIndex, endIndex + 1);
  const segments = [];
  let segment = [];
  for (const point of points) {
    if (point.breakBefore && segment.length) { if (segment.length > 1) segments.push(segment); segment = []; }
    segment.push(point.coordinate);
  }
  if (segment.length > 1) segments.push(segment);
  if (!segments.length) throw new Error(`No connected geometry for section ${section.id}`);
  const distanceKm = Math.round(segments.reduce((total, line) => total + line.slice(1).reduce((length, coordinate, index) => length + distance(line[index], coordinate), 0), 0) * 10) / 10;
  const latitude = points[Math.floor(points.length / 2)].coordinate[1];
  const result = { id: section.id, coordinates: points.map(point => point.coordinate), segments, distanceKm,
    startName: endpointName(points[0].coordinate), endName: endpointName(points.at(-1).coordinate),
    region: latitude >= 32.45 ? 'north' : latitude >= 31.35 ? 'center' : 'south' };
  startIndex = endIndex;
  return result;
});

const output = {
  source: { relationId: 282071, url: 'https://www.openstreetmap.org/relation/282071', license: 'ODbL-1.0', importedAt: new Date().toISOString(), pointCount: route.length, disconnectedWays },
  sections,
};
await writeFile(new URL('../src/data/intRoute.json', import.meta.url), JSON.stringify(output));
console.log(JSON.stringify({ points: route.length, disconnectedWays, sections: sections.length, distanceKm: sections.reduce((total, section) => total + section.distanceKm, 0), smallestPointCount: Math.min(...sections.map(section => section.coordinates.length)), longestSectionKm: Math.max(...sections.map(section => section.distanceKm)) }, null, 2));