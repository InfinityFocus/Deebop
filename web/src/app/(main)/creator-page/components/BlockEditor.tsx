'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Upload, Link2, Loader2, X, ImageIcon, Search } from 'lucide-react';
import { ContentPickerModal } from './ContentPickerModal';
import type {
  CreatorPageBlock,
  HeroBlockData,
  CardBlockData,
  LinksBlockData,
  SocialLinksBlockData,
  AffiliateCardBlockData,
  EmailCaptureBlockData,
  DividerBlockData,
  FeaturedContentBlockData,
  BookingBlockData,
  BookingPlatform,
  SocialPlatform,
  SOCIAL_PLATFORMS,
} from '@/types/creator-page';
import { BOOKING_PLATFORMS } from '@/types/creator-page';

interface BlockEditorProps {
  block: CreatorPageBlock;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  switch (block.type) {
    case 'hero':
      return <HeroEditor data={block.data as HeroBlockData} onUpdate={onUpdate} />;
    case 'card':
      return <CardEditor data={block.data as CardBlockData} onUpdate={onUpdate} />;
    case 'links':
      return <LinksEditor data={block.data as LinksBlockData} onUpdate={onUpdate} />;
    case 'social_links':
      return <SocialLinksEditor data={block.data as SocialLinksBlockData} onUpdate={onUpdate} />;
    case 'affiliate_card':
      return <AffiliateCardEditor data={block.data as AffiliateCardBlockData} onUpdate={onUpdate} />;
    case 'email_capture':
      return <EmailCaptureEditor data={block.data as EmailCaptureBlockData} onUpdate={onUpdate} />;
    case 'divider':
      return <DividerEditor data={block.data as DividerBlockData} onUpdate={onUpdate} />;
    case 'featured_content':
      return <FeaturedContentEditor data={block.data as FeaturedContentBlockData} onUpdate={onUpdate} />;
    case 'booking':
      return <BookingEditor data={block.data as BookingBlockData} onUpdate={onUpdate} />;
    default:
      return <div className="text-gray-500">No editor available</div>;
  }
}

// Input component
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

// Textarea component
function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
      />
    </div>
  );
}

// Toggle component
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </label>
  );
}

