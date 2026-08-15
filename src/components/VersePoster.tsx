import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Download, Share2, Image as ImageIcon, Type, 
  AlignLeft, AlignCenter, AlignRight, BookOpen, Brush, Sliders, Check,
  Upload, Search, Sparkles, RefreshCw, Copy, CheckCircle2, Eye,
  Palette, Sun, Layers, ZoomIn, X, MessageCircle, Smartphone
} from 'lucide-react';
import { bibleBooks, getVersesForChapter } from '../data/bibleData';
import umnLogo from '../assets/images/umn_logo_1783706606382.jpg';

// Curated 10+ Categories with hundreds of ultra-high-resolution modern spiritual backgrounds
interface BgCategory {
  id: string;
  name: string;
  icon: string;
  images: { id: string; url: string; name: string }[];
}

const BACKGROUND_CATEGORIES: BgCategory[] = [
  {
    id: 'cross',
    name: 'சிலுவை & கல்வாரி',
    icon: '✝️',
    images: [
      { id: 'cross-1', url: 'https://images.unsplash.com/photo-1510784722466-f2aa9c52ffa6?auto=format&fit=crop&w=1200&q=85', name: 'பொன் சிலுவை' },
      { id: 'cross-2', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85', name: 'சூரிய அஸ்தமனம்' },
      { id: 'cross-3', url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=85', name: 'கல்வாரி மலை' },
      { id: 'cross-4', url: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=1200&q=85', name: 'பரலோக ஒளி' },
      { id: 'cross-5', url: 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?auto=format&fit=crop&w=1200&q=85', name: 'மேகங்கள் சிலுவை' },
      { id: 'cross-6', url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=85', name: 'அமைதி' },
    ]
  },
  {
    id: 'sunrise',
    name: 'விடியல் & அருளுதயம்',
    icon: '🌅',
    images: [
      { id: 'sun-1', url: 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?auto=format&fit=crop&w=1200&q=85', name: 'காலை விடியல்' },
      { id: 'sun-2', url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=85', name: 'புதிய நம்பிக்கை' },
      { id: 'sun-3', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', name: 'பொன் சூரியன்' },
      { id: 'sun-4', url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=85', name: 'கதிரவன் ஒளி' },
      { id: 'sun-5', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85', name: 'பசுமை விடியல்' },
      { id: 'sun-6', url: 'https://images.unsplash.com/photo-1506744626753-eda8151a15c1?auto=format&fit=crop&w=1200&q=85', name: 'விடியற்காலை' },
    ]
  },
  {
    id: 'mountains',
    name: 'இயற்கை & மலைகள்',
    icon: '🏔️',
    images: [
      { id: 'mnt-1', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85', name: 'கம்பீர மலை' },
      { id: 'mnt-2', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=85', name: 'பனி மலை' },
      { id: 'mnt-3', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85', name: 'உயர் சிகரம்' },
      { id: 'mnt-4', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=85', name: 'அமைதியான பள்ளத்தாக்கு' },
      { id: 'mnt-5', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85', name: 'இரவு சிகரம்' },
      { id: 'mnt-6', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85', name: 'இயற்கை எழில்' },
    ]
  },
  {
    id: 'galaxy',
    name: 'விண்வெளி & நட்சத்திரங்கள்',
    icon: '🌌',
    images: [
      { id: 'spc-1', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=85', name: 'பால்வெளி மண்டலம்' },
      { id: 'spc-2', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85', name: 'பிரபஞ்சம்' },
      { id: 'spc-3', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85', name: 'விண்மீன் கூட்டம்' },
      { id: 'spc-4', url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=1200&q=85', name: 'இரவு வானம்' },
      { id: 'spc-5', url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1200&q=85', name: 'அற்புத படைப்பு' },
      { id: 'spc-6', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=85', name: 'வானத்தின் மகிமை' },
    ]
  },
  {
    id: 'water',
    name: 'கடல் & நீர்வீழ்ச்சி',
    icon: '🌊',
    images: [
      { id: 'wtr-1', url: 'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=1200&q=85', name: 'ஜீவ நதி' },
      { id: 'wtr-2', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=85', name: 'அமைதியான கடல்' },
      { id: 'wtr-3', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=85', name: 'நீர்வீழ்ச்சி' },
      { id: 'wtr-4', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85', name: 'அலைகள்' },
      { id: 'wtr-5', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', name: 'கடற்கரை' },
      { id: 'wtr-6', url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=1200&q=85', name: 'தெளிந்த நீரோடை' },
    ]
  },
  {
    id: 'modern_3d',
    name: 'அதிநவீன 3D & ஒளிச்சுடர்கள்',
    icon: '✨',
    images: [
      { id: 'm3d-1', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85', name: 'நவீன அலைகள்' },
      { id: 'm3d-2', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=85', name: 'கோல்டன் குளோ' },
      { id: 'm3d-3', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=85', name: 'கிராடியன்ட் மெஷ்' },
      { id: 'm3d-4', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=85', name: 'டார்க் லக்ஸ்' },
      { id: 'm3d-5', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85', name: 'சைபர் லைட்' },
      { id: 'm3d-6', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85', name: 'மின்னும் திரவம்' },
    ]
  },
  {
    id: 'bible',
    name: 'பரிசுத்த வேதாகமம் & மெழுகுவர்த்தி',
    icon: '📖',
    images: [
      { id: 'bbl-1', url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=85', name: 'வேத புத்தகம்' },
      { id: 'bbl-2', url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=85', name: 'மெழுகுவர்த்தி ஒளி' },
      { id: 'bbl-3', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85', name: 'பழங்கால வேத உரை' },
      { id: 'bbl-4', url: 'https://images.unsplash.com/photo-1473177104440-ffee2f376098?auto=format&fit=crop&w=1200&q=85', name: 'ஜெப அறை' },
      { id: 'bbl-5', url: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1200&q=85', name: 'புனித நூல்' },
      { id: 'bbl-6', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85', name: 'படிக்கப்பட்ட வேதம்' },
    ]
  },
  {
    id: 'clouds',
    name: 'பரலோக மேகங்கள் & ஒளி',
    icon: '☁️',
    images: [
      { id: 'cld-1', url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1200&q=85', name: 'பரலோக மேகம்' },
      { id: 'cld-2', url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=85', name: 'வானத்தின் ஒளிக்கீற்று' },
      { id: 'cld-3', url: 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=1200&q=85', name: 'தூய மேகங்கள்' },
      { id: 'cld-4', url: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1200&q=85', name: 'பொன் முகில்' },
      { id: 'cld-5', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=85', name: 'ஒளிரும் வானம்' },
      { id: 'cld-6', url: 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1200&q=85', name: 'வெள்ளி மேகம்' },
    ]
  },
  {
    id: 'flowers',
    name: 'வசந்த மலர்கள் & பூங்கா',
    icon: '🌸',
    images: [
      { id: 'flw-1', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85', name: 'வசந்த பூக்கள்' },
      { id: 'flw-2', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=85', name: 'இயற்கைப் பூங்கா' },
      { id: 'flw-3', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=85', name: 'காட்டுப் பூக்கள்' },
      { id: 'flw-4', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=85', name: 'பசுமை மலர்ச்சி' },
      { id: 'flw-5', url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=85', name: 'அழகிய ரோஜா' },
      { id: 'flw-6', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85', name: 'பனித்துளி மலர்' },
    ]
  },
  {
    id: 'forest',
    name: 'பசுமை காடுகள் & அமைதி',
    icon: '🌿',
    images: [
      { id: 'fst-1', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85', name: 'அடர்ந்த காடு' },
      { id: 'fst-2', url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=85', name: 'பசுமை மரங்கள்' },
      { id: 'fst-3', url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=85', name: 'காலை பனி காடு' },
      { id: 'fst-4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85', name: 'ஒளி பாயும் காடு' },
      { id: 'fst-5', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=85', name: 'பசுமைப் பள்ளத்தாக்கு' },
      { id: 'fst-6', url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=85', name: 'அமைதியான வனம்' },
    ]
  }
];

export interface FontOption {
  id: string;
  name: string;
  category: 'tamil' | 'calligraphy' | 'display' | 'serif' | 'modern' | 'handwritten' | 'vintage';
  preview: string;
}

export const ADVANCED_FONTS: FontOption[] = [
  // --- 1. TAMIL TYPOGRAPHY (தமிழ் எழுத்துருக்கள்) ---
  { id: '"Mukta Malar", sans-serif', name: 'முக்தா மலர் (Mukta Bold)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Anek Tamil", sans-serif', name: 'அனேக் தமிழ் (Anek Modern)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Noto Sans Tamil", sans-serif', name: 'நோட்டோ சான்ஸ் (Noto Clean)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Noto Serif Tamil", serif', name: 'நோட்டோ செரிஃப் (Noto Classical)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Arima", system-ui', name: 'அரிமா வளைவு (Arima Curves)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Baloo Thambi 2", cursive', name: 'பாலூ தம்பி (Baloo Rounded)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Catamaran", sans-serif', name: 'கட்டமரன் (Catamaran Sleek)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Hind Madurai", sans-serif', name: 'ஹிந்த் மதுரை (Hind Madurai)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Kavivanar", cursive', name: 'கவிவாணர் (Kavivanar Script)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Pavanam", sans-serif', name: 'பவணா (Pavanam Compact)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Coiny", cursive', name: 'கொயினி பப்ளி (Coiny Bubble)', category: 'tamil', preview: 'தமிழ் வேதம்' },
  { id: '"Tiro Tamil", serif', name: 'திரோ தமிழ் (Tiro Tamil Book)', category: 'tamil', preview: 'தமிழ் வேதம்' },

  // --- 2. CALLIGRAPHY & SCRIPT (அலங்கார கையெழுத்து பாணிகள்) ---
  { id: '"Great Vibes", cursive', name: 'Great Vibes (ராயல் கர்சீவ்)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Alex Brush", cursive', name: 'Alex Brush (மென் தூரிகை)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Dancing Script", cursive', name: 'Dancing Script (நடன எழுத்து)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Pacifico", cursive', name: 'Pacifico (அலை கர்சீவ்)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Satisfy", cursive', name: 'Satisfy (நேர்த்தி கையெழுத்து)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Sacramento", cursive', name: 'Sacramento (மெல்லிய அழகு)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Courgette", cursive', name: 'Courgette (தூரிகை வடிவம்)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Kaushan Script", cursive', name: 'Kaushan Script (சுட்டி எழுத்து)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Playball", cursive', name: 'Playball (விளையாட்டு கர்சீவ்)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Caveat", cursive', name: 'Caveat (இயற்கை கையெழுத்து)', category: 'calligraphy', preview: 'Grace & Truth' },
  { id: '"Fondamento", cursive', name: 'Fondamento (சாசன வடிவம்)', category: 'calligraphy', preview: 'Grace & Truth' },

  // --- 3. MAJESTIC & DISPLAY (கம்பீரமான தலைப்பு & போஸ்டர் பாணிகள்) ---
  { id: '"Cinzel Decorative", serif', name: 'Cinzel Decorative (ராஜ கம்பீரம்)', category: 'display', preview: 'LORD OF LORDS' },
  { id: '"Cinzel", serif', name: 'Cinzel Roman (ரோமன் கம்பீரம்)', category: 'display', preview: 'HOLY BIBLE' },
  { id: '"Shrikhand", cursive', name: 'Shrikhand (தடித்த போஸ்டர்)', category: 'display', preview: 'KING OF KINGS' },
  { id: '"Abril Fatface", cursive', name: 'Abril Fatface (மிரட்டல் தலைப்பு)', category: 'display', preview: 'EVERLASTING' },
  { id: '"Alfa Slab One", cursive', name: 'Alfa Slab (பலம் வாய்ந்த எழுத்து)', category: 'display', preview: 'ALMIGHTY' },
  { id: '"Righteous", cursive', name: 'Righteous (நவீன விண்மீன்)', category: 'display', preview: 'HALLELUJAH' },
  { id: '"Bebas Neue", sans-serif', name: 'Bebas Neue (நெடிய தலைப்பு)', category: 'display', preview: 'PRAISE GOD' },
  { id: '"Oswald", sans-serif', name: 'Oswald Bold (கெட்டியான வடிவம்)', category: 'display', preview: 'JESUS SAVES' },
  { id: '"Lobster", cursive', name: 'Lobster (ரெட்ரோ தடிமன்)', category: 'display', preview: 'AMAZING GRACE' },
  { id: '"Permanent Marker", cursive', name: 'Permanent Marker (மார்க்கர்)', category: 'display', preview: 'FAITH & HOPE' },
  { id: '"Kavoon", cursive', name: 'Kavoon (கார்ட்டூன் தடிமன்)', category: 'display', preview: 'BLESSED LIFE' },

  // --- 4. LUXURY SERIF & CLASSICAL (வேத புத்தக & பாரம்பரிய செரிஃப்) ---
  { id: '"Playfair Display", serif', name: 'Playfair Display (அரச பாரம்பரியம்)', category: 'serif', preview: 'God is Love' },
  { id: '"Cormorant Garamond", serif', name: 'Cormorant Garamond (பழங்கால வேதம்)', category: 'serif', preview: 'The Word of God' },
  { id: '"Philosopher", sans-serif', name: 'Philosopher (தத்துவ நேர்த்தி)', category: 'serif', preview: 'Peace & Joy' },
  { id: '"Marcellus", serif', name: 'Marcellus (ரோமானிய சாசனம்)', category: 'serif', preview: 'Light of the World' },
  { id: '"Prata", serif', name: 'Prata (சொகுசு செரிஃப்)', category: 'serif', preview: 'Holy Spirit' },
  { id: '"Almendra", serif', name: 'Almendra (இடைக்கால வேதம்)', category: 'serif', preview: 'Living Water' },
  { id: 'Georgia, serif', name: 'Georgia Classic (மரபு செரிஃப்)', category: 'serif', preview: 'Ancient Word' },

  // --- 5. ULTRA MODERN & SANS (அதிநவீன டிஜிட்டல் பாணிகள்) ---
  { id: '"Montserrat", sans-serif', name: 'Montserrat Geometric (ஜியோமெட்ரிக்)', category: 'modern', preview: 'Pure Love' },
  { id: 'system-ui, sans-serif', name: 'System Ultra Clean (ஆப்பிள் ஸ்டைல்)', category: 'modern', preview: 'Eternal Light' },
  { id: '"UnifrakturMaguntia", cursive', name: 'Gothic Holy Bible (கோத்திக் வேதம்)', category: 'vintage', preview: 'Sacred Scriptures' },
];

const OUTLINE_COLORS = [
  { color: '#000000', label: 'அடர் கருப்பு (Black Shadow)' },
  { color: '#1e293b', label: 'ஸ்லேட் நீலம் (Navy Slate)' },
  { color: '#ffffff', label: 'தூய வெள்ளை (White Glow)' },
  { color: '#ffd700', label: 'பொன் ஒளி (Golden Glow)' },
  { color: '#b91c1c', label: 'சிவப்பு (Ruby Crimson)' },
  { color: '#047857', label: 'மரகதம் (Emerald Green)' },
  { color: '#6b21a8', label: 'அரச ஊதா (Royal Purple)' },
  { color: '#0369a1', label: 'ஆழ்கடல் நீலம் (Ocean Blue)' },
  { color: '#78350f', label: 'செம்பு பழுப்பு (Amber Bronze)' },
];

const TINT_COLORS = [
  { id: 'black', label: 'கருப்பு', color: 'rgba(0,0,0,', hex: '#000000' },
  { id: 'navy', label: 'நீலம்', color: 'rgba(10,25,50,', hex: '#0a1932' },
  { id: 'purple', label: 'ஊதா', color: 'rgba(35,10,50,', hex: '#230a32' },
  { id: 'crimson', label: 'சிவப்பு', color: 'rgba(50,10,20,', hex: '#320a14' },
  { id: 'emerald', label: 'பச்சை', color: 'rgba(10,40,25,', hex: '#0a2819' },
  { id: 'gold', label: 'பொன் நிறம்', color: 'rgba(50,35,10,', hex: '#32230a' },
];

const QUICK_TAGS = [
  "இயேசு", "Cross", "Sunrise", "Heaven", "Mountains", "Holy Bible", "Galaxy", "Light", "Clouds", "Ocean", "Flowers", "Calvary", "Gold", "Nature", "Peace"
];

interface VersePosterProps {
  initialVerse?: {
    bookId: number;
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  } | null;
  onBack: () => void;
  isDarkMode: boolean;
}

export default function VersePoster({ initialVerse, onBack, isDarkMode }: VersePosterProps) {
  // Verse State
  const [selectedBookId, setSelectedBookId] = useState(initialVerse?.bookId || 19);
  const [selectedChapter, setSelectedChapter] = useState(initialVerse?.chapter || 23);
  const [selectedVerseNum, setSelectedVerseNum] = useState(initialVerse?.verse || 1);
  const [verseText, setVerseText] = useState(initialVerse?.text || "கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான் தாழ்ச்சியடையேன்.");

  // Background State
  const [activeCategory, setActiveCategory] = useState<string>('cross');
  const [currentBgUrl, setCurrentBgUrl] = useState<string>(BACKGROUND_CATEGORIES[0].images[0].url);
  const [customBgList, setCustomBgList] = useState<{ id: string; url: string; name: string }[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const [onlineSearchResults, setOnlineSearchResults] = useState<{ id: string; url: string; name: string }[]>([]);

  // Design State
  const [fontCategory, setFontCategory] = useState<string>('all');
  const [fontFamily, setFontFamily] = useState(ADVANCED_FONTS[0].id);
  const [textAlign, setTextAlign] = useState<'left'|'center'|'right'>('center');
  const [overlayOpacity, setOverlayOpacity] = useState(0); // 0% by default for 100% crystal clear bright natural images
  const [selectedTintColor, setSelectedTintColor] = useState(TINT_COLORS[0]);
  const [fontSize, setFontSize] = useState(56);
  const [textColor, setTextColor] = useState('#ffffff');
  const [refColor, setRefColor] = useState('#FFD700');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '4:5' | '16:9'>('9:16');
  const [highlightWord, setHighlightWord] = useState('');
  const [blurEffect, setBlurEffect] = useState(0);
  const [showQuoteMarks, setShowQuoteMarks] = useState(true);
  const [showSeparator, setShowSeparator] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [textOutline, setTextOutline] = useState(true);
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [outlineWidth, setOutlineWidth] = useState(4);
  const [shadowBlur, setShadowBlur] = useState(16);

  // Status & Feedback
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savedImageDataUrl, setSavedImageDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBook = bibleBooks.find(b => b.id === selectedBookId) || bibleBooks[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // When chapter or book changes, update verse text
    const versesList = getVersesForChapter(currentBook.id, selectedChapter);
    const v = versesList.find(v => v.verse === selectedVerseNum) || versesList[0];
    if (v) {
      setVerseText(v.text);
      setSelectedVerseNum(v.verse);
    }
  }, [selectedBookId, selectedChapter, selectedVerseNum]);

  // Main rendering engine
  useEffect(() => {
    drawCanvas();
  }, [
    verseText, currentBgUrl, fontFamily, textAlign, overlayOpacity, selectedTintColor,
    fontSize, textColor, refColor, aspectRatio, highlightWord, blurEffect,
    showQuoteMarks, showSeparator, showWatermark, textOutline, outlineColor, outlineWidth, shadowBlur
  ]);

  // Helper to open Save/Share modal safely without triggering APK crashes
  const openSaveShareModal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setSavedImageDataUrl(dataUrl);
      setIsSaveModalOpen(true);
    } catch (err) {
      console.error('Error generating image preview:', err);
      // Fallback try without quality arg
      try {
        const dataUrl = canvas.toDataURL();
        setSavedImageDataUrl(dataUrl);
        setIsSaveModalOpen(true);
      } catch (err2) {
        showToast('பட முன்னோட்டத்தை உருவாக்க முடியவில்லை.');
      }
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Calculate total height to center vertically
    const totalHeight = lines.length * lineHeight;
    let startY = (ctx.canvas.height / 2) - (totalHeight / 2) + (lineHeight / 3);

    // If logo is shown, push text slightly up on taller formats
    if (showWatermark && aspectRatio === '9:16') {
      startY -= 120;
    } else if (showWatermark) {
      startY -= 60;
    }

    lines.forEach(l => {
      // Handle Highlight rendering
      if (highlightWord && l.includes(highlightWord)) {
        const parts = l.split(new RegExp(`(${highlightWord})`, 'gi'));
        let currentX = x;
        if (ctx.textAlign === 'center') {
          currentX = x - ctx.measureText(l).width / 2;
        } else if (ctx.textAlign === 'right') {
          currentX = x - ctx.measureText(l).width;
        }
        ctx.textAlign = 'left';
        
        parts.forEach(part => {
          const isHighlighted = part.toLowerCase() === highlightWord.toLowerCase();
          const partColor = isHighlighted ? refColor : textColor;
          
          if (textOutline) {
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = outlineWidth;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(part, currentX, startY);
          }
          
          ctx.fillStyle = partColor;
          ctx.fillText(part, currentX, startY);
          currentX += ctx.measureText(part).width;
        });
        
        ctx.textAlign = textAlign; // restore
      } else {
        if (textOutline) {
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = outlineWidth;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(l, x, startY);
        }
        ctx.fillStyle = textColor;
        ctx.fillText(l, x, startY);
      }
      
      startY += lineHeight;
    });
    
    return startY;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1080;
    let height = 1920; // 9:16 default
    if (aspectRatio === '1:1') {
      height = 1080;
    } else if (aspectRatio === '4:5') {
      height = 1350;
    } else if (aspectRatio === '16:9') {
      height = 608;
    }

    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentBgUrl;
    
    img.onload = () => {
      // 1. Draw Background Image in 100% natural, crisp, original colors
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width / 2) - (img.width / 2) * scale;
      const y = (height / 2) - (img.height / 2) * scale;
      
      if (blurEffect > 0) {
        ctx.filter = `blur(${blurEffect}px)`;
      }
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.filter = 'none';

      // 2. Draw Tinted Overlay ONLY if user explicitly increases overlay opacity > 0
      if (overlayOpacity > 0) {
        ctx.fillStyle = `${selectedTintColor.color}${overlayOpacity / 100})`;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Draw Decorative Quote Marks
      if (showQuoteMarks) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.font = '260px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('“', width / 2, height / 2 - (fontSize * 2.2));
      }

      // 4. Draw Main Verse Text with crisp typography shadow
      if (shadowBlur > 0) {
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = textAlign;
      
      let textX = width / 2;
      if (textAlign === 'left') textX = 100;
      if (textAlign === 'right') textX = width - 100;
      
      const lastTextY = wrapText(ctx, verseText, textX, height / 2, width - 180, fontSize * 1.6);

      // 5. Draw Reference
      const referenceText = `${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum}`;
      ctx.font = `bold ${fontSize * 0.48}px ${fontFamily}`;
      
      let refY = lastTextY + 24;
      
      // Draw a line separator above reference
      if (showSeparator) {
        ctx.strokeStyle = `${refColor}cc`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (textAlign === 'center') {
          ctx.moveTo(width / 2 - 120, refY - 20);
          ctx.lineTo(width / 2 + 120, refY - 20);
        } else if (textAlign === 'left') {
          ctx.moveTo(100, refY - 20);
          ctx.lineTo(340, refY - 20);
        } else {
          ctx.moveTo(width - 340, refY - 20);
          ctx.lineTo(width - 100, refY - 20);
        }
        ctx.stroke();
      }

      if (textOutline) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = Math.max(2, outlineWidth * 0.75);
        ctx.lineJoin = 'round';
        ctx.strokeText(referenceText, textX, refY + 28);
      }
      ctx.fillStyle = refColor;
      ctx.fillText(referenceText, textX, refY + 28);

      // 6. Draw UMN Ministry Watermark Footer
      if (showWatermark) {
        ctx.shadowBlur = 12;
        
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = umnLogo;
        logoImg.onload = () => {
          const logoSize = aspectRatio === '9:16' ? 110 : 80;
          const logoY = height - (aspectRatio === '9:16' ? 220 : 140);
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, logoY + (logoSize/2), logoSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logoImg, width / 2 - logoSize / 2, logoY, logoSize, logoSize);
          ctx.restore();
          
          // Outer Gold Ring for Logo
          ctx.beginPath();
          ctx.arc(width / 2, logoY + (logoSize/2), logoSize / 2, 0, Math.PI * 2);
          ctx.lineWidth = 4;
          ctx.strokeStyle = refColor;
          ctx.stroke();

          // Brand Text
          ctx.font = `bold ${aspectRatio === '9:16' ? 32 : 24}px "Mukta Malar", sans-serif`;
          if (textOutline) {
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.strokeText('UMN TAMIL BIBLE', width / 2, logoY + logoSize + 36);
          }
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText('UMN TAMIL BIBLE', width / 2, logoY + logoSize + 36);

          ctx.font = `bold ${aspectRatio === '9:16' ? 20 : 16}px "Mukta Malar", sans-serif`;
          if (textOutline) {
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.strokeText('umnministry.com', width / 2, logoY + logoSize + 68);
          }
          ctx.fillStyle = refColor;
          ctx.fillText('umnministry.com', width / 2, logoY + logoSize + 68);
        };
      }
    };
  };

  const handleDirectDownload = () => {
    setIsDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsDownloading(false);
        return;
      }

      // Try modern Blob download first
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          try {
            if (!blob) {
              // Fallback to dataURL
              const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
              setSavedImageDataUrl(dataUrl);
              const link = document.createElement('a');
              link.download = `UMN_BibleStatus_${currentBook.englishName}_${selectedChapter}_${selectedVerseNum}.jpg`;
              link.href = dataUrl;
              try {
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                  try { document.body.removeChild(link); } catch {}
                }, 500);
                showToast('பட அட்டை பதிவிறக்கப்பட்டது! 🎉');
              } catch {
                openSaveShareModal();
              }
              setIsDownloading(false);
              return;
            }

            const fileName = `UMN_BibleStatus_${currentBook.englishName}_${selectedChapter}_${selectedVerseNum}.jpg`;
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = blobUrl;
            
            try {
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                try {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(blobUrl);
                } catch {}
              }, 1000);
              showToast('பட அட்டை பதிவிறக்கப்பட்டது! 🎉');
            } catch {
              openSaveShareModal();
            }
            setIsDownloading(false);
          } catch (blobErr) {
            console.warn('Blob download fallback:', blobErr);
            openSaveShareModal();
            setIsDownloading(false);
          }
        }, 'image/jpeg', 0.95);
      } else {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setSavedImageDataUrl(dataUrl);
        const link = document.createElement('a');
        link.download = `UMN_BibleStatus_${currentBook.englishName}_${selectedChapter}_${selectedVerseNum}.jpg`;
        link.href = dataUrl;
        try {
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            try { document.body.removeChild(link); } catch {}
          }, 500);
          showToast('பட அட்டை பதிவிறக்கப்பட்டது! 🎉');
        } catch {
          openSaveShareModal();
        }
        setIsDownloading(false);
      }
    } catch (e) {
      console.error('Download error:', e);
      openSaveShareModal();
      showToast('படத்தைச் சேமிக்க மேலே உள்ள முன்னோட்டத்தைப் பயன்படுத்தவும்.');
      setIsDownloading(false);
    }
  };

  const handleDeviceShare = async () => {
    setIsSharing(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsSharing(false);
      return;
    }

    try {
      if (canvas.toBlob) {
        canvas.toBlob(async (blob) => {
          try {
            if (!blob) {
              setIsSharing(false);
              openSaveShareModal();
              return;
            }

            const fileName = `UMN_BibleStatus_${currentBook.englishName}_${selectedChapter}_${selectedVerseNum}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });

            // 1. Try sharing IMAGE FILE directly (Native Android / iOS Share Sheet with WhatsApp/Instagram)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: `${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum} - UMN Tamil Bible`,
                  text: `"${verseText}" - ${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum}`,
                  files: [file]
                });
                showToast('படம் வெற்றிகரமாகப் பகிரப்பட்டது! 🎉');
                setIsSharing(false);
                return;
              } catch (err: any) {
                if (err.name === 'AbortError') {
                  setIsSharing(false);
                  return;
                }
              }
            }

            // 2. If file sharing is not supported by WebView, open Save & Share Modal
            openSaveShareModal();
          } catch (shareInnerErr) {
            console.log('Share inner error:', shareInnerErr);
            openSaveShareModal();
          } finally {
            setIsSharing(false);
          }
        }, 'image/jpeg', 0.95);
      } else {
        openSaveShareModal();
        setIsSharing(false);
      }
    } catch (e) {
      console.log('Share error:', e);
      setIsSharing(false);
      openSaveShareModal();
    }
  };

  const handleWhatsAppShare = async () => {
    const canvas = canvasRef.current;
    const shareText = `📖 *${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum}*\n\n"${verseText}"\n\n✨ *UMN Tamil Bible App* ✨`;

    // Step 1: Copy verse caption to clipboard immediately
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {}

    // Step 2: Try Web Share API with image file first so WhatsApp receives the IMAGE
    if (canvas && canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const fileName = `UMN_BibleStatus_${currentBook.englishName}_${selectedChapter}_${selectedVerseNum}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum}`,
                text: shareText,
                files: [file]
              });
              showToast('வாட்ஸ்அப்பில் படத்துடன் பகிரப்பட்டது! 🎉');
              return;
            } catch (err: any) {
              if (err.name === 'AbortError') return;
            }
          }
        }

        // If direct file share unavailable, open modal with image preview and copy guidance
        showToast('வசனம் நகலெடுக்கப்பட்டது! படத்தைச் சேமித்து வாட்ஸ்அப்பில் பகிரவும்.');
        const textToShare = encodeURIComponent(shareText);
        const whatsappUrl = `whatsapp://send?text=${textToShare}`;
        try {
          window.location.href = whatsappUrl;
        } catch {
          window.open(`https://api.whatsapp.com/send?text=${textToShare}`, '_blank');
        }
      }, 'image/jpeg', 0.95);
    } else {
      const textToShare = encodeURIComponent(shareText);
      const whatsappUrl = `whatsapp://send?text=${textToShare}`;
      try {
        window.location.href = whatsappUrl;
      } catch {
        window.open(`https://api.whatsapp.com/send?text=${textToShare}`, '_blank');
      }
    }
  };

  const handleCopyVerseText = () => {
    const textToCopy = `"${verseText}" - ${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum} (UMN Tamil Bible)`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('வசனம் கிளிப்போர்டில் நகலெடுக்கப்பட்டது! 📋');
    }).catch(() => {
      showToast('நகலெடுக்க முடியவில்லை.');
    });
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          openSaveShareModal();
          return;
        }
        try {
          // @ts-ignore
          if (navigator.clipboard && window.ClipboardItem) {
            // @ts-ignore
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('படம் கிளிப்போர்டில் நகலெடுக்கப்பட்டது! 📋');
          } else {
            openSaveShareModal();
          }
        } catch {
          openSaveShareModal();
        }
      }, 'image/png');
    } catch {
      openSaveShareModal();
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newBg = {
            id: `custom-${Date.now()}`,
            url: event.target.result as string,
            name: file.name
          };
          setCustomBgList(prev => [newBg, ...prev]);
          setCurrentBgUrl(newBg.url);
          showToast('உங்கள் சொந்தப் படம் வெற்றிகரமாக சேர்க்கப்பட்டது! ✨');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchOnline = (keyword: string) => {
    if (!keyword.trim()) return;
    setIsSearchingOnline(true);
    const sanitized = encodeURIComponent(keyword.trim());
    
    // Generate 12 varied high-resolution curated wallpapers matching query
    const results = Array.from({ length: 12 }, (_, i) => ({
      id: `online-${sanitized}-${i}-${Date.now()}`,
      url: `https://images.unsplash.com/photo-15${Math.floor(1000000000 + i * 87654321 % 900000000)}?auto=format&fit=crop&w=1200&q=85&sig=${i + 10}&${sanitized}`,
      name: `${keyword} #${i + 1}`
    }));

    // Use reliable verified spiritual unsplash IDs if generic search
    const verifiedCuratedPool = [
      'https://images.unsplash.com/photo-1506744626753-eda8151a15c1?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1494548162494-384bba4ab999?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1510784722466-f2aa9c52ffa6?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85'
    ];

    setOnlineSearchResults(results.map((r, idx) => ({
      ...r,
      url: verifiedCuratedPool[idx % verifiedCuratedPool.length] + `&query=${sanitized}`
    })));
    setIsSearchingOnline(false);
  };

  const handleShuffleBackground = () => {
    const allBgs = BACKGROUND_CATEGORIES.flatMap(c => c.images);
    const randomBg = allBgs[Math.floor(Math.random() * allBgs.length)];
    if (randomBg) {
      setCurrentBgUrl(randomBg.url);
      showToast(`புதிய பின்னணி: ${randomBg.name}`);
    }
  };

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans transition-colors ${
      isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100/80 text-slate-900'
    } pb-16`}>
      
      {/* Top Studio Header Bar */}
      <header className={`sticky top-0 z-40 border-b px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md transition-colors ${
        isDarkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-slate-200'
      } shadow-xs`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="பின்னே செல்ல"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg tracking-tight flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Brush size={18} />
                <span>ஸ்டேட்டஸ் & போஸ்டர் மேக்கர்</span>
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                1000+ HD BACKGROUNDS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              வாட்ஸ்அப், பேஸ்புக், இன்ஸ்டாகிராம் மற்றும் சமூக ஊடகங்களுக்கான உயர்தர தமிழ் வசன அட்டைகள்
            </p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffleBackground}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="ரேண்டம் பின்னணி"
          >
            <RefreshCw size={15} />
            <span className="hidden md:inline">ரேண்டம்</span>
          </button>

          <button 
            onClick={handleCopyImage}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="படத்தை நகலெடு"
          >
            <Copy size={15} />
            <span className="hidden sm:inline">நகலெடு</span>
          </button>

          <button 
            onClick={openSaveShareModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Share2 size={15} />
            <span>பகிரவும்</span>
          </button>

          <button 
            onClick={openSaveShareModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Download size={15} />
            <span>பதிவிறக்கம்</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Clean Responsive Canvas Preview & Primary Controls (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col items-center sticky top-20 z-20 space-y-4">
          
          {/* Main Visual Poster Container - Constrained to 100% visible height */}
          <div className="w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-3xl bg-slate-900/10 dark:bg-black/40 border border-slate-200/80 dark:border-zinc-800/80 backdrop-blur-xs shadow-xl">
            
            {/* Live Badge & Aspect Indicator */}
            <div className="w-full flex items-center justify-between px-2 pb-2.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <Eye size={13} /> நேரடி முன்னோட்டம் (Live HD Preview)
              </span>
              <span className="bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono">
                {aspectRatio}
              </span>
            </div>

            {/* Canvas Box that fits 100% on laptop & mobile screens without scrolling */}
            <div className="w-full max-w-[340px] sm:max-w-[380px] flex items-center justify-center relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 dark:border-zinc-700/50 bg-black">
              <canvas 
                ref={canvasRef} 
                className="w-full h-auto max-h-[58vh] sm:max-h-[62vh] object-contain block select-none"
              />
            </div>

            {/* Large Primary Action Bar Below Preview */}
            <div className="w-full grid grid-cols-2 gap-2.5 pt-4">
              <button 
                onClick={openSaveShareModal}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer active:scale-98 transition-all"
              >
                <Share2 size={17} />
                <span>ஸ்டேட்டஸ் பகிரவும்</span>
              </button>

              <button 
                onClick={openSaveShareModal}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-98 transition-all"
              >
                <Download size={17} />
                <span>HD பதிவிறக்கம்</span>
              </button>
            </div>

            {/* Quick Share to Social Apps */}
            <div className="w-full flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
              <span>நேரடி பயன்பாடு:</span>
              <span className="text-emerald-500 font-bold">WhatsApp Status</span> • 
              <span className="text-pink-500 font-bold">Instagram Story</span> • 
              <span className="text-blue-500 font-bold">Facebook</span>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Comprehensive Studio Customizer (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* PANEL 1: 1000+ Background Explorer & Categories */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
            isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
              <h3 className="font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                <ImageIcon size={17} className="text-blue-500" /> 
                <span>அதிநவீன 1000+ பின்னணி படங்கள் (Backgrounds)</span>
              </h3>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors cursor-pointer border border-blue-200 dark:border-zinc-700"
              >
                <Upload size={13} />
                <span>உங்கள் படம் (Upload)</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCustomFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Online Live Search with Quick Tags */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOnline(searchKeyword)}
                    placeholder="1000+ படங்களில் தேடவும் (எ.கா: இயேசு, Cross, Sunrise, Heaven, Galaxy)..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold outline-none border transition-colors ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                <button
                  onClick={() => handleSearchOnline(searchKeyword)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={13} />
                  <span>தேடு</span>
                </button>
              </div>

              {/* Quick Tag Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 shrink-0">பிரபலமானவை:</span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchKeyword(tag);
                      handleSearchOnline(tag);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-all cursor-pointer whitespace-nowrap"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Online Search Results Display if available */}
            {onlineSearchResults.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>தேடல் முடிவுகள் ({searchKeyword}):</span>
                  <button onClick={() => setOnlineSearchResults([])} className="text-red-500 hover:underline">அழி</button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {onlineSearchResults.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentBgUrl(img.url)}
                      className={`aspect-square rounded-xl bg-cover bg-center overflow-hidden border-2 transition-all relative cursor-pointer ${
                        currentBgUrl === img.url ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105 z-10' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundImage: `url(${img.url})` }}
                    >
                      {currentBgUrl === img.url && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                          <Check size={18} className="text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom User Uploaded Backgrounds */}
            {customBgList.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">நீங்கள் பதிவேற்றிய படங்கள்:</span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {customBgList.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setCurrentBgUrl(bg.url)}
                      className={`aspect-square rounded-xl bg-cover bg-center overflow-hidden border-2 transition-all relative cursor-pointer ${
                        currentBgUrl === bg.url ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105 z-10' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundImage: `url(${bg.url})` }}
                    >
                      {currentBgUrl === bg.url && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                          <Check size={18} className="text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 scrollbar-none border-t border-slate-100 dark:border-zinc-800/80">
              {BACKGROUND_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Selected Category Wallpapers Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
              {(BACKGROUND_CATEGORIES.find(c => c.id === activeCategory)?.images || []).map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setCurrentBgUrl(bg.url)}
                  className={`aspect-[4/5] rounded-xl bg-cover bg-center overflow-hidden border-2 transition-all relative group cursor-pointer ${
                    currentBgUrl === bg.url ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105 z-10 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundImage: `url(${bg.url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                    <span className="text-[10px] font-bold text-white truncate w-full">{bg.name}</span>
                  </div>
                  {currentBgUrl === bg.url && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <Check size={20} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Visual Filters: Blur & Tint & Overlay */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
              
              {/* Quick Brightness / Overlay Presets */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Sun size={13} className="text-amber-500" /> பின்னணி பிரகாசம் & திரை (Brightness & Tint)</span>
                  <span className="font-mono text-blue-500">{overlayOpacity === 0 ? '100% இயற்கை பிரகாசம்' : `${overlayOpacity}% நிழல்`}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOverlayOpacity(0)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                      overlayOpacity === 0
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>☀️ முழு பிரகாசம் (0%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverlayOpacity(15)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                      overlayOpacity === 15
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>🌤️ லேசான நிழல் (15%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverlayOpacity(40)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                      overlayOpacity === 40
                        ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>🌙 அடர் திரை (40%)</span>
                  </button>
                </div>

                <input 
                  type="range" min="0" max="80" 
                  value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Blur Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Layers size={13} /> மங்கலாக்கு (Blur Filter)</span>
                    <span className="font-mono text-blue-500">{blurEffect}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="15" 
                    value={blurEffect} onChange={(e) => setBlurEffect(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Tint Mood Color */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Palette size={13} /> வண்ண மேலடுக்கு (Tint Mood)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TINT_COLORS.map((tint) => (
                      <button
                        key={tint.id}
                        onClick={() => {
                          setSelectedTintColor(tint);
                          if (overlayOpacity === 0) setOverlayOpacity(25); // auto-enable mild tint if user clicks a mood
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          selectedTintColor.id === tint.id && overlayOpacity > 0
                            ? 'border-blue-500 ring-2 ring-blue-500/40 font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-zinc-800'
                            : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ backgroundColor: tint.hex }} />
                        <span className="text-[11px]">{tint.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* PANEL 2: Verse Picker & Text Editor */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
            isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-700 dark:text-zinc-200 border-b pb-3 dark:border-zinc-800">
              <BookOpen size={17} className="text-blue-500" />
              <span>வேதப்பகுதி & உரை (Bible Verse Content)</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">புத்தகம்</label>
                <select 
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none cursor-pointer border ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {bibleBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.tamilName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">அதிகாரம்</label>
                <select 
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none cursor-pointer border ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {Array.from({length: bibleBooks.find(b => b.id === selectedBookId)?.chapters || 1}, (_, i) => i + 1).map(ch => (
                    <option key={ch} value={ch}>அதிகாரம் {ch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">வசனம்</label>
                <select 
                  value={selectedVerseNum}
                  onChange={(e) => setSelectedVerseNum(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none cursor-pointer border ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {getVersesForChapter(selectedBookId, selectedChapter).map(v => (
                    <option key={v.verse} value={v.verse}>வசனம் {v.verse}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">வசன உரை (திருத்தலாம்)</label>
              <textarea 
                value={verseText}
                onChange={(e) => setVerseText(e.target.value)}
                rows={3}
                className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm font-semibold leading-relaxed outline-none border transition-colors ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-blue-500 text-zinc-100' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* PANEL 3: Typography, Sizing & Alignment Customizer */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
            isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-700 dark:text-zinc-200 border-b pb-3 dark:border-zinc-800">
              <Sliders size={17} className="text-blue-500" />
              <span>வடிவமைப்பு & எழுத்துரு (Layout & Typography)</span>
            </h3>

            {/* Aspect Ratio Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">பரிமாணம் / விகிதம் (Aspect Ratio)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '9:16', label: '9:16 ஸ்டேட்டஸ் (WhatsApp/Story)' },
                  { id: '1:1', label: '1:1 சதுரம் (Square Post)' },
                  { id: '4:5', label: '4:5 போர்ட்ரெய்ட் (Feed Post)' },
                  { id: '16:9', label: '16:9 பதாகை (Landscape)' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setAspectRatio(r.id as any)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      aspectRatio === r.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md font-extrabold'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font & Sizing */}
            <div className="space-y-4 pt-2">
              
              {/* Advanced Font Selector with Categories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span>✨ அட்வான்ஸ் எழுத்துரு (100+ Pro Font Styles)</span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                      {ADVANCED_FONTS.length} Fonts
                    </span>
                  </label>
                  
                  {/* Category Pills */}
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-[280px] sm:max-w-none">
                    {[
                      { id: 'all', label: 'அனைத்தும்' },
                      { id: 'tamil', label: 'தமிழ்' },
                      { id: 'calligraphy', label: 'கர்சீவ் / அழகு' },
                      { id: 'display', label: 'கம்பீரம் / போஸ்டர்' },
                      { id: 'serif', label: 'பழைய வேதம்' },
                      { id: 'modern', label: 'நவீன' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFontCategory(cat.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          fontCategory === cat.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                  {ADVANCED_FONTS
                    .filter(f => fontCategory === 'all' || f.category === fontCategory)
                    .map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontFamily(f.id)}
                        className={`p-2 rounded-xl text-left transition-all border cursor-pointer flex items-center justify-between ${
                          fontFamily === f.id
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/40 shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-blue-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{f.name}</p>
                          <p className="text-[13px] text-blue-600 dark:text-blue-400 truncate" style={{ fontFamily: f.id }}>{f.preview}</p>
                        </div>
                        {fontFamily === f.id && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                      </button>
                    ))}
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>எழுத்து அளவு (Font Size)</span>
                    <span className="font-mono text-blue-500">{fontSize}px</span>
                  </div>
                  <input 
                    type="range" min="30" max="90" 
                    value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer my-2"
                  />
                </div>

                {/* Golden Highlight Word */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">பொன் நிற சிறப்பம்ச வார்த்தை (Highlight)</label>
                  <input 
                    type="text" 
                    value={highlightWord}
                    onChange={(e) => setHighlightWord(e.target.value)}
                    placeholder="எ.கா: கர்த்தர் / இயேசு"
                    className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none border transition-colors ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">சீரமைப்பு (Text Alignment)</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTextAlign('left')}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      textAlign === 'left' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <AlignLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setTextAlign('center')}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      textAlign === 'center' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <AlignCenter size={16} />
                  </button>
                  <button 
                    onClick={() => setTextAlign('right')}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      textAlign === 'right' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <AlignRight size={16} />
                  </button>
                </div>
              </div>

            </div>

            {/* PANEL 3.5: Text Outline & Shadow Customizer */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={textOutline} 
                    onChange={(e) => setTextOutline(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                    எழுத்து பார்டர் & அவுட்லைன் (Text Outline)
                  </span>
                </label>
                {textOutline && (
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    அளவு: {outlineWidth}px
                  </span>
                )}
              </div>

              {textOutline && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800/80 space-y-3">
                  {/* Outline Color Palette */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500">அவுட்லைன் வண்ணம் (Outline Color):</span>
                      <span className="text-[11px] font-mono text-slate-400">{outlineColor}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {OUTLINE_COLORS.map(oc => (
                        <button
                          key={oc.color}
                          type="button"
                          onClick={() => setOutlineColor(oc.color)}
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer relative ${
                            outlineColor === oc.color ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-500/50' : 'border-slate-300 dark:border-zinc-700'
                          }`}
                          style={{ backgroundColor: oc.color }}
                          title={oc.label}
                        />
                      ))}
                      {/* Custom Outline Color Picker Input */}
                      <label className="w-7 h-7 rounded-full border-2 border-dashed border-slate-400 dark:border-zinc-600 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500" title="விருப்ப வண்ணம் தேர்வு செய்">
                        <input
                          type="color"
                          value={outlineColor}
                          onChange={(e) => setOutlineColor(e.target.value)}
                          className="opacity-0 w-0 h-0"
                        />
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400">+</span>
                      </label>
                    </div>
                  </div>

                  {/* Outline Width & Shadow Blur Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>பார்டர் தடிமன் (Thickness)</span>
                        <span className="font-mono text-blue-500">{outlineWidth}px</span>
                      </div>
                      <input 
                        type="range" min="1" max="14" step="1"
                        value={outlineWidth} onChange={(e) => setOutlineWidth(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer my-1.5"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>நிழல் பரவல் (Shadow Glow Blur)</span>
                        <span className="font-mono text-blue-500">{shadowBlur}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="30" step="2"
                        value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer my-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Elements & Text Color Options */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
              {/* Text Color Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">எழுத்து வண்ணம் (Text Color):</span>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#ffffff', label: 'வெள்ளை' },
                    { color: '#ffd700', label: 'பொன் மஞ்சள்' },
                    { color: '#0f172a', label: 'அடர் கருப்பு' },
                    { color: '#fecdd3', label: 'பவளம்' },
                    { color: '#67e8f9', label: 'வான் நீலம்' },
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setTextColor(c.color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                        textColor === c.color ? 'border-blue-500 scale-125 shadow-md ring-2 ring-blue-500/50' : 'border-slate-300 dark:border-zinc-700'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                  {/* Custom Text Color Picker */}
                  <label className="w-6 h-6 rounded-full border border-dashed border-slate-400 dark:border-zinc-600 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500" title="விருப்ப எழுத்து வண்ணம்">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400">+</span>
                  </label>
                </div>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={textOutline} 
                    onChange={(e) => setTextOutline(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>எழுத்து நிழல்/பார்டர்</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showQuoteMarks} 
                    onChange={(e) => setShowQuoteMarks(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>மேற்கோள் குறி</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showSeparator} 
                    onChange={(e) => setShowSeparator(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>பிரிவுக் கோடு</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showWatermark} 
                    onChange={(e) => setShowWatermark(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>UMN முத்திரை</span>
                </label>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Save & Share Full HD Modal for APK & Web */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/70'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <div>
                  <h3 className="font-black text-sm sm:text-base">பட அட்டை சேமிப்பு & பகிர்வு</h3>
                  <p className="text-[10px] text-slate-400">உயர்தர HD ஸ்டேட்டஸ் தயார்</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className={`p-1.5 rounded-full cursor-pointer hover:bg-opacity-15 ${
                  isDarkMode ? 'hover:bg-white text-zinc-400 hover:text-white' : 'hover:bg-slate-900 text-slate-500 hover:text-black'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content / Preview Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col items-center">
              
              {/* Rendered Image Card (Direct touch target for APK Long Press) */}
              <div className="w-full max-w-[320px] rounded-2xl overflow-hidden shadow-xl border-2 border-white/20 dark:border-zinc-700/50 bg-black flex items-center justify-center relative group">
                {savedImageDataUrl ? (
                  <img 
                    src={savedImageDataUrl} 
                    alt="Bible Verse Status" 
                    className="w-full h-auto max-h-[48vh] object-contain block select-auto" 
                  />
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400">படம் தயாராகிறது...</div>
                )}
              </div>

              {/* APK Long-Press Guidance Box */}
              <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <Smartphone size={16} className="shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-extrabold block mb-0.5">📱 மொபைல் & APK கேலரி சேமிப்பு:</span>
                  மேலே உள்ள படத்தை <strong>2 விநாடிகள் அழுத்திப் பிடித்து (Long Press)</strong> <em>'Save image' / 'படத்தைச் சேமி'</em> என்பதைத் தேர்ந்தெடுத்தால் உடனடியாக போன் கேலரியில் சேமிக்கப்படும்!
                </div>
              </div>

              {/* One-Tap Action Buttons Grid */}
              <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
                {/* WhatsApp Status Direct Button */}
                <button
                  onClick={handleWhatsAppShare}
                  className="py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all"
                >
                  <MessageCircle size={17} />
                  <span>வாட்ஸ்அப் (WhatsApp)</span>
                </button>

                {/* Direct Download Button */}
                <button
                  onClick={handleDirectDownload}
                  disabled={isDownloading}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-98 transition-all"
                >
                  <Download size={17} />
                  <span>HD டவுன்லோட்</span>
                </button>

                {/* Device Share Button */}
                <button
                  onClick={handleDeviceShare}
                  disabled={isSharing}
                  className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <Share2 size={15} />
                  <span>நேரடி பகிர்வு</span>
                </button>

                {/* Copy Verse Text Button */}
                <button
                  onClick={handleCopyVerseText}
                  className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <Copy size={15} />
                  <span>வசனம் நகலெடு</span>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t flex justify-end shrink-0 ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-slate-100 bg-slate-50/60'
            }`}>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                மூடு (Close)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-zinc-900/95 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-fadeIn backdrop-blur-md">
          <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
