'use client';

import { X } from 'lucide-react';

import { useState } from 'react';
import Link from 'next/link';
import { useMyStorefront } from '@/hooks/useMyStorefront';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState } from '@/components/states/EmptyState';
import { deletePortfolioItem, savePortfolioItem } from '@/lib/client/domain';

const EVENT_TYPES = ['Wedding', 'Engagement', 'Fashion', 'Corporate', 'Music', 'Documentary', 'Commercial', 'Other'];

export default function OwnerPortfolioPage() {
  const { provider: storefront } = useMyStorefront();
  const { data: portfolio, refresh } = useStorageSync(STORAGE_KEYS.PORTFOLIO, []);

  const provider = storefront;
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!provider) return;

    const payload = {
      id: editingItem?.id,
      providerId: provider.id,
      title: formData.title,
      eventType: formData.eventType,
      mediaUrl: formData.mediaUrl,
    };

    const res = await savePortfolioItem(payload);
    if (!res.ok) {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to save portfolio item' });
      return;
    }

    setStatusMessage({ type: 'success', text: 'Portfolio item saved successfully!' });
    setIsModalOpen(false);
    refresh();
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to remove this portfolio piece?')) return;
    const res = await deletePortfolioItem(itemId);
    if (!res.ok) {
      alert(res.error || 'Failed to delete item');
      return;
    }
    refresh();
  };

  if (!provider) {
    return (
      <div className="py-12 text-center text-halo-text-muted">
        No provider storefront found linked to your account.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Portfolio & Showcase Gallery</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Highlight your best productions, weddings, editorial photography, and video coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/studios/${provider.slug}/portfolio`}
            target="_blank"
            className="px-4 py-2 border border-halo-border-strong rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 transition min-h-[44px] flex items-center gap-1.5"
          >
            Public Gallery</Link>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-halo-ink text-white rounded-xl text-xs font-semibold hover:bg-halo-ink-soft transition min-h-[44px] flex items-center gap-1.5"
          >
            Add Item
          </button>
        </div>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            statusMessage.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Portfolio Grid */}
      {myItems.length === 0 ? (
        <EmptyState
          title="No portfolio items yet"
          message="Upload visual examples of your work to attract renters and event inquiries."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-halo-border overflow-hidden hover: transition flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video bg-stone-100 overflow-hidden">
                  <SafeImage
                    src={item.mediaUrl}
                    alt={item.title}
                    fallbackType="portfolio"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold rounded-lg">
                    {item.eventType}
                  </span>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-semibold text-halo-ink text-sm">{item.title}</h3>
                  <p className="text-[11px] text-halo-text-muted font-mono">
                    ID: #{item.id.slice(-6)}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-halo-border flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="text-xs font-semibold text-stone-700 hover:text-halo-ink min-h-[44px] px-2 flex items-center"
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
          <div className="bg-white rounded-2xl border border-halo-border max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-halo-border">
              <h2 className="text-lg font-semibold text-halo-ink">
                {editingItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-halo-text-muted hover:text-stone-600 min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="item-title" className="block text-xs font-semibold text-stone-700">
                  Item Title *
                </label>
                <input
                  id="item-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Traditional Wedding Highlights"
                  className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="event-type" className="block text-xs font-semibold text-stone-700">
                  Event / Category *
                </label>
                <select
                  id="event-type"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="media-url" className="block text-xs font-semibold text-stone-700">
                  Image URL *
                </label>
                <input
                  id="media-url"
                  type="text"
                  required
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  placeholder="/images/portfolio/b-light-wedding-1.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-halo-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-halo-border text-stone-600 hover:bg-stone-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-halo-ink text-white hover:bg-halo-ink-soft transition min-h-[44px]"
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