// Select component
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Image Upload component with drag-and-drop
function ImageUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [mode, setMode] = useState<'upload' | 'url'>(value ? 'url' : 'upload');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/creator-page/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      onChange(data.url);
      setMode('url');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleClear = useCallback(() => {
    onChange('');
    setMode('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition ${
            mode === 'upload'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          <Upload size={12} />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition ${
            mode === 'url'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          <Link2 size={12} />
          URL
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-sm text-gray-400">Uploading & compressing...</p>
              </div>
            ) : value ? (
              <div className="relative">
                <img
                  src={value}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 5MB (auto-compressed)
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </>
      ) : (
        /* URL input mode */
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-400"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {value && (
            <img
              src={value}
              alt="Preview"
              className="max-h-32 rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

// Hero Editor
function HeroEditor({
  data,
  onUpdate,
}: {
  data: HeroBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Headline"
        value={data.headline || ''}
        onChange={(v) => onUpdate({ ...data, headline: v })}
        placeholder="e.g., Musician & Producer"
      />
      <Textarea
        label="Bio"
        value={data.bio || ''}
        onChange={(v) => onUpdate({ ...data, bio: v })}
        placeholder="Short bio (leave empty to use profile bio)"
      />
      <Input
        label="CTA Button Label"
        value={data.ctaLabel || ''}
        onChange={(v) => onUpdate({ ...data, ctaLabel: v })}
        placeholder="e.g., Book Now"
      />
      <Input
        label="CTA Button URL"
        value={data.ctaUrl || ''}
        onChange={(v) => onUpdate({ ...data, ctaUrl: v })}
        placeholder="https://..."
        type="url"
      />
      <Toggle
        label="Show Social Icons"
        checked={data.showSocialIcons || false}
        onChange={(v) => onUpdate({ ...data, showSocialIcons: v })}
      />
      <Select
        label="Alignment"
        value={data.alignment || 'center'}
        onChange={(v) => onUpdate({ ...data, alignment: v })}
        options={[
          { value: 'center', label: 'Center' },
          { value: 'left', label: 'Left' },
        ]}
      />
    </div>
  );
}

// Card Editor
function CardEditor({
  data,
  onUpdate,
}: {
  data: CardBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <ImageUpload
        label="Card Image"
        value={data.imageUrl || ''}
        onChange={(v) => onUpdate({ ...data, imageUrl: v })}
      />
      <Input
        label="Title"
        value={data.title || ''}
        onChange={(v) => onUpdate({ ...data, title: v })}
        placeholder="Card title"
      />
      <Textarea
        label="Description"
        value={data.description || ''}
        onChange={(v) => onUpdate({ ...data, description: v })}
        placeholder="Short description"
      />
      <Input
        label="Button Label"
        value={data.ctaLabel || ''}
        onChange={(v) => onUpdate({ ...data, ctaLabel: v })}
        placeholder="e.g., Learn More"
      />
      <Input
        label="Button URL"
        value={data.ctaUrl || ''}
        onChange={(v) => onUpdate({ ...data, ctaUrl: v })}
        placeholder="https://..."
        type="url"
      />
      <Toggle
        label="Highlight (Accent Color)"
        checked={data.highlight || false}
        onChange={(v) => onUpdate({ ...data, highlight: v })}
      />
    </div>
  );
}

// Links Editor
function LinksEditor({
  data,
  onUpdate,
}: {
  data: LinksBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  const groups = data.groups || [];

  const addGroup = () => {
    onUpdate({
      ...data,
      groups: [...groups, { heading: '', links: [] }],
    });
  };

  const updateGroup = (index: number, updates: Partial<LinksBlockData['groups'][0]>) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], ...updates };
    onUpdate({ ...data, groups: newGroups });
  };

  const deleteGroup = (index: number) => {
    onUpdate({ ...data, groups: groups.filter((_, i) => i !== index) });
  };

  const addLink = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].links.push({ label: '', url: '' });
    onUpdate({ ...data, groups: newGroups });
  };

  const updateLink = (groupIndex: number, linkIndex: number, updates: Partial<{ label: string; url: string }>) => {
    const newGroups = [...groups];
    newGroups[groupIndex].links[linkIndex] = {
      ...newGroups[groupIndex].links[linkIndex],
      ...updates,
    };
    onUpdate({ ...data, groups: newGroups });
  };

  const deleteLink = (groupIndex: number, linkIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].links = newGroups[groupIndex].links.filter((_, i) => i !== linkIndex);
    onUpdate({ ...data, groups: newGroups });
  };

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={group.heading || ''}
              onChange={(e) => updateGroup(gi, { heading: e.target.value })}
              placeholder="Group heading (optional)"
              className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            />
            <button
              onClick={() => deleteGroup(gi)}
              className="p-1 text-gray-500 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {group.links.map((link, li) => (
              <div key={li} className="flex items-center gap-2">
                <GripVertical size={14} className="text-gray-600" />
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(gi, li, { label: e.target.value })}
                  placeholder="Label"
                  className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(gi, li, { url: e.target.value })}
                  placeholder="URL"
                  className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
                <button
                  onClick={() => deleteLink(gi, li)}
                  className="p-1 text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addLink(gi)}
            className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Plus size={14} /> Add Link
          </button>
        </div>
      ))}

      <button
        onClick={addGroup}
        className="w-full py-2 border border-dashed border-gray-700 hover:border-emerald-500 rounded-lg text-gray-500 hover:text-emerald-400 flex items-center justify-center gap-1"
      >
        <Plus size={16} /> Add Group
      </button>
    </div>
  );
}

// Social Links Editor
const PLATFORMS: SocialPlatform[] = [
  'instagram',
  'youtube',
  'tiktok',
  'linkedin',
  'x',
  'website',
  'spotify',
  'soundcloud',
  'twitch',
  'discord',
  'github',
  'email',
];

