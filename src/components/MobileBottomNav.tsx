import { Map, List, Plus, Locate, Moon, Sun } from 'lucide-react';

interface MobileBottomNavProps {
  onListToggle: () => void;
  onAddClick: () => void;
  onLocate: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  listOpen: boolean;
  addingMode: boolean;
}

export default function MobileBottomNav({
  onListToggle,
  onAddClick,
  onLocate,
  darkMode,
  onDarkModeToggle,
  listOpen,
  addingMode,
}: MobileBottomNavProps) {
  const bg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const iconColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const activeColor = 'text-emerald-600';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[800] ${bg} border-t safe-bottom`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="h-16 flex items-center justify-around px-2">
        {/* Map */}
        <button
          onClick={onListToggle}
          className="flex flex-col items-center gap-0.5 min-w-[52px] min-h-[44px] justify-center"
          aria-label={listOpen ? 'Zatvori listu' : 'Otvori listu'}
        >
          {listOpen ? (
            <Map size={22} className={activeColor} />
          ) : (
            <List size={22} className={listOpen ? activeColor : iconColor} />
          )}
          <span className={`text-[10px] font-medium ${listOpen ? activeColor : iconColor}`}>
            {listOpen ? 'Mapa' : 'Drva'}
          </span>
        </button>

        {/* Add tree — big FAB-style center button */}
        <button
          onClick={onAddClick}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            addingMode
              ? 'bg-amber-500 shadow-amber-200'
              : 'bg-emerald-600 shadow-emerald-200'
          }`}
          aria-label="Dodaj drvo"
          style={{ marginTop: '-16px' }}
        >
          <Plus size={26} className="text-white" strokeWidth={2.5} />
        </button>

        {/* Locate */}
        <button
          onClick={onLocate}
          className="flex flex-col items-center gap-0.5 min-w-[52px] min-h-[44px] justify-center"
          aria-label="Moja lokacija"
        >
          <Locate size={22} className={iconColor} />
          <span className={`text-[10px] font-medium ${iconColor}`}>Lokacija</span>
        </button>

        {/* Dark mode */}
        <button
          onClick={onDarkModeToggle}
          className="flex flex-col items-center gap-0.5 min-w-[52px] min-h-[44px] justify-center"
          aria-label={darkMode ? 'Svetla tema' : 'Tamna tema'}
        >
          {darkMode ? (
            <Sun size={22} className={iconColor} />
          ) : (
            <Moon size={22} className={iconColor} />
          )}
          <span className={`text-[10px] font-medium ${iconColor}`}>Tema</span>
        </button>
      </div>
    </div>
  );
}
