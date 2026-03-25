import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, ArrowUpRight, MessageCircle, Instagram, Play, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Helmet } from 'react-helmet-async';

const parseImages = (urlStr) => {
  if (!urlStr) return [];
  if (urlStr.startsWith('[')) {
    try { return JSON.parse(urlStr); } catch (e) { return [urlStr]; }
  }
  return [urlStr];
};

// ==========================================
// KONFIGURASI UMUM & DATA
// ==========================================
const BRAND_NAME = 'PODONPICTURES';
// TODO: Ganti dengan nomor WhatsApp asli kamu (contoh: 6281234567890)
const WA_LINK = 'https://wa.me/6282152969826';
const IG_LINK = 'https://www.instagram.com/podon.pictures/';
const TIKTOK_LINK = 'https://www.tiktok.com/@podon.pictures';

// Menggunakan data lokal (mock) untuk menggantikan Supabase
// agar dapat berjalan lancar di lingkungan pratinjau (preview).
const portfolioDataMock = {
  foto: [
    {
      id: 1,
      title: 'Wedding Session',
      category: 'Wedding',
      description: 'Momen sakral pernikahan dengan sentuhan emosional yang mendalam. Kami fokus menangkap interaksi natural dan kebahagiaan sejati.',
      image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 2,
      title: 'Portrait Studio',
      category: 'Portrait',
      description: 'Sesi potret studio dengan pencahayaan profesional untuk kebutuhan personal branding atau profil perusahaan.',
      image_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 3,
      title: 'Nature Landscape',
      category: 'Nature',
      description: 'Keindahan alam yang ditangkap dengan detail tajam dan komposisi dinamis, cocok untuk dekorasi atau editorial.',
      image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 4,
      title: 'Product Shoot',
      category: 'Commercial',
      description: 'Fotografi produk berkualitas tinggi yang menonjolkan fitur dan nilai jual produk Anda untuk meningkatkan konversi penjualan.',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 5,
      title: 'Engagement Day',
      category: 'Wedding',
      description: 'Cerita awal dari perjalanan cinta Anda, diabadikan dalam suasana yang lebih santai namun tetap penuh makna.',
      image_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 6,
      title: 'Event Coverage',
      category: 'Event',
      description: 'Dokumentasi acara menyeluruh, memastikan setiap momen penting dan tamu undangan terekam dengan baik.',
      image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    },
  ],
  video: [
    {
      id: 7,
      title: 'Cinematic Wedding',
      category: 'Highlight',
      description: 'Video highlight pernikahan dengan editing sinematik dan pemilihan musik yang menyentuh hati.',
      image_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800',
      video_url: 'https://videos.pexels.com/video-files/5532766/5532766-sd_640_360_25fps.mp4',
    },
    {
      id: 8,
      title: 'Company Profile',
      category: 'Corporate',
      description: 'Video profil perusahaan yang profesional untuk membangun kredibilitas dan kepercayaan klien.',
      image_url: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=800',
      video_url: 'https://videos.pexels.com/video-files/855564/855564-sd_640_360_25fps.mp4',
    },
    {
      id: 9,
      title: 'Music Video',
      category: 'Art',
      description: 'Visualisasi musik yang kreatif dengan konsep artistik yang sesuai dengan nuansa lagu.',
      image_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800',
      video_url: 'https://videos.pexels.com/video-files/3195641/3195641-sd_640_360_25fps.mp4',
    },
  ],
};

const testimoniMockData = [
  {
    id: 1,
    quote: 'PodonPictures berhasil menangkap momen pernikahan kami dengan cara yang begitu natural. Hasilnya membuat kami selalu ingin melihatnya ulang.',
    name: 'Alya & Bima',
    role: 'Pengantin',
  },
  {
    id: 2,
    quote: 'Timnya profesional, cepat tanggap, dan hasil videonya sangat cinematic. Pelanggan kami pun memuji kualitasnya.',
    name: 'Dewi Harsono',
    role: 'Owner Brand Fashion',
  },
  {
    id: 3,
    quote: 'Foto produknya membuat toko online kami terlihat premium. Delivery cepat dan komunikasinya jelas.',
    name: 'Rian Santoso',
    role: 'E-commerce Manager',
  },
];

