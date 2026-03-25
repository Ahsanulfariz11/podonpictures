import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Edit3, Trash2, ArrowLeft, X, Film, ImageIcon,
  CheckCircle, UploadCloud, ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react';
import { Cropper } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { toast } from 'sonner';
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  title: '',
  category: '',
  description: '',
  images: [],
  video_url: '',
  type: 'foto',
};

const CATEGORIES_FOTO = ['Wedding', 'Portrait', 'Nature', 'Commercial', 'Event', 'Other'];
const CATEGORIES_VIDEO = ['Highlight', 'Corporate', 'Art', 'Documentary', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatSupabaseError = (err) => {
  const message = String(err?.message ?? err ?? 'Terjadi kesalahan');
  if (message.includes('Could not find the table')) {
    return 'Tabel portfolio_items tidak ditemukan. Pastikan sudah dibuat di Supabase.';
  }
  return message;
};

const uploadFileToStorage = async (file, folder) => {
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('portfolio')
    .upload(filePath, file, { cacheControl: '3600', upsert: true });
  if (uploadError) throw uploadError;

  const { data, error: publicUrlError } = supabase.storage
    .from('portfolio')
    .getPublicUrl(filePath);
  if (publicUrlError) throw publicUrlError;
  if (!data?.publicUrl) throw new Error('Gagal mendapatkan public URL. Pastikan bucket "portfolio" bersifat public.');

  return data.publicUrl;
};

// ─── Crop Modal ───────────────────────────────────────────────────────────────
function CropModal({ src, onConfirm, onCancel, uploading, initialRatio }) {
  const cropperRef = useRef(null);
  const [mode, setMode] = useState(() => (initialRatio ? 'custom' : 'portrait'));
  const [customRatio, setCustomRatio] = useState(() => initialRatio ?? '3:4');

  const parseRatio = (text) => {
    const parts = text.split(':').map((s) => Number(s.trim()));
    if (parts.length !== 2 || parts.some((n) => Number.isNaN(n) || n <= 0)) return null;
    return parts[0] / parts[1];
  };

  const getAspectRatio = () => {
    if (mode === 'free') return undefined;
    if (mode === 'portrait') return 3 / 4;
    if (mode === 'landscape') return 4 / 3;
    if (mode === 'square') return 1;
    if (mode === 'custom') {
      const r = parseRatio(customRatio);
      return r ?? 1;
    }
    return 3 / 4;
  };

  const aspectRatio = getAspectRatio();

  const handleConfirm = () => {
    const canvas = cropperRef.current?.getCanvas({ maxWidth: 1600, maxHeight: 1600 });
    if (!canvas) return;
    canvas.toBlob((blob) => onConfirm(blob), 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-stone-700">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg font-heading">Crop Gambar</h3>
            <button onClick={onCancel} className="text-stone-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'portrait', label: 'Portrait' },
              { id: 'landscape', label: 'Landscape' },
              { id: 'square', label: 'Square' },
              { id: 'free', label: 'Free' },
              { id: 'custom', label: 'Custom' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${mode === option.id
                  ? 'bg-white text-stone-900'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
              >
                {option.label}
              </button>
            ))}

            {mode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  value={customRatio}
                  onChange={(e) => setCustomRatio(e.target.value)}
                  className="w-20 rounded-full border border-stone-700 bg-stone-900 px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="16:9"
                />
                <span className="text-stone-400 text-xs">(w:h)</span>
              </div>
            )}
          </div>
        </div>

        {/* Cropper */}
        <div className="relative bg-black" style={{ height: 400 }}>
          <Cropper
            ref={cropperRef}
            src={src}
            stencilProps={aspectRatio === undefined ? {} : { aspectRatio }}
            className="w-full h-full"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-stone-700 gap-4">
          <p className="text-stone-400 text-xs">Drag untuk menggeser • Scroll untuk zoom</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-full bg-stone-700 text-white text-sm font-semibold hover:bg-stone-600 transition"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={uploading}
              className="px-6 py-2 rounded-full bg-white text-stone-900 text-sm font-bold hover:bg-stone-100 transition disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-stone-400 border-t-stone-900 rounded-full animate-spin" /> Mengupload…</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Terapkan</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────
function ImageUploadZone({ onFileSelect, onUrlChange, uploading }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  };

  const handleAddUrl = () => {
    if (manualUrl) {
      onUrlChange(manualUrl);
      setManualUrl('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver
          ? 'border-stone-500 bg-stone-100'
          : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
          }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
            <p className="text-sm text-stone-500">Mengupload…</p>
          </div>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-600">Drag & drop atau klik untuk pilih</p>
            <p className="text-xs text-stone-400 mt-1">JPG, PNG, WEBP (maks. 1 GB)</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="mt-3 inline-flex items-center justify-center px-3 py-2 rounded-full bg-white text-stone-900 text-xs font-semibold shadow-sm hover:bg-stone-100 transition"
            >
              Browse file dari perangkat
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = '';
        }}
      />

      {/* URL manual */}
      <div className="flex gap-2">
        <input
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          className="flex-1 rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-300"
          placeholder="atau tempel URL gambar (https://…)"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-bold shadow-sm"
        >
          Tambah
        </button>
      </div>
    </div>
  );
}

