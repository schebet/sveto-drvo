import { useState } from 'react';
import { TreePine, X } from 'lucide-react';
import { SPECIES_CATEGORIES } from '../lib/supabase';

interface AddTreeFormProps {
  onSubmit: (data: { title: string; description: string; species: string; estimated_age: number | null; comment: string; authorName: string }) => void;
  onCancel: () => void;
}

export default function AddTreeForm({ onSubmit, onCancel }: AddTreeFormProps) {
  const [title, setTitle] = useState('');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedAge, setEstimatedAge] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      species: species.trim(),
      description: description.trim(),
      estimated_age: estimatedAge ? parseInt(estimatedAge, 10) : null,
      comment: comment.trim(),
      authorName: authorName.trim() || 'Анониман',
    });
  };

  const speciesOptions = Object.entries(SPECIES_CATEGORIES).filter(([k]) => k !== 'other');

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-5 border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TreePine size={18} className="text-emerald-600" />
          </div>
          <h3 className="font-bold text-emerald-800 text-sm">Ново дрво-запис</h3>
        </div>
        <button
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Назив дрвета <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="нпр. Стари храст код школе"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Врста дрвета</label>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-white"
          >
            <option value="">-- Изаберите врсту --</option>
            {speciesOptions.map(([key, info]) => (
              <option key={key} value={info.label}>
                {info.icon} {info.label}
              </option>
            ))}
            <option value="other">Друго (унесите ручно)</option>
          </select>
          {species === 'other' && (
            <input
              type="text"
              placeholder="Унесите врсту дрвета"
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Опис</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите ово дрво..."
            rows={2}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Процењена старост (године)
          </label>
          <input
            type="number"
            min="1"
            max="2000"
            value={estimatedAge}
            onChange={(e) => setEstimatedAge(e.target.value)}
            placeholder="нпр. 150"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
          {estimatedAge && parseInt(estimatedAge) >= 100 && (
            <p className="text-[10px] text-amber-600 mt-1 font-medium">
              Дрво старије од 100 година добија посебан &quot;старо&quot; обележје!
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Први коментар</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Ваше име (опционо)"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all mb-2"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Додајте коментар уз овај запис..."
            rows={2}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none transition-all"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-sm py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Откажи
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 text-sm py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            Сачувај
          </button>
        </div>
      </form>
    </div>
  );
}
