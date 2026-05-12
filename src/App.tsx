import { useEffect, useState, useCallback } from 'react';
import { supabase, Tree, Comment } from './lib/supabase';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import Auth, { AuthProvider } from './components/Auth';
import TreeDetailModal from './components/TreeDetailModal';
import { TreePine, Menu, X, Moon, Sun, Locate } from 'lucide-react';

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

    return () => {
      supabase.removeChannel(channel);
    };
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
    title: string;
    description: string;
    species: string;
    latitude: number;
    longitude: number;
    estimated_age: number | null;
    comment: string;
    authorName: string;
  }) => {
    const { data: treeData, error: treeError } = await supabase
      .from('trees')
      .insert({
        title: data.title,
        description: data.description,
        species: data.species,
        latitude: data.latitude,
        longitude: data.longitude,
        estimated_age: data.estimated_age,
      })
      .select()
      .single();

    if (treeError) {
      console.error('Error adding tree:', treeError);
      return;
    }

    if (data.comment.trim() && treeData) {
      await supabase.from('comments').insert({
        tree_id: treeData.id,
        content: data.comment.trim(),
        author_name: data.authorName,
      });
    }

    fetchTrees();
    fetchComments();
  };

  const handleAddComment = async (treeId: string, content: string, authorName: string) => {
    const { error } = await supabase.from('comments').insert({
      tree_id: treeId,
      content,
      author_name: authorName,
    });
    if (error) {
      console.error('Error adding comment:', error);
      return;
    }
    fetchComments();
  };

  const handleDeleteTree = async (treeId: string) => {
    await supabase.from('comments').delete().eq('tree_id', treeId);
    const { error } = await supabase.from('trees').delete().eq('id', treeId);
    if (error) {
      console.error('Error deleting tree:', error);
      return;
    }
    if (selectedTreeId === treeId) setSelectedTreeId(null);
    fetchTrees();
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      console.error('Error deleting comment:', error);
      return;
    }
    fetchComments();
  };

  const handleUpdateTree = async (treeId: string, updates: Partial<Tree>) => {
    const { error } = await supabase
      .from('trees')
      .update({
        title: updates.title,
        description: updates.description,
        species: updates.species,
        estimated_age: updates.estimated_age,
      })
      .eq('id', treeId);
    if (error) {
      console.error('Error updating tree:', error);
      return;
    }
    fetchTrees();
  };

  const handleTreeSelect = (tree: Tree) => {
    setFlyTo({ lat: tree.latitude, lng: tree.longitude });
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocateAt({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleTreeOpen = (treeId: string) => {
    setSelectedTreeId(treeId);
  };

  const selectedTree = selectedTreeId
    ? trees.find((t) => t.id === selectedTreeId) ?? null
    : null;
  const selectedTreeComments = selectedTreeId
    ? comments.filter((c) => c.tree_id === selectedTreeId)
    : [];

  return (
    <div className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-100'} border-r`}
      >
        <div className="w-80 h-full">
          <Sidebar
            trees={trees}
            comments={comments}
            onTreeSelect={handleTreeSelect}
            onAddClick={() => setAddingMode(true)}
            addingMode={addingMode}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className={`h-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-b flex items-center justify-between px-3 flex-shrink-0 z-10 transition-colors`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {sidebarOpen ? <X size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} /> : <Menu size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />}
            </button>
            <div className="flex items-center gap-1.5">
              <TreePine size={16} className="text-emerald-600" />
              <span className={`text-sm font-semibold hidden sm:inline ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Култна дрва-записи</span>
            </div>
            {addingMode && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                РЕЖИМ УНОСА
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`text-[11px] hidden sm:block ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {trees.length} дрва &middot; {comments.length} коментара
            </div>

            <button
              onClick={handleLocate}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Моја локација"
            >
              <Locate size={16} />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              title={darkMode ? 'Светла тема' : 'Тамна тема'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Auth />
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className={`absolute inset-0 flex items-center justify-center z-10 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Учитавање мапе...</p>
              </div>
            </div>
          ) : null}
          <MapComponent
            trees={trees}
            comments={comments}
            onAddComment={handleAddComment}
            onAddTree={handleAddTree}
            addingMode={addingMode}
            onAddingModeChange={setAddingMode}
            flyTo={flyTo}
            locateAt={locateAt}
            darkMode={darkMode}
            onTreeOpen={handleTreeOpen}
            onDeleteTree={handleDeleteTree}
            onDeleteComment={handleDeleteComment}
          />
        </div>
      </div>

      {/* Detail modal */}
      {selectedTree && (
        <TreeDetailModal
          tree={selectedTree}
          comments={selectedTreeComments}
          onAddComment={handleAddComment}
          onDeleteTree={handleDeleteTree}
          onDeleteComment={handleDeleteComment}
          onUpdateTree={handleUpdateTree}
          onClose={() => setSelectedTreeId(null)}
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
