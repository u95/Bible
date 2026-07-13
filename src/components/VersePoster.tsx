import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Image as ImageIcon, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sparkles, 
  BookOpen, 
  Copy, 
  Check, 
  Smartphone,
  RefreshCw,
  Sliders,
  Calendar,
  Globe,
  MapPin,
  Eye
} from 'lucide-react';
import { bibleBooks } from '../data/bibleData';
import umnLogo from '../assets/images/umn_logo_1783706606382.jpg';

// Premium High-Resolution Scenic Backgrounds matching the user's requested style
interface ScenicBackground {
  id: string;
  name: string;
  url: string;
  textColor: string;
  accentColor: string;
  shadowColor: string;
}

const SCENIC_BACKGROUNDS: ScenicBackground[] = [
  {
    id: 'mountain-halo',
    name: 'மகிமையின் மலை (Majestic Mountain Peak)',
    url: 'https://images.unsplash.com/photo-1486873249359-2731bd6dafc7?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#ffd700', // vibrant gold
    shadowColor: 'rgba(0,0,0,0.95)'
  },
  {
    id: 'sunrise-cross',
    name: 'விடியலின் சிலுவை (Wooden Cross Sunrise)',
    url: 'https://images.unsplash.com/photo-1510784722466-f2aa9c52ffa6?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#ffcc00',
    shadowColor: 'rgba(0,0,0,0.9)'
  },
  {
    id: 'serene-lake',
    name: 'அமைதியான நீர்நிலை (Path by River/Lake)',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    shadowColor: 'rgba(0,0,0,0.9)'
  },
  {
    id: 'forest-sunbeams',
    name: 'ஜீவ வழிப் பாதை (Forest Sunbeams)',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    shadowColor: 'rgba(0,0,0,0.9)'
  },
  {
    id: 'divine-beams',
    name: 'பரலோக ஜோதி (Golden Divine Light)',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    shadowColor: 'rgba(0,0,0,0.85)'
  },
  {
    id: 'heavenly-clouds',
    name: 'தேவ மேகங்கள் (Heavenly Skies)',
    url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    shadowColor: 'rgba(0,0,0,0.85)'
  },
  {
    id: 'peaceful-woods',
    name: 'அமைதியான சோலை (Deep Woods)',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#81c784',
    shadowColor: 'rgba(0,0,0,0.9)'
  },
  {
    id: 'starry-cosmic',
    name: 'விண்மீன் மண்டலம் (Starry Night Sky)',
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80',
    textColor: '#ffffff',
    accentColor: '#4fc3f7',
    shadowColor: 'rgba(0,0,0,0.95)'
  }
];

// Curated beautiful popular Tamil Bible Verses for immediate status creation
interface PresetVerse {
  bookName: string;
  tamilName: string;
  chapter: number;
  verse: number;
  text: string;
  highlight: string;
}

