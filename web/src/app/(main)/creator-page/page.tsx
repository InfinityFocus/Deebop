'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Eye,
  ExternalLink,
  Copy,
  Check,
  Globe,
  GlobeLock,
  Loader2,
  Smartphone,
  Monitor,
  GripVertical,
  Trash2,
  Edit3,
  Lock,
  BarChart3,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { CreatorPageBlock, BlockType, CreatorPageResponse } from '@/types/creator-page';
import { BlockTypeMenu } from './components/BlockTypeMenu';
import { BlockEditor } from './components/BlockEditor';
import { PreviewFrame } from './components/PreviewFrame';

export default function CreatorPageBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pageData, setPageData] = useState<CreatorPageResponse | null>(null);
  const [blocks, setBlocks] = useState<CreatorPageBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [copied, setCopied] = useState(false);

  // Mobile view state
  const [mobileView, setMobileView] = useState<'blocks' | 'preview' | 'editor'>('preview');

  // Dragging state
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch('/api/creator-page');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          if (res.status === 403) {
            setError('Creator Page is available for Standard and Pro users. Upgrade to unlock this feature.');
            setLoading(false);
            return;
          }
          throw new Error('Failed to load page');
        }
        const data: CreatorPageResponse = await res.json();
        setPageData(data);
        setBlocks(data.page?.blocks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [router]);

  // Save blocks
  const saveBlocks = useCallback(async () => {
    if (!pageData) return;
    setSaving(true);
    try {
      const res = await fetch('/api/creator-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: blocks.map((b, i) => ({
            id: b.id,
            type: b.type,
            sortOrder: i,
            data: b.data,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      const updated = await res.json();
      setPageData((prev) => prev ? { ...prev, page: updated.page } : null);
      setBlocks(updated.page?.blocks || []);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [pageData, blocks]);

  // Publish/Unpublish
  const togglePublish = async () => {
    if (!pageData?.page) return;
    setPublishing(true);
    try {
      const isPublished = pageData.page.status === 'published';
      const res = await fetch('/api/creator-page/publish', {
        method: isPublished ? 'DELETE' : 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }
      const updated = await res.json();
      setPageData((prev) => prev ? { ...prev, page: updated.page } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setPublishing(false);
    }
  };

  // Add block
  const addBlock = (type: BlockType) => {
    const newBlock: CreatorPageBlock = {
      id: `temp-${Date.now()}`,
      type,
      sortOrder: blocks.length,
      data: getDefaultBlockData(type),
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setShowAddMenu(false);
    setHasUnsavedChanges(true);
  };

  // Update block
  const updateBlock = (blockId: string, data: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, data: data as CreatorPageBlock['data'] } : b)));
    setHasUnsavedChanges(true);
  };

  // Delete block
  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    setHasUnsavedChanges(true);
  };

  // Drag handlers
  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId);
  };

  const handleDragOver = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetBlockId) return;

    const draggedIndex = blocks.findIndex((b) => b.id === draggedBlockId);
    const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, removed);
    setBlocks(newBlocks);
  };

  const handleDragEnd = () => {
    if (draggedBlockId) {
      setHasUnsavedChanges(true);
    }
    setDraggedBlockId(null);
  };

  // Copy link
  const copyLink = () => {
    if (!pageData?.user) return;
    const url = `${window.location.origin}/u/${pageData.user.username}/hub`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle block selection with mobile auto-switch
  const handleBlockSelect = (blockId: string) => {
    setSelectedBlockId(blockId);
    // On mobile, switch to editor view when block selected
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileView('editor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (error && !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Lock size={48} className="text-gray-500 mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Creator Page Locked</h1>
        <p className="text-gray-400 text-center max-w-md mb-6">{error}</p>
        <button
          onClick={() => router.push('/pricing')}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition"
        >
          View Plans
        </button>
      </div>
    );
  }

  const isPublished = pageData?.page?.status === 'published';
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="flex h-screen bg-gray-950 pb-32 md:pb-0">
      {/* Left Panel - Block List */}
      <div className={clsx(
        "md:w-80 md:border-r border-gray-800 flex flex-col",
        "w-full",
        mobileView !== 'blocks' && 'hidden md:flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold text-white">Creator Page</h1>
          <div className="flex items-center gap-2 mt-2">
            {isPublished ? (
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <Globe size={14} /> Published
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <GlobeLock size={14} /> Draft
              </span>
            )}
          </div>
        </div>

        {/* Block List */}
        <div className="flex-1 overflow-y-auto p-4">
          {blocks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No blocks yet</p>
              <button
                onClick={() => setShowAddMenu(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Add First Block
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(block.id)}
                  onDragOver={(e) => handleDragOver(e, block.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                    selectedBlockId === block.id
                      ? 'bg-emerald-500/10 border-emerald-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  } ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                  onClick={() => handleBlockSelect(block.id)}
                >
                  <GripVertical size={16} className="text-gray-500 cursor-grab" />
                  <span className="flex-1 text-sm text-white capitalize">
                    {block.type.replace('_', ' ')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBlock(block.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {blocks.length > 0 && (
            <button
              onClick={() => setShowAddMenu(true)}
              className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-lg text-gray-500 hover:text-emerald-400 transition flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Block
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          {error && (
            <p className="text-sm text-red-400 mb-2">{error}</p>
          )}

          <button
            onClick={saveBlocks}
            disabled={saving || !hasUnsavedChanges}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </button>

          <button
            onClick={togglePublish}
            disabled={publishing || blocks.length === 0}
            className={`w-full px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              isPublished
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {publishing ? <Loader2 size={16} className="animate-spin" /> : null}
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>

          {isPublished && pageData?.user && (
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={`/u/${pageData.user.username}/hub`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          )}

          <Link
            href="/creator-page/analytics"
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <BarChart3 size={16} />
            View Analytics
          </Link>
        </div>
      </div>

      {/* Center - Preview */}
      <div className={clsx(
        "md:flex-1 flex flex-col bg-gray-900",
        "flex-1",
        mobileView !== 'preview' && 'hidden md:flex'
      )}>
        {/* Preview Controls - hidden on mobile */}
        <div className="hidden md:flex p-4 border-b border-gray-800 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-lg transition ${
                previewMode === 'mobile' ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Smartphone size={18} />
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-lg transition ${
                previewMode === 'desktop' ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Monitor size={18} />
            </button>
          </div>
          <span className="text-sm text-gray-500">Preview</span>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-0 md:p-8">
          <PreviewFrame
            mode={previewMode}
            user={pageData?.user || null}
            blocks={blocks}
            onBlockClick={handleBlockSelect}
            selectedBlockId={selectedBlockId}
          />
        </div>
      </div>

      {/* Right Panel - Block Editor */}
      {selectedBlock && (
        <div className={clsx(
          "md:w-96 md:border-l border-gray-800 flex flex-col",
          "w-full",
          mobileView !== 'editor' && 'hidden md:flex'
        )}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white capitalize">
              Edit {selectedBlock.type.replace('_', ' ')}
            </h2>
            <button
              onClick={() => {
                setSelectedBlockId(null);
                // On mobile, go back to blocks view
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setMobileView('blocks');
                }
              }}
              className="p-1 text-gray-500 hover:text-white transition"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <BlockEditor
              block={selectedBlock}
              onUpdate={(data) => updateBlock(selectedBlock.id, data)}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - positioned above main navbar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-[60] rounded-t-xl">
        <button
          onClick={() => setMobileView('blocks')}
          className={clsx(
            "flex-1 py-3 flex flex-col items-center gap-1 text-xs",
            mobileView === 'blocks' ? 'text-emerald-400' : 'text-gray-500'
          )}
        >
          <Layers size={20} />
          Blocks
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={clsx(
            "flex-1 py-3 flex flex-col items-center gap-1 text-xs",
            mobileView === 'preview' ? 'text-emerald-400' : 'text-gray-500'
          )}
        >
          <Eye size={20} />
          Preview
        </button>
        <button
          onClick={() => {
            if (selectedBlock) {
              setMobileView('editor');
            }
          }}
          className={clsx(
            "flex-1 py-3 flex flex-col items-center gap-1 text-xs",
            mobileView === 'editor' ? 'text-emerald-400' : 'text-gray-500',
            !selectedBlock && 'opacity-40'
          )}
        >
          <Edit3 size={20} />
          Edit
        </button>
      </div>

      {/* Add Block Menu Modal */}
      {showAddMenu && (
        <BlockTypeMenu
          onSelect={addBlock}
          onClose={() => setShowAddMenu(false)}
          currentBlockCount={blocks.length}
          userTier={pageData?.user?.tier || 'free'}
        />
      )}
    </div>
  );
}

// Default data for new blocks
function getDefaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return { showSocialIcons: false, alignment: 'center' };
    case 'featured_content':
      return { items: [] };
    case 'card':
      return { title: 'New Card', ctaLabel: 'Learn More', ctaUrl: '' };
    case 'links':
      return { groups: [{ links: [] }] };
    case 'social_links':
      return { links: [] };
    case 'affiliate_card':
      return { title: 'Product Name', ctaLabel: 'Shop Now', ctaUrl: '' };
    case 'email_capture':
      return { heading: 'Join My Newsletter', buttonLabel: 'Subscribe', consentText: 'I agree to receive emails' };
    case 'divider':
      return { style: 'space', height: 'medium' };
    default:
      return {};
  }
}
