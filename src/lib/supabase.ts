import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Tree {
  id: string;
  title: string;
  description: string;
  species: string;
  latitude: number;
  longitude: number;
  image_url: string;
  estimated_age: number | null;
  created_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  tree_id: string;
  content: string;
  author_name: string;
  created_by: string | null;
  created_at: string;
}

export const SPECIES_CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
  hrast: { label: 'Храст', color: '#92400e', icon: '🌳' },
  lipa: { label: 'Липа', color: '#65a30d', icon: '🌳' },
  kesten: { label: 'Кестен', color: '#b45309', icon: '🌰' },
  brest: { label: 'Брест', color: '#15803d', icon: '🌿' },
  bor: { label: 'Бор', color: '#166534', icon: '🌲' },
  jela: { label: 'Јела', color: '#14532d', icon: '🌲' },
  javor: { label: 'Јавор', color: '#ca8a04', icon: '🍁' },
  platana: { label: 'Платана', color: '#4d7c0f', icon: '🍃' },
  topola: { label: 'Топола', color: '#a3e635', icon: '🌿' },
  vrba: { label: 'Врба', color: '#84cc16', icon: '🌿' },
  bagrem: { label: 'Багрем', color: '#fbbf24', icon: '🌸' },
  orah: { label: 'Орах', color: '#78350f', icon: '🥜' },
  dunja: { label: 'Дуња', color: '#f59e0b', icon: '🍐' },
  smokva: { label: 'Смоква', color: '#7c2d12', icon: '🍇' },
  other: { label: 'Остало', color: '#6b7280', icon: '🌱' },
};

export function getSpeciesCategory(species: string): string {
  if (!species) return 'other';
  const s = species.toLowerCase().trim();
  for (const key of Object.keys(SPECIES_CATEGORIES)) {
    if (key === 'other') continue;
    if (s.includes(key)) return key;
  }
  if (s.includes('храст') || s.includes('hrast') || s.includes('oak')) return 'hrast';
  if (s.includes('липа') || s.includes('lipa') || s.includes('linden') || s.includes('lime')) return 'lipa';
  if (s.includes('кестен') || s.includes('kesten') || s.includes('chestnut')) return 'kesten';
  if (s.includes('брест') || s.includes('brest') || s.includes('elm')) return 'brest';
  if (s.includes('бор') || s.includes('bor') || s.includes('pine')) return 'bor';
  if (s.includes('јела') || s.includes('jela') || s.includes('fir')) return 'jela';
  if (s.includes('јавор') || s.includes('javor') || s.includes('maple')) return 'javor';
  if (s.includes('платан') || s.includes('platan') || s.includes('plane')) return 'platana';
  if (s.includes('топол') || s.includes('topol') || s.includes('poplar')) return 'topola';
  if (s.includes('врб') || s.includes('vrb') || s.includes('willow')) return 'vrba';
  if (s.includes('багрем') || s.includes('bagrem') || s.includes('acacia')) return 'bagrem';
  if (s.includes('орах') || s.includes('orah') || s.includes('walnut')) return 'orah';
  if (s.includes('дуњ') || s.includes('dunj') || s.includes('quince')) return 'dunja';
  if (s.includes('смокв') || s.includes('smokv') || s.includes('fig')) return 'smokva';
  return 'other';
}

export const TREE_STOCK_PHOTOS = [
  'https://images.pexels.com/photos/1622405/pexels-photo-1622405.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/360755/pexels-photo-360755.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/896291/pexels-photo-896291.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1580280/pexels-photo-1580280.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/326900/pexels-photo-326900.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=400',
];

export function getStockPhotoForSpecies(species: string): string {
  const cat = getSpeciesCategory(species);
  const idx = Object.keys(SPECIES_CATEGORIES).indexOf(cat);
  return TREE_STOCK_PHOTOS[idx % TREE_STOCK_PHOTOS.length];
}
