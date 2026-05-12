import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Tree, Comment, SPECIES_CATEGORIES, getSpeciesCategory } from '../lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import TreePopup from './TreePopup';
import AddTreeForm from './AddTreeForm';

const DONJI_DUSNIK: [number, number] = [43.167648, 22.087475];
const RADIUS_60KM = 60000;

function createColoredIcon(color: string): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1"/>
    <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.9"/>
  </svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
    shadowSize: [0, 0],
  });
}

const goldIcon = createColoredIcon('#d97706');
const ancientIcon = createColoredIcon('#7c2d12');

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
  addingMode: boolean;
}

function MapClickHandler({ onMapClick, addingMode }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (addingMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function FlyToHandler({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom ?? 15, { duration: 1.2 });
  }, [lat, lng, zoom, map]);
  return null;
}

function LocateHandler({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

interface MapComponentProps {
  trees: Tree[];
  comments: Comment[];
  onAddComment: (treeId: string, content: string, authorName: string) => void;
  onAddTree: (data: { title: string; description: string; species: string; latitude: number; longitude: number; estimated_age: number | null; comment: string; authorName: string }) => void;
  addingMode: boolean;
  onAddingModeChange: (mode: boolean) => void;
  flyTo: { lat: number; lng: number } | null;
  locateAt: { lat: number; lng: number } | null;
  darkMode: boolean;
  onTreeOpen: (treeId: string) => void;
  onDeleteTree: (treeId: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export default function MapComponent({
  trees,
  comments,
  onAddComment,
  onAddTree,
  addingMode,
  onAddingModeChange,
  flyTo,
  locateAt,
  darkMode,
  onTreeOpen,
  onDeleteTree,
  onDeleteComment,
}: MapComponentProps) {
  const [newTreeLocation, setNewTreeLocation] = useState<{ lat: number; lng: number } | null>(null);

  const commentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of comments) {
      counts[c.tree_id] = (counts[c.tree_id] || 0) + 1;
    }
    return counts;
  }, [comments]);

  const maxComments = useMemo(() => {
    return Math.max(1, ...Object.values(commentCounts));
  }, [commentCounts]);

  const getIconForTree = (tree: Tree) => {
    const isCult = (commentCounts[tree.id] || 0) >= Math.max(3, maxComments * 0.6);
    const isAncient = tree.estimated_age !== null && tree.estimated_age >= 100;

    if (isCult) return goldIcon;
    if (isAncient) return ancientIcon;

    const cat = getSpeciesCategory(tree.species);
    const color = SPECIES_CATEGORIES[cat]?.color ?? '#059669';
    return createColoredIcon(color);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setNewTreeLocation({ lat, lng });
  };

  const handleAddTree = (data: { title: string; description: string; species: string; estimated_age: number | null; comment: string; authorName: string }) => {
    if (!newTreeLocation) return;
    onAddTree({
      ...data,
      latitude: newTreeLocation.lat,
      longitude: newTreeLocation.lng,
    });
    setNewTreeLocation(null);
    onAddingModeChange(false);
  };

  const handleCancelAdd = () => {
    setNewTreeLocation(null);
    onAddingModeChange(false);
  };

  const getCommentsForTree = (treeId: string) => {
    return comments.filter((c) => c.tree_id === treeId);
  };

  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttr = darkMode
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className="relative w-full h-full">
      {addingMode && !newTreeLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm tracking-wide animate-bounce">
          Кликните на мапу да означите локацију дрвета
        </div>
      )}

      {newTreeLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[400px] max-w-[92vw]">
          <AddTreeForm
            onSubmit={handleAddTree}
            onCancel={handleCancelAdd}
          />
        </div>
      )}

      <MapContainer
        center={DONJI_DUSNIK}
        zoom={9}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer attribution={tileAttr} url={tileUrl} />

        <Circle
          center={DONJI_DUSNIK}
          radius={RADIUS_60KM}
          pathOptions={{
            color: darkMode ? '#34d399' : '#059669',
            fillColor: darkMode ? '#34d399' : '#059669',
            fillOpacity: 0.04,
            weight: 2,
            dashArray: '8 6',
          }}
        />

        <MapClickHandler onMapClick={handleMapClick} addingMode={addingMode} />

        {flyTo && <FlyToHandler lat={flyTo.lat} lng={flyTo.lng} zoom={15} />}
        {locateAt && <LocateHandler lat={locateAt.lat} lng={locateAt.lng} />}

        {trees.map((tree) => (
          <Marker key={tree.id} position={[tree.latitude, tree.longitude]} icon={getIconForTree(tree)}>
            <Popup maxWidth={320} minWidth={260}>
              <TreePopup
                tree={tree}
                comments={getCommentsForTree(tree.id)}
                onAddComment={onAddComment}
                onOpenDetail={onTreeOpen}
                onDeleteTree={onDeleteTree}
                onDeleteComment={onDeleteComment}
              />
            </Popup>
          </Marker>
        ))}

        {newTreeLocation && (
          <Marker position={[newTreeLocation.lat, newTreeLocation.lng]} icon={defaultIcon}>
            <Popup>
              <div className="text-sm font-semibold">Нова локација</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
