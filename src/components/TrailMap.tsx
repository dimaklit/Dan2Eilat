import { useEffect, useRef, useState } from 'react';
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import type { StyleSpecification } from 'maplibre-gl';
import { Camera, Expand, Layers, Mountain, X } from 'lucide-react';
import { intSections } from '../data/intSections';
import type { TrailSection } from '../types/trail';
import type { ProgressLogs, TrailPhoto } from '../types/userProgress';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props { logs: ProgressLogs; selectedId: number | null; onSelect: (section: TrailSection) => void; dark: boolean }

const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    topo: { type: 'raster', tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 17, attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)' },
    street: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 19, attribution: '© OpenStreetMap contributors' },
    terrain: { type: 'raster-dem', tiles: ['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 15, encoding: 'terrarium', attribution: 'Terrain © Mapzen / AWS Open Data' },
  },
  layers: [{ id: 'base', type: 'background', paint: { 'background-color': '#e5e9dc' } },
    { id: 'street-tiles', type: 'raster', source: 'street', paint: { 'raster-saturation': -0.5, 'raster-opacity': 0.8 } },
    { id: 'topo-tiles', type: 'raster', source: 'topo', paint: { 'raster-saturation': -0.65, 'raster-opacity': 0.8 } }],
};

export function TrailMap({ logs, selectedId, onSelect, dark }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [topo, setTopo] = useState(true);
  const [terrain, setTerrain] = useState(false);
  const [viewZoom, setViewZoom] = useState(7.5);
  const [mapError, setMapError] = useState(false);
  const [activePhoto, setActivePhoto] = useState<{ photo: TrailPhoto; lat: number; lng: number } | null>(null);
  const data: FeatureCollection<LineString> = { type: 'FeatureCollection', features: intSections.flatMap(section => (section.routeSegments ?? [section.coordinates]).map(coordinates => ({
    type: 'Feature', properties: { id: section.id, status: logs[section.id]?.status ?? 'not_started' },
    geometry: { type: 'LineString', coordinates },
  }))) };

  function fitSection(section: TrailSection) {
    const lngs = section.coordinates.map(coordinate => coordinate[0]);
    const lats = section.coordinates.map(coordinate => coordinate[1]);
    mapRef.current?.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 80, duration: 1000, maxZoom: 12 });
  }

  function select(event: MapLayerMouseEvent) {
    const section = intSections.find(item => item.id === Number(event.features?.[0]?.properties?.id));
    if (section) onSelect(section);
  }

  useEffect(() => {
    const section = intSections.find(item => item.id === selectedId);
    if (section) fitSection(section);
    else showAll();
  }, [selectedId]);

  function showAll() {
    const bounds = intSections.reduce((result, section) => section.coordinates.reduce((current, [lng, lat]) =>
      ({ minLng: Math.min(current.minLng, lng), maxLng: Math.max(current.maxLng, lng), minLat: Math.min(current.minLat, lat), maxLat: Math.max(current.maxLat, lat) }), result),
      { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity });
    mapRef.current?.fitBounds([[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
      { padding: { top: 100, bottom: 110, left: 55, right: 55 }, pitch: 0, bearing: 0, duration: 1000 });
  }

  return <div className={`map-surface ${dark ? 'map-dark' : ''}`}>
    <Map ref={mapRef} initialViewState={{ longitude: 35.0, latitude: 31.5, zoom: 7.5 }} mapStyle={mapStyle}
      terrain={terrain ? { source: 'terrain', exaggeration: 1.4 } : undefined}
      locale={{ 'NavigationControl.ZoomIn': 'הגדלה', 'NavigationControl.ZoomOut': 'הקטנה', 'NavigationControl.ResetBearing': 'איפוס כיוון לצפון', 'AttributionControl.ToggleAttribution': 'ייחוס מקורות המפה' }}
      interactiveLayerIds={['trail-hit']} onClick={select} onLoad={() => { const section = intSections.find(item => item.id === selectedId); if (section) fitSection(section); else showAll(); }} onError={() => setMapError(true)}
      onZoomEnd={event => setViewZoom(event.viewState.zoom)}
      onMouseMove={event => { const canvas = mapRef.current?.getCanvas(); if (canvas) canvas.style.cursor = event.features?.length ? 'pointer' : ''; }}
      style={{ width: '100%', height: '100%' }} attributionControl={{ compact: true }}>
      <NavigationControl position="bottom-left" showCompass />
      <Source id="trail" type="geojson" data={data} attribution='© OpenStreetMap contributors · ODbL · <a href="https://www.openstreetmap.org/relation/282071" target="_blank" rel="noopener noreferrer">Israel National Trail</a>'>
        <Layer id="trail-outline" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': 1 }} />
        <Layer id="trail-glow" type="line" filter={['==', ['get', 'status'], 'completed']} paint={{ 'line-color': '#f97316', 'line-width': 16, 'line-opacity': 0.4, 'line-blur': 4 }} />
        <Layer id="trail-remaining" type="line" filter={['==', ['get', 'status'], 'not_started']} paint={{ 'line-color': '#334155', 'line-width': 5, 'line-opacity': 1, 'line-dasharray': [2, 1] }} />
        <Layer id="trail-partial" type="line" filter={['==', ['get', 'status'], 'partial']} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#f59e0b', 'line-width': 6 }} />
        <Layer id="trail-completed" type="line" filter={['==', ['get', 'status'], 'completed']} layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#f97316', 'line-width': 7 }} />
        <Layer id="trail-selected" type="line" filter={['==', ['get', 'id'], selectedId ?? -1]} paint={{ 'line-color': '#087f8c', 'line-width': 9, 'line-opacity': 0.3 }} />
        <Layer id="trail-hit" type="line" paint={{ 'line-width': 20, 'line-opacity': 0 }} />
      </Source>
      {intSections.map(section => {
        const middle = section.coordinates[Math.floor(section.coordinates.length / 2)];
        return <Marker key={section.id} longitude={middle[0]} latitude={middle[1]} anchor="center">
          <button className={`section-pin ${viewZoom < 8 ? 'overview' : ''} ${logs[section.id]?.status ?? 'not_started'} ${selectedId === section.id ? 'selected' : ''}`} aria-label={section.nameHe} title={section.nameHe} onClick={event => { event.stopPropagation(); onSelect(section); }}>{section.id}</button>
        </Marker>;
      })}
      {intSections.flatMap(section => (logs[section.id]?.photos ?? []).map(photo => {
        const middle = section.coordinates[Math.floor(section.coordinates.length / 2)];
        const lng = photo.lng ?? middle[0];
        const lat = photo.lat ?? middle[1];
        return <Marker key={photo.id} longitude={lng} latitude={lat} anchor="bottom" offset={[25, -20]}>
          <button className="photo-marker" title={photo.caption || 'תמונה מהמסע'} aria-label={photo.caption || 'תמונה מהמסע'} onClick={event => { event.stopPropagation(); setActivePhoto({ photo, lng, lat }); }}><Camera size={16} /></button>
        </Marker>;
      }))}
      {activePhoto && <Popup longitude={activePhoto.lng} latitude={activePhoto.lat} onClose={() => setActivePhoto(null)} closeOnClick={false} maxWidth="260px"><img className="popup-photo" src={activePhoto.photo.url} alt={activePhoto.photo.caption || 'תמונה מהמסע'} /><p>{activePhoto.photo.caption || 'רגע מהשביל'}</p></Popup>}
    </Map>
    <div className="map-title"><span className="live-dot" /><span>שביל ישראל</span><span className="map-title-secondary">מהחרמון עד אילת</span></div>
    <div className="map-tools">
      <button className="map-tool" title="כל המסלול" aria-label="כל המסלול" onClick={showAll}><Expand size={19} /></button>
      <button className={`map-tool ${topo ? 'active' : ''}`} title={topo ? 'מעבר למפת רחובות' : 'מעבר למפה טופוגרפית'} aria-label="מפה טופוגרפית" aria-pressed={topo} onClick={() => { const next = !topo; setTopo(next); mapRef.current?.getMap().setLayoutProperty('topo-tiles', 'visibility', next ? 'visible' : 'none'); }}><Layers size={19} /></button>
      <button className={`map-tool ${terrain ? 'active' : ''}`} title="תבליט תלת־ממדי" aria-label="תבליט תלת־ממדי" aria-pressed={terrain} onClick={() => { setTerrain(!terrain); mapRef.current?.easeTo({ pitch: terrain ? 0 : 55, duration: 800 }); }}><Mountain size={19} /></button>
    </div>
    {mapError && <div className="map-error" role="status">חלק מאריחי המפה לא נטענו. בדקו את החיבור או עברו למפת רחובות.<button className="icon-button" aria-label="סגירת הודעה" onClick={() => setMapError(false)}><X size={16} /></button></div>}
    <div className="map-legend"><span><i className="legend-completed" />הושלם</span><span><i className="legend-partial" />חלקי</span><span><i className="legend-remaining" />טרם בוצע</span></div>
    <div className="map-credit">תוואי OpenStreetMap · מקטעים משוערים · לא לניווט</div>
  </div>;
}