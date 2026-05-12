import { Tree, Comment, SPECIES_CATEGORIES, getSpeciesCategory, getStockPhotoForSpecies } from '../lib/supabase';
import { useState } from 'react';
import { useAuth } from './Auth';
import { MessageCircle, Calendar, Crown, Clock, Share2, ExternalLink, Trash2 } from 'lucide-react';

interface TreePopupProps {
  tree: Tree;
  comments: Comment[];
  onAddComment: (treeId: string, content: string, authorName: string) => void;
  onOpenDetail: (treeId: string) => void;
  onDeleteTree?: (treeId: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export default function TreePopup({ tree, comments, onAddComment, onOpenDetail, onDeleteTree, onDeleteComment }: TreePopupProps) {
  const { isAdmin } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [copied, setCopied] = useState(false);
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
    setShowCommentForm(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#tree-${tree.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = () => {
    if (!onDeleteTree) return;
    if (confirmDelete) {
      onDeleteTree(tree.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      year: 'numeric',
      month: 'short',
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
    <div className="font-sans">
      <div className="mb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-emerald-800 leading-tight">{tree.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isCult && (
              <span className="flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                <Crown size={9} /> КУЛТ
              </span>
            )}
            {isAncient && (
              <span className="flex items-center gap-0.5 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                <Clock size={9} /> {tree.estimated_age} г.
              </span>
            )}
          </div>
        </div>
        {tree.species && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: catInfo?.color ?? '#6b7280' }}
            />
            <span className="text-xs text-emerald-600 italic">{tree.species}</span>
          </div>
        )}
      </div>

      <img
        src={imageUrl}
        alt={tree.title}
        className="w-full h-28 object-cover rounded-lg mb-2"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {tree.description && (
        <p className="text-xs text-gray-600 mb-2 leading-relaxed">{tree.description}</p>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Calendar size={10} />
          <span>{formatDate(tree.created_at)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <Share2 size={10} />
            {copied ? 'Копирано!' : 'Дели'}
          </button>
          <button
            onClick={() => onOpenDetail(tree.id)}
            className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-800 transition-colors ml-2"
          >
            <ExternalLink size={10} />
            Детаљи
          </button>
          {isAdmin && onDeleteTree && (
            <button
              onClick={handleDelete}
              className={`flex items-center gap-1 text-[10px] ml-2 transition-colors ${
                confirmDelete ? 'text-red-600 font-bold' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Trash2 size={10} />
              {confirmDelete ? 'Потврди?' : 'Обриши'}
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
            <MessageCircle size={13} />
            <span>Коментари ({comments.length})</span>
          </div>
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
          >
            {showCommentForm ? 'Затвори' : '+ Додај'}
          </button>
        </div>

        {comments.length > 0 && (
          <div className="space-y-0 mb-2 max-h-32 overflow-y-auto">
            {comments.map((comment, idx) => (
              <div key={comment.id} className="flex gap-2 relative">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {idx < comments.length - 1 && (
                    <div className="w-px flex-1 bg-emerald-200 min-h-[16px]" />
                  )}
                </div>
                <div className="pb-2 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {comment.author_name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-gray-400">
                        {formatTimelineDate(comment.created_at)}
                      </span>
                      {isAdmin && onDeleteComment && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={9} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCommentForm && (
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <input
              type="text"
              placeholder="Ваше име (опционо)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            />
            <textarea
              placeholder="Напишите коментар..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="w-full text-xs py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
            >
              Пошаљи коментар
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