const PRESET_VERSES: PresetVerse[] = [
  {
    bookName: "Habakkuk",
    tamilName: "ஆபாகூக்",
    chapter: 2,
    verse: 3,
    text: "தாமதத்தாலும் காத்திரு நிச்சயமாக வரும்",
    highlight: "காத்திரு"
  },
  {
    bookName: "John",
    tamilName: "யோவான்",
    chapter: 14,
    verse: 6,
    text: "நான் வழியும் சத்தியமும் ஜீவனுமாயிருக்கிறேன்.",
    highlight: "வழியும் சத்தியமும்"
  },
  {
    bookName: "Isaiah",
    tamilName: "ஏசாயா",
    chapter: 41,
    verse: 10,
    text: "நீ பயப்படாதே, நான் உன்னுடனே இருக்கிறேன்; திகையாதே, நான் உன் தேவன்.",
    highlight: "பயப்படாதே"
  },
  {
    bookName: "Psalms",
    tamilName: "சங்கீதம்",
    chapter: 23,
    verse: 1,
    text: "கர்த்தர் என் மேய்ப்பராயிருக்கிறார், நான் தாழ்ச்சியடையேன்.",
    highlight: "மேய்ப்பராயிருக்கிறார்"
  },
  {
    bookName: "Matthew",
    tamilName: "மத்தேயு",
    chapter: 6,
    verse: 33,
    text: "முதலாவது தேவனுடைய ராஜ்யத்தையும் அவருடைய நீதியையும் தேடுங்கள்.",
    highlight: "தேவனுடைய ராஜ்யத்தையும்"
  },
  {
    bookName: "Philippians",
    tamilName: "பிலிப்பியர்",
    chapter: 4,
    verse: 13,
    text: "என்னைப் பெலப்படுத்துகிற கிறிஸ்துவினாலே எல்லாவற்றையுஞ்செய்ய எனக்குப் பெலனுண்டு.",
    highlight: "கிறிஸ்துவினாலே"
  }
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
  // Navigation & Verse Selection States
  const [selectedBookId, setSelectedBookId] = useState<number>(initialVerse?.bookId || 19); // Default to Psalms/Habakkuk
  const [selectedChapter, setSelectedChapter] = useState<number>(initialVerse?.chapter || 23);
  const [selectedVerseNum, setSelectedVerseNum] = useState<number>(initialVerse?.verse || 1);
  const [verseText, setVerseText] = useState<string>(initialVerse?.text || "கர்த்தர் என் மேய்ப்பராயிருக்கிறார், நான் தாழ்ச்சியடையேன்.");

  // Dropdown options
  const currentBook = bibleBooks.find(b => b.id === selectedBookId) || bibleBooks[0];
  const totalChapters = currentBook.chapters;

  const [customEditing, setCustomEditing] = useState<boolean>(false);

  // Core Customization & Image/Theme States
  const [dailyAuto, setDailyAuto] = useState<boolean>(true); // True by default for auto-changing backgrounds!
  const [selectedBgIndex, setSelectedBgIndex] = useState<number>(0);
  const [bgOpacity, setBgOpacity] = useState<number>(15); // Default 15% dark overlay to preserve high text readability
  const [fontFamily, setFontFamily] = useState<string>('"Mukta Malar"'); // default heavy Tamil font
  const [highlightWord, setHighlightWord] = useState<string>(""); // Word to highlight in gold

  // Layout customization
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('9:16'); // default 9:16 for WhatsApp Status
  const [fontSize, setFontSize] = useState<number>(50); // optimized high resolution base size
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showAppPromo, setShowAppPromo] = useState<boolean>(true);
  const [locationLabel, setLocationLabel] = useState<string>("CHENNAI");
  const [websiteLabel, setWebsiteLabel] = useState<string>("bibleonlineumnministry.blogspot.com");

  // Pre-loaded Image cache state to avoid visual flickering on canvas re-draws
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgLoading, setBgLoading] = useState<boolean>(false);

  // Preview States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Helper to determine background option dynamically
  const getActiveBackground = (): ScenicBackground => {
    if (dailyAuto) {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const index = dayOfYear % SCENIC_BACKGROUNDS.length;
      return SCENIC_BACKGROUNDS[index];
    }
    return SCENIC_BACKGROUNDS[selectedBgIndex] || SCENIC_BACKGROUNDS[0];
  };

  const activeBackground = getActiveBackground();

  // Load Unsplash background image safely into HTMLImageElement
  useEffect(() => {
    setBgLoading(true);
    const img = new Image();
    img.src = activeBackground.url;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setBgImage(img);
      setBgLoading(false);
    };
    img.onerror = () => {
      console.error("Failed to load background image:", activeBackground.url);
      setBgImage(null);
      setBgLoading(false);
    };
  }, [activeBackground.url]);

  // Handle Preset Verse Selection
  const applyPresetVerse = (preset: PresetVerse) => {
    setCustomEditing(true);
    setVerseText(preset.text);
    setHighlightWord(preset.highlight);
    const bk = bibleBooks.find(b => b.englishName.toLowerCase() === preset.bookName.toLowerCase());
    if (bk) {
      setSelectedBookId(bk.id);
      setSelectedChapter(preset.chapter);
      setSelectedVerseNum(preset.verse);
    }
  };

  // Synchronize initial selection on mount
  useEffect(() => {
    if (initialVerse) {
      setVerseText(initialVerse.text);
      setSelectedBookId(initialVerse.bookId);
      setSelectedChapter(initialVerse.chapter);
      setSelectedVerseNum(initialVerse.verse);
      
      // Auto-identify highlightable words if possible
      const splitWords = initialVerse.text.split(" ");
      if (splitWords.length > 3) {
        setHighlightWord(splitWords[Math.floor(splitWords.length / 2)]);
      }
    }
  }, [initialVerse]);

  // Watch selector variables to fetch text dynamically (if not manually typing)
  useEffect(() => {
    if (!customEditing && !initialVerse) {
      // Pull dynamic Tamil scripture text or fallbacks
      const key = `${selectedBookId}-${selectedChapter}-${selectedVerseNum}`;
      const matchingPreset = PRESET_VERSES.find(v => {
        const bk = bibleBooks.find(b => b.englishName.toLowerCase() === v.bookName.toLowerCase());
        return bk && bk.id === selectedBookId && v.chapter === selectedChapter && v.verse === selectedVerseNum;
      });

      if (matchingPreset) {
        setVerseText(matchingPreset.text);
        setHighlightWord(matchingPreset.highlight);
      } else {
        // Fallback or placeholder verses with beautiful flow
        setVerseText(`கர்த்தர் உன்னை ஆசீர்வதித்து, உன்னைக் காக்கக்கடவர். கர்த்தர் தம்முடைய முகத்தை உன்மேல் பிரகாசிப்பித்து, உன்மேல் கிருபையாயிருக்கக்கடவர்.`);
        setHighlightWord("ஆசீர்வதித்து");
      }
    }
  }, [selectedBookId, selectedChapter, selectedVerseNum, customEditing, initialVerse]);

  // Core effect to draw canvas on any parameter edit
  useEffect(() => {
    drawPoster();
  }, [
    verseText, 
    bgImage, 
    bgOpacity, 
    highlightWord, 
    fontFamily, 
    aspectRatio, 
    fontSize, 
    textAlign, 
    showLogo, 
    showAppPromo, 
    locationLabel, 
    websiteLabel, 
    selectedBookId, 
    selectedChapter, 
    selectedVerseNum
  ]);

  // Canvas scaling / Cover drawing helper
  const drawImageProp = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    const r = Math.min(w / imgWidth, h / imgHeight);
    let nw = imgWidth * r;
    let nh = imgHeight * r;
    let cx = 1;
    let cy = 1;

    if (nw < w) { cx = w / nw; nw = w; nh = nh * cx; }
    if (nh < h) { cy = h / nh; nh = h; nw = nw * cy; }

    const sx = (imgWidth - (w / cx)) / 2;
    const sy = (imgHeight - (h / cy)) / 2;

    ctx.drawImage(img, sx, sy, w / cx, h / cy, x, y, w, h);
  };

  // Helper to draw text line with single-word high-contrast highlight
  const drawTextLineWithHighlight = (
    ctx: CanvasRenderingContext2D,
    line: string,
    x: number,
    y: number,
    hlWord: string,
    textColor: string,
    hlColor: string
  ) => {
    if (!hlWord || !line.toLowerCase().includes(hlWord.toLowerCase())) {
      ctx.fillStyle = textColor;
      ctx.fillText(line, x, y);
      return;
    }

    // Split text by highlight word preserving match
    const regex = new RegExp(`(${escapeRegExp(hlWord)})`, 'gi');
    const parts = line.split(regex);
    
    // Compute starting X coordinate for center/right alignments
    const totalWidth = ctx.measureText(line).width;
    let currentX = x;
    
    if (ctx.textAlign === 'center') {
      currentX = x - totalWidth / 2;
    } else if (ctx.textAlign === 'right') {
      currentX = x - totalWidth;
    }
    
    const originalAlign = ctx.textAlign;
    ctx.textAlign = 'left';

    parts.forEach(part => {
      if (part.toLowerCase() === hlWord.toLowerCase()) {
        ctx.fillStyle = hlColor;
        // Draw heavy shadow under highlighted text to replicate high-end premium contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 18;
      } else {
        ctx.fillStyle = textColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
      }
      ctx.fillText(part, currentX, y);
      currentX += ctx.measureText(part).width;
    });

    ctx.textAlign = originalAlign;
  };

  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Primary rendering engine for HD Image Generator
  const drawPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define HD Resolution size: 1080x1920 (Status 9:16) or 1080x1080 (Post 1:1)
    const width = 1080;
    const height = aspectRatio === '9:16' ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    // Draw background (Image or fallback gradient)
    if (bgImage) {
      drawImageProp(ctx, bgImage, 0, 0, width, height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#101725');
      gradient.addColorStop(1, '#070a10');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Apply soft dark overlay to ensure maximum legibility for scripture text
    if (bgOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${bgOpacity / 100})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Add glowing halo effect at the center top (similar to mountain photo)
    const radialGlow = ctx.createRadialGradient(width / 2, height / 2.3, 100, width / 2, height / 2.3, 500);
    radialGlow.addColorStop(0, 'rgba(255, 215, 0, 0.12)'); // soft gold glow
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Draw solid elegant outer margins/borders (matching Image 1)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = '#ffd70035'; // faint gold border
    ctx.lineWidth = 3;
    ctx.strokeRect(46, 46, width - 92, height - 92);

    // Setup typographic baseline
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    // Process & wrap main scripture text
    ctx.font = `bold ${fontSize}px ${fontFamily}, system-ui, sans-serif`;
    ctx.textAlign = textAlign;
    const textPadding = 120;
    const maxTextWidth = width - (textPadding * 2);
    
    const lines = wrapText(ctx, verseText, maxTextWidth);
    const textTotalHeight = lines.length * (fontSize * 1.6);
    let startY = (height / 2) - (textTotalHeight / 2) - 40;

    // Adjust position based on content layout
    if (aspectRatio === '9:16') {
      startY = (height / 2) - (textTotalHeight / 2) + 20;
    }

    // Draw Quote Mark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = '240px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('“', width / 2, startY - 60);

    // Draw main scripture lines
    ctx.font = `bold ${fontSize}px ${fontFamily}, system-ui, sans-serif`;
    ctx.textAlign = textAlign;

    lines.forEach((line, index) => {
      const lineY = startY + (index * (fontSize * 1.6));
      let lineX = width / 2;
      if (textAlign === 'left') lineX = textPadding;
      if (textAlign === 'right') lineX = width - textPadding;

      drawTextLineWithHighlight(
        ctx, 
        line, 
        lineX, 
        lineY, 
        highlightWord, 
        activeBackground.textColor, 
        '#ffd700' // Gold highlight color
      );
    });

    // Reset shadow for structural elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw Scripture Reference Pill + Filigree (exactly like user's Habakkuk photo)
    const referenceY = startY + (lines.length * (fontSize * 1.6)) + 50;
    const referenceText = `${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum}`;
    
    ctx.font = `bold 28px ${fontFamily}, system-ui, sans-serif`;
    const textWidth = ctx.measureText(referenceText).width;
    const pillWidth = textWidth + 80;
    const pillHeight = 56;
    const pillX = width / 2 - pillWidth / 2;
    const pillY = referenceY - pillHeight / 2;

    // Draw Pill Background (black translucent)
    ctx.fillStyle = 'rgba(10, 13, 20, 0.75)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
    ctx.fill();

    // Draw Pill Gold Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
    ctx.stroke();

    // Draw Pill Text
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(referenceText, width / 2, referenceY + 9);

    // Draw Gold Leaf Filigree Flourishes on Left and Right of reference (replicates Image 1)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;

    // Left Filigree
    ctx.beginPath();
    ctx.moveTo(pillX - 25, referenceY);
    ctx.lineTo(pillX - 95, referenceY);
    ctx.stroke();
    
    // Draw leaf buds
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(pillX - 102, referenceY, 5, 0, Math.PI * 2); // Center bud
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pillX - 82, referenceY - 12, 4, 0, Math.PI * 2); // Upper bud
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pillX - 82, referenceY + 12, 4, 0, Math.PI * 2); // Lower bud
    ctx.fill();

    // Right Filigree
    ctx.beginPath();
    ctx.moveTo(pillX + pillWidth + 25, referenceY);
    ctx.lineTo(pillX + pillWidth + 95, referenceY);
    ctx.stroke();

    // Draw leaf buds
    ctx.beginPath();
    ctx.arc(pillX + pillWidth + 102, referenceY, 5, 0, Math.PI * 2); // Center bud
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pillX + pillWidth + 82, referenceY - 12, 4, 0, Math.PI * 2); // Upper bud
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pillX + pillWidth + 82, referenceY + 12, 4, 0, Math.PI * 2); // Lower bud
    ctx.fill();

    // Draw circular framed UMN logo at the bottom center
    if (showLogo) {
      const logoImg = new Image();
      logoImg.src = umnLogo;
      logoImg.crossOrigin = "anonymous";
      logoImg.onload = () => {
        const logoSize = 135;
        const logoX = width / 2 - logoSize / 2;
        // Push logo to bottom but within border
        const logoY = height - 310;

        // Circular clip path for logo image
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();

        // High-contrast gold ring around logo (Image 1 style)
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(width / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing white circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, logoY + logoSize / 2, logoSize / 2 - 4, 0, Math.PI * 2);
        ctx.stroke();

        // CHENNAI Location Pill underneath logo
        const badgeText = locationLabel.toUpperCase() || "CHENNAI";
        ctx.font = 'black 20px system-ui, -apple-system, sans-serif';
        const badgeWidth = ctx.measureText(badgeText).width + 50;
        const badgeHeight = 36;
        const badgeX = width / 2 - badgeWidth / 2;
        const badgeY = logoY + logoSize + 15;

        // Draw Location Badge Box
        ctx.fillStyle = '#070a10';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
        ctx.fill();

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
        ctx.stroke();

        // Draw Location text
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, width / 2, badgeY + 25);

        // Continue to draw final website footer
        drawWebsiteFooter(ctx, width, height);
      };

      logoImg.onerror = () => {
        drawWebsiteFooter(ctx, width, height);
      };
    } else {
      drawWebsiteFooter(ctx, width, height);
    }
  };

  const drawWebsiteFooter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (showAppPromo) {
      const footerY = height - 75;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      
      // Draw globe emoji symbol + website label beautifully
      ctx.fillText(`🌐  ${websiteLabel}`, width / 2, footerY);

      // Delicate gold separator bar above website
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.fillRect(width / 2 - 220, footerY - 45, 440, 2);
    }

    // Refresh browser URL artifact for download/rendering
    try {
      const dataUrl = canvasRef.current?.toDataURL('image/jpeg', 0.95);
      if (dataUrl) {
        setPreviewUrl(dataUrl);
      }
    } catch (e) {
      console.error("Failed to generate preview URL", e);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      const link = document.createElement('a');
      link.download = `umn_tamil_bible_status_${selectedBookId}_${selectedChapter}_${selectedVerseNum}.jpg`;
      link.href = previewUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      alert("படம் பதிவிறக்கம் செய்வதில் சிக்கல் ஏற்பட்டது. கீழே உள்ள படத்தை நீண்ட நேரம் அழுத்தி உங்கள் கேலரியில் நேரடியாகச் சேமிக்கவும்!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`"${verseText}"\n— ${currentBook.tamilName} ${selectedChapter}:${selectedVerseNum}\nபதிவிறக்க UMN Tamil Bible App ஐப் பயன்படுத்தவும்.`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-slate-950 text-white flex flex-col h-full z-30">
      
      {/* Title Bar Header */}
      <div className="h-14 shrink-0 bg-blue-700 text-white flex items-center justify-between px-4 shadow-md select-none">
        <button 
          onClick={onBack}
          className="p-1 rounded-full hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-black tracking-wide flex items-center justify-center gap-1 uppercase">
            <Sparkles size={14} className="text-yellow-300 animate-pulse" /> UMN ஸ்டேட்டஸ் மேக்கர்
          </h2>
          <p className="text-[8px] text-blue-100 font-bold">Daily Tamil Bible Status Generator</p>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/25 bg-slate-950 shrink-0 shadow-sm flex items-center justify-center">
          <img 
            src={umnLogo} 
            alt="UMN Logo" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Help Banner tailored for Android APK download */}
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-3.5 flex gap-3 items-start">
          <Smartphone size={22} className="text-blue-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wide block">போன் கேலரியில் சேமிப்பது எப்படி?</span>
            <p className="text-[10px] text-slate-300 leading-normal">
              வாட்ஸ்அப் ஸ்டேட்டஸ் வைக்க <strong>"பதிவிறக்கு"</strong> பொத்தானை அழுத்தவும். படம் உங்கள் கேலரியில் நேரடியாக சேமிக்கப்படும். ஒருவேளை அது வேலை செய்யாவிட்டால், <strong>கீழே உள்ள போஸ்டர் படத்தை நீண்ட நேரம் அழுத்தி (Long Press)</strong> நேரடியாக உங்கள் போனில் சேமித்துக் கொள்ளலாம்.
            </p>
          </div>
        </div>

        {/* Real-time Rendered Poster Frame */}
        <div className="flex flex-col items-center justify-center py-1">
          <div className="text-center mb-1.5 flex items-center gap-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">உயர்தர நேரடிப் போஸ்டர் (HD Live Preview)</span>
          </div>

          {/* Offscreen rendering Canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scalable Container representing Mobile Aspect Ratio */}
          <div className={`relative ${aspectRatio === '9:16' ? 'w-[235px] h-[418px]' : 'w-[265px] h-[265px]'} rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 transition-all duration-300`}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Bible Verse Poster" 
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <span>போஸ்டர் தயாராகிறது...</span>
              </div>
            )}

            {bgLoading && (
              <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-[8px] font-bold text-yellow-400 flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> படம் பதிவிறக்கமாகிறது...
              </div>
            )}
          </div>
          
          <p className="text-[9px] text-slate-500 mt-2 italic text-center">
            * 1080px HD தரத்தில் அட்டைப்படம் உருவாக்கப்படும்.
          </p>
        </div>

        {/* Action Button Segment */}
        <div className="grid grid-cols-2 gap-2 select-none">
          <button
            onClick={handleDownload}
            disabled={isGenerating || !previewUrl}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98"
          >
            <Download size={15} /> 
            <span>{isGenerating ? "சேமிக்கப்படுகிறது..." : "பதிவிறக்கு (Save)"}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-extrabold py-3.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Copy size={15} />
            <span>வசனத்தை நகலெடு</span>
          </button>
        </div>

        {/* Toast Notification indicator inside tool */}
        {isCopied && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-2.5 px-4 text-[10px] font-bold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
            <Check size={14} /> 
            <span>கேலரியில் சேமிக்கப்பட்டது / நகலெடுக்கப்பட்டது வெற்றிகரமாக!</span>
          </div>
        )}

        {/* Interactive Customization Controls */}
        <div className="space-y-4 pt-2">
          
          {/* Quick Preset Verses Container */}
          <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'bg-zinc-900/40 border border-zinc-800/60' : 'bg-slate-800/20 border border-slate-700/30'} space-y-2`}>
            <span className="text-[10px] font-extrabold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-yellow-400" /> விரைவான வசன வார்ப்புருக்கள் (Presets)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_VERSES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPresetVerse(preset)}
                  className="p-2 text-left bg-slate-900/60 hover:bg-slate-900 text-white border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <div className="text-[8px] text-yellow-400 font-extrabold">{preset.tamilName} {preset.chapter}:{preset.verse}</div>
                  <div className="text-[9px] truncate font-serif text-slate-300">{preset.text}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Background Scenery Selection */}
          <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'bg-zinc-900/40 border border-zinc-800/60' : 'bg-slate-800/20 border border-slate-700/30'} space-y-3`}>
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon size={12} /> பின்னணிக் காட்சி (Scenic Background)
              </span>
              
              {/* Daily Auto Switch */}
              <button
                onClick={() => setDailyAuto(!dailyAuto)}
                className={`text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-all ${dailyAuto ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}
              >
                <Calendar size={10} /> 
                {dailyAuto ? "தினசரி தானியங்கி: ஆன்" : "தினசரி தானியங்கி: ஆஃப்"}
              </button>
            </div>

            {dailyAuto ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
                <p className="text-[10px] text-emerald-400 font-bold">
                  📅 இன்றைய தினம்: <span className="underline">{activeBackground.name.split(' ')[0]}</span> பின்னணி தானாகவே தேர்வு செய்யப்பட்டுள்ளது!
                </p>
                <p className="text-[8px] text-slate-400 mt-1">
                  ஒவ்வொரு நாளும் புதிய பின்னணி படம் தானாகவே மாறும். கையேடு மூலம் தேர்வு செய்ய 'தானியங்கி' பொத்தானை அணைக்கவும்.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[9px] text-slate-400 font-extrabold block">காட்சியைத் தேர்ந்தெடு (Manual Scenery Selection)</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
                  {SCENIC_BACKGROUNDS.map((bg, idx) => {
                    const isSelected = selectedBgIndex === idx && !dailyAuto;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => {
                          setDailyAuto(false);
                          setSelectedBgIndex(idx);
                        }}
                        className={`flex-shrink-0 p-1.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${isSelected ? 'border-orange-400 bg-slate-900 shadow-md scale-102' : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'}`}
                      >
                        <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/10">
                          <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-300 max-w-[70px] text-center truncate">{bg.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Readability Overlay Adjuster (Slider) */}
            <div className="space-y-1 pt-1.5 border-t border-slate-800">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                <span>எழுத்துத் தெளிவு நிழல் (Contrast Overlay)</span>
                <span className="text-yellow-400">{bgOpacity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="80" 
                value={bgOpacity}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[8px] text-slate-500 block leading-tight">
                * உரை தெளிவாகத் தெரிய பின்னணிப் படத்தை இதைக் கொண்டு சிறிது இருட்டாக்கிக் கொள்ளலாம்.
              </span>
            </div>
          </div>

          {/* Section 2: Scripture Verse Picker & Text Editor */}
          <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'bg-zinc-900/40 border border-zinc-800/60' : 'bg-slate-800/20 border border-slate-700/30'} space-y-3`}>
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <BookOpen size={12} /> வசனத் தேர்வு & திருத்தம் (Verse Content)
              </span>
              <button
                onClick={() => setCustomEditing(!customEditing)}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-all ${customEditing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                {customEditing ? "வேதத்திலிருந்து எடு" : "சொந்தமாக எழுது"}
              </button>
            </div>

            {customEditing ? (
              <div className="space-y-2">
                <textarea
                  value={verseText}
                  onChange={(e) => setVerseText(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-blue-500 resize-none font-serif text-white leading-normal"
                  placeholder="இங்கே உங்கள் தியான வசனத்தை தட்டச்சு செய்யவும்..."
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Book & Chapter selector row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">புத்தகம்</label>
                    <select
                      value={selectedBookId}
                      onChange={(e) => {
                        setSelectedBookId(Number(e.target.value));
                        setSelectedChapter(1);
                        setSelectedVerseNum(1);
                      }}
                      className="w-full p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white outline-none cursor-pointer font-bold"
                    >
                      {bibleBooks.map(book => (
                        <option key={book.id} value={book.id}>{book.tamilName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">அதிகாரம்</label>
                      <select
                        value={selectedChapter}
                        onChange={(e) => {
                          setSelectedChapter(Number(e.target.value));
                          setSelectedVerseNum(1);
                        }}
                        className="w-full p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white outline-none cursor-pointer font-bold"
                      >
                        {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">வசனம்</label>
                      <select
                        value={selectedVerseNum}
                        onChange={(e) => setSelectedVerseNum(Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white outline-none cursor-pointer font-bold"
                      >
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live text modification */}
                <div className="space-y-1">
                  <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">திருத்தம் (விருப்பம்)</label>
                  <input
                    type="text"
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white outline-none font-serif"
                  />
                </div>
              </div>
            )}

            {/* Word Highlight control */}
            <div className="space-y-1 pt-1.5 border-t border-slate-800">
              <label className="text-[9px] text-slate-400 font-extrabold block">தங்க நிறத்தில் ஒளிரச் செய்ய வேண்டிய சொல் (Word to Highlight in Gold):</label>
              <input
                type="text"
                value={highlightWord}
                onChange={(e) => setHighlightWord(e.target.value)}
                placeholder="எ.கா: காத்திரு"
                className="w-full p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-yellow-400 font-bold outline-none"
              />
              <span className="text-[8px] text-slate-500 block leading-tight">
                * நீங்கள் உள்ளிடும் சொல் தானாகவே அட்டைப்படத்தில் தங்க நிறத்தில் ஜொலிக்கும்!
              </span>
            </div>
          </div>

          {/* Section 3: Custom Layout & Brands */}
          <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'bg-zinc-900/40 border border-zinc-800/60' : 'bg-slate-800/20 border border-slate-700/30'} space-y-3`}>
            <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders size={12} /> வடிவமைப்பு மற்றும் லோகோ (Layout & Logo Customization)
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Aspect Ratio */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block">அளவீடு (Aspect Ratio)</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-1.5 text-[9px] font-extrabold rounded-lg cursor-pointer text-center transition-all ${aspectRatio === '9:16' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    9:16 (Status)
                  </button>
                  <button
                    onClick={() => setAspectRatio('1:1')}
                    className={`py-1.5 text-[9px] font-extrabold rounded-lg cursor-pointer text-center transition-all ${aspectRatio === '1:1' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    1:1 (Post)
                  </button>
                </div>
              </div>

              {/* Typography Font Selection */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block">எழுத்துரு (Tamil Font Family)</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-1.5 text-[10px] font-extrabold rounded-xl bg-slate-950 border border-slate-800 text-white outline-none cursor-pointer"
                >
                  <option value='"Mukta Malar"'>தடித்த எழுத்து (Mukta Malar)</option>
                  <option value='"Arima"'>காட்சி எழுத்து (Arima)</option>
                  <option value='"Kavivanar"'>வளைவு எழுத்து (Kavivanar)</option>
                  <option value="system-ui">இயல்பு எழுத்து (Sans-serif)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Text Alignment */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block">உரை அமைப்பு (Alignment)</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setTextAlign('left')}
                    className={`py-1.5 flex items-center justify-center rounded-lg cursor-pointer transition-all ${textAlign === 'left' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    onClick={() => setTextAlign('center')}
                    className={`py-1.5 flex items-center justify-center rounded-lg cursor-pointer transition-all ${textAlign === 'center' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    onClick={() => setTextAlign('right')}
                    className={`py-1.5 flex items-center justify-center rounded-lg cursor-pointer transition-all ${textAlign === 'right' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    <AlignRight size={13} />
                  </button>
                </div>
              </div>

              {/* Font Size Selector */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block">எழுத்தின் அளவு (Font Size)</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-center font-bold text-[8.5px]">
                  <button
                    onClick={() => setFontSize(38)}
                    className={`py-1 rounded-lg cursor-pointer transition-all ${fontSize === 38 ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    சிறிய
                  </button>
                  <button
                    onClick={() => setFontSize(50)}
                    className={`py-1 rounded-lg cursor-pointer transition-all ${fontSize === 50 ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    நடு
                  </button>
                  <button
                    onClick={() => setFontSize(60)}
                    className={`py-1 rounded-lg cursor-pointer transition-all ${fontSize === 60 ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    பெரிய
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Location badge input */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block">ஊர் பெயர் (Location label Under Logo)</label>
                <input
                  type="text"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="CHENNAI"
                  className="w-full p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block">வலைத்தள முகவரி (Footer Website)</label>
                <input
                  type="text"
                  value={websiteLabel}
                  onChange={(e) => setWebsiteLabel(e.target.value)}
                  placeholder="bibleonlineumnministry.blogspot.com"
                  className="w-full p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold outline-none"
                />
              </div>
            </div>

            {/* Logo and Footer show/hide checkboxes */}
            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-800 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 font-bold">UMN லோகோ காட்டுக</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={showAppPromo}
                  onChange={(e) => setShowAppPromo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-800 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 font-bold">அடிக்குறிப்பு காட்டுக</span>
              </label>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
