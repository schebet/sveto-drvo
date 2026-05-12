import { Tree, Comment, SPECIES_CATEGORIES, getSpeciesCategory } from '../lib/supabase';
import { TreePine, MessageCircle, MapPin, Search, Plus, BarChart3, Crown, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';

interface SidebarProps {
  trees: Tree[];
  comments: Comment[];
  onTreeSelect: (tree: Tree) => void;
  onAddClick: () => void;
  addingMode: boolean;
}

export default function Sidebar({ trees, comments, onTreeSelect, onAddClick, addingMode }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

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

  const speciesStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const tree of trees) {
      const cat = getSpeciesCategory(tree.species);
      stats[cat] = (stats[cat] || 0) + 1;
    }
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .map(([key, count]) => ({
        key,
        label: SPECIES_CATEGORIES[key]?.label ?? 'Остало',
        color: SPECIES_CATEGORIES[key]?.color ?? '#6b7280',
        count,
      }));
  }, [trees]);

  const cultTrees = useMemo(() => {
    return trees
      .filter((t) => (commentCounts[t.id] || 0) >= Math.max(3, maxComments * 0.6))
      .sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0));
  }, [trees, commentCounts, maxComments]);

  const ancientTrees = useMemo(() => {
    return trees
      .filter((t) => t.estimated_age !== null && t.estimated_age >= 100)
      .sort((a, b) => (b.estimated_age ?? 0) - (a.estimated_age ?? 0));
  }, [trees]);

  const filteredTrees = useMemo(() => {
    return trees.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.species.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = !activeFilter || getSpeciesCategory(t.species) === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [trees, search, activeFilter]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <TreePine size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-base leading-tight">Култна дрва</h1>
            <p className="text-[10px] text-gray-400 tracking-wide">МАПА ДРВА-ЗАПИСА</p>
          </div>
        </div>

        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Претражите дрва..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter(null)}
            className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-medium transition-all ${
              !activeFilter ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Све
          </button>
          {speciesStats.slice(0, 6).map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
              className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-medium transition-all ${
                activeFilter === s.key ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              style={activeFilter === s.key ? { backgroundColor: s.color } : {}}
            >
              {s.label} ({s.count})
            </button>
          ))}
        </div>
      </div>

      {/* Stats toggle */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <BarChart3 size={13} />
          Статистика
        </button>
        <div className="flex items-center gap-2">
          {cultTrees.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
              <Crown size={10} /> {cultTrees.length} култ
            </span>
          )}
          {ancientTrees.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-medium">
              <Clock size={10} /> {ancientTrees.length} стара
            </span>
          )}
        </div>
      </div>

      {showStats && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-3">
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">По врсти</h4>
            <div className="space-y-1">
              {speciesStats.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[11px] text-gray-600 flex-1">{s.label}</span>
                  <span className="text-[11px] font-semibold text-gray-800">{s.count}</span>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.count / Math.max(1, trees.length)) * 100}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {cultTrees.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Crown size={10} /> Култна дрва
              </h4>
              <div className="space-y-1">
                {cultTrees.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTreeSelect(t)}
                    className="w-full text-left flex items-center gap-2 text-[11px] p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <Crown size={10} className="text-amber-500 flex-shrink-0" />
                    <span className="text-gray-700 truncate flex-1">{t.title}</span>
                    <span className="text-amber-600 font-semibold">{commentCounts[t.id]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {ancientTrees.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={10} /> Најстарија
              </h4>
              <div className="space-y-1">
                {ancientTrees.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTreeSelect(t)}
                    className="w-full text-left flex items-center gap-2 text-[11px] p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Clock size={10} className="text-red-400 flex-shrink-0" />
                    <span className="text-gray-700 truncate flex-1">{t.title}</span>
                    <span className="text-red-500 font-semibold">{t.estimated_age} г.</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tree list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredTrees.length === 0 ? (
          <div className="p-6 text-center">
            <TreePine size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {search || activeFilter ? 'Нема резултата' : 'Још нема дрва-записа'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredTrees.map((tree) => {
              const cat = getSpeciesCategory(tree.species);
              const catInfo = SPECIES_CATEGORIES[cat];
              const isCult = (commentCounts[tree.id] || 0) >= Math.max(3, maxComments * 0.6);
              const isAncient = tree.estimated_age !== null && tree.estimated_age >= 100;

              return (
                <button
                  key={tree.id}
                  onClick={() => onTreeSelect(tree)}
                  className="w-full text-left p-3 rounded-xl hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${catInfo?.color ?? '#6b7280'}18` }}
                    >
                      <TreePine size={14} style={{ color: catInfo?.color ?? '#6b7280' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                          {tree.title}
                        </h3>
                        {isCult && <Crown size={11} className="text-amber-500 flex-shrink-0" />}
                        {isAncient && <Clock size={11} className="text-red-400 flex-shrink-0" />}
                      </div>
                      {tree.species && (
                        <p className="text-[11px] italic truncate" style={{ color: catInfo?.color ?? '#6b7280' }}>
                          {tree.species}
                        </p>
                      )}
                      {tree.description && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{tree.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <MapPin size={10} />
                          <span>
                            {tree.latitude.toFixed(3)}, {tree.longitude.toFixed(3)}
                          </span>
                        </div>
                        {(commentCounts[tree.id] || 0) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <MessageCircle size={10} />
                            <span>{commentCounts[tree.id]}</span>
                          </div>
                        )}
                        {tree.estimated_age !== null && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock size={10} />
                            <span>{tree.estimated_age} г.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onAddClick}
          disabled={addingMode}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            addingMode
              ? 'bg-amber-100 text-amber-700 cursor-default'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
          }`}
        >
          <Plus size={16} />
          {addingMode ? 'Кликните на мапу...' : 'Додај дрво'}
        </button>
      </div>
    </div>
  );
}
