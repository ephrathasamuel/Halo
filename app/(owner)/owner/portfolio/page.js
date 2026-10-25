'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { savePortfolioItem, deletePortfolioItem } from '@/lib/domain/providers';
import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState } from '@/components/states/EmptyState';

const EVENT_TYPES = ['Wedding', 'Engagement', 'Fashion', 'Corporate', 'Music', 'Documentary', 'Commercial', 'Other'];

export default function OwnerPortfolioPage() {
  const { session } = useSession();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: portfolio, refresh } = useStorageSync(STORAGE_KEYS.PORTFOLIO, []);

  const provider = providers.find((p) => p.ownerId === session?.userId);
  const myItems = provider ? portfolio.filter((item) => item.providerId === provider.id) : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    eventType: 'Wedding',
    mediaUrl: '/images/portfolio/b-light-wedding-1.jpg',
  });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      eventType: 'Wedding',
      mediaUrl: '/images/portfolio/b-light-wedding-1.jpg',
    });
    setStatusMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      eventType: item.eventType,
      mediaUrl: item.mediaUrl,
    });
    setStatusMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!provider) return;

    const payload = {
      id: editingItem?.id,
      providerId: provider.id,
      title: formData.title,
      eventType: formData.eventType,
      mediaUrl: formData.mediaUrl,
    };

    const res = savePortfolioItem(payload);
    if (!res.ok) {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to save portfolio item' });
      return;
    }

    setStatusMessage({ type: 'success', text: 'Portfolio item saved successfully!' });
    setIsModalOpen(false);
    refresh();
  };

  const handleDelete = (itemId) => {
    if (!confirm('Are you sure you want to remove this portfolio piece?')) return;
    const res = deletePortfolioItem(itemId);
    if (!res.ok) {
      alert(res.error || 'Failed to delete item');
      return;
    }
    refresh();
  };

  if (!provider) {
    return (
      <div className="py-12 text-center text-slate-500">
        No provider storefront found linked to your account.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portfolio & Showcase Gallery</h1>
          <p className="text-xs text-slate-500 mt-1">
            Highlight your best productions, weddings, editorial photography, and video coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/studios/${provider.slug}/portfolio`}
            target="_blank"
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition min-h-[44px] flex items-center gap-1.5"
          >
            <span>🌐</span> Public Gallery ↗
          </Link>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-halo-primary text-white rounded-xl text-xs font-bold hover:bg-halo-primary-light transition shadow min-h-[44px] flex items-center gap-1.5"
          >
            <span>➕</span> Add Item
          </button>
        </div>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {statusMessage.type === 'error' ? '⚠️ ' : '✓ '}
          {statusMessage.text}
        </div>
      )}

      {/* Portfolio Grid */}
      {myItems.length === 0 ? (
        <EmptyState
          title="No portfolio items yet"
          message="Upload visual examples of your work to attract renters and event inquiries."
          icon="🖼️"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={item.mediaUrl}
                    alt={item.title}
                    fallbackCategory="portfolio"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold uppercase rounded-lg">
                    {item.eventType}
                  </span>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: #{item.id.slice(0, 8)}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="text-xs font-semibold text-slate-700 hover:text-halo-primary min-h-[44px] px-2 flex items-center"
                >
                  Edit Item
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 min-h-[44px] px-2 flex items-center"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {editingItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="item-title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Item Title *
                </label>
                <input
                  id="item-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Traditional Wedding Highlights"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="event-type" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Event / Category *
                </label>
                <select
                  id="event-type"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="media-url" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Media Image URL (Demo Path) *
                </label>
                <input
                  id="media-url"
                  type="text"
                  required
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  placeholder="/images/portfolio/b-light-wedding-1.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-halo-primary text-white hover:bg-halo-primary-light transition min-h-[44px]"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
