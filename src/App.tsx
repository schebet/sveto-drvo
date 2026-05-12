import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Tree, Comment } from './lib/supabase';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import Auth, { AuthProvider } from './components/Auth';
import TreeDetailModal from './components/TreeDetailModal';
import MobileBottomNav from './components/MobileBottomNav';
import { TreePine, Menu, X, ChevronDown } from 'lucide-react';

function AppContent() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [addingMode, setAddingMode] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [locateAt, setLocateAt] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number>(0);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const fetchTrees = useCallback(async () => {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTrees(data);
  }, []);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setComments(data);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTrees(), fetchComments()]);
      setLoading(false);
    };
    load();
  }, [fetchTrees, fetchComments]);

  useEffect(() => {
    const channel = supabase
      .channel('trees-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trees' }, () => {
        fetchTrees();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTrees, fetchComments]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#tree-')) {
      const treeId = hash.replace('#tree-', '');
      const tree = trees.find((t) => t.id === treeId);
      if (tree) {
        setFlyTo({ lat: tree.latitude, lng: tree.longitude });
        setSelectedTreeId(treeId);
      }
    }
  }, [trees]);

  const handleAddTree = async (data: {
    title: string; description: string; species: string;
    latitude: number; longitude: number;
    estimated_age: number | null; comment: string; authorName: string;
  }) => {
    const { data: treeData, error: treeError } = await supabase
      .from('trees')
      .insert({ title: data.title, description: data.description, species: data.species,
        latitude: data.latitude, longitude: data.longitude, estimated_age: data.estimated_age })
      .select().single();
    if (treeError) { console.error('Error adding tree:', treeError); return; }
    if (data.comment.trim() && treeData) {
      await supabase.from('comments').insert({
        tree_id: treeData.id, content: data.comment.trim(), author_name: data.authorName });
    }
    fetchTrees(); fetchComments();
  };

  const handleAddComment = async (treeId: string, content: string, authorName: string) => {
    const { error } = await supabase.from('comments').insert({ tree_id: treeId, content, author_name: authorName });
    if (error) { console.error('Error adding comment:', error); return; }
    fetchComments();
  };

  const handleDeleteTree = async (treeId: string) => {
    await supabase.from('comments').delete().eq('tree_id', treeId);
    const { error } = await supabase.from('trees').delete().eq('id', treeId);
    if (error) { console.error('Error deleting tree:', error); return; }
    if (selectedTreeId === treeId) setSelectedTreeId(null);
    fetchTrees(); fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) { console.error('Error deleting comment:', error); return; }
    fetchComments();
  };

  const handleUpdateTree = async (treeId: string, updates: Partial<Tree>) => {
    const { error } = await supabase.from('trees')
      .update({ title: updates.title, description: updates.description,
        species: updates.species, estimated_age: updates.estimated_age })
      .eq('id', treeId);
    if (error) { console.error('Error updating tree:', error); return; }
    fetchTrees();
  };

  const handleTreeSelect = (tree: Tree) => {
    setFlyTo({ lat: tree.latitude, lng: tree.longitude });
    if (isMobile) setMobileSheetOpen(false);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocateAt({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (isMobile) setMobileSheetOpen(false);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleTreeOpen = (treeId: string) => setSelectedTreeId(treeId);

  const handleAddClick = () => {
    setAddingMode(true);
    if (isMobile) setMobileSheetOpen(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    dragCurrentY.current = e.touches[0].clientY - dragStartY.current;
  };
  const handleTouchEnd = () => {
    if (dragCurrentY.current > 60) setMobileSheetOpen(false);
    else if (dragCurrentY.current < -60) setMobileSheetOpen(true);
    dragStartY.current = null;
    dragCurrentY.current = 0;
  };

  const selectedTree = selectedTreeId ? trees.find((t) => t.id === selectedTreeId) ?? null : null;
  const selectedTreeComments = selectedTreeId ? comments.filter((c) => c.tree_id === selectedTreeId) : [];
  const dm = darkMode;

  return (
    <div
      className={`flex overflow-hidden transition-colors duration-300 ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ height: '100dvh', width: '100vw' }}
    >
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${dm ? 'border-gray-800' : 'border-gray-100'} border-r`}>
          <div className="w-80 h-full">
            <Sidebar trees={trees} comments={comments} onTreeSelect={handleTreeSelect} onAddClick={handleAddClick} addingMode={addingMode} />
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className={`flex-shrink-0 z-10 flex items-center justify-between px-3 transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-b`}
          style={{ height: '52px', paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined }}
        >
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {sidebarOpen
                  ? <X size={17} className={dm ? 'text-gray-400' : 'text-gray-500'} />
                  : <Menu size={17} className={dm ? 'text-gray-400' : 'text-gray-500'} />}
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <TreePine size={17} className="text-emerald-600" />
              <span className={`text-sm font-bold tracking-tight ${dm ? 'text-gray-100' : 'text-gray-800'}`}>
                Kultna drva
              </span>
              <span className={`hidden sm:inline text-xs font-normal ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                — zapisi
              </span>
            </div>
            {addingMode && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                UNOS
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[11px] hidden sm:block mr-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
              {trees.length} drva · {comments.length} komentara
            </span>
            <Auth />
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ paddingBottom: isMobile ? '64px' : undefined }}>
          {loading && (
            <div className={`absolute inset-0 flex items-center justify-center z-10 ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className={`text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Učitavanje mape...</p>
              </div>
            </div>
          )}
          <MapComponent
            trees={trees} comments={comments}
            onAddComment={handleAddComment} onAddTree={handleAddTree}
            addingMode={addingMode} onAddingModeChange={setAddingMode}
            flyTo={flyTo} locateAt={locateAt} darkMode={darkMode}
            onTreeOpen={handleTreeOpen} onDeleteTree={handleDeleteTree}
            onDeleteComment={handleDeleteComment}
          />
        </div>
      </div>

      {/* MOBILE: Bottom sheet + nav */}
      {isMobile && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 z-[700] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${mobileSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setMobileSheetOpen(false)}
          />

          {/* Bottom sheet */}
          <div
            className={`fixed left-0 right-0 z-[750] rounded-t-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${dm ? 'bg-gray-900' : 'bg-white'} ${mobileSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ bottom: '64px', maxHeight: 'calc(100dvh - 116px)' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex flex-col items-center pt-2 pb-1 cursor-pointer" onClick={() => setMobileSheetOpen(false)}>
              <div className={`w-10 h-1 rounded-full ${dm ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <ChevronDown size={14} className={`mt-0.5 ${dm ? 'text-gray-600' : 'text-gray-300'}`} />
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(100dvh - 200px)' }}>
              <Sidebar trees={trees} comments={comments} onTreeSelect={handleTreeSelect} onAddClick={handleAddClick} addingMode={addingMode} />
            </div>
          </div>

          {/* Bottom nav */}
          <MobileBottomNav
            onListToggle={() => setMobileSheetOpen(!mobileSheetOpen)}
            onAddClick={handleAddClick}
            onLocate={handleLocate}
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode(!darkMode)}
            listOpen={mobileSheetOpen}
            addingMode={addingMode}
          />
        </>
      )}

      {/* Tree detail */}
      {selectedTree && (
        <TreeDetailModal
          tree={selectedTree}
          comments={selectedTreeComments}
          onAddComment={handleAddComment}
          onDeleteTree={handleDeleteTree}
          onDeleteComment={handleDeleteComment}
          onUpdateTree={handleUpdateTree}
          onClose={() => setSelectedTreeId(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