function SocialLinksEditor({
  data,
  onUpdate,
}: {
  data: SocialLinksBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  const links = data.links || [];

  const addLink = () => {
    const usedPlatforms = links.map((l) => l.platform);
    const available = PLATFORMS.find((p) => !usedPlatforms.includes(p));
    if (available) {
      onUpdate({
        ...data,
        links: [...links, { platform: available, url: '' }],
      });
    }
  };

  const updateLink = (index: number, updates: Partial<{ platform: SocialPlatform; url: string }>) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], ...updates };
    onUpdate({ ...data, links: newLinks });
  };

  const deleteLink = (index: number) => {
    onUpdate({ ...data, links: links.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={link.platform}
            onChange={(e) => updateLink(i, { platform: e.target.value as SocialPlatform })}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={link.url}
            onChange={(e) => updateLink(i, { url: e.target.value })}
            placeholder={link.platform === 'email' ? 'mailto:you@example.com' : 'https://...'}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          />
          <button
            onClick={() => deleteLink(i)}
            className="p-1 text-gray-500 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {links.length < PLATFORMS.length && (
        <button
          onClick={addLink}
          className="w-full py-2 border border-dashed border-gray-700 hover:border-emerald-500 rounded-lg text-gray-500 hover:text-emerald-400 flex items-center justify-center gap-1"
        >
          <Plus size={16} /> Add Social Link
        </button>
      )}
    </div>
  );
}

// Affiliate Card Editor
function AffiliateCardEditor({
  data,
  onUpdate,
}: {
  data: AffiliateCardBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-xs text-amber-400">
          This block will always show an &quot;Affiliate&quot; badge for transparency.
        </p>
      </div>
      <ImageUpload
        label="Product Image"
        value={data.imageUrl || ''}
        onChange={(v) => onUpdate({ ...data, imageUrl: v })}
      />
      <Input
        label="Product Title"
        value={data.title || ''}
        onChange={(v) => onUpdate({ ...data, title: v })}
        placeholder="Product name"
      />
      <Textarea
        label="Description"
        value={data.description || ''}
        onChange={(v) => onUpdate({ ...data, description: v })}
        placeholder="Brief product description"
      />
      <Input
        label="Price Note"
        value={data.priceNote || ''}
        onChange={(v) => onUpdate({ ...data, priceNote: v })}
        placeholder="e.g., 20% off, $29/month"
      />
      <Input
        label="Coupon Code"
        value={data.couponCode || ''}
        onChange={(v) => onUpdate({ ...data, couponCode: v })}
        placeholder="e.g., SAVE20"
      />
      <Input
        label="Button Label"
        value={data.ctaLabel || ''}
        onChange={(v) => onUpdate({ ...data, ctaLabel: v })}
        placeholder="e.g., Shop Now"
      />
      <Input
        label="Affiliate URL"
        value={data.ctaUrl || ''}
        onChange={(v) => onUpdate({ ...data, ctaUrl: v })}
        placeholder="https://..."
        type="url"
      />
    </div>
  );
}

// Email Capture Editor
function EmailCaptureEditor({
  data,
  onUpdate,
}: {
  data: EmailCaptureBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Heading"
        value={data.heading || ''}
        onChange={(v) => onUpdate({ ...data, heading: v })}
        placeholder="e.g., Join My Newsletter"
      />
      <Textarea
        label="Description"
        value={data.description || ''}
        onChange={(v) => onUpdate({ ...data, description: v })}
        placeholder="Brief description"
      />
      <Input
        label="Input Placeholder"
        value={data.placeholder || ''}
        onChange={(v) => onUpdate({ ...data, placeholder: v })}
        placeholder="e.g., Enter your email"
      />
      <Input
        label="Button Label"
        value={data.buttonLabel || ''}
        onChange={(v) => onUpdate({ ...data, buttonLabel: v })}
        placeholder="e.g., Subscribe"
      />
      <Textarea
        label="Consent Text (Required)"
        value={data.consentText || ''}
        onChange={(v) => onUpdate({ ...data, consentText: v })}
        placeholder="I agree to receive emails..."
        rows={2}
      />
      <p className="text-xs text-gray-500">
        Users must check a consent box with this text before subscribing.
      </p>
    </div>
  );
}

// Divider Editor
function DividerEditor({
  data,
  onUpdate,
}: {
  data: DividerBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <Select
        label="Style"
        value={data.style || 'space'}
        onChange={(v) => onUpdate({ ...data, style: v })}
        options={[
          { value: 'space', label: 'Empty Space' },
          { value: 'line', label: 'Horizontal Line' },
          { value: 'dots', label: 'Three Dots' },
        ]}
      />
      <Select
        label="Height"
        value={data.height || 'medium'}
        onChange={(v) => onUpdate({ ...data, height: v })}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />
    </div>
  );
}