// ==========================================
// KOMPONEN ANIMASI KUSTOM (framer-motion)
// ==========================================
const RevealWrapper = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.8, delay: delay / 1000, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// HALAMAN LANDING
// ==========================================
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [activeTab, setActiveTab] = useState('foto');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tiktokOpen, setTiktokOpen] = useState(false);

  const [testimonials, setTestimonials] = useState([]);
  const [loadingTesti, setLoadingTesti] = useState(true);
  const [showTestiForm, setShowTestiForm] = useState(false);
  const [testiForm, setTestiForm] = useState({ name: '', role: '', quote: '' });
  const [submittingTesti, setSubmittingTesti] = useState(false);

  const [siteSettings, setSiteSettings] = useState({
    hero_badge: 'Photography & Videography',
    hero_title: 'Capture <br /> <span class="text-stone-300">The Real</span> <br /> Moments.',
    hero_desc: 'Pendekatan visual yang jujur, estetik, dan tak lekang oleh waktu. Kami merekam cerita Anda apa adanya, namun dengan cara terindah.',
    hero_image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1600',
    hero_counter_number: '500+',
    hero_counter_label: 'Happy Clients',
    why_title: 'Mengapa Pilih PodonPictures?',
    why_desc: 'Kami menggabungkan storytelling, teknik sinematik, dan pendekatan personal untuk membuat setiap momen Anda terasa tak terlupakan.',
    why_items: [
      { title: 'Pendekatan Personal', desc: 'Sesi yang disesuaikan dengan karakter dan tujuan Anda, bukan sekadar checklist foto.' },
      { title: 'Hasil Cepat & Berkualitas', desc: 'Proses editing terstruktur dengan hasil yang siap pakai dalam waktu optimal.' },
      { title: 'Tim Profesional', desc: 'Tim berpengalaman dengan peralatan premium untuk hasil yang tajam dan estetik.' },
    ],
    portfolio_title: 'Selected Works',
    portfolio_desc: 'Kurasi karya terbaik yang merepresentasikan visi artistik kami.',
    testi_badge: 'Testimoni Klien',
    testi_title: 'Mereka memilih kami karena hasil yang nyata.',
    about_badge: 'What We Do',
    about_title: 'Layanan kami dirancang untuk menangkap esensi momen, bukan sekadar dokumentasi.',
    services: [
      { title: 'Wedding & Engagement', desc: 'Pendekatan editorial untuk hari bahagia Anda. Fokus pada emosi natural dan detail estetis.' },
      { title: 'Commercial Visuals', desc: 'Tingkatkan nilai brand dengan foto produk dan campaign yang clean dan persuasif.' },
      { title: 'Event Coverage', desc: 'Dokumentasi acara korporat atau privat dengan gaya candid yang tidak mengganggu.' },
      { title: 'Creative Session', desc: 'Sesi potret personal atau pre-wedding dengan konsep unik sesuai karakter Anda.' },
    ],
    contact_title: 'Let\'s create something timeless.',
    contact_desc: 'Punya ide project atau rencana pernikahan? Diskusikan dengan kami.',
    footer_brand: 'PODONPICTURES',
    footer_copyright: `© ${new Date().getFullYear()} All Rights Reserved.`,
    social_wa: WA_LINK,
    social_ig: IG_LINK,
    social_tiktok: TIKTOK_LINK,
    categories_foto: [],
    categories_video: []
  });

  // Derived filter categories
  const filteredPortfolio = portfolioData.filter(item => activeCategory === 'Semua' || item.category === activeCategory);

  // Handlers
  const openModal = (item) => {
    setSelectedItem(item);
    setCurrentSlide(0);
  };

  // ── Derived canonical URL
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://podonpictures.com';

  const scrollToSection = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const sectionIds = ['home', 'portfolio', 'services', 'contact'];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -70% 0px',
        threshold: 0.2,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        if (isSupabaseEnabled) {
          const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
          if (!error && data) {
            setSiteSettings(prev => ({
              ...prev,
              hero_badge: data.hero_badge || prev.hero_badge,
              hero_title: data.hero_title || prev.hero_title,
              hero_desc: data.hero_desc || prev.hero_desc,
              hero_image: data.hero_image || prev.hero_image,
              hero_counter_number: data.hero_counter_number || prev.hero_counter_number,
              hero_counter_label: data.hero_counter_label || prev.hero_counter_label,
              why_title: data.why_title || prev.why_title,
              why_desc: data.why_desc || prev.why_desc,
              why_items: data.why_items ? (typeof data.why_items === 'string' ? JSON.parse(data.why_items) : data.why_items) : prev.why_items,
              portfolio_title: data.portfolio_title || prev.portfolio_title,
              portfolio_desc: data.portfolio_desc || prev.portfolio_desc,
              testi_badge: data.testi_badge || prev.testi_badge,
              testi_title: data.testi_title || prev.testi_title,
              about_badge: data.about_badge || prev.about_badge,
              about_title: data.about_title || prev.about_title,
              services: data.services ? (typeof data.services === 'string' ? JSON.parse(data.services) : data.services) : prev.services,
              contact_title: data.contact_title || prev.contact_title,
              contact_desc: data.contact_desc || prev.contact_desc,
              footer_brand: data.footer_brand || prev.footer_brand,
              footer_copyright: data.footer_copyright || prev.footer_copyright,
              social_wa: data.social_wa || prev.social_wa,
              social_ig: data.social_ig || prev.social_ig,
              social_tiktok: data.social_tiktok || prev.social_tiktok,
              categories_foto: data.categories_foto ? (typeof data.categories_foto === 'string' ? JSON.parse(data.categories_foto) : data.categories_foto) : prev.categories_foto,
              categories_video: data.categories_video ? (typeof data.categories_video === 'string' ? JSON.parse(data.categories_video) : data.categories_video) : prev.categories_video,
            }));
          }
        }
      } catch (err) { }
    };
    fetchSiteSettings();

    const fetchPortfolio = async () => {
      setLoading(true);
      try {
        if (isSupabaseEnabled) {
          const { data, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('type', activeTab)
            .order('id', { ascending: true });

          if (error) throw error;
          setPortfolioData(data ?? []);
        } else {
          // Fallback: gunakan mock data
          await new Promise((resolve) => setTimeout(resolve, 600));
          setPortfolioData(portfolioDataMock[activeTab] || []);
        }
      } catch (err) {
        console.error('Gagal memuat data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
    setActiveCategory('Semua'); // Reset filter on tab change
  }, [activeTab]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoadingTesti(true);
      try {
        if (isSupabaseEnabled) {
          const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(6);

          if (error) {
            setTestimonials(testimoniMockData);
          } else {
            setTestimonials(data && data.length > 0 ? data : testimoniMockData);
          }
        } else {
          setTestimonials(testimoniMockData);
        }
      } catch (err) {
        setTestimonials(testimoniMockData);
      } finally {
        setLoadingTesti(false);
      }
    };
    fetchTestimonials();
  }, []);

  const handleTestiSubmit = async (e) => {
    e.preventDefault();
    if (!testiForm.name || !testiForm.quote) {
      alert('Nama dan testimoni wajib diisi');
      return;
    }

    setSubmittingTesti(true);
    try {
      if (isSupabaseEnabled) {
        const { error } = await supabase.from('testimonials').insert([{
          name: testiForm.name,
          role: testiForm.role || 'Klien',
          quote: testiForm.quote
        }]);
        if (error) throw error;

        alert('Terima kasih! Testimoni Anda berhasil dikirim.');
        setShowTestiForm(false);
        setTestiForm({ name: '', role: '', quote: '' });

        const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false }).limit(6);
        if (data) setTestimonials(data);
      } else {
        alert('Fitur ini membutuhkan Supabase dikonfigurasi.');
      }
    } catch (err) {
      alert('Gagal mengirim testimoni. Pastikan tabel "testimonials" sudah dibuat di database Supabase Anda.');
      console.error(err);
    } finally {
      setSubmittingTesti(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{(siteSettings.footer_brand || 'PodonPictures') + ' \u2013 Photography & Videography'}</title>
        <meta name="description" content={siteSettings.hero_desc || 'Pendekatan visual yang jujur, estetik, dan tak lekang oleh waktu.'} />
        <meta property="og:title" content={siteSettings.footer_brand || 'PodonPictures'} />
        <meta property="og:description" content={siteSettings.hero_desc || ''} />
        <meta property="og:image" content={siteSettings.hero_image || ''} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteSettings.footer_brand || 'PodonPictures'} />
        <meta name="twitter:description" content={siteSettings.hero_desc || ''} />
        <meta name="twitter:image" content={siteSettings.hero_image || ''} />
      </Helmet>

      <div className="bg-white text-stone-900 selection:bg-stone-200 antialiased overflow-x-hidden font-sans min-h-screen">
        <nav
          role="navigation"
          aria-label="Primary navigation"
          className={`fixed w-full z-50 transition-all duration-300 ${scrolled || menuOpen ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
            }`}
        >
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6 flex justify-center lg:justify-between items-center relative">
            <div
              className="text-xl md:text-2xl font-extrabold tracking-tighter text-stone-900 z-50 uppercase text-center lg:text-left font-heading"
            >
              PODON<span className="text-stone-400 font-light">PICTURES</span>
            </div>

            <div className="hidden lg:flex items-center space-x-10 text-xs font-semibold tracking-widest uppercase">
              <button
                type="button"
                onClick={() => scrollToSection('home')}
                className={`transition-colors ${activeSection === 'home' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('portfolio')}
                className={`transition-colors ${activeSection === 'portfolio' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                Portfolio
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className={`transition-colors ${activeSection === 'services' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className={`transition-colors ${activeSection === 'contact' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                Contact
              </button>
              <a
                href={siteSettings.social_wa}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 bg-black text-white rounded-full hover:bg-stone-800 transition-all text-xs font-bold hover:scale-105 transform duration-300"
              >
                Get in Touch
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
              className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 text-stone-900 focus:outline-none transition-transform duration-300"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Menu Dropdown */}
            <div
              aria-hidden={!menuOpen}
              className={`absolute top-full left-0 w-full bg-white border-t border-stone-100 shadow-xl py-6 flex flex-col items-center space-y-6 lg:hidden transition-all duration-300 origin-top ${menuOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-0 pointer-events-none'
                }`}
            >
              <button
                type="button"
                onClick={() => scrollToSection('home')}
                className="text-lg font-bold hover:text-stone-500 transition-colors font-heading"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('portfolio')}
                className="text-lg font-bold hover:text-stone-500 transition-colors font-heading"
              >
                Portfolio
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className="text-lg font-bold hover:text-stone-500 transition-colors font-heading"
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="text-lg font-bold hover:text-stone-500 transition-colors font-heading"
              >
                Contact
              </button>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-3 bg-black text-white rounded-full font-bold w-3/4 text-center"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </nav>

        <header id="home" className="relative min-h-[100dvh] flex items-center pt-24 lg:pt-0">
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-24 2xl:gap-32">
              <div className="w-full lg:w-1/2 text-center lg:text-left order-2 lg:order-1 pb-10 lg:pb-0">
                <RevealWrapper>
                  <div className="inline-block px-3 py-1 mb-4 lg:mb-6 border border-stone-200 rounded-full">
                    <span className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">
                      {siteSettings.hero_badge}
                    </span>
                  </div>
                  <h1
                    className="text-4xl sm:text-5xl lg:text-7xl 2xl:text-8xl font-bold mb-4 lg:mb-6 leading-[1.1] lg:leading-[0.9] text-stone-900 tracking-tight"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: siteSettings.hero_title }}
                  />
                  <p className="text-stone-500 text-sm md:text-base 2xl:text-lg mb-8 lg:mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
                    {siteSettings.hero_desc}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto justify-center lg:justify-start">
                    <a
                      href="#portfolio"
                      className="group px-6 md:px-8 py-3 md:py-4 bg-stone-900 text-white font-bold rounded-full hover:bg-black transition-all flex items-center justify-center gap-3 hover:shadow-lg text-sm md:text-base"
                    >
                      Lihat Portfolio <ArrowDownRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                      href={siteSettings.social_wa}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 md:px-8 py-3 md:py-4 border border-stone-200 text-stone-900 font-bold rounded-full hover:bg-stone-50 transition-all text-sm md:text-base"
                    >
                      Konsultasi
                    </a>
                  </div>
                </RevealWrapper>
              </div>

              <div className="w-full lg:w-1/2 order-1 lg:order-2">
                <RevealWrapper delay={200}>
                  <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] 2xl:aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 shadow-2xl shadow-stone-200 mx-auto max-w-lg lg:max-w-none">
                    <img
                      src={siteSettings.hero_image}
                      alt="PodonPictures Hero"
                      loading="lazy"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-out transform hover:scale-105"
                    />
                    <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 bg-white/90 backdrop-blur-sm p-3 md:p-5 rounded-xl shadow-sm hidden sm:block border border-white/50 animate-float-once">
                      <p className="font-bold text-xl md:text-2xl font-heading">
                        {siteSettings.hero_counter_number}
                      </p>
                      <p className="text-[10px] md:text-xs text-stone-500 uppercase tracking-wider">{siteSettings.hero_counter_label}</p>
                    </div>
                  </div>
                </RevealWrapper>
              </div>
            </div>
          </div>
        </header>

        <section className="py-16 lg:py-24 bg-stone-50">
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6">
            <RevealWrapper>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {siteSettings.why_title}
                </h2>
                <p className="text-stone-500 text-sm md:text-base">
                  {siteSettings.why_desc}
                </p>
              </div>
            </RevealWrapper>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(siteSettings.why_items || []).map((item, index) => (
                <RevealWrapper key={index} delay={index * 120}>
                  <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="w-12 h-12 flex items-center justify-center bg-stone-100 rounded-2xl mb-5">
                      {index === 0 ? <MessageCircle className="w-6 h-6" /> : index === 1 ? <ArrowUpRight className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </RevealWrapper>
              ))}
            </div>
          </div>
        </section>

        <div className="py-10 lg:py-16 border-y border-stone-100 bg-stone-50 overflow-hidden">
          <RevealWrapper
            className="container mx-auto 2xl:max-w-7xl px-4 md:px-6 flex justify-between items-center opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-default font-bold uppercase tracking-widest text-sm md:text-xl lg:text-2xl 2xl:text-3xl"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <span>WEDDING</span>
            <span className="hidden md:inline text-stone-300">•</span>
            <span>PORTRAIT</span>
            <span className="hidden md:inline text-stone-300">•</span>
            <span>COMMERCIAL</span>
            <span className="hidden md:inline text-stone-300">•</span>
            <span>EVENTS</span>
          </RevealWrapper>
        </div>

        <section id="portfolio" className="py-16 lg:py-32 2xl:py-40">
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6">
            <RevealWrapper>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 gap-6">
                <div>
                  <h2
                    className="text-3xl lg:text-5xl font-bold mb-3 lg:mb-4"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {siteSettings.portfolio_title}
                  </h2>
                  <p className="text-stone-500 text-sm max-w-xs">{siteSettings.portfolio_desc}</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-stone-100 p-1 rounded-full w-full lg:w-auto">
                  <button
                    onClick={() => setActiveTab('foto')}
                    className={`flex-1 lg:flex-none justify-center px-4 lg:px-6 py-2 rounded-full text-[10px] lg:text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'foto' ? 'bg-white shadow-sm text-black' : 'text-stone-400 hover:text-stone-600'
                      }`}
                  >
                    PHOTOGRAPHY
                  </button>
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 lg:flex-none justify-center px-4 lg:px-6 py-2 rounded-full text-[10px] lg:text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'video' ? 'bg-white shadow-sm text-black' : 'text-stone-400 hover:text-stone-600'
                      }`}
                  >
                    VIDEOGRAPHY
                  </button>
                </div>
              </div>
            </RevealWrapper>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {['Semua', ...(activeTab === 'foto' ? siteSettings.categories_foto : siteSettings.categories_video)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCategory === cat
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-8 min-h-[400px]">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="rounded-xl bg-stone-200 aspect-[3/4] mb-4 shadow-sm relative overflow-hidden">
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-300/30 to-transparent" />
                    </div>
                    <div className="h-5 bg-stone-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-stone-200 rounded w-1/3" />
                  </div>
                ))
              ) : filteredPortfolio.length > 0 ? (
                filteredPortfolio.map((item, index) => (
                  <RevealWrapper key={item.id} delay={index * 100}>
                    <div className="group cursor-pointer" onClick={() => openModal(item)}>
                      <div className="relative overflow-hidden rounded-xl bg-stone-100 aspect-[3/4] mb-4 shadow-sm">
                        {activeTab === 'video' ? (
                          <>
                            <video
                              src={item.video_url}
                              poster={parseImages(item.image_url)[0]}
                              preload="metadata"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              muted
                              loop
                              playsInline
                              onMouseEnter={(e) => e.target.play()}
                              onMouseLeave={(e) => e.target.pause()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
                              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                <Play className="w-5 h-5 ml-1 fill-white" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <LazyLoadImage
                            src={parseImages(item.image_url)[0]}
                            alt={item.title}
                            effect="blur"
                            wrapperClassName="w-full h-full"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
                          />
                        )}
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold group-hover:text-stone-600 transition-colors"
                          style={{ fontFamily: 'Manrope, sans-serif' }}
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-stone-400 uppercase tracking-wider mt-1">{item.category}</p>
                      </div>
                    </div>
                  </RevealWrapper>
                ))
              ) : (
                <div className="col-span-full text-center text-stone-500 py-10">Belum ada karya di kategori ini.</div>
              )}
            </div>
          </div>
        </section >

        <section className="py-16 lg:py-24">
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6">
            <RevealWrapper>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">
                  {siteSettings.testi_badge}
                </span>
                <h2 className="text-3xl lg:text-5xl font-bold mt-2 mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {siteSettings.testi_title}
                </h2>
                <button
                  onClick={() => setShowTestiForm(true)}
                  className="px-6 py-3 bg-stone-900 text-white font-bold rounded-full text-sm hover:bg-black transition-all shadow-md mt-2"
                >
                  + Tulis Testimoni Anda
                </button>
              </div>
            </RevealWrapper>

            {loadingTesti ? (
              <div className="flex justify-center h-40 items-center">
                <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((item, idx) => (
                  <RevealWrapper key={item.id || idx} delay={idx * 120}>
                    <div className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                      <p className="text-stone-600 leading-relaxed mb-6 flex-1">“{item.quote}”</p>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold uppercase">
                          {item.name ? item.name.split(' ').map((w) => w[0]).join('').slice(0, 2) : 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.name}</p>
                          <p className="text-xs text-stone-400">{item.role}</p>
                        </div>
                      </div>
                    </div>
                  </RevealWrapper>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="services" className="py-16 lg:py-32 bg-stone-50">
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6">
            <div className="max-w-4xl 2xl:max-w-5xl mx-auto">
              <RevealWrapper>
                <span className="text-stone-400 uppercase tracking-widest text-[10px] font-bold block mb-4">{siteSettings.about_badge}</span>
                <h2
                  className="text-2xl lg:text-4xl 2xl:text-5xl font-bold mb-8 lg:mb-12 leading-tight font-heading"
                  dangerouslySetInnerHTML={{ __html: siteSettings.about_title }}
                />
              </RevealWrapper>

              <div className="grid md:grid-cols-2 gap-x-8 lg:gap-x-20 gap-y-6 lg:gap-y-8">
                {(siteSettings.services || []).map((srv, idx) => (
                  <RevealWrapper key={idx} delay={idx * 100}>
                    <div className="border-t border-stone-200 pt-5 lg:pt-6 group hover:border-black transition-colors">
                      <h4
                        className="text-lg lg:text-2xl font-bold text-stone-900 mb-2 flex justify-between items-center cursor-pointer font-heading"
                      >
                        {srv.title}{' '}
                        <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5 text-stone-300 group-hover:text-black transition-colors transform group-hover:rotate-45 duration-300" />
                      </h4>
                      <p className="text-stone-500 text-sm 2xl:text-base leading-relaxed">{srv.desc}</p>
                    </div>
                  </RevealWrapper>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 lg:py-32 2xl:py-40 bg-white text-center">
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6 max-w-3xl">
            <RevealWrapper>
              <h2
                className="text-4xl lg:text-7xl font-bold mb-6 lg:mb-8 text-stone-900 tracking-tight font-heading"
                dangerouslySetInnerHTML={{ __html: siteSettings.contact_title }}
              />
              <p className="text-stone-500 text-sm lg:text-lg mb-8 lg:mb-12">
                {siteSettings.contact_desc}
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 lg:gap-4">
                <a
                  href={siteSettings.social_wa}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 lg:px-10 py-3 lg:py-4 bg-stone-900 text-white font-bold rounded-full hover:bg-black hover:scale-105 transition-all shadow-xl shadow-stone-900/10 text-sm lg:text-base"
                >
                  <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" /> Chat WhatsApp
                </a>
                <a
                  href={siteSettings.social_ig}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 lg:px-10 py-3 lg:py-4 bg-stone-100 text-stone-900 font-bold rounded-full hover:bg-stone-200 transition-all text-sm lg:text-base"
                >
                  <Instagram className="w-4 h-4 lg:w-5 lg:h-5" /> Instagram
                </a>
                <a
                  href={siteSettings.social_tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 lg:px-10 py-3 lg:py-4 bg-stone-100 text-stone-900 font-bold rounded-full hover:bg-stone-200 transition-all text-sm lg:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4 lg:w-5 lg:h-5">
                    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                  </svg>
                  TikTok
                </a>
              </div>
            </RevealWrapper>
          </div>
        </section>

        <footer className="bg-stone-900 text-stone-400 py-8 lg:py-12 border-t border-stone-800">
          <div className="container mx-auto 2xl:max-w-7xl px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-xs uppercase tracking-widest font-medium">
            <div className="text-white font-bold text-base lg:text-lg tracking-normal normal-case font-heading">
              {siteSettings.footer_brand}
            </div>
            <p>{siteSettings.footer_copyright}</p>
          </div>
        </footer>

        {
          showTestiForm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-8">
              <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" onClick={() => setShowTestiForm(false)}></div>
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-float-once">
                <div className="flex items-center justify-between p-6 border-b border-stone-100">
                  <h3 className="text-xl font-bold font-heading">Tulis Testimoni</h3>
                  <button onClick={() => setShowTestiForm(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleTestiSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Nama Anda *</label>
                    <input
                      type="text"
                      required
                      value={testiForm.name}
                      onChange={(e) => setTestiForm({ ...testiForm, name: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                      placeholder="Contoh: Alya & Bima"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Peran / Perusahaan</label>
                    <input
                      type="text"
                      value={testiForm.role}
                      onChange={(e) => setTestiForm({ ...testiForm, role: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                      placeholder="Contoh: Pengantin, atau CEO di PT Bahagia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Testimoni *</label>
                    <textarea
                      required
                      rows="4"
                      value={testiForm.quote}
                      onChange={(e) => setTestiForm({ ...testiForm, quote: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm resize-none"
                      placeholder="Ceritakan pengalaman Anda menggunakan jasa kami..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingTesti}
                    className="w-full py-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-black transition-all flex justify-center items-center gap-2 mt-4"
                  >
                    {submittingTesti ? <div className="w-4 h-4 border-2 border-stone-400 border-t-stone-900 rounded-full animate-spin"></div> : 'Kirim Testimoni'}
                  </button>
                </form>
              </div>
            </div>
          )
        }

        {
          selectedItem && (
            <>
              {/* ── TikTok-style full-screen SCROLL for MOBILE VIDEO ── */}
              {activeTab === 'video' && selectedItem.video_url && (
                <div className="fixed inset-0 z-[60] bg-black lg:hidden overflow-y-scroll snap-y snap-mandatory">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="fixed top-5 right-4 z-50 bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  {portfolioData.filter(i => i.video_url).map((vid) => (
                    <TikTokSlide
                      key={vid.id}
                      vid={vid}
                      initialActive={vid.id === selectedItem.id}
                      waLink={siteSettings.social_wa}
                    />
                  ))}
                </div>
              )}

              {/* ── Photo modal (all screens) ── */}
              {activeTab !== 'video' && !selectedItem.video_url && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 lg:p-8">
                  <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
                  <div className="bg-white w-full sm:w-[fit-content] sm:max-w-[95vw] lg:max-w-[1200px] max-h-[92vh] rounded-t-3xl sm:rounded-2xl lg:rounded-3xl shadow-2xl relative z-10 flex flex-col lg:flex-row overflow-hidden">
                    <div className="bg-stone-900 relative flex items-center justify-center group/slider overflow-hidden shrink-0 lg:flex-none">
                      <img
                        src={parseImages(selectedItem.image_url)[currentSlide]}
                        alt={`${selectedItem.title} - Slide ${currentSlide + 1}`}
                        loading="lazy"
                        className="w-auto h-auto max-w-[100vw] sm:max-w-[60vw] lg:max-w-[calc(95vw-400px)] xl:max-w-[750px] max-h-[55vw] sm:max-h-[60vh] lg:max-h-[90vh] object-contain transition-opacity duration-300"
                      />
                      {parseImages(selectedItem.image_url).length > 1 && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(p => (p > 0 ? p - 1 : parseImages(selectedItem.image_url).length - 1)); }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-stone-900 p-1.5 rounded-full shadow-md">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(p => (p < parseImages(selectedItem.image_url).length - 1 ? p + 1 : 0)); }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-stone-900 p-1.5 rounded-full shadow-md">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-3 left-0 w-full flex justify-center gap-1.5 z-10">
                            {parseImages(selectedItem.image_url).map((_, idx) => (
                              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${currentSlide === idx ? 'bg-white scale-125' : 'bg-white/40'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col bg-white overflow-y-auto max-h-[50vh] sm:max-h-none">
                      <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-white z-10 border-b border-stone-100">
                        <span className="inline-block px-3 py-1 border border-stone-200 rounded-full text-stone-500 uppercase tracking-widest text-[10px] font-bold">{selectedItem.category}</span>
                        <button onClick={() => setSelectedItem(null)} className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded-full transition-all"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="p-5 lg:p-8 flex flex-col flex-1">
                        <h3 className="text-2xl lg:text-4xl font-bold text-stone-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{selectedItem.title}</h3>
                        <p className="text-stone-500 leading-relaxed text-sm lg:text-base flex-1">{selectedItem.description}</p>
                        <div className="mt-6 pt-5 border-t border-stone-100">
                          <a href={siteSettings.social_wa} target="_blank" rel="noreferrer" className="block w-full text-center bg-stone-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all text-sm">Book This Service</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Desktop video modal (lg+) ── */}
              {activeTab === 'video' && selectedItem.video_url && (
                <div className="fixed inset-0 z-[60] hidden lg:flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
                  <div className="bg-white w-[fit-content] max-w-[1200px] max-h-[90vh] rounded-3xl shadow-2xl relative z-10 flex flex-row overflow-hidden">
                    <div className="bg-stone-900 shrink-0 flex items-center justify-center overflow-hidden">
                      <video src={selectedItem.video_url} preload="metadata" className="w-auto h-auto max-w-[calc(95vw-400px)] xl:max-w-[750px] max-h-[90vh] object-contain" controls autoPlay muted playsInline />
                    </div>
                    <div className="w-[400px] xl:w-[450px] shrink-0 flex flex-col bg-white overflow-y-auto">
                      <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-stone-100">
                        <span className="inline-block px-3 py-1 border border-stone-200 rounded-full text-stone-500 uppercase tracking-widest text-[10px] font-bold">{selectedItem.category}</span>
                        <button onClick={() => setSelectedItem(null)} className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded-full"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <h3 className="text-4xl font-bold text-stone-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>{selectedItem.title}</h3>
                        <p className="text-stone-500 leading-relaxed text-base flex-1">{selectedItem.description}</p>
                        <div className="mt-8 pt-6 border-t border-stone-100">
                          <a href={siteSettings.social_wa} target="_blank" rel="noreferrer" className="block w-full text-center bg-stone-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all">Book This Service</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        }

        {
          !isSupabaseEnabled && import.meta.env.DEV && (
            <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-amber-100 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 shadow-md">
              <strong className="block font-semibold">⚙️ Dev Mode: Supabase belum dikonfigurasi</strong>
              <p className="text-sm">
                Data menggunakan mock lokal. Buat file <code className="bg-white px-1 rounded">.env</code> dan isi <code className="bg-white px-1 rounded">VITE_SUPABASE_URL</code> &amp; <code className="bg-white px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          )
        }
      </div >
    </>
  );
}

// ─── TikTok Slide Component ──────────────────────────────────────────────────
function TikTokSlide({ vid, initialActive, waLink }) {
  const videoRef = useRef(null);
  const slideRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Auto-scroll to this slide if it's the one that was clicked
  useEffect(() => {
    if (initialActive && slideRef.current) {
      slideRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [initialActive]);

  // IntersectionObserver: auto-play when fully visible, pause otherwise
  useEffect(() => {
    const el = slideRef.current;
    const videoEl = videoRef.current;
    if (!el || !videoEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
          videoEl.play().then(() => setPlaying(true)).catch(() => { });
        } else {
          videoEl.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.8 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div
      ref={slideRef}
      className="relative w-full h-screen snap-start snap-always flex-shrink-0 overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        src={vid.video_url}
        poster={vid.image_url && !vid.image_url.startsWith('[') ? vid.image_url : undefined}
        className="w-full h-full object-contain"
        loop
        muted={false}
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Play/Pause indicator */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom gradient + info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent pt-32 pb-28 px-5 z-10 pointer-events-none">
        <span className="inline-block px-2.5 py-0.5 mb-2 border border-white/30 rounded-full text-white/70 uppercase tracking-widest text-[10px] font-bold">
          {vid.category}
        </span>
        <h3 className="text-xl font-bold text-white mb-1 leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {vid.title}
        </h3>
        {vid.description && (
          <p className="text-white/70 text-sm leading-relaxed line-clamp-2">{vid.description}</p>
        )}
      </div>

      {/* Book button — sits above safe area, above the info text */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-20">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center bg-white text-stone-900 font-bold py-3.5 rounded-2xl text-sm"
        >
          📲 Book This Service
        </a>
      </div>
    </div>
  );
}