// ─── Video Upload Zone ────────────────────────────────────────────────────────
function VideoUploadZone({ videoUrl, onFileSelect, onUrlChange, uploading }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) onFileSelect(file);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {videoUrl && (
        <div className="rounded-2xl overflow-hidden border border-stone-200 bg-black">
          <video
            src={videoUrl}
            controls
            className="w-full max-h-48 object-contain"
          />
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-5 cursor-pointer transition-all ${dragOver ? 'border-stone-500 bg-stone-100' : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? (
          <><div className="w-4 h-4 border-2 border-stone-400 border-t-stone-700 rounded-full animate-spin" /> Mengupload video…</>
        ) : (
          <><Film className="w-5 h-5" /> {videoUrl ? 'Ganti Video' : 'Pilih file video dari perangkat'}</>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = '';
        }}
      />

      <input
        value={videoUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-300"
        placeholder="atau tempel URL video (https://…)"
      />
    </div>
  );
}

// ─── Portfolio Card ───────────────────────────────────────────────────────────
function PortfolioCard({ item, onEdit, onDelete }) {
  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  return (
    <div className="group relative bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div className="relative bg-stone-100 overflow-hidden" style={{ aspectRatio }}>
        {item.type === 'video' && item.video_url ? (
          <video
            src={item.video_url}
            poster={item.image_url || undefined}
            className="w-full h-full object-contain"
            muted
            loop
            playsInline
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              if (video.videoWidth && video.videoHeight) {
                setAspectRatio(video.videoWidth / video.videoHeight);
              }
            }}
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
          />
        ) : item.image_url ? (
          <img
            src={item.image_url.startsWith('[') ? (JSON.parse(item.image_url)[0] || '') : item.image_url}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setAspectRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.type === 'video'
              ? <Film className="w-10 h-10 text-stone-300" />
              : <ImageIcon className="w-10 h-10 text-stone-300" />}
          </div>
        )}

        {/* Type badge */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.type === 'video' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'
          }`}>
          {item.type}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-bold text-stone-900 truncate font-heading">{item.title}</p>
        <p className="text-xs text-stone-400 uppercase tracking-wider mt-0.5">{item.category}</p>
        {item.description && (
          <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-stone-100">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
        <div className="w-px bg-stone-100" />
        <button
          onClick={() => onDelete(item.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CrudPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('foto');
  const [saving, setSaving] = useState(false);

  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Crop states
  const [cropSrc, setCropSrc] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [initialCropRatio, setInitialCropRatio] = useState(null);

  // Settings state
  const [siteSettings, setSiteSettings] = useState({
    hero_badge: '', hero_title: '', hero_desc: '', hero_image: '',
    hero_counter_number: '', hero_counter_label: '',
    why_title: '', why_desc: '',
    why_items: [{ title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }],
    portfolio_title: '', portfolio_desc: '',
    testi_badge: '', testi_title: '',
    about_badge: '', about_title: '',
    services: [{ title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }],
    contact_title: '', contact_desc: '',
    footer_brand: '', footer_copyright: '',
    social_wa: '', social_ig: '', social_tiktok: '',
    categories_foto: ['Wedding', 'Portrait', 'Nature', 'Commercial', 'Event', 'Other'],
    categories_video: ['Highlight', 'Corporate', 'Art', 'Documentary', 'Other'],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [newCatFoto, setNewCatFoto] = useState('');
  const [newCatVideo, setNewCatVideo] = useState('');

  // ── Fetch ──
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseEnabled) {
        toast.error('Supabase belum dikonfigurasi. Isi file .env terlebih dahulu.');
        setItems([]);
        return;
      }
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('type', filterType)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data ?? []);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  const fetchSiteSettings = useCallback(async () => {
    try {
      if (!isSupabaseEnabled) return;
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (!error && data) {
        const parseJSON = (val, fallback) => {
          if (!val) return fallback;
          if (typeof val === 'object') return val;
          try { return JSON.parse(val); } catch { return fallback; }
        };
        setSiteSettings({
          hero_badge: data.hero_badge || '',
          hero_title: data.hero_title || '',
          hero_desc: data.hero_desc || '',
          hero_image: data.hero_image || '',
          hero_counter_number: data.hero_counter_number || '',
          hero_counter_label: data.hero_counter_label || '',
          why_title: data.why_title || '',
          why_desc: data.why_desc || '',
          why_items: parseJSON(data.why_items, [{ title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }]),
          portfolio_title: data.portfolio_title || '',
          portfolio_desc: data.portfolio_desc || '',
          testi_badge: data.testi_badge || '',
          testi_title: data.testi_title || '',
          about_badge: data.about_badge || '',
          about_title: data.about_title || '',
          services: parseJSON(data.services, [{ title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }]),
          contact_title: data.contact_title || '',
          contact_desc: data.contact_desc || '',
          footer_brand: data.footer_brand || '',
          footer_copyright: data.footer_copyright || '',
          social_wa: data.social_wa || '',
          social_ig: data.social_ig || '',
          social_tiktok: data.social_tiktok || '',
          categories_foto: parseJSON(data.categories_foto, ['Wedding', 'Portrait', 'Nature', 'Commercial', 'Event', 'Other']),
          categories_video: parseJSON(data.categories_video, ['Highlight', 'Corporate', 'Art', 'Documentary', 'Other']),
        });
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    if (filterType === 'pengaturan') fetchSiteSettings();
    else fetchItems();
  }, [filterType, fetchItems, fetchSiteSettings]);

  const handleSaveSettings = async () => {
    if (!isSupabaseEnabled) { toast.error('Supabase belum dikonfigurasi.'); return; }
    setSavingSettings(true);
    try {
      const payload = {
        ...siteSettings,
        why_items: JSON.stringify(siteSettings.why_items),
        services: JSON.stringify(siteSettings.services),
        categories_foto: JSON.stringify(siteSettings.categories_foto),
        categories_video: JSON.stringify(siteSettings.categories_video),
      };
      const { error } = await supabase.from('site_settings').upsert({ id: 1, ...payload });
      if (error) throw error;
      toast.success('Pengaturan berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan. Pastikan SQL sudah dijalankan di Supabase.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Form Logic ──
  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const setFormField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Judul tidak boleh kosong.'); return; }
    if (!isSupabaseEnabled) { toast.error('Supabase belum dikonfigurasi.'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        image_url: JSON.stringify(form.images),
        video_url: form.video_url,
        type: form.type,
      };

      if (editingId) {
        const { data, error } = await supabase.from('portfolio_items').update(payload).eq('id', editingId);
        console.log('SUPABASE UPDATE', { data, error });
        if (error) throw error;
        toast.success('Item berhasil diperbarui!');
      } else {
        const { data, error } = await supabase.from('portfolio_items').insert(payload);
        console.log('SUPABASE INSERT', { data, error });
        if (error) throw error;
        toast.success('Item berhasil ditambahkan!');
      }
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus item ini?')) return;
    try {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
      if (error) throw error;
      toast.success('Item dihapus.');
      if (editingId === id) resetForm();
      fetchItems();
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  };

  const startEdit = (item) => {
    let parsedImages = [];
    if (item.image_url) {
      if (item.image_url.startsWith('[')) {
        try { parsedImages = JSON.parse(item.image_url); } catch (e) { parsedImages = [item.image_url]; }
      } else {
        parsedImages = [item.image_url];
      }
    }
    setEditingId(item.id);
    setForm({
      title: item.title ?? '',
      category: item.category ?? '',
      description: item.description ?? '',
      images: parsedImages,
      video_url: item.video_url ?? '',
      type: item.type ?? 'foto',
    });
    // Scroll to form
    document.getElementById('crud-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Image file selected → open crop ──
  const handleImageFileSelect = (file) => {
    if (!isSupabaseEnabled) { toast.error('Supabase belum dikonfigurasi.'); return; }

    // Batasi ukuran file gambar (rekomendasi maks 20MB agar browser tidak hang)
    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      toast.error('File terlalu besar (maks 20 MB). Kompres foto Anda terlebih dahulu.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result);
      setPendingFile(file);

      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth && img.naturalHeight
          ? `${img.naturalWidth}:${img.naturalHeight}`
          : null;
        setInitialCropRatio(ratio);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ── Crop confirmed → upload ──
  const handleCropConfirm = async (blob) => {
    if (!blob) { setCropSrc(null); setPendingFile(null); return; }
    if (!isSupabaseEnabled) {
      toast.error('Supabase belum dikonfigurasi.');
      setCropSrc(null);
      setPendingFile(null);
      return;
    }
    setUploadingImage(true);
    try {
      const croppedFile = new File([blob], pendingFile?.name ?? 'image.jpg', { type: 'image/jpeg' });
      const publicUrl = await uploadFileToStorage(croppedFile, 'images');
      setFormField('images', [...form.images, publicUrl]);
      toast.success('Gambar berhasil diupload!');
    } catch (err) {
      toast.error(formatSupabaseError(err));
    } finally {
      setUploadingImage(false);
      setCropSrc(null);
      setPendingFile(null);
    }
  };

  // ── Video upload ──
  const generateVideoThumbnail = async (file, seekTo = 1) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    await new Promise((resolve, reject) => {
      const onLoadedMetadata = () => resolve(null);
      const onError = (e) => reject(e);
      video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      video.addEventListener('error', onError, { once: true });
    });

    const duration = video.duration || 0;
    video.currentTime = Math.min(seekTo, Math.max(0, duration - 0.1));

    await new Promise((resolve, reject) => {
      const onSeeked = () => resolve(null);
      const onError = (e) => reject(e);
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tidak bisa membuat konteks canvas untuk thumbnail');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    URL.revokeObjectURL(url);
    if (!blob) throw new Error('Gagal membuat thumbnail video');
    return blob;
  };

  const handleVideoFileSelect = async (file) => {
    console.log('VIDEO SELECT:', { name: file.name, size: file.size, type: file.type });
    if (!isSupabaseEnabled) { toast.error('Supabase belum dikonfigurasi.'); return; }

    // Batasi ukuran file agar tidak melebihi batas server / browser.
    const maxSize = 2 * 1024 * 1024 * 1024; // 2 GB
    if (file.size > maxSize) {
      toast.error('File terlalu besar (maks 2 GB).');
      return;
    }

    setUploadingVideo(true);
    try {
      const publicUrl = await uploadFileToStorage(file, 'videos');
      console.log('VIDEO UPLOAD URL:', publicUrl);
      setFormField('video_url', publicUrl);

      // Buat thumbnail otomatis dari video (cover)
      try {
        const thumbBlob = await generateVideoThumbnail(file);
        const thumbUrl = await uploadFileToStorage(thumbBlob, 'images');
        setFormField('images', [thumbUrl]);
      } catch (thumbErr) {
        console.warn('Gagal buat thumbnail video:', thumbErr);
      }

      toast.success('Video berhasil diupload!');
    } catch (err) {
      console.error('VIDEO UPLOAD ERROR:', err);
      toast.error(formatSupabaseError(err));
    } finally {
      setUploadingVideo(false);
    }
  };

  const categories = form.type === 'video' ? CATEGORIES_VIDEO : CATEGORIES_FOTO;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 antialiased">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-3 md:py-0 md:h-16 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
              <div className="w-px h-5 bg-stone-200" />
              <h1 className="font-bold text-stone-900 font-heading text-sm sm:text-base">Portfolio Manager</h1>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-full overflow-x-auto max-w-full hide-scrollbar">
            {['foto', 'video', 'pengaturan'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterType === t ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                {t === 'foto' ? '📷 Foto' : t === 'video' ? '🎬 Video' : '⚙️ Pengaturan'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 md:px-6 py-4 sm:py-8">
        {filterType === 'pengaturan' ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm overflow-hidden mt-2 sm:mt-8">
            <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-stone-100">
              <h2 className="font-bold text-xl sm:text-2xl font-heading">⚙️ Pengaturan Landing Page</h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">Ubah teks dan gambar pada layar utama Landing Page.</p>
            </div>
            <div className="p-5 sm:p-8 space-y-8">

              {/* 🖼️ Hero */}
              <div className="space-y-4">
                <h3 className="font-bold text-base border-b pb-2">🖼️ Hero Section</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-xs">Lencana (Badge)</label>
                    <input value={siteSettings.hero_badge} onChange={(e) => setSiteSettings({ ...siteSettings, hero_badge: e.target.value })} className="input-base mt-1" placeholder="Photography & Videography" />
                  </div>
                  <div>
                    <label className="label-xs">Angka Counter</label>
                    <input value={siteSettings.hero_counter_number} onChange={(e) => setSiteSettings({ ...siteSettings, hero_counter_number: e.target.value })} className="input-base mt-1" placeholder="500+" />
                  </div>
                  <div className="col-span-2">
                    <label className="label-xs">Label Counter</label>
                    <input value={siteSettings.hero_counter_label} onChange={(e) => setSiteSettings({ ...siteSettings, hero_counter_label: e.target.value })} className="input-base mt-1" placeholder="Happy Clients" />
                  </div>
                </div>
                <div>
                  <label className="label-xs">Judul Hero (HTML diperbolehkan)</label>
                  <textarea value={siteSettings.hero_title} onChange={(e) => setSiteSettings({ ...siteSettings, hero_title: e.target.value })} className="input-base mt-1 resize-none" rows={3} placeholder='Capture <br/> <span class="text-stone-300">The Real</span> <br/> Moments.' />
                </div>
                <div>
                  <label className="label-xs">Deskripsi Hero</label>
                  <textarea value={siteSettings.hero_desc} onChange={(e) => setSiteSettings({ ...siteSettings, hero_desc: e.target.value })} className="input-base mt-1 resize-none" rows={3} />
                </div>
                <div>
                  <label className="label-xs">Gambar Hero</label>
                  <div className="mt-1">
                    <ImageUploadZone
                      onFileSelect={async (file) => {
                        setSavingSettings(true);
                        try {
                          const publicUrl = await uploadFileToStorage(file, 'images');
                          setSiteSettings({ ...siteSettings, hero_image: publicUrl });
                        } catch (e) { toast.error('Gagal upload'); } finally { setSavingSettings(false); }
                      }}
                      onUrlChange={(v) => setSiteSettings({ ...siteSettings, hero_image: v })}
                      uploading={savingSettings}
                    />
                    {siteSettings.hero_image && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-stone-200">
                        <img src={siteSettings.hero_image} className="w-full h-auto max-h-48 object-cover" />
                        <button onClick={() => setSiteSettings({ ...siteSettings, hero_image: '' })} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ✨ Why Section */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-base border-b pb-2">✨ Mengapa Pilih Kami</h3>
                <div>
                  <label className="label-xs">Judul Section</label>
                  <input value={siteSettings.why_title} onChange={(e) => setSiteSettings({ ...siteSettings, why_title: e.target.value })} className="input-base mt-1" />
                </div>
                <div>
                  <label className="label-xs">Deskripsi Section</label>
                  <textarea value={siteSettings.why_desc} onChange={(e) => setSiteSettings({ ...siteSettings, why_desc: e.target.value })} className="input-base mt-1 resize-none" rows={2} />
                </div>
                {(siteSettings.why_items || []).map((item, i) => (
                  <div key={i} className="bg-stone-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase">Fitur #{i + 1}</p>
                    <input value={item.title} onChange={(e) => { const n = [...siteSettings.why_items]; n[i] = { ...n[i], title: e.target.value }; setSiteSettings({ ...siteSettings, why_items: n }); }} className="input-base" placeholder="Judul fitur" />
                    <textarea value={item.desc} onChange={(e) => { const n = [...siteSettings.why_items]; n[i] = { ...n[i], desc: e.target.value }; setSiteSettings({ ...siteSettings, why_items: n }); }} className="input-base resize-none" rows={2} placeholder="Deskripsi fitur" />
                  </div>
                ))}
              </div>

              {/* 🗂️ Portfolio */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-base border-b pb-2">🗂️ Portfolio Section</h3>
                <div>
                  <label className="label-xs">Judul Portfolio ("Selected Works")</label>
                  <input value={siteSettings.portfolio_title} onChange={(e) => setSiteSettings({ ...siteSettings, portfolio_title: e.target.value })} className="input-base mt-1" />
                </div>
                <div>
                  <label className="label-xs">Sub-Judul</label>
                  <input value={siteSettings.portfolio_desc} onChange={(e) => setSiteSettings({ ...siteSettings, portfolio_desc: e.target.value })} className="input-base mt-1" />
                </div>
              </div>

              {/* 💬 Testimoni */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-base border-b pb-2">💬 Testimoni Section</h3>
                <div>
                  <label className="label-xs">Lencana (Badge)</label>
                  <input value={siteSettings.testi_badge} onChange={(e) => setSiteSettings({ ...siteSettings, testi_badge: e.target.value })} className="input-base mt-1" placeholder="Testimoni Klien" />
                </div>
                <div>
                  <label className="label-xs">Judul Testimoni</label>
                  <input value={siteSettings.testi_title} onChange={(e) => setSiteSettings({ ...siteSettings, testi_title: e.target.value })} className="input-base mt-1" />
                </div>
              </div>

              {/* 🛠️ Layanan */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-base">🛠️ Layanan Services</h3>
                  <button onClick={() => setSiteSettings({ ...siteSettings, services: [...siteSettings.services, { title: '', desc: '' }] })} className="text-xs text-stone-500 hover:text-stone-900 font-bold border border-stone-200 px-3 py-1 rounded-full">+ Tambah</button>
                </div>
                <div>
                  <label className="label-xs">Teks Lencana / Judul Section</label>
                  <input value={siteSettings.about_badge} onChange={(e) => setSiteSettings({ ...siteSettings, about_badge: e.target.value })} className="input-base mt-1" placeholder="What We Do" />
                </div>
                <div>
                  <label className="label-xs">Kalimat Pembuka</label>
                  <textarea value={siteSettings.about_title} onChange={(e) => setSiteSettings({ ...siteSettings, about_title: e.target.value })} className="input-base mt-1 resize-none" rows={2} />
                </div>
                {(siteSettings.services || []).map((srv, i) => (
                  <div key={i} className="bg-stone-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-stone-400 uppercase">Layanan #{i + 1}</p>
                      {siteSettings.services.length > 1 && <button onClick={() => { const n = siteSettings.services.filter((_, idx) => idx !== i); setSiteSettings({ ...siteSettings, services: n }); }} className="text-rose-400 hover:text-rose-600 text-xs">Hapus</button>}
                    </div>
                    <input value={srv.title} onChange={(e) => { const n = [...siteSettings.services]; n[i] = { ...n[i], title: e.target.value }; setSiteSettings({ ...siteSettings, services: n }); }} className="input-base" placeholder="Nama layanan" />
                    <textarea value={srv.desc} onChange={(e) => { const n = [...siteSettings.services]; n[i] = { ...n[i], desc: e.target.value }; setSiteSettings({ ...siteSettings, services: n }); }} className="input-base resize-none" rows={2} placeholder="Deskripsi layanan" />
                  </div>
                ))}
              </div>

              {/* 📬 Kontak & Sosial */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-base border-b pb-2">📬 Kontak & Sosial Media</h3>
                <div>
                  <label className="label-xs">Judul Kontak</label>
                  <input value={siteSettings.contact_title} onChange={(e) => setSiteSettings({ ...siteSettings, contact_title: e.target.value })} className="input-base mt-1" />
                </div>
                <div>
                  <label className="label-xs">Deskripsi Kontak</label>
                  <textarea value={siteSettings.contact_desc} onChange={(e) => setSiteSettings({ ...siteSettings, contact_desc: e.target.value })} className="input-base mt-1 resize-none" rows={2} />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div><label className="label-xs">Link WhatsApp</label><input value={siteSettings.social_wa} onChange={(e) => setSiteSettings({ ...siteSettings, social_wa: e.target.value })} className="input-base mt-1" placeholder="https://wa.me/..." /></div>
                  <div><label className="label-xs">Link Instagram</label><input value={siteSettings.social_ig} onChange={(e) => setSiteSettings({ ...siteSettings, social_ig: e.target.value })} className="input-base mt-1" /></div>
                  <div><label className="label-xs">Link TikTok</label><input value={siteSettings.social_tiktok} onChange={(e) => setSiteSettings({ ...siteSettings, social_tiktok: e.target.value })} className="input-base mt-1" /></div>
                </div>
              </div>

              {/* 🏠 Footer */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-base border-b pb-2">🏠 Footer</h3>
                <div>
                  <label className="label-xs">Nama Brand</label>
                  <input value={siteSettings.footer_brand} onChange={(e) => setSiteSettings({ ...siteSettings, footer_brand: e.target.value })} className="input-base mt-1" placeholder="PODONPICTURES" />
                </div>
                <div>
                  <label className="label-xs">Teks Copyright</label>
                  <input value={siteSettings.footer_copyright} onChange={(e) => setSiteSettings({ ...siteSettings, footer_copyright: e.target.value })} className="input-base mt-1" placeholder="© 2025 All Rights Reserved." />
                </div>
              </div>

              {/* 🏷️ Manajemen Kategori */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-base border-b pb-2">🏷️ Kategori Portfolio</h3>
                <p className="text-xs text-stone-400">Kategori ini muncul sebagai pilihan saat menambah/edit karya.</p>

                {/* Foto categories */}
                <div>
                  <label className="label-xs mb-2 block">Kategori Foto</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(siteSettings.categories_foto || []).map((cat, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-xs font-semibold text-stone-700">
                        {cat}
                        <button
                          type="button"
                          onClick={() => setSiteSettings({ ...siteSettings, categories_foto: siteSettings.categories_foto.filter((_, idx) => idx !== i) })}
                          className="text-stone-400 hover:text-rose-500 ml-0.5"
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newCatFoto}
                      onChange={(e) => setNewCatFoto(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && newCatFoto.trim()) { setSiteSettings({ ...siteSettings, categories_foto: [...(siteSettings.categories_foto || []), newCatFoto.trim()] }); setNewCatFoto(''); } }}
                      className="input-base flex-1 text-sm"
                      placeholder="Tambah kategori foto..."
                    />
                    <button
                      type="button"
                      onClick={() => { if (newCatFoto.trim()) { setSiteSettings({ ...siteSettings, categories_foto: [...(siteSettings.categories_foto || []), newCatFoto.trim()] }); setNewCatFoto(''); } }}
                      className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-black"
                    >+ Add</button>
                  </div>
                </div>

                {/* Video categories */}
                <div>
                  <label className="label-xs mb-2 block">Kategori Video</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(siteSettings.categories_video || []).map((cat, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-xs font-semibold text-stone-700">
                        {cat}
                        <button
                          type="button"
                          onClick={() => setSiteSettings({ ...siteSettings, categories_video: siteSettings.categories_video.filter((_, idx) => idx !== i) })}
                          className="text-stone-400 hover:text-rose-500 ml-0.5"
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newCatVideo}
                      onChange={(e) => setNewCatVideo(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && newCatVideo.trim()) { setSiteSettings({ ...siteSettings, categories_video: [...(siteSettings.categories_video || []), newCatVideo.trim()] }); setNewCatVideo(''); } }}
                      className="input-base flex-1 text-sm"
                      placeholder="Tambah kategori video..."
                    />
                    <button
                      type="button"
                      onClick={() => { if (newCatVideo.trim()) { setSiteSettings({ ...siteSettings, categories_video: [...(siteSettings.categories_video || []), newCatVideo.trim()] }); setNewCatVideo(''); } }}
                      className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-black"
                    >+ Add</button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-4 font-bold rounded-xl bg-stone-900 text-white hover:bg-black transition-all sticky bottom-4 shadow-lg shadow-stone-900/20"
              >
                {savingSettings ? 'Menyimpan...' : '💾 Simpan Semua Pengaturan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">

            {/* ── Left: Form ── */}
            <aside id="crud-form" className="space-y-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Form Header */}
                <div className={`px-6 pt-6 pb-4 border-b border-stone-100 flex items-center justify-between ${editingId ? 'bg-amber-50' : ''}`}>
                  <div>
                    <h2 className="font-bold text-lg font-heading">
                      {editingId ? '✏️ Edit Item' : '➕ Tambah Item'}
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {editingId ? `Mengedit ID #${editingId}` : 'Upload foto atau video portfolio baru'}
                    </p>
                  </div>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-stone-400 hover:text-stone-700 transition-colors"
                      title="Batalkan edit"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  {/* Tipe */}
                  <div>
                    <label className="label-xs">Tipe Konten</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        { val: 'foto', icon: '📷', label: 'Foto' },
                        { val: 'video', icon: '🎬', label: 'Video' },
                      ].map(({ val, icon, label }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormField('type', val)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${form.type === val
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                            }`}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Judul */}
                  <div>
                    <label className="label-xs">Judul <span className="text-rose-400">*</span></label>
                    <input
                      value={form.title}
                      onChange={(e) => setFormField('title', e.target.value)}
                      className="input-base mt-2"
                      placeholder="Contoh: Wedding Session"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="label-xs">Kategori</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(form.type === 'video' ? siteSettings.categories_video : siteSettings.categories_foto).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormField('category', cat)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.category === cat
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'border-stone-200 text-stone-500 hover:border-stone-400'
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                      {/* Custom input */}
                      <input
                        value={(form.type === 'video' ? siteSettings.categories_video : siteSettings.categories_foto).includes(form.category) ? '' : form.category}
                        onChange={(e) => setFormField('category', e.target.value)}
                        className="px-3 py-1 rounded-full text-xs border border-dashed border-stone-300 focus:outline-none focus:border-stone-500 w-28 placeholder:text-stone-300"
                        placeholder="Kustom…"
                      />
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="label-xs">Deskripsi</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setFormField('description', e.target.value)}
                      className="input-base mt-2 resize-none"
                      rows={3}
                      placeholder="Deskripsi singkat mengenai karya…"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="label-xs">
                      {form.type === 'video' ? 'Thumbnail (Cover)' : 'Foto (Maks 5 slide)'}
                    </label>
                    <div className="mt-2 space-y-3">
                      {form.images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                          <img src={imgUrl} alt={`Slide ${idx + 1}`} className="w-full max-h-56 object-contain" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button type="button" onClick={() => {
                              const newImages = [...form.images];
                              newImages.splice(idx, 1);
                              setFormField('images', newImages);
                            }} className="p-2 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {form.images.length < 5 && (
                        <ImageUploadZone
                          onFileSelect={handleImageFileSelect}
                          onUrlChange={(v) => setFormField('images', [...form.images, v])}
                          uploading={uploadingImage}
                        />
                      )}
                    </div>
                  </div>

                  {/* Video Upload (only for video type) */}
                  {form.type === 'video' && (
                    <div>
                      <label className="label-xs">File Video</label>
                      <div className="mt-2">
                        <VideoUploadZone
                          videoUrl={form.video_url}
                          onFileSelect={handleVideoFileSelect}
                          onUrlChange={(v) => setFormField('video_url', v)}
                          uploading={uploadingVideo}
                        />
                        {form.video_url && (
                          <button
                            type="button"
                            onClick={() => setFormField('video_url', '')}
                            className="mt-2 text-xs text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            × Hapus video
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || uploadingImage || uploadingVideo}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 text-white font-bold text-sm hover:bg-black transition-all disabled:opacity-50 font-heading"
                    >
                      {saving ? (
                        <><div className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin" /> Menyimpan…</>
                      ) : (
                        <>{editingId ? '✓ Update' : '+ Simpan'}</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-5 py-3 rounded-2xl bg-stone-100 text-stone-600 font-semibold text-sm hover:bg-stone-200 transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

            </aside>

            {/* ── Right: Card Grid ── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold font-heading">
                    {filterType === 'foto' ? '📷 Foto Portfolio' : '🎬 Video Portfolio'}
                  </h2>
                  <p className="text-sm text-stone-400 mt-0.5">
                    {loading ? 'Memuat…' : `${items.length} item`}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-200/50 to-transparent" />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-stone-100 rounded-full w-3/4" />
                        <div className="h-3 bg-stone-100 rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  {filterType === 'video'
                    ? <Film className="w-14 h-14 text-stone-200 mb-4" />
                    : <ImageIcon className="w-14 h-14 text-stone-200 mb-4" />}
                  <p className="text-stone-500 font-semibold">Belum ada {filterType === 'foto' ? 'foto' : 'video'}</p>
                  <p className="text-stone-400 text-sm mt-1">Tambahkan item pertama lewat form di samping.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <PortfolioCard
                      key={`${item.id}-${item.video_url || item.image_url || 'no-media'}`}
                      item={item}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ── Crop Modal ── */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          uploading={uploadingImage}
          initialRatio={initialCropRatio}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); setPendingFile(null); setInitialCropRatio(null); }}
        />
      )}
    </div>
  );
}