// Featured Content Editor
function FeaturedContentEditor({
  data,
  onUpdate,
}: {
  data: FeaturedContentBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  const items = data.items || [];
  const [showPicker, setShowPicker] = useState(false);

  const deleteItem = (index: number) => {
    onUpdate({ ...data, items: items.filter((_, i) => i !== index) });
  };

  const handlePickerSelect = (item: { type: 'post' | 'album' | 'event'; id: string }) => {
    if (items.length >= 6) return;
    // Check if already added
    if (items.some((i) => i.id === item.id)) return;
    onUpdate({
      ...data,
      items: [...items, item],
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Add up to 6 pieces of content to feature.
      </p>

      {/* Browse Content Button */}
      {items.length < 6 && (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 text-white rounded-lg transition flex items-center justify-center gap-2"
        >
          <Search size={18} />
          Browse My Content
        </button>
      )}

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Selected ({items.length}/6)</p>
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg"
            >
              <span className="text-xs text-emerald-400 uppercase w-12">{item.type}</span>
              <span className="flex-1 text-sm text-white font-mono truncate">
                {item.id}
              </span>
              <button
                onClick={() => deleteItem(i)}
                className="p-1 text-gray-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length >= 6 && (
        <p className="text-sm text-amber-400">Maximum 6 items reached</p>
      )}

      {/* Content Picker Modal */}
      <ContentPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handlePickerSelect}
        selectedIds={items.map((i) => i.id)}
        maxItems={6}
      />
    </div>
  );
}

// Booking Editor
const BOOKING_PLATFORM_OPTIONS: BookingPlatform[] = [
  'calendly',
  'acuity',
  'calcom',
  'tidycal',
  'setmore',
  'youcanbookme',
  'other',
];

function BookingEditor({
  data,
  onUpdate,
}: {
  data: BookingBlockData;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  const mode = data.mode || 'link';

  return (
    <div className="space-y-4">
      {/* Platform Selector */}
      <Select
        label="Booking Platform"
        value={data.platform || 'calendly'}
        onChange={(v) => onUpdate({ ...data, platform: v })}
        options={BOOKING_PLATFORM_OPTIONS.map((p) => ({
          value: p,
          label: BOOKING_PLATFORMS[p].label,
        }))}
      />

      {/* Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Display Mode</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ ...data, mode: 'link' })}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === 'link'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            Link Card
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ ...data, mode: 'embed' })}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === 'embed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            Embed Widget
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {mode === 'link'
            ? 'Opens booking page in a new tab'
            : 'Embeds the booking calendar directly on your page'}
        </p>
      </div>

      {/* Title */}
      <Input
        label="Title"
        value={data.title || ''}
        onChange={(v) => onUpdate({ ...data, title: v })}
        placeholder="e.g., Book a Session"
      />

      {/* Description */}
      <Textarea
        label="Description"
        value={data.description || ''}
        onChange={(v) => onUpdate({ ...data, description: v })}
        placeholder="Brief description (optional)"
        rows={2}
      />

      {/* URL */}
      <Input
        label={mode === 'embed' ? 'Embed URL' : 'Booking URL'}
        value={data.url || ''}
        onChange={(v) => onUpdate({ ...data, url: v })}
        placeholder="https://calendly.com/your-link"
        type="url"
      />
      <p className="text-xs text-gray-500 -mt-2">
        {mode === 'embed'
          ? 'Use the embed/inline URL from your booking platform'
          : 'Link to your booking page'}
      </p>

      {/* Mode-specific fields */}
      {mode === 'link' ? (
        <Input
          label="Button Label"
          value={data.ctaLabel || ''}
          onChange={(v) => onUpdate({ ...data, ctaLabel: v })}
          placeholder="Book Now"
        />
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Widget Height: {data.embedHeight || 600}px
          </label>
          <input
            type="range"
            min={300}
            max={900}
            step={50}
            value={data.embedHeight || 600}
            onChange={(e) => onUpdate({ ...data, embedHeight: parseInt(e.target.value) })}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>300px</span>
            <span>900px</span>
          </div>
        </div>
      )}

      {/* Highlight Toggle */}
      <Toggle
        label="Highlight (Accent Border)"
        checked={data.highlight || false}
        onChange={(v) => onUpdate({ ...data, highlight: v })}
      />
    </div>
  );
}
