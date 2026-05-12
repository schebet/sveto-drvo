import { Tree, Comment, SPECIES_CATEGORIES, getSpeciesCategory, getStockPhotoForSpecies } from '../lib/supabase';
import { useState } from 'react';
import { useAuth } from './Auth';
import {
  X, MessageCircle, MapPin, Calendar, Crown, Clock,
  Share2, Send, Pencil, Trash2, Check, Shield,
} from 'lucide-react';

interface TreeDetailModalProps {
  tree: Tree;
  comments: Comment[];
  onAddComment: (treeId: string, content: string, authorName: string) => void;
  onDeleteTree: (treeId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateTree: (treeId: string, updates: Partial<Tree>) => void;
  onClose: () => void;
}

export default function TreeDetailModal({ tree, comments, onAddComment, onDeleteTree, onDeleteComment, onUpdateTree, onClose }: TreeDetailModalProps) {
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

  const cat = getSpeciesCategory(tree.species);
  const catInfo = SPECIES_CATEGORIES[cat];
  const isAncient = tree.estimated_age !== null && tree.estimated_age >= 100;
  const isCult = comments.length >= 3;
  const imageUrl = tree.image_url || getStockPhotoForSpecies(tree.species);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(tree.id, commentText.trim(), authorName.trim() || 'Анониман');
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
      title: editTitle.trim(),
      description: editDescription.trim(),
      species: editSpecies.trim(),
      estimated_age: editAge ? parseInt(editAge, 10) : null,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDeleteTree(tree.id);
      onClose();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimelineDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header image */}
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt={tree.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              {isCult && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/90 text-white px-2 py-0.5 rounded-full font-bold">
                  <Crown size={10} /> КУЛТ
                </span>
              )}
              {isAncient && (
                <span className="flex items-center gap-1 text-[10px] bg-red-500/90 text-white px-2 py-0.5 rounded-full font-bold">
                  <Clock size={10} /> {tree.estimated_age} година
                </span>
              )}
              {isAdmin && (
                <span className="flex items-center gap-1 text-[10px] bg-white/90 text-gray-700 px-2 py-0.5 rounded-full font-bold">
                  <Shield size={10} /> АДМИН
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{tree.title}</h2>
            {tree.species && (
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: catInfo?.color ?? '#6b7280' }}
                />
                <span className="text-sm text-white/80 italic">{tree.species}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          {isAdmin && !editing && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <button
                onClick={() => setEditing(true)}
                className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
                title="Измени"
              >
                <Pencil size={14} className="text-white" />
              </button>
              <button
                onClick={handleDelete}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  confirmDelete ? 'bg-red-500' : 'bg-black/40 hover:bg-red-500/80'
                }`}
                title={confirmDelete ? 'Потврдите брисање' : 'Обриши'}
              >
                <Trash2 size={14} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Назив</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Врста</label>
                <input
                  type="text"
                  value={editSpecies}
                  onChange={(e) => setEditSpecies(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Опис</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Процењена старост</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 text-sm py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  Откажи
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 text-sm py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Сачувај
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(tree.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  <Share2 size={12} />
                  {copied ? 'Копирано!' : 'Дели'}
                </button>
              </div>

              {/* Description */}
              {tree.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{tree.description}</p>
              )}
            </>
          )}

          {/* Comments timeline */}
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-3">
              <MessageCircle size={15} className="text-emerald-600" />
              Коментари ({comments.length})
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
                        <span className="text-xs font-semibold text-emerald-700">
                          {comment.author_name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">
                            {formatTimelineDate(comment.created_at)}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteComment(comment.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              title="Обриши коментар"
                            >
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
              <p className="text-xs text-gray-400 italic">Још нема коментара. Будите први!</p>
            )}
          </div>
        </div>

        {/* Comment form */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              placeholder="Ваше име (опционо)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Напишите коментар..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="w-10 h-10 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
