import { Tree, Comment, SPECIES_CATEGORIES, getSpeciesCategory, getStockPhotoForSpecies } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { useAuth } from './Auth';
import {
  X, MessageCircle, MapPin, Calendar, Crown, Clock,
  Share2, Send, Pencil, Trash2, Check, Shield, ArrowLeft,
} from 'lucide-react';

interface TreeDetailModalProps {
  tree: Tree;
  comments: Comment[];
  onAddComment: (treeId: string, content: string, authorName: string) => void;
  onDeleteTree: (treeId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateTree: (treeId: string, updates: Partial<Tree>) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export default function TreeDetailModal({
  tree, comments, onAddComment, onDeleteTree, onDeleteComment, onUpdateTree, onClose, isMobile = false,
}: TreeDetailModalProps) {
  const { isAdmin } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(tree.title);
  const [editDescription, setEditDescription] = useState(tree.description);
  const [editSpecies, setEditSpecies] = useState(tree.species);
  const [editAge, setEditAge] = useState(tree.estimated_age?.toString() ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    return () => setVisible(false);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const cat = getSpeciesCategory(tree.species);
  const catInfo = SPECIES_CATEGORIES[cat];
  const isAncient = tree.estimated_age !== null && tree.estimated_age >= 100;
  const isCult = comments.length >= 3;
  const imageUrl = tree.image_url || getStockPhotoForSpecies(tree.species);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(tree.id, commentText.trim(), authorName.trim() || 'Anoniman');
    setCommentText('');
    setAuthorName('');
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#tree-${tree.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveEdit = () => {
    onUpdateTree(tree.id, {
      title: editTitle.trim(), description: editDescription.trim(),
      species: editSpecies.trim(),
      estimated_age: editAge ? parseInt(editAge, 10) : null,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) { onDeleteTree(tree.id); onClose(); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('sr-Latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const formatTimelineDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('sr-Latn', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ─── MOBILE: Full-screen bottom sheet ───
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[3000] flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-280 ${visible ? 'opacity-100' : 'opacity-0'}`}
          onClick={handleClose}
        />

        {/* Sheet */}
        <div
          className={`relative bg-white flex flex-col overflow-hidden shadow-2xl transition-transform duration-280 ease-out mt-auto rounded-t-2xl ${visible ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ maxHeight: '94dvh', minHeight: '60dvh' }}
        >
          {/* Header image */}
          <div className="relative h-52 overflow-hidden flex-shrink-0">
            <img
              src={imageUrl}
              alt={tree.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Back button */}
            <button
              onClick={handleClose}
              className="absolute top-3 left-3 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors active:scale-95"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>

            {/* Admin actions */}
            {isAdmin && !editing && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button onClick={() => setEditing(true)} className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors">
                  <Pencil size={15} className="text-white" />
                </button>
                <button
                  onClick={handleDelete}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${confirmDelete ? 'bg-red-500' : 'bg-black/40 hover:bg-red-500/80'}`}
                >
                  <Trash2 size={15} className="text-white" />
                </button>
              </div>
            )}

            {/* Title area */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                {isCult && (
                  <span className="flex items-center gap-1 text-[11px] bg-amber-500/90 text-white px-2.5 py-1 rounded-full font-bold">
                    <Crown size={11} /> KULT
                  </span>
                )}
                {isAncient && (
                  <span className="flex items-center gap-1 text-[11px] bg-red-500/90 text-white px-2.5 py-1 rounded-full font-bold">
                    <Clock size={11} /> {tree.estimated_age} god.
                  </span>
                )}
                {isAdmin && (
                  <span className="flex items-center gap-1 text-[11px] bg-white/90 text-gray-700 px-2.5 py-1 rounded-full font-bold">
                    <Shield size={11} /> ADMIN
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">{tree.title}</h2>
              {tree.species && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catInfo?.color ?? '#6b7280' }} />
                  <span className="text-sm text-white/80 italic">{tree.species}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {editing ? (
                <div className="space-y-3">
                  {[
                    { label: 'Naziv', value: editTitle, onChange: setEditTitle, type: 'text' },
                    { label: 'Vrsta', value: editSpecies, onChange: setEditSpecies, type: 'text' },
                  ].map(({ label, value, onChange, type }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
                        className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Opis</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                      rows={3} className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Procenjena starost</label>
                    <input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 text-sm py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium">
                      Otkaži
                    </button>
                    <button onClick={handleSaveEdit}
                      className="flex-1 text-sm py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium flex items-center justify-center gap-1">
                      <Check size={14} /> Sačuvaj
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(tree.created_at)}</span>
                      </div>
                    </div>
                    <button onClick={handleShare}
                      className="flex items-center gap-1 text-xs text-emerald-600 font-medium min-h-[36px] px-2">
                      <Share2 size={13} />
                      {copied ? 'Kopirano!' : 'Deli'}
                    </button>
                  </div>
                  {tree.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{tree.description}</p>
                  )}
                </>
              )}

              {/* Comments */}
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-3">
                  <MessageCircle size={15} className="text-emerald-600" />
                  Komentari ({comments.length})
                </h3>
                {comments.length > 0 ? (
                  <div className="space-y-0">
                    {comments.map((comment, idx) => (
                      <div key={comment.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm mt-1 flex-shrink-0" />
                          {idx < comments.length - 1 && (
                            <div className="w-0.5 flex-1 bg-emerald-200 min-h-[20px]" />
                          )}
                        </div>
                        <div className="pb-3 flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold text-emerald-700">{comment.author_name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-400">{formatTimelineDate(comment.created_at)}</span>
                              {isAdmin && (
                                <button onClick={() => onDeleteComment(comment.id)}
                                  className="min-w-[28px] min-h-[28px] flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-snug">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Još nema komentara. Budite prvi!</p>
                )}
              </div>

              {/* Bottom padding so sticky form doesn't cover content */}
              <div className="h-24" />
            </div>
          </div>

          {/* Sticky comment form */}
          <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text" placeholder="Vaše ime (opcionо)"
                value={authorName} onChange={(e) => setAuthorName(e.target.value)}
                className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Napišite komentar..."
                  value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  type="submit" disabled={!commentText.trim()}
                  className="w-11 h-11 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center flex-shrink-0 active:scale-95"
                >
                  <Send size={17} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── DESKTOP: Centered modal (original behavior) ───
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header image */}
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          <img src={imageUrl} alt={tree.title} className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              {isCult && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/90 text-white px-2 py-0.5 rounded-full font-bold">
                  <Crown size={10} /> KULT
                </span>
              )}
              {isAncient && (
                <span className="flex items-center gap-1 text-[10px] bg-red-500/90 text-white px-2 py-0.5 rounded-full font-bold">
                  <Clock size={10} /> {tree.estimated_age} godina
                </span>
              )}
              {isAdmin && (
                <span className="flex items-center gap-1 text-[10px] bg-white/90 text-gray-700 px-2 py-0.5 rounded-full font-bold">
                  <Shield size={10} /> ADMIN
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{tree.title}</h2>
            {tree.species && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catInfo?.color ?? '#6b7280' }} />
                <span className="text-sm text-white/80 italic">{tree.species}</span>
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors">
            <X size={16} className="text-white" />
          </button>
          {isAdmin && !editing && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <button onClick={() => setEditing(true)}
                className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors">
                <Pencil size={14} className="text-white" />
              </button>
              <button onClick={handleDelete}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${confirmDelete ? 'bg-red-500' : 'bg-black/40 hover:bg-red-500/80'}`}>
                <Trash2 size={14} className="text-white" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Naziv</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vrsta</label>
                <input type="text" value={editSpecies} onChange={(e) => setEditSpecies(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opis</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                  rows={3} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Procenjena starost</label>
                <input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="flex-1 text-sm py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">
                  Otkaži
                </button>
                <button onClick={handleSaveEdit}
                  className="flex-1 text-sm py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center justify-center gap-1">
                  <Check size={14} /> Sačuvaj
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} /><span>{tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} /><span>{formatDate(tree.created_at)}</span>
                  </div>
                </div>
                <button onClick={handleShare}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 transition-colors">
                  <Share2 size={12} />
                  {copied ? 'Kopirano!' : 'Deli'}
                </button>
              </div>
              {tree.description && <p className="text-sm text-gray-600 leading-relaxed">{tree.description}</p>}
            </>
          )}

          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-3">
              <MessageCircle size={15} className="text-emerald-600" />
              Komentari ({comments.length})
            </h3>
            {comments.length > 0 ? (
              <div className="space-y-0">
                {comments.map((comment, idx) => (
                  <div key={comment.id} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm mt-1 flex-shrink-0" />
                      {idx < comments.length - 1 && <div className="w-0.5 flex-1 bg-emerald-200 min-h-[20px]" />}
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-emerald-700">{comment.author_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">{formatTimelineDate(comment.created_at)}</span>
                          {isAdmin && (
                            <button onClick={() => onDeleteComment(comment.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-snug">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Još nema komentara. Budite prvi!</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            <input type="text" placeholder="Vaše ime (opcionо)" value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <div className="flex gap-2">
              <input type="text" placeholder="Napišite komentar..." value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <button type="submit" disabled={!commentText.trim()}
                className="w-10 h-10 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center flex-shrink-0">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
