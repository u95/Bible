import React, { useState, useEffect, useRef } from 'react';
import { 
  bibleBooks, 
  getVersesForChapter, 
  getDailyVerse, 
  searchBible, 
  searchBibleAsync, 
  BibleBook, 
  BibleVerse 
} from '../data/bibleData';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  BookMarked,
  FileText, 
  Settings, 
  Info, 
  ArrowLeft, 
  Moon, 
  Sun, 
  Type, 
  Copy, 
  Share2, 
  Trash2, 
  Check, 
  Plus,
  Compass,
  Smile,
  Church,
  ExternalLink,
  Sliders,
  Sparkles,
  ChevronRight,
  Gamepad2,
  Volume2,
  Trophy,
  Music,
  Book,
  X,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle,
  Edit3
} from 'lucide-react';
import BibleQuiz from './BibleQuiz';
import AudioBible from './AudioBible';
import VersePoster from './VersePoster';
import umnLogo from '../assets/images/umn_logo_1783706606382.jpg';

export default function BibleEmulator() {
  // Navigation & Screen Management
  // "home" | "books" | "chapters" | "read" | "search" | "bookmarks" | "notes" | "settings" | "about"
  const [currentScreen, setCurrentScreen] = useState<string>("home");
  const [history, setHistory] = useState<string[]>([]);
  
  // State variables for selected book, chapter, etc.
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const cachedChapters = useRef<Record<string, BibleVerse[]>>({});
  
  // User Preferences & Offline Storage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [bookmarks, setBookmarks] = useState<BibleVerse[]>([]);
  const [notes, setNotes] = useState<Array<{ id: string; bookId: number; bookName: string; chapter: number; verse: number; text: string; date: string }>>([]);
  const [highlights, setHighlights] = useState<Record<string, string>>({}); // verseKey -> color

  // Search Screen States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchScope, setSearchScope] = useState<'All' | 'Old' | 'New'>('All');
  const [searchBookFilter, setSearchBookFilter] = useState<number>(0); // 0 = all
  const [booksSearchQuery, setBooksSearchQuery] = useState<string>("");
  const [activeTestament, setActiveTestament] = useState<'Old' | 'New'>('Old');

  // Bookmarks & Notes Screen States
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState<string>("");
  const [bookmarkTestament, setBookmarkTestament] = useState<'All' | 'Old' | 'New'>('All');
  const [notesSearchQuery, setNotesSearchQuery] = useState<string>("");
  const [notesBookFilter, setNotesBookFilter] = useState<number>(0);

  // Note dialog customization (for creating a new note from scratch)
  const [noteFormBookId, setNoteFormBookId] = useState<number>(1);
  const [noteFormChapter, setNoteFormChapter] = useState<number>(1);
  const [noteFormVerse, setNoteFormVerse] = useState<number>(1);
  const [isCustomNoteMode, setIsCustomNoteMode] = useState<boolean>(false);

  // Interactive popup modals or dialogs
  const [selectedVerseForAction, setSelectedVerseForAction] = useState<BibleVerse | null>(null);
  const [selectedVerseForPoster, setSelectedVerseForPoster] = useState<BibleVerse | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>("");
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [activeRedirectUrl, setActiveRedirectUrl] = useState<string | null>(null);
  const [activeRedirectTitle, setActiveRedirectTitle] = useState<string>("");
  const [isFontDialogHovered, setIsFontDialogHovered] = useState<boolean>(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState<string>("");
  const [adMode, setAdMode] = useState<'test' | 'live'>('live');

  // Daily Verse
  const [dailyVerse, setDailyVerse] = useState<BibleVerse & { englishBookName: string } | null>(null);

  // Initialize data on load
  useEffect(() => {
    // Load local storage items
    const savedDark = localStorage.getItem('umn_dark_mode');
    if (savedDark) setIsDarkMode(savedDark === 'true');

    const savedFont = localStorage.getItem('umn_font_size');
    if (savedFont) setFontSize(parseInt(savedFont));

    const savedBookmarks = localStorage.getItem('umn_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error("Error parsing bookmarks from localStorage", e);
      }
    }

    const savedNotes = localStorage.getItem('umn_notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Error parsing notes from localStorage", e);
      }
    }

    const savedHighlights = localStorage.getItem('umn_highlights');
    if (savedHighlights) {
      try {
        setHighlights(JSON.parse(savedHighlights));
      } catch (e) {
        console.error("Error parsing highlights from localStorage", e);
      }
    }

    setDailyVerse(getDailyVerse());
  }, []);

  // Save updates to local storage helper functions
  const saveBookmarks = (newBms: BibleVerse[]) => {
    setBookmarks(newBms);
    localStorage.setItem('umn_bookmarks', JSON.stringify(newBms));
  };

  const saveNotes = (newNotes: typeof notes) => {
    setNotes(newNotes);
    localStorage.setItem('umn_notes', JSON.stringify(newNotes));
  };

  const saveHighlights = (newHighlights: typeof highlights) => {
    setHighlights(newHighlights);
    localStorage.setItem('umn_highlights', JSON.stringify(newHighlights));
  };

  const handleToggleDark = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    localStorage.setItem('umn_dark_mode', String(newVal));
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('umn_font_size', String(size));
  };

  // Navigation push helper
  const navigateTo = (screen: string) => {
    setHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  // Navigation pop helper
  const navigateBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prevHistory => prevHistory.slice(0, -1));
      setCurrentScreen(prev);
    } else {
      setCurrentScreen("home");
    }
  };

  // When selectedBook or selectedChapter changes, load the verses
  useEffect(() => {
    let active = true;
    if (selectedBook) {
      const cacheKey = `${selectedBook.id}-${selectedChapter}`;
      
      // Check if we already have this chapter cached
      if (cachedChapters.current[cacheKey]) {
        setVerses(cachedChapters.current[cacheKey]);
        setIsLoadingLive(false);
        setIsLiveConnected(true);
        return;
      }

      setIsLoadingLive(true);
      setIsLiveConnected(false);

      // Fetch the full book JSON from our offline/local folder
      fetch(`bible/${encodeURIComponent(selectedBook.englishName)}.json`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`அதிகாரத்தை ஏற்றுவதில் சிக்கல் (Status: ${res.status})`);
          }
          return res.json();
        })
        .then(data => {
          if (!active) return;
          
          if (data && data.chapters && Array.isArray(data.chapters)) {
            // Find the specific selected chapter in the downloaded book JSON
            const chapterData = data.chapters.find((c: any) => c.chapter === selectedChapter.toString());
            
            if (chapterData && Array.isArray(chapterData.verses)) {
              const fetched: BibleVerse[] = chapterData.verses.map((item: any) => ({
                bookId: selectedBook.id,
                bookName: selectedBook.tamilName,
                chapter: selectedChapter,
                verse: parseInt(item.verse),
                text: item.text
              }));
              
              // Update state with authentic offline verses!
              setVerses(fetched);
              setIsLiveConnected(true);
              setIsLoadingLive(false);
              
              // Cache this chapter for instant retrieval later
              cachedChapters.current[cacheKey] = fetched;
            } else {
              throw new Error("அதிகாரம் காணப்படவில்லை (Chapter not found)");
            }
          } else {
            throw new Error("தவறான தரவு வடிவம் (Invalid data format)");
          }
        })
        .catch(err => {
          if (!active) return;
          console.error("Local fetch failed, trying fallback:", err);
          
          // Last-resort fallback using mock data generator
          const chapterVerses = getVersesForChapter(selectedBook.id, selectedChapter);
          setVerses(chapterVerses);
          setIsLiveConnected(false);
          setIsLoadingLive(false);
        });
    }
    return () => {
      active = false;
    };
  }, [selectedBook, selectedChapter]);

  // Bookmarks handlers
  const isBookmarked = (v: BibleVerse) => {
    return bookmarks.some(b => b.bookId === v.bookId && b.chapter === v.chapter && v.verse === b.verse);
  };

  const toggleBookmark = (v: BibleVerse) => {
    if (isBookmarked(v)) {
      const filtered = bookmarks.filter(b => !(b.bookId === v.bookId && b.chapter === v.chapter && v.verse === b.verse));
      saveBookmarks(filtered);
    } else {
      saveBookmarks([...bookmarks, v]);
    }
  };

  // Search Bible
  const handleBibleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchBibleAsync(q);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Text highlight helper
  const handleHighlight = (v: BibleVerse, color: string) => {
    const key = `${v.bookId}-${v.chapter}-${v.verse}`;
    const newHighlights = { ...highlights };
    if (color === "") {
      delete newHighlights[key];
    } else {
      newHighlights[key] = color;
    }
    saveHighlights(newHighlights);
    setSelectedVerseForAction(null);
  };

  // Notes actions
  const openNoteDialog = (v: BibleVerse) => {
    const existingNote = notes.find(n => n.bookId === v.bookId && n.chapter === v.chapter && n.verse === v.verse);
    setNoteInput(existingNote ? existingNote.text : "");
    setSelectedVerseForAction(v);
    setIsNoteModalOpen(true);
  };

  const saveNote = () => {
    if (!selectedVerseForAction) return;
    const v = selectedVerseForAction;
    const existingIdx = notes.findIndex(n => n.bookId === v.bookId && n.chapter === v.chapter && n.verse === v.verse);
    
    const timestamp = new Date().toLocaleDateString('ta-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    
    if (noteInput.trim() === "") {
      // Delete empty notes
      if (existingIdx !== -1) {
        const filtered = notes.filter((_, idx) => idx !== existingIdx);
        saveNotes(filtered);
      }
    } else {
      if (existingIdx !== -1) {
        // Edit existing
        const updated = [...notes];
        updated[existingIdx] = {
          ...updated[existingIdx],
          text: noteInput,
          date: timestamp
        };
        saveNotes(updated);
      } else {
        // Create new
        const newNote = {
          id: Math.random().toString(),
          bookId: v.bookId,
          bookName: v.bookName,
          chapter: v.chapter,
          verse: v.verse,
          text: noteInput,
          date: timestamp
        };
        saveNotes([...notes, newNote]);
      }
    }
    
    setIsNoteModalOpen(false);
    setSelectedVerseForAction(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, url: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveRedirectUrl(url);
    setActiveRedirectTitle(title);
  };

  const shareVerse = (v: BibleVerse) => {
    const shareText = `"${v.text}"\n— ${v.bookName} ${v.chapter}:${v.verse}\nUMN Tamil Bible`;
    if (navigator.share) {
      navigator.share({
        title: 'UMN Tamil Bible',
        text: shareText,
      }).catch(err => {
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
      alert("பகிர்வதற்கான உரை நகலெடுக்கப்பட்டது!");
    }
  };

  // Reset all application data
  const handleClearAppStorage = () => {
    if (window.confirm("உங்கள் சேமிக்கப்பட்ட குறிப்புகள், அடையாளங்கள் மற்றும் சிறப்பம்சங்களை முழுமையாக அழிக்க விரும்புகிறீர்களா?")) {
      localStorage.clear();
      setIsDarkMode(false);
      setFontSize(18);
      setBookmarks([]);
      setNotes([]);
      setHighlights({});
      setCurrentScreen("home");
    }
  };

  // Books filtering
  const filteredBooks = bibleBooks.filter(b => {
    const q = booksSearchQuery.toLowerCase().trim();
    if (q === "") return b.testament === activeTestament;
    return (
      b.tamilName.toLowerCase().includes(q) || 
      b.englishName.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Web Navigation Bar */}
      <nav className={`w-full border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
        isDarkMode ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-slate-200 text-slate-900'
      } shadow-xs`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left Brand & Title */}
            <div className="flex items-center gap-3">
              {currentScreen !== "home" && (
                <button 
                  onClick={navigateBack} 
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-200' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="பின்னே செல்ல"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div 
                onClick={() => { setHistory([]); setCurrentScreen("home"); }}
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-blue-500/20 shadow-xs bg-slate-900 shrink-0">
                  <img 
                    src={umnLogo} 
                    alt="UMN Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-blue-600 dark:text-blue-400">UMN தமிழ் வேதாகமம்</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 hidden sm:inline-block">
                      WEB PORTAL
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">
                    {currentScreen === "home" && "முகப்புப் பக்கம்"}
                    {currentScreen === "books" && "வேதாகமப் புத்தகங்கள் (66 புத்தகங்கள்)"}
                    {currentScreen === "chapters" && `${selectedBook?.tamilName} (${selectedBook?.englishName})`}
                    {currentScreen === "read" && `${selectedBook?.tamilName} • அதிகாரம் ${selectedChapter}`}
                    {currentScreen === "search" && "முழு விவிலிய வசன தேடல்"}
                    {currentScreen === "notes" && "எனது தியானக் குறிப்புகள்"}
                    {currentScreen === "bookmarks" && "அடையாளமிட்ட திருவசனங்கள்"}
                    {currentScreen === "quiz" && "விவிலிய அறிவு விளையாட்டுப் புதையல்"}
                    {currentScreen === "audio" && "தமிழ் ஆடியோ பைபிள் வாசிப்பகம்"}
                    {currentScreen === "poster" && "வாட்ஸ்அப் & இன்ஸ்டாகிராம் ஸ்டேட்டஸ் மேக்கர்"}
                    {currentScreen === "settings" && "பயன்பாட்டு அமைப்புகள்"}
                    {currentScreen === "about" && "UMN Ministry பற்றி"}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions (Dark Mode, Font Size, External) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentScreen === "read" && (
                <div className="relative">
                  <button 
                    onClick={() => setIsFontDialogHovered(!isFontDialogHovered)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-100' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                    title="எழுத்து அளவு மாற்றம்"
                  >
                    <Type size={16} />
                    <span className="hidden sm:inline">{fontSize}px</span>
                  </button>

                  {/* Font scale popover */}
                  {isFontDialogHovered && (
                    <div className={`absolute top-12 right-0 z-50 p-4 rounded-2xl shadow-xl border w-72 ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <Sliders size={14} /> வாசிப்பு எழுத்து அளவு
                        </span>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">{fontSize}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="14" 
                        max="32" 
                        value={fontSize} 
                        onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                        className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer my-2"
                      />
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 text-center font-serif leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                        இறைவார்த்தை என்றும் ஜீவனுள்ளது.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={handleToggleDark}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-yellow-400' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title={isDarkMode ? "பகல் பயன்முறை (Light Mode)" : "இருண்ட பயன்முறை (Dark Mode)"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => { setHistory([]); setCurrentScreen("settings"); }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  currentScreen === "settings"
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="அமைப்புகள்"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Web Navigation Tabs Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 dark:border-zinc-800/80">
            {[
              { id: "home", label: "முகப்பு", icon: Compass, active: currentScreen === "home" },
              { id: "books", label: "வேதாகமம்", icon: BookOpen, active: currentScreen === "books" || currentScreen === "chapters" || currentScreen === "read" },
              { id: "search", label: "வசன தேடல்", icon: Search, active: currentScreen === "search" },
              { id: "notes", label: "எனது குறிப்புகள்", icon: FileText, active: currentScreen === "notes", badge: notes.length > 0 ? notes.length : undefined },
              { id: "bookmarks", label: "அடையாளங்கள்", icon: Bookmark, active: currentScreen === "bookmarks", badge: bookmarks.length > 0 ? bookmarks.length : undefined },
              { id: "quiz", label: "விளையாட்டு (Quiz)", icon: Trophy, active: currentScreen === "quiz" },
              { id: "audio", label: "ஆடியோ பைபிள்", icon: Music, active: currentScreen === "audio" },
              { id: "poster", label: "ஸ்டேட்டஸ் மேக்கர்", icon: ImageIcon, active: currentScreen === "poster" },
              { id: "about", label: "எங்களைப் பற்றி", icon: Info, active: currentScreen === "about" },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setHistory([]);
                    setCurrentScreen(tab.id);
                  }}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    tab.active
                      ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                      : isDarkMode
                        ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <IconComp size={15} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      tab.active ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Web Page Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto">

        {/* SCREEN: HOME */}
        {currentScreen === "home" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 animate-fadeIn">
            {/* Logo and Greeting Banner */}
            <div className="rounded-3xl p-5 text-white flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 shadow-md">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 border border-white/20 shadow-md bg-slate-900">
                <img 
                  src={umnLogo} 
                  alt="UMN Ministry Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xl font-bold tracking-tight">தமிழ் பரிசுத்த வேதாகமம்</h3>
              <p className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">இறைவார்த்தை என்றும் உங்களோடு</p>
              <div className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[10px] sm:text-xs sm:text-sm font-semibold border border-white/10 uppercase tracking-wider">
                UMN Ministry
              </div>
            </div>

            {/* Daily Verse Panel */}
            {dailyVerse && (
              <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" /> இன்றைய வாக்குத்தத்தம்
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => shareVerse(dailyVerse)}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-500 dark:text-zinc-400"
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      onClick={() => toggleBookmark(dailyVerse)}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Bookmark 
                        className={isBookmarked(dailyVerse) ? "text-red-500 fill-red-500" : "text-slate-500 dark:text-zinc-400"} 
                      />
                    </button>
                  </div>
                </div>
                <p className="text-sm italic leading-relaxed font-serif">
                  "{dailyVerse.text}"
                </p>
                <div className="text-right mt-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">
                  — {dailyVerse.bookName} {dailyVerse.chapter}:{dailyVerse.verse}
                </div>
                <button 
                  onClick={() => {
                    const book = bibleBooks.find(b => b.id === dailyVerse.bookId)!;
                    setSelectedBook(book);
                    setSelectedChapter(dailyVerse.chapter);
                    navigateTo("read");
                  }}
                  className="mt-3 w-full bg-blue-50 hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-300 font-bold py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <BookOpen size={12} /> வாசிக்கச் செல்லவும்
                </button>
              </div>
            )}

            {/* Quick Access Tiles Grid */}
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">விரைவு அணுகல்</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => navigateTo("books")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm sm:text-sm md:text-base font-bold">வேதாகமம்</div>
                    <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500">66 புத்தகங்கள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("search")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">வசன தேடல்</div>
                    <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500">தேடல் பொறியாளர்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("notes")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">எனது குறிப்புகள்</div>
                    <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500">விளக்கக் குறிப்புகள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("bookmarks")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <BookMarked size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">அடையாளங்கள்</div>
                    <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500">{bookmarks.length} வசனங்கள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("quiz")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                    <Gamepad2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">விளையாட்டு (Quiz)</div>
                    <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500">100 லெவல்கள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("audio")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">ஆடியோ பைபிள்</div>
                    <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500">வசன வாசிப்பு</div>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setSelectedVerseForPoster(dailyVerse ? dailyVerse : null);
                    navigateTo("poster");
                  }}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">ஸ்டேட்டஸ் மேக்கர்</div>
                    <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500">வசன அட்டை உருவாக்கம்</div>
                  </div>
                </button>
              </div>
            </div>

            {/* E-Books Banner */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'} shadow-xs flex items-center justify-between gap-4`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Book size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">UMN மின்னூல்கள் (E-Books)</h4>
                  <p className="text-[10px] sm:text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">பாடல் புத்தகங்கள் மற்றும் ஆன்மீக நூல்களைப் பெற இங்கே இணையுங்கள்.</p>
                </div>
              </div>
              <button 
                onClick={(e) => handleLinkClick(e, "https://payhip.com/Umnmelody", "UMN E-Books கடை (Store)")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                பார்வையிட <ExternalLink size={10} />
              </button>
            </div>

            {/* Bible Study Banner */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'} shadow-xs flex items-center justify-between gap-4`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">வேதாகம ஆராய்ச்சி (Bible Study)</h4>
                  <p className="text-[10px] sm:text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">ஆன்மீக கட்டுரைகள் மற்றும் வேத தியானங்களைப் படிக்கவும்.</p>
                </div>
              </div>
              <button 
                onClick={(e) => handleLinkClick(e, "https://umnministry.blogspot.com", "வேதாகம ஆராய்ச்சி (Bible Study)")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                பார்வையிட <ExternalLink size={10} />
              </button>
            </div>

            {/* Bottom menu list */}
            <div className={`rounded-2xl divide-y ${isDarkMode ? 'bg-zinc-900/40 divide-zinc-800' : 'bg-white divide-slate-100'} border ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <button 
                onClick={(e) => handleLinkClick(e, "https://payhip.com/Umnmelody", "UMN E-Books கடை (Store)")}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer text-slate-900 dark:text-white"
              >
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Book size={15} className="text-blue-500" /> UMN E-Books கடை (Store)
                </span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
              <button 
                onClick={(e) => handleLinkClick(e, "https://umnministry.blogspot.com", "UMN வேதாகம ஆராய்ச்சி (Bible Study)")}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer text-slate-900 dark:text-white"
              >
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <BookOpen size={15} className="text-emerald-500" /> UMN வேதாகம ஆராய்ச்சி (Bible Study)
                </span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
              <button 
                onClick={() => navigateTo("settings")}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Settings size={15} className="text-slate-500" /> அமைப்புகள் (Settings)
                </span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
              <button 
                onClick={() => navigateTo("about")}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Info size={15} className="text-slate-500" /> எங்களைப் பற்றி (About UMN)
                </span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
            </div>
          </div>
        )}


        {/* SCREEN: BOOKS */}
        {currentScreen === "books" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn">
            {/* Search books */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="புத்தகத்தைத் தேடுக... (எ.கா. யோவான்)"
                value={booksSearchQuery}
                onChange={(e) => setBooksSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </div>

            {/* Testament tabs */}
            <div className={`p-1 rounded-xl flex ${isDarkMode ? 'bg-zinc-900' : 'bg-slate-200'}`}>
              <button 
                onClick={() => setActiveTestament('Old')}
                className={`flex-1 py-1.5 text-[11px] sm:text-sm font-bold rounded-lg cursor-pointer transition-all ${activeTestament === 'Old' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs') : 'text-slate-500'}`}
              >
                பழைய ஏற்பாடு (OT)
              </button>
              <button 
                onClick={() => setActiveTestament('New')}
                className={`flex-1 py-1.5 text-[11px] sm:text-sm font-bold rounded-lg cursor-pointer transition-all ${activeTestament === 'New' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs') : 'text-slate-500'}`}
              >
                புதிய ஏற்பாடு (NT)
              </button>
            </div>

            {/* Books grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredBooks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBook(b);
                    navigateTo("chapters");
                  }}
                  className={`p-3 text-left rounded-xl border hover:scale-102 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                >
                  <div className="font-bold text-sm sm:text-base md:text-lg leading-tight truncate">{b.tamilName}</div>
                  <div className="text-[10px] sm:text-xs sm:text-sm text-slate-500 truncate">{b.englishName}</div>
                  <div className="text-[10px] sm:text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold mt-1.5">{b.chapters} அதிகாரங்கள்</div>
                </button>
              ))}

              {filteredBooks.length === 0 && (
                <div className="col-span-2 text-center py-10 text-slate-500 text-xs sm:text-sm">
                  தேடலுக்குப் பொருத்தமான புத்தகங்கள் எதுவும் இல்லை!
                </div>
              )}
            </div>
          </div>
        )}


        {/* SCREEN: CHAPTERS */}
        {currentScreen === "chapters" && selectedBook && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn">
            <div className={`p-4 rounded-2xl flex items-center justify-between ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} border ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div>
                <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">{selectedBook.tamilName}</h3>
                <p className="text-xs sm:text-sm text-slate-500">{selectedBook.englishName}</p>
              </div>
              <span className="px-3 py-1 text-xs sm:text-sm rounded-full bg-blue-100 text-blue-800 font-bold">
                {selectedBook.testament === 'Old' ? 'பழைய ஏற்பாடு' : 'புதிய ஏற்பாடு'}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">அதிகாரத்தைத் தேர்ந்தெடுக்கவும்</h4>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelectedChapter(ch);
                      navigateTo("read");
                    }}
                    className={`aspect-square rounded-xl border font-bold text-sm sm:text-lg md:text-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer ${selectedChapter === ch ? 'bg-blue-600 text-white border-blue-600' : (isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800')}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* SCREEN: VERSE READING */}
        {currentScreen === "read" && selectedBook && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn">
            {/* Simple Next/Prev chapter controls */}
            <div className="flex justify-between items-center mb-1">
              <button
                disabled={selectedChapter <= 1}
                onClick={() => setSelectedChapter(prev => prev - 1)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer border ${selectedChapter <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-zinc-800'} ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}
              >
                முந்தைய அதிகாரம்
              </button>
              <span className="text-xs sm:text-sm font-bold text-slate-500">
                {selectedChapter} / {selectedBook.chapters}
              </span>
              <button
                disabled={selectedChapter >= selectedBook.chapters}
                onClick={() => setSelectedChapter(prev => prev + 1)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer border ${selectedChapter >= selectedBook.chapters ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-zinc-800'} ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}
              >
                அடுத்த அதிகாரம்
              </button>
            </div>

            {/* Dev Notice Card */}
            <div className={`p-3 rounded-2xl text-[10px] sm:text-xs sm:text-sm leading-relaxed border flex flex-col gap-1.5 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info size={13} className="text-blue-500" />
                  <span className="font-bold text-[11px] sm:text-sm text-slate-700 dark:text-zinc-200">
                    வேதாகம இணைப்பு நிலை (Bible Connection Status)
                  </span>
                </div>
                {isLoadingLive ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-[9px] sm:text-xs sm:text-sm animate-pulse">
                    ஏற்றுகிறது... / Loading...
                  </span>
                ) : isLiveConnected ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[9px] sm:text-xs sm:text-sm">
                    🟢 பரிசுத்த வேதாகமம் ஆஃப்லைன் / Holy Bible Offline
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[9px] sm:text-xs sm:text-sm">
                    🟡 ஆஃப்லைன் மாதிரி / Offline Fallback
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-zinc-400">
                {isLiveConnected ? (
                  <span>உண்மையான <strong>பரிசுத்த வேதாகமம் (Tamil Union Version)</strong> வசனங்கள் 100% துல்லியமாகவும் முழுமையாகவும் உள்ளூர் ஆஃப்லைன் கோப்புகளிலிருந்து பெறப்பட்டுள்ளது.</span>
                ) : (
                  <span>ஆஃப்லைன் வேதாகமக் கோப்புகள் ஏற்றப்படுகின்றன. தற்போதைய வாசிப்பில் உண்மையான தமிழ் வேதாகம வசனங்கள் காட்டப்படுகின்றன.</span>
                )}
              </p>
            </div>

            {/* Verses list */}
            <div className="space-y-3.5 pb-20">
              {verses.map((v) => {
                const highlightKey = `${v.bookId}-${v.chapter}-${v.verse}`;
                const highlightColor = highlights[highlightKey] || "";
                
                let highlightClass = "";
                if (highlightColor === "yellow") highlightClass = "bg-yellow-200 dark:bg-yellow-950/50 text-slate-900 dark:text-zinc-100 rounded px-1";
                if (highlightColor === "blue") highlightClass = "bg-blue-200 dark:bg-blue-950/50 text-slate-900 dark:text-zinc-100 rounded px-1";
                if (highlightColor === "green") highlightClass = "bg-emerald-200 dark:bg-emerald-950/50 text-slate-900 dark:text-zinc-100 rounded px-1";
                if (highlightColor === "pink") highlightClass = "bg-pink-200 dark:bg-pink-950/50 text-slate-900 dark:text-zinc-100 rounded px-1";

                return (
                  <div 
                    key={v.verse}
                    onClick={() => setSelectedVerseForAction(v)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${selectedVerseForAction?.verse === v.verse ? 'border-blue-500 ring-2 ring-blue-500/20' : (isDarkMode ? 'bg-zinc-900/40 border-zinc-900' : 'bg-white border-slate-100')} hover:shadow-xs`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400 mr-2" style={{ fontSize: `${fontSize}px` }}>
                          {v.verse}.
                        </span>
                        <span className={highlightClass} style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}>
                          {v.text}
                        </span>

                        {/* Associated notes badge indicator */}
                        {notes.some(n => n.bookId === v.bookId && n.chapter === v.chapter && n.verse === v.verse) && (
                          <div className="mt-2 text-[10px] sm:text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <FileText size={10} /> குறிப்பு உள்ளது / Note
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 items-center">
                        {isBookmarked(v) && (
                          <span className="text-red-500">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Absolute overlay menu at bottom when a verse is selected */}
            {selectedVerseForAction && (
              <div className={`absolute bottom-0 left-0 right-0 z-50 p-4 border-t rounded-t-[28px] shadow-2xl transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-500">
                    {selectedVerseForAction.bookName} {selectedVerseForAction.chapter}:{selectedVerseForAction.verse} வசன விருப்பங்கள்:
                  </span>
                  <button 
                    onClick={() => setSelectedVerseForAction(null)}
                    className="text-xs sm:text-sm text-red-500 font-bold hover:underline cursor-pointer"
                  >
                    மூடு
                  </button>
                </div>

                {/* Highlight colors */}
                <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <span className="text-[11px] sm:text-sm text-slate-400 font-medium">வண்ணம் பூசு:</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleHighlight(selectedVerseForAction, "yellow")}
                      className="w-6 h-6 rounded-full bg-yellow-300 border border-yellow-400 cursor-pointer"
                    />
                    <button 
                      onClick={() => handleHighlight(selectedVerseForAction, "blue")}
                      className="w-6 h-6 rounded-full bg-blue-300 border border-blue-400 cursor-pointer"
                    />
                    <button 
                      onClick={() => handleHighlight(selectedVerseForAction, "green")}
                      className="w-6 h-6 rounded-full bg-emerald-300 border border-emerald-400 cursor-pointer"
                    />
                    <button 
                      onClick={() => handleHighlight(selectedVerseForAction, "pink")}
                      className="w-6 h-6 rounded-full bg-pink-300 border border-pink-400 cursor-pointer"
                    />
                    <button 
                      onClick={() => handleHighlight(selectedVerseForAction, "")}
                      className="text-[10px] sm:text-xs sm:text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white ml-1 font-bold underline cursor-pointer"
                    >
                      அழி
                    </button>
                  </div>
                </div>

                {/* Action buttons panel */}
                <div className="grid grid-cols-5 gap-1">
                  <button
                    onClick={() => {
                      toggleBookmark(selectedVerseForAction);
                      setSelectedVerseForAction(null);
                    }}
                    className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] sm:text-xs sm:text-sm font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 ${isBookmarked(selectedVerseForAction) ? 'text-red-500 border-red-200 bg-red-50/20' : 'text-slate-600 dark:text-zinc-300'}`}
                  >
                    <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isBookmarked(selectedVerseForAction) ? "fill-red-500" : ""}`} />
                    <span className="truncate">அடையாளம்</span>
                  </button>

                  <button
                    onClick={() => {
                      copyToClipboard(`"${selectedVerseForAction.text}"\n— ${selectedVerseForAction.bookName} ${selectedVerseForAction.chapter}:${selectedVerseForAction.verse}`);
                      setSelectedVerseForAction(null);
                    }}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] sm:text-xs sm:text-sm font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                  >
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">நகலெடு</span>
                  </button>

                  <button
                    onClick={() => {
                      shareVerse(selectedVerseForAction);
                      setSelectedVerseForAction(null);
                    }}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] sm:text-xs sm:text-sm font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">பகிர்</span>
                  </button>

                  <button
                    onClick={() => openNoteDialog(selectedVerseForAction)}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] sm:text-xs sm:text-sm font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">குறிப்பு</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedVerseForPoster(selectedVerseForAction);
                      setSelectedVerseForAction(null);
                      navigateTo("poster");
                    }}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] sm:text-xs sm:text-sm font-bold border cursor-pointer bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40"
                  >
                    <span className="truncate">போஸ்டர்</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* SCREEN: BIBLE SEARCH */}
        {currentScreen === "search" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn w-full max-w-6xl mx-auto">
            {/* Search Header Banner */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
                    <Search className="text-blue-500" size={18} />
                    <span>வசன தேடல் (Bible Search)</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    முழு வேதாகமத்திலும் வார்த்தைகளை அல்லது சொற்றொடர்களை நொடியில் தேடுங்கள்
                  </p>
                </div>
                {searchResults.length > 0 && (
                  <span className="self-start sm:self-auto px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black">
                    {searchResults.length} வசனங்கள் கண்டறியப்பட்டன
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder="தேட வேண்டிய வார்த்தையைத் தட்டச்சு செய்யவும் (எ.கா. தேவன், கர்த்தர், அன்பு, இரட்சிப்பு)..."
                  value={searchQuery}
                  onChange={(e) => handleBibleSearch(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                {searchQuery && (
                  <button 
                    onClick={() => handleBibleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {/* Testament Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
                  <button
                    onClick={() => setSearchScope('All')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      searchScope === 'All' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    முழு வேதாகமம்
                  </button>
                  <button
                    onClick={() => setSearchScope('Old')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      searchScope === 'Old' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    பழைய ஏற்பாடு
                  </button>
                  <button
                    onClick={() => setSearchScope('New')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      searchScope === 'New' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    புதிய ஏற்பாடு
                  </button>
                </div>

                {/* Specific Book Dropdown Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">புத்தகம்:</span>
                  <select
                    value={searchBookFilter}
                    onChange={(e) => setSearchBookFilter(parseInt(e.target.value))}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none focus:border-blue-500 ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value={0}>அனைத்து புத்தகங்களும்</option>
                    {(searchScope === 'Old' 
                      ? bibleBooks.filter(b => b.testament === 'Old') 
                      : searchScope === 'New' 
                        ? bibleBooks.filter(b => b.testament === 'New') 
                        : bibleBooks
                    ).map(b => (
                      <option key={b.id} value={b.id}>{b.tamilName} ({b.englishName})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Word Suggestions if query is empty */}
            {searchQuery.length < 2 && (
              <div className={`p-6 rounded-2xl border text-center space-y-4 ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'}`}>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                  <Search size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">அடிக்கடி தேடப்படும் விவிலிய வார்த்தைகள்</h4>
                  <p className="text-xs text-slate-400">கீழே உள்ள வார்த்தைகளில் ஒன்றை அழுத்தி உடனடி தேடலை ஆரம்பிக்கவும்:</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {['தேவன்', 'கர்த்தர்', 'இயேசு', 'அன்பு', 'விசுவாசம்', 'சமாதானம்', 'இரட்சிப்பு', 'பரிசுத்தம்', 'ஆசீர்வாதம்', 'ஜெபம்', 'வெளிச்சம்', 'ஜீவன்'].map((word) => (
                    <button
                      key={word}
                      onClick={() => handleBibleSearch(word)}
                      className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-blue-400 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60 cursor-pointer transition-all hover:scale-105"
                    >
                      #{word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Grid */}
            {searchQuery.length >= 2 && (
              <div className="space-y-3 pb-12">
                {isSearching ? (
                  <div className="text-center py-16 text-slate-500 text-xs sm:text-sm space-y-3 animate-pulse">
                    <Sparkles className="mx-auto text-blue-500 animate-spin" size={28} />
                    <p className="font-bold text-slate-700 dark:text-zinc-300">முழு வேதாகமத்திலும் தேடுகிறது...</p>
                    <p className="text-xs text-slate-400">Searching all 66 books offline...</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const displayedResults = searchResults.filter(r => {
                        const book = bibleBooks.find(b => b.id === r.bookId);
                        if (!book) return true;
                        if (searchScope === 'Old' && book.testament !== 'Old') return false;
                        if (searchScope === 'New' && book.testament !== 'New') return false;
                        if (searchBookFilter !== 0 && r.bookId !== searchBookFilter) return false;
                        return true;
                      });

                      if (displayedResults.length === 0) {
                        return (
                          <div className={`text-center py-16 rounded-2xl border p-6 space-y-2 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                            <AlertCircle size={32} className="mx-auto text-slate-400 opacity-60" />
                            <p className="font-extrabold text-sm text-slate-700 dark:text-zinc-300">
                              "{searchQuery}" என்ற வார்த்தைக்குப் பொருத்தமான வசனங்கள் எதுவும் கிடைக்கவில்லை!
                            </p>
                            <p className="text-xs text-slate-400">
                              வார்த்தை எழுத்துப்பிழைகளைச் சரிபார்க்கவும் அல்லது வேறு ஒரு விவிலியச் சொல்லைத் தட்டச்சு செய்யவும்.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {displayedResults.map((r, idx) => {
                            const isBk = bookmarks.some(b => b.bookId === r.bookId && b.chapter === r.chapter && b.verse === r.verse);
                            const bookObj = bibleBooks.find(b => b.id === r.bookId);
                            
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all hover:shadow-md ${
                                  isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="space-y-2">
                                  {/* Header Info */}
                                  <div className="flex justify-between items-center">
                                    <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                      <BookOpen size={13} />
                                      {r.bookName} {r.chapter}:{r.verse}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500">
                                      {bookObj?.testament === 'Old' ? 'பழைய ஏற்பாடு' : 'புதிய ஏற்பாடு'}
                                    </span>
                                  </div>

                                  {/* Verse Text with highlighted keywords */}
                                  <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-serif">
                                    "{(() => {
                                      if (!searchQuery.trim()) return r.text;
                                      const regex = new RegExp(`(${searchQuery.trim()})`, 'gi');
                                      const parts = r.text.split(regex);
                                      return (
                                        <>
                                          {parts.map((part, pIdx) => 
                                            part.toLowerCase() === searchQuery.trim().toLowerCase() ? (
                                              <mark key={pIdx} className="bg-amber-300 dark:bg-amber-500/40 text-slate-950 dark:text-amber-100 font-bold px-1 rounded">
                                                {part}
                                              </mark>
                                            ) : (
                                              part
                                            )
                                          )}
                                        </>
                                      );
                                    })()}"
                                  </p>
                                </div>

                                {/* Action Buttons Row */}
                                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-1">
                                  <button
                                    onClick={() => {
                                      if (bookObj) {
                                        setSelectedBook(bookObj);
                                        setSelectedChapter(r.chapter);
                                        navigateTo("read");
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                                    title="முழு அதிகாரம் வாசிக்க"
                                  >
                                    <BookOpen size={12} /> வாசி
                                  </button>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setSelectedVerseForPoster(r);
                                        navigateTo("poster");
                                      }}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 cursor-pointer"
                                      title="வாட்ஸ்அப் ஸ்டேட்டஸ் கார்டு"
                                    >
                                      <ImageIcon size={14} />
                                    </button>

                                    <button
                                      onClick={() => copyToClipboard(`"${r.text}" — ${r.bookName} ${r.chapter}:${r.verse}`)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer"
                                      title="நகலெடு"
                                    >
                                      <Copy size={14} />
                                    </button>

                                    <button
                                      onClick={() => toggleBookmark(r)}
                                      className={`p-1.5 rounded-lg cursor-pointer ${
                                        isBk ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-zinc-800'
                                      }`}
                                      title={isBk ? "அடையாளத்தை நீக்கு" : "அடையாளமிடு"}
                                    >
                                      <Bookmark size={14} className={isBk ? "fill-amber-500" : ""} />
                                    </button>

                                    <button
                                      onClick={() => openNoteDialog(r)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 cursor-pointer"
                                      title="குறிப்பு எழுது"
                                    >
                                      <FileText size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        )}


        {/* SCREEN: BOOKMARKS */}
        {currentScreen === "bookmarks" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn w-full max-w-6xl mx-auto">
            {/* Bookmarks Header Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
                    <Bookmark className="text-amber-500 fill-amber-500" size={18} />
                    <span>அடையாளங்கள் (Saved Bookmarks)</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    நீங்கள் விரும்பி அடையாளமிட்ட திருவசனங்களின் தொகுப்பு
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black">
                  {bookmarks.length} வசனங்கள்
                </span>
              </div>

              {bookmarks.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                  {/* Search inside bookmarks */}
                  <div className="relative flex-1 min-w-[200px]">
                    <input 
                      type="text"
                      placeholder="அடையாளங்களில் தேட..."
                      value={bookmarkSearchQuery}
                      onChange={(e) => setBookmarkSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-8 py-2 text-xs rounded-xl border focus:outline-none focus:border-blue-500 ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    {bookmarkSearchQuery && (
                      <button 
                        onClick={() => setBookmarkSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Testament Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
                    {(['All', 'Old', 'New'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setBookmarkTestament(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          bookmarkTestament === t 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : 'text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {t === 'All' ? 'அனைத்தும்' : t === 'Old' ? 'பழைய ஏற்பாடு' : 'புதிய ஏற்பாடு'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bookmarks List */}
            {bookmarks.length === 0 ? (
              <div className={`text-center py-16 rounded-2xl border p-8 space-y-3 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Bookmark size={32} />
                </div>
                <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">அடையாளமிட்ட வசனங்கள் எதுவும் இல்லை!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  வேதாகமத்தை வாசிக்கும் போது, உங்களுக்குப் பிடித்த வசனங்களை எளிதில் அணுக அடையாளமிடலாம்.
                </p>
                <button 
                  onClick={() => navigateTo("books")}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:scale-105 transition-all"
                >
                  வேதாகமம் வாசிக்கச் செல்
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-12">
                {bookmarks
                  .filter(b => {
                    const book = bibleBooks.find(bk => bk.id === b.bookId);
                    if (bookmarkTestament === 'Old' && book?.testament !== 'Old') return false;
                    if (bookmarkTestament === 'New' && book?.testament !== 'New') return false;
                    if (bookmarkSearchQuery.trim() !== '') {
                      const q = bookmarkSearchQuery.toLowerCase();
                      return b.text.toLowerCase().includes(q) || b.bookName.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map((b, idx) => {
                    const bookObj = bibleBooks.find(book => book.id === b.bookId);
                    return (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-xs transition-all hover:shadow-md ${
                          isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Bookmark size={13} className="fill-amber-500" />
                              {b.bookName} {b.chapter}:{b.verse}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500">
                              {bookObj?.testament === 'Old' ? 'பழைய ஏற்பாடு' : 'புதிய ஏற்பாடு'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm italic leading-relaxed font-serif text-slate-700 dark:text-zinc-200">
                            "{b.text}"
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-1">
                          <button
                            onClick={() => {
                              if (bookObj) {
                                setSelectedBook(bookObj);
                                setSelectedChapter(b.chapter);
                                navigateTo("read");
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                          >
                            <BookOpen size={12} /> வாசி
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedVerseForPoster(b);
                                navigateTo("poster");
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 cursor-pointer"
                              title="ஸ்டேட்டஸ் மேக்கர்"
                            >
                              <ImageIcon size={14} />
                            </button>

                            <button
                              onClick={() => copyToClipboard(`"${b.text}" — ${b.bookName} ${b.chapter}:${b.verse}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer"
                              title="நகலெடு"
                            >
                              <Copy size={14} />
                            </button>

                            <button
                              onClick={() => shareVerse(b)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 cursor-pointer"
                              title="பகிரவும்"
                            >
                              <Share2 size={14} />
                            </button>

                            <button 
                              onClick={() => toggleBookmark(b)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="அடையாளத்தை நீக்கு"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}


        {/* SCREEN: NOTES */}
        {currentScreen === "notes" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn w-full max-w-6xl mx-auto">
            {/* Notes Header Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
                    <FileText className="text-purple-500" size={18} />
                    <span>எனது குறிப்புகள் (My Study Notes)</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    தியானங்கள், போதனை முக்கியக் கருத்துக்கள் மற்றும் தனிப்பட்ட குறிப்புகள்
                  </p>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-xs font-black">
                    {notes.length} குறிப்புகள்
                  </span>
                  <button
                    onClick={() => {
                      setIsCustomNoteMode(true);
                      setNoteFormBookId(1);
                      setNoteFormChapter(1);
                      setNoteFormVerse(1);
                      setNoteInput("");
                      const b = bibleBooks[0];
                      setSelectedVerseForAction({
                        bookId: b.id,
                        bookName: b.tamilName,
                        chapter: 1,
                        verse: 1,
                        text: "ஆதியிலே தேவன் வானத்தையும் பூமியையும் சிருஷ்டித்தார்."
                      });
                      setIsNoteModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-105"
                  >
                    <Plus size={14} /> புதிய குறிப்பு
                  </button>
                </div>
              </div>

              {notes.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                  {/* Search inside notes */}
                  <div className="relative flex-1 min-w-[200px]">
                    <input 
                      type="text"
                      placeholder="குறிப்புகளில் தேட..."
                      value={notesSearchQuery}
                      onChange={(e) => setNotesSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-8 py-2 text-xs rounded-xl border focus:outline-none focus:border-purple-500 ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    {notesSearchQuery && (
                      <button 
                        onClick={() => setNotesSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Filter by Book */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">புத்தகம்:</span>
                    <select
                      value={notesBookFilter}
                      onChange={(e) => setNotesBookFilter(parseInt(e.target.value))}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none focus:border-purple-500 ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value={0}>அனைத்து புத்தகங்களும்</option>
                      {bibleBooks.map(b => (
                        <option key={b.id} value={b.id}>{b.tamilName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Notes List */}
            {notes.length === 0 ? (
              <div className={`text-center py-16 rounded-2xl border p-8 space-y-3 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
                  <FileText size={32} />
                </div>
                <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">குறிப்புகள் எதுவும் இன்னும் எழுதப்படவில்லை!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  வேதாகமத்தை வாசிக்கும் போது ஏதேனும் வசனத்தைத் தொட்டு அல்லது மேலேயுள்ள 'புதிய குறிப்பு' பொத்தானை அழுத்தி குறிப்புகளைச் சேர்க்கலாம்.
                </p>
                <button 
                  onClick={() => {
                    setIsCustomNoteMode(true);
                    setNoteFormBookId(1);
                    setNoteFormChapter(1);
                    setNoteFormVerse(1);
                    setNoteInput("");
                    const b = bibleBooks[0];
                    setSelectedVerseForAction({
                      bookId: b.id,
                      bookName: b.tamilName,
                      chapter: 1,
                      verse: 1,
                      text: "ஆதியிலே தேவன் வானத்தையும் பூமியையும் சிருஷ்டித்தார்."
                    });
                    setIsNoteModalOpen(true);
                  }}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:scale-105 transition-all"
                >
                  + புதிய குறிப்பு எழுதவும்
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-12">
                {notes
                  .filter(n => {
                    if (notesBookFilter !== 0 && n.bookId !== notesBookFilter) return false;
                    if (notesSearchQuery.trim() !== '') {
                      const q = notesSearchQuery.toLowerCase();
                      return n.text.toLowerCase().includes(q) || n.bookName.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map((n) => {
                    const bookObj = bibleBooks.find(b => b.id === n.bookId);
                    return (
                      <div 
                        key={n.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-xs transition-all hover:shadow-md ${
                          isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Note Header */}
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                              <BookOpen size={13} />
                              {n.bookName} {n.chapter}:{n.verse}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{n.date}</span>
                          </div>

                          {/* Note Content */}
                          <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-zinc-200">
                            {n.text}
                          </div>
                        </div>

                        {/* Note Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-1">
                          <button
                            onClick={() => {
                              if (bookObj) {
                                setSelectedBook(bookObj);
                                setSelectedChapter(n.chapter);
                                navigateTo("read");
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 cursor-pointer flex items-center gap-1"
                          >
                            <BookOpen size={12} /> அதிகாரம் வாசி
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsCustomNoteMode(false);
                                setSelectedVerseForAction({
                                  bookId: n.bookId,
                                  bookName: n.bookName,
                                  chapter: n.chapter,
                                  verse: n.verse,
                                  text: ""
                                });
                                setNoteInput(n.text);
                                setIsNoteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer"
                              title="தொகுக்க (Edit Note)"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              onClick={() => copyToClipboard(`[${n.bookName} ${n.chapter}:${n.verse} குறிப்பு]\n${n.text}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer"
                              title="நகலெடு"
                            >
                              <Copy size={14} />
                            </button>

                            <button 
                              onClick={() => {
                                const filtered = notes.filter(note => note.id !== n.id);
                                saveNotes(filtered);
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="குறிப்பை நீக்கு"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}


        {/* SCREEN: SETTINGS */}
        {currentScreen === "settings" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn w-full max-w-4xl mx-auto">
            {/* Dark Mode Tile */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">இருண்ட பயன்முறை (Dark Mode)</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">பயன்பாட்டின் பின்னணி மாற்று</p>
              </div>
              <button
                onClick={handleToggleDark}
                className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${isDarkMode ? 'bg-blue-600 flex justify-end' : 'bg-slate-300 flex justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Font scale view */}
            <div className={`p-4 rounded-2xl border space-y-3.5 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">எழுத்து அளவு மாற்றம் (Font Scale)</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">வசனங்களின் வாசிப்பு அளவு</p>
              </div>
              <input 
                type="range" 
                min="14" 
                max="30" 
                value={fontSize} 
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="p-2 text-center rounded-lg bg-slate-50 dark:bg-zinc-950 text-xs sm:text-sm border border-slate-100 dark:border-zinc-900" style={{ fontSize: `${fontSize}px` }}>
                இறைவார்த்தை
              </div>
            </div>

            {/* Clear app storage */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-red-600">தரவுகளை மீட்டமை (Reset Data)</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">சேமிப்புகளை நிரந்தரமாக அழி</p>
              </div>
              <button
                onClick={handleClearAppStorage}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/40 cursor-pointer"
              >
                மீட்டமைக்கவும்
              </button>
            </div>

            {/* Version tile */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">பயன்பாட்டு பதிப்பு (Version)</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">UMN Ministry Official Release</p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-400">1.0.0 (APK)</span>
            </div>
          </div>
        )}


        {/* SCREEN: ABOUT */}
        {currentScreen === "about" && (
          <div className="p-5 text-center space-y-5 animate-fadeIn max-w-2xl mx-auto">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 flex items-center justify-center mx-auto shadow-md bg-slate-900">
              <img 
                src={umnLogo} 
                alt="UMN Ministry Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-xl tracking-tight">UMN Tamil Bible</h3>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold">UMN Ministry</p>
              <p className="text-[11px] sm:text-xs text-slate-400">இறைவார்த்தை உலகெங்கும் பரவ...</p>
            </div>

            <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-300 border text-justify ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              எங்கள் <strong>UMN தமிழ் வேதாகமச் செயலி</strong> மூலம் இறைவார்த்தையை எளிய முறையில் வாசிக்கவும், தேடவும், தியானிக்கவும் வழிவகை செய்கிறோம். இது முற்றிலும் இலவசமாகவும், எந்தவொரு இணையத் தொடர்பும் இல்லாமலும் ஆஃப்லைனில் முழுமையாக இயங்கும் வகையில் வடிவமைக்கப்பட்டுள்ளது.
            </div>

             <div className="space-y-1.5 flex flex-col items-center">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">அதிகாரப்பூர்வ வலைத்தளம்</span>
              <button 
                onClick={(e) => handleLinkClick(e, "https://bibleonlineumnministry.blogspot.com/", "UMN அதிகாரப்பூர்வ வலைத்தளம்")}
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-center bg-transparent border-none p-0"
              >
                bibleonlineumnministry.blogspot.com <ExternalLink size={12} />
              </button>
            </div>

            <div className="pt-8 text-[10px] sm:text-xs text-slate-400">
              © 2026 UMN Ministry. All Rights Reserved.
            </div>
          </div>
        )}

        {currentScreen === "quiz" && (
          <div className="w-full animate-fadeIn">
            <BibleQuiz isDarkMode={isDarkMode} onBack={navigateBack} />
          </div>
        )}

        {currentScreen === "audio" && (
          <div className="w-full animate-fadeIn">
            <AudioBible isDarkMode={isDarkMode} onBack={navigateBack} />
          </div>
        )}

        {currentScreen === "poster" && (
          <div className="w-full animate-fadeIn">
            <VersePoster 
              initialVerse={selectedVerseForPoster} 
              onBack={() => {
                setSelectedVerseForPoster(null);
                navigateBack();
              }} 
              isDarkMode={isDarkMode} 
            />
          </div>
        )}

      </main>

      {/* Interactive Bottom Modal Dialog for taking or editing notes */}
      {isNoteModalOpen && selectedVerseForAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className={`w-full rounded-3xl max-w-lg p-5 sm:p-6 space-y-4 border shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <FileText size={16} /> {isCustomNoteMode ? "புதிய குறிப்பு எழுதுதல்" : "வசனக் குறிப்பு"}
              </span>
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setSelectedVerseForAction(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* If Custom note mode, show book/chapter/verse pickers */}
            {isCustomNoteMode ? (
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">புத்தகம்</label>
                  <select
                    value={noteFormBookId}
                    onChange={(e) => {
                      const bId = parseInt(e.target.value);
                      setNoteFormBookId(bId);
                      const b = bibleBooks.find(book => book.id === bId)!;
                      setSelectedVerseForAction(prev => prev ? { ...prev, bookId: b.id, bookName: b.tamilName } : null);
                    }}
                    className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    {bibleBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.tamilName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">அதிகாரம்</label>
                  <input
                    type="number"
                    min={1}
                    max={150}
                    value={noteFormChapter}
                    onChange={(e) => {
                      const ch = parseInt(e.target.value) || 1;
                      setNoteFormChapter(ch);
                      setSelectedVerseForAction(prev => prev ? { ...prev, chapter: ch } : null);
                    }}
                    className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">வசனம்</label>
                  <input
                    type="number"
                    min={1}
                    max={176}
                    value={noteFormVerse}
                    onChange={(e) => {
                      const vr = parseInt(e.target.value) || 1;
                      setNoteFormVerse(vr);
                      setSelectedVerseForAction(prev => prev ? { ...prev, verse: vr } : null);
                    }}
                    className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {selectedVerseForAction.bookName} {selectedVerseForAction.chapter}:{selectedVerseForAction.verse}
                </span>
              </div>
            )}

            {selectedVerseForAction.text && (
              <div className={`p-3 rounded-xl border italic text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800 font-serif leading-relaxed line-clamp-3`}>
                "{selectedVerseForAction.text}"
              </div>
            )}

            <textarea
              rows={4}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="உங்கள் தியானக்குறிப்புகள் அல்லது கருத்துக்களை இங்கே எழுதவும்..."
              className={`w-full p-3 text-xs sm:text-sm border rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-white border-slate-200 placeholder-slate-400'
              }`}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setSelectedVerseForAction(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 ${
                  isDarkMode ? 'border-zinc-800 text-zinc-300' : 'border-slate-300 text-slate-700'
                }`}
              >
                ரத்து
              </button>
              <button
                onClick={saveNote}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-md transition-all hover:scale-101"
              >
                குறிப்பைச் சேமி
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Portal Footer */}
      <footer className={`border-t py-4 px-4 sm:px-6 select-none shrink-0 transition-colors ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-zinc-200">UMN தமிழ் பரிசுத்த வேதாகமம்</span>
            <span>•</span>
            <span>© 2026 UMN Ministry</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% இலவச ஆஃப்லைன் தளம்</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button 
              onClick={() => { setHistory([]); setCurrentScreen("search"); }} 
              className="hover:text-blue-500 cursor-pointer"
            >
              வசன தேடல்
            </button>
            <button 
              onClick={() => { setHistory([]); setCurrentScreen("quiz"); }} 
              className="hover:text-blue-500 cursor-pointer"
            >
              விளையாட்டு
            </button>
            <button 
              onClick={() => { setHistory([]); setCurrentScreen("audio"); }} 
              className="hover:text-blue-500 cursor-pointer"
            >
              ஆடியோ பைபிள்
            </button>
            <button 
              onClick={() => { setHistory([]); setCurrentScreen("poster"); }} 
              className="hover:text-blue-500 cursor-pointer"
            >
              ஸ்டேட்டஸ் மேக்கர்
            </button>
            <button 
              onClick={(e) => handleLinkClick(e, "https://bibleonlineumnministry.blogspot.com/", "UMN அதிகாரப்பூர்வ வலைத்தளம்")} 
              className="hover:text-blue-500 flex items-center gap-1 cursor-pointer"
            >
              வலைத்தளம் <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </footer>

      {/* External Link Redirect Dialog */}
      {activeRedirectUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 border shadow-2xl relative ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800/60">
              <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                இணைப்புத் தகவல் / External Link
              </span>
              <button 
                onClick={() => setActiveRedirectUrl(null)}
                className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-500`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 block">இணைப்பின் தலைப்பு:</span>
              <p className="text-xs sm:text-sm font-bold">{activeRedirectTitle}</p>
            </div>

            <div className={`p-2.5 rounded-xl border font-mono text-xs bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800/60 select-all break-all text-blue-600 dark:text-blue-400`}>
              {activeRedirectUrl}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  window.open(activeRedirectUrl, '_blank', 'noopener,noreferrer');
                }}
                className="py-2.5 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center justify-center gap-1.5"
              >
                வலைத்தளத்தைத் திறக்க <ExternalLink size={14} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeRedirectUrl);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 ${isDarkMode ? 'border-zinc-800 bg-zinc-800/40 text-zinc-300' : 'border-slate-300 bg-slate-50 text-slate-700'}`}
              >
                <Copy size={14} /> லிங்க் நகலெடுக்க
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for copying text */}
      {copiedText && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 dark:bg-zinc-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={14} className="text-green-400 shrink-0" />
          <span>நகலெடுக்கப்பட்டது! (Copied to Clipboard)</span>
        </div>
      )}

    </div>
  );
}
