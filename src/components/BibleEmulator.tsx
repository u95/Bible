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
  Image as ImageIcon
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
  const [booksSearchQuery, setBooksSearchQuery] = useState<string>("");
  const [activeTestament, setActiveTestament] = useState<'Old' | 'New'>('Old');

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
    <div className={`w-full max-w-sm mx-auto h-[750px] rounded-[36px] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Phone Status Bar Simulation */}
      <div className={`h-8 px-5 flex justify-between items-center text-[11px] font-medium tracking-tight select-none border-b shrink-0 ${isDarkMode ? 'bg-zinc-950 text-zinc-400 border-zinc-900' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
        <span>10:52 AM</span>
        <div className="flex items-center gap-1.5">
          <span>UMN-ONLINE</span>
          <div className="w-4 h-2 rounded-sm border border-current flex items-center p-0.5">
            <div className="w-2 h-full bg-current rounded-2xs"></div>
          </div>
        </div>
      </div>

      {/* Screen Headers */}
      {currentScreen !== "quiz" && currentScreen !== "audio" && (
        <div className={`h-14 px-4 flex items-center justify-between shrink-0 border-b select-none ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            {currentScreen !== "home" && (
              <button 
                onClick={navigateBack} 
                className={`p-1.5 rounded-full hover:bg-opacity-20 cursor-pointer ${isDarkMode ? 'hover:bg-white text-zinc-200' : 'hover:bg-slate-200 text-slate-700'}`}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <span className="font-bold text-base flex items-center gap-1.5">
              {currentScreen === "home" && (
                <>
                  <img 
                    src={umnLogo} 
                    alt="UMN Logo" 
                    className="w-5 h-5 rounded-md object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="tracking-tight text-blue-600 font-extrabold">UMN Tamil Bible</span>
                </>
              )}
              {currentScreen === "books" && "புத்தகங்கள்"}
              {currentScreen === "chapters" && selectedBook?.tamilName}
              {currentScreen === "read" && `${selectedBook?.tamilName} - ${selectedChapter}`}
              {currentScreen === "search" && "வேதாகம தேடல்"}
              {currentScreen === "bookmarks" && "எனது அடையாளங்கள்"}
              {currentScreen === "notes" && "எனது குறிப்புகள்"}
              {currentScreen === "settings" && "அமைப்புகள்"}
              {currentScreen === "about" && "எங்களைப் பற்றி"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={handleToggleDark}
              className={`p-2 rounded-full cursor-pointer hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white text-yellow-400' : 'hover:bg-slate-900 text-slate-700'}`}
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {currentScreen === "read" && (
              <button 
                onClick={() => setIsFontDialogHovered(!isFontDialogHovered)}
                className={`p-2 rounded-full cursor-pointer hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white text-zinc-100' : 'hover:bg-slate-900 text-slate-700'}`}
                title="Font settings"
              >
                <Type size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Font scale floating control */}
      {isFontDialogHovered && currentScreen === "read" && (
        <div className={`absolute top-[90px] right-4 z-40 p-4 rounded-2xl shadow-xl border w-64 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Sliders size={14} className="text-blue-500" /> எழுத்து அளவு (Font Size)
            </span>
            <span className="text-xs font-bold text-blue-500">{fontSize}px</span>
          </div>
          <input 
            type="range" 
            min="14" 
            max="30" 
            value={fontSize} 
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="text-[11px] text-slate-500 mt-2 text-center">
            மாதிரி வசனம் / Sample size
          </div>
        </div>
      )}

      {/* Screen Contents */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">

        {/* SCREEN: HOME */}
        {currentScreen === "home" && (
          <div className="p-4 space-y-5 animate-fadeIn">
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
              <p className="text-xs text-blue-200 mt-1 font-medium">இறைவார்த்தை என்றும் உங்களோடு</p>
              <div className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[10px] font-semibold border border-white/10 uppercase tracking-wider">
                UMN Ministry
              </div>
            </div>

            {/* Daily Verse Panel */}
            {dailyVerse && (
              <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Sparkles size={14} className="animate-pulse" /> இன்றைய வாக்குத்தத்தம்
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => shareVerse(dailyVerse)}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-500 dark:text-zinc-400"
                    >
                      <Share2 size={14} />
                    </button>
                    <button 
                      onClick={() => toggleBookmark(dailyVerse)}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Bookmark 
                        size={14} 
                        className={isBookmarked(dailyVerse) ? "text-red-500 fill-red-500" : "text-slate-500 dark:text-zinc-400"} 
                      />
                    </button>
                  </div>
                </div>
                <p className="text-sm italic leading-relaxed font-serif">
                  "{dailyVerse.text}"
                </p>
                <div className="text-right mt-2 text-xs font-bold text-slate-500 dark:text-zinc-400">
                  — {dailyVerse.bookName} {dailyVerse.chapter}:{dailyVerse.verse}
                </div>
                <button 
                  onClick={() => {
                    const book = bibleBooks.find(b => b.id === dailyVerse.bookId)!;
                    setSelectedBook(book);
                    setSelectedChapter(dailyVerse.chapter);
                    navigateTo("read");
                  }}
                  className="mt-3 w-full bg-blue-50 hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-300 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <BookOpen size={12} /> வாசிக்கச் செல்லவும்
                </button>
              </div>
            )}

            {/* Quick Access Tiles Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">விரைவு அணுகல்</h4>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigateTo("books")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">வேதாகமம்</div>
                    <div className="text-[10px] text-slate-500">66 புத்தகங்கள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("search")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Search size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">வசன தேடல்</div>
                    <div className="text-[10px] text-slate-500">தேடல் பொறியாளர்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("notes")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">எனது குறிப்புகள்</div>
                    <div className="text-[10px] text-slate-500">விளக்கக் குறிப்புகள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("bookmarks")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <BookMarked size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">அடையாளங்கள்</div>
                    <div className="text-[10px] text-slate-500">{bookmarks.length} வசனங்கள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("quiz")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                    <Gamepad2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">விளையாட்டு (Quiz)</div>
                    <div className="text-[10px] text-slate-500">100 லெவல்கள்</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigateTo("audio")}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">ஆடியோ பைபிள்</div>
                    <div className="text-[10px] text-slate-500">வசன வாசிப்பு</div>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setSelectedVerseForPoster(dailyVerse ? dailyVerse : null);
                    navigateTo("poster");
                  }}
                  className={`p-4 rounded-2xl flex flex-col items-start gap-2 border transition-all hover:scale-102 cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-xs`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">ஸ்டேட்டஸ் மேக்கர்</div>
                    <div className="text-[10px] text-slate-500">வசன அட்டை உருவாக்கம்</div>
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
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">UMN மின்னூல்கள் (E-Books)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">பாடல் புத்தகங்கள் மற்றும் ஆன்மீக நூல்களைப் பெற இங்கே இணையுங்கள்.</p>
                </div>
              </div>
              <button 
                onClick={(e) => handleLinkClick(e, "https://payhip.com/Umnmelody", "UMN E-Books கடை (Store)")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
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
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">வேதாகம ஆராய்ச்சி (Bible Study)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">ஆன்மீக கட்டுரைகள் மற்றும் வேத தியானங்களைப் படிக்கவும்.</p>
                </div>
              </div>
              <button 
                onClick={(e) => handleLinkClick(e, "https://umnministry.blogspot.com", "வேதாகம ஆராய்ச்சி (Bible Study)")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
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
                <span className="text-xs font-semibold flex items-center gap-2">
                  <Book size={15} className="text-blue-500" /> UMN E-Books கடை (Store)
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button 
                onClick={(e) => handleLinkClick(e, "https://umnministry.blogspot.com", "UMN வேதாகம ஆராய்ச்சி (Bible Study)")}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer text-slate-900 dark:text-white"
              >
                <span className="text-xs font-semibold flex items-center gap-2">
                  <BookOpen size={15} className="text-emerald-500" /> UMN வேதாகம ஆராய்ச்சி (Bible Study)
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button 
                onClick={() => navigateTo("settings")}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer"
              >
                <span className="text-xs font-semibold flex items-center gap-2">
                  <Settings size={15} className="text-slate-500" /> அமைப்புகள் (Settings)
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button 
                onClick={() => navigateTo("about")}
                className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-800/30 cursor-pointer"
              >
                <span className="text-xs font-semibold flex items-center gap-2">
                  <Info size={15} className="text-slate-500" /> எங்களைப் பற்றி (About UMN)
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>
        )}


        {/* SCREEN: BOOKS */}
        {currentScreen === "books" && (
          <div className="p-4 space-y-4 animate-fadeIn">
            {/* Search books */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="புத்தகத்தைத் தேடுக... (எ.கா. யோவான்)"
                value={booksSearchQuery}
                onChange={(e) => setBooksSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </div>

            {/* Testament tabs */}
            <div className={`p-1 rounded-xl flex ${isDarkMode ? 'bg-zinc-900' : 'bg-slate-200'}`}>
              <button 
                onClick={() => setActiveTestament('Old')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${activeTestament === 'Old' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs') : 'text-slate-500'}`}
              >
                பழைய ஏற்பாடு (OT)
              </button>
              <button 
                onClick={() => setActiveTestament('New')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${activeTestament === 'New' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs') : 'text-slate-500'}`}
              >
                புதிய ஏற்பாடு (NT)
              </button>
            </div>

            {/* Books grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredBooks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBook(b);
                    navigateTo("chapters");
                  }}
                  className={`p-3 text-left rounded-xl border hover:scale-102 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                >
                  <div className="font-bold text-xs leading-tight truncate">{b.tamilName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{b.englishName}</div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1.5">{b.chapters} அதிகாரங்கள்</div>
                </button>
              ))}

              {filteredBooks.length === 0 && (
                <div className="col-span-2 text-center py-10 text-slate-500 text-xs">
                  தேடலுக்குப் பொருத்தமான புத்தகங்கள் எதுவும் இல்லை!
                </div>
              )}
            </div>
          </div>
        )}


        {/* SCREEN: CHAPTERS */}
        {currentScreen === "chapters" && selectedBook && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div className={`p-4 rounded-2xl flex items-center justify-between ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} border ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div>
                <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">{selectedBook.tamilName}</h3>
                <p className="text-xs text-slate-500">{selectedBook.englishName}</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-bold">
                {selectedBook.testament === 'Old' ? 'பழைய ஏற்பாடு' : 'புதிய ஏற்பாடு'}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">அதிகாரத்தைத் தேர்ந்தெடுக்கவும்</h4>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelectedChapter(ch);
                      navigateTo("read");
                    }}
                    className={`aspect-square rounded-xl border font-bold text-xs flex items-center justify-center hover:scale-105 transition-all cursor-pointer ${selectedChapter === ch ? 'bg-blue-600 text-white border-blue-600' : (isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800')}`}
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
          <div className="p-4 space-y-4 animate-fadeIn">
            {/* Simple Next/Prev chapter controls */}
            <div className="flex justify-between items-center mb-1">
              <button
                disabled={selectedChapter <= 1}
                onClick={() => setSelectedChapter(prev => prev - 1)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer border ${selectedChapter <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-zinc-800'} ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}
              >
                முந்தைய அதிகாரம்
              </button>
              <span className="text-xs font-bold text-slate-500">
                {selectedChapter} / {selectedBook.chapters}
              </span>
              <button
                disabled={selectedChapter >= selectedBook.chapters}
                onClick={() => setSelectedChapter(prev => prev + 1)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer border ${selectedChapter >= selectedBook.chapters ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-zinc-800'} ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}
              >
                அடுத்த அதிகாரம்
              </button>
            </div>

            {/* Dev Notice Card */}
            <div className={`p-3 rounded-2xl text-[10px] leading-relaxed border flex flex-col gap-1.5 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info size={13} className="text-blue-500" />
                  <span className="font-bold text-[11px] text-slate-700 dark:text-zinc-200">
                    வேதாகம இணைப்பு நிலை (Bible Connection Status)
                  </span>
                </div>
                {isLoadingLive ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-[9px] animate-pulse">
                    ஏற்றுகிறது... / Loading...
                  </span>
                ) : isLiveConnected ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[9px]">
                    🟢 பரிசுத்த வேதாகமம் ஆஃப்லைன் / Holy Bible Offline
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[9px]">
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
                          <div className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <FileText size={10} /> குறிப்பு உள்ளது / Note
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 items-center">
                        {isBookmarked(v) && (
                          <span className="text-red-500">
                            <Bookmark size={14} className="fill-current" />
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
                  <span className="text-xs font-bold text-slate-500">
                    {selectedVerseForAction.bookName} {selectedVerseForAction.chapter}:{selectedVerseForAction.verse} வசன விருப்பங்கள்:
                  </span>
                  <button 
                    onClick={() => setSelectedVerseForAction(null)}
                    className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                  >
                    மூடு
                  </button>
                </div>

                {/* Highlight colors */}
                <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <span className="text-[11px] text-slate-400 font-medium">வண்ணம் பூசு:</span>
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
                      className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white ml-1 font-bold underline cursor-pointer"
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
                    className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 ${isBookmarked(selectedVerseForAction) ? 'text-red-500 border-red-200 bg-red-50/20' : 'text-slate-600 dark:text-zinc-300'}`}
                  >
                    <Bookmark size={14} className={isBookmarked(selectedVerseForAction) ? "fill-red-500" : ""} />
                    <span className="truncate">அடையாளம்</span>
                  </button>

                  <button
                    onClick={() => {
                      copyToClipboard(`"${selectedVerseForAction.text}"\n— ${selectedVerseForAction.bookName} ${selectedVerseForAction.chapter}:${selectedVerseForAction.verse}`);
                      setSelectedVerseForAction(null);
                    }}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                  >
                    <Copy size={14} />
                    <span className="truncate">நகலெடு</span>
                  </button>

                  <button
                    onClick={() => {
                      shareVerse(selectedVerseForAction);
                      setSelectedVerseForAction(null);
                    }}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                  >
                    <Share2 size={14} />
                    <span className="truncate">பகிர்</span>
                  </button>

                  <button
                    onClick={() => openNoteDialog(selectedVerseForAction)}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] font-bold border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                  >
                    <FileText size={14} />
                    <span className="truncate">குறிப்பு</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedVerseForPoster(selectedVerseForAction);
                      setSelectedVerseForAction(null);
                      navigateTo("poster");
                    }}
                    className="py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-[9px] font-bold border cursor-pointer bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40"
                  >
                    <ImageIcon size={14} />
                    <span className="truncate">போஸ்டர்</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* SCREEN: BIBLE SEARCH */}
        {currentScreen === "search" && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">வேதாகம வார்த்தையைத் தட்டச்சு செய்யவும்</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="எ.கா. தேவன், கர்த்தர், அன்பு..."
                  value={searchQuery}
                  onChange={(e) => handleBibleSearch(e.target.value)}
                  className={`flex-1 px-4 py-2 text-xs rounded-xl border focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                தேடல் முடிவுகள் ({searchResults.length})
              </h4>
              <div className="space-y-2.5 pb-12">
                {isSearching ? (
                  <div className="text-center py-12 text-slate-500 text-xs space-y-3 animate-pulse">
                    <Sparkles className="mx-auto text-blue-500 animate-spin" size={24} />
                    <p className="font-semibold text-slate-700 dark:text-zinc-300">முழு வேதாகமத்திலும் தேடுகிறது...</p>
                    <p className="text-[10px] text-slate-400">Searching all 66 books offline...</p>
                  </div>
                ) : (
                  <>
                    {searchResults.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const book = bibleBooks.find(b => b.id === r.bookId)!;
                          setSelectedBook(book);
                          setSelectedChapter(r.chapter);
                          navigateTo("read");
                        }}
                        className={`w-full p-3.5 text-left rounded-xl border hover:scale-101 transition-all cursor-pointer flex flex-col gap-1.5 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                            {r.bookName} {r.chapter}:{r.verse}
                          </span>
                          <ChevronRight size={12} className="text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-serif">
                          "{r.text}"
                        </p>
                      </button>
                    ))}

                    {searchResults.length === 0 && searchQuery.length >= 2 && (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        தேடலுக்குப் பொருத்தமான வசனங்கள் எதுவும் இல்லை!
                      </div>
                    )}
                  </>
                )}

                {searchQuery.length < 2 && (
                  <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                    <Search size={24} className="mx-auto opacity-30" />
                    <p>வார்த்தைகளைத் தட்டச்சு செய்து தேடலைத் தொடங்கவும்</p>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-3">
                      {['ஆதி', 'தேவன்', 'கர்த்தர்', 'அன்பு', 'இயேசு', 'வசனம்'].map((word) => (
                        <button
                          key={word}
                          onClick={() => handleBibleSearch(word)}
                          className="px-2 py-1 text-[10px] font-bold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer"
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* SCREEN: BOOKMARKS */}
        {currentScreen === "bookmarks" && (
          <div className="p-4 space-y-4 animate-fadeIn">
            {bookmarks.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                <BookMarked size={36} className="mx-auto opacity-30 text-slate-400" />
                <p>அடையாளமிட்ட வசனங்கள் எதுவும் இல்லை!</p>
                <p className="text-[10px] text-slate-400">வாசிப்புத் திரையில் வசனங்களைத் தொட்டு அடையாளமிடலாம்.</p>
                <button 
                  onClick={() => navigateTo("books")}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  வாசிக்கச் செல்
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarks.map((b, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <button
                        onClick={() => {
                          const book = bibleBooks.find(book => book.id === b.bookId)!;
                          setSelectedBook(book);
                          setSelectedChapter(b.chapter);
                          navigateTo("read");
                        }}
                        className="font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                      >
                        {b.bookName} {b.chapter}:{b.verse}
                      </button>
                      <button 
                        onClick={() => toggleBookmark(b)}
                        className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                        title="Delete bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs italic leading-relaxed font-serif text-slate-600 dark:text-zinc-300">
                      "{b.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* SCREEN: NOTES */}
        {currentScreen === "notes" && (
          <div className="p-4 space-y-4 animate-fadeIn">
            {notes.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                <FileText size={36} className="mx-auto opacity-30 text-slate-400" />
                <p>குறிப்புகள் எதுவும் இன்னும் எழுதப்படவில்லை!</p>
                <p className="text-[10px] text-slate-400">வசனங்களுக்குக் கீழ் குறிப்பு எழுதிக் கொள்ளலாம்.</p>
                <button 
                  onClick={() => navigateTo("books")}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  புத்தகங்கள் பார்க்க
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {notes.map((n) => (
                  <div 
                    key={n.id}
                    className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <button
                        onClick={() => {
                          const book = bibleBooks.find(book => book.id === n.bookId)!;
                          setSelectedBook(book);
                          setSelectedChapter(n.chapter);
                          navigateTo("read");
                        }}
                        className="font-bold text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer text-left"
                      >
                        {n.bookName} {n.chapter}:{n.verse}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{n.date}</span>
                        <button 
                          onClick={() => {
                            const filtered = notes.filter(note => note.id !== n.id);
                            saveNotes(filtered);
                          }}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 leading-relaxed whitespace-pre-wrap">
                      {n.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* SCREEN: SETTINGS */}
        {currentScreen === "settings" && (
          <div className="p-4 space-y-4 animate-fadeIn">
            {/* Dark Mode Tile */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h4 className="text-xs font-bold">இருண்ட பயன்முறை (Dark Mode)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">பயன்பாட்டின் பின்னணி மாற்று</p>
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
                <h4 className="text-xs font-bold">எழுத்து அளவு மாற்றம் (Font Scale)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">வசனங்களின் வாசிப்பு அளவு</p>
              </div>
              <input 
                type="range" 
                min="14" 
                max="30" 
                value={fontSize} 
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="p-2 text-center rounded-lg bg-slate-50 dark:bg-zinc-950 text-xs border border-slate-100 dark:border-zinc-900" style={{ fontSize: `${fontSize}px` }}>
                இறைவார்த்தை
              </div>
            </div>

            {/* Clear app storage */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h4 className="text-xs font-bold text-red-600">தரவுகளை மீட்டமை (Reset Data)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">சேமிப்புகளை நிரந்தரமாக அழி</p>
              </div>
              <button
                onClick={handleClearAppStorage}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 text-[10px] font-bold rounded-lg border border-red-200 dark:border-red-900/40 cursor-pointer"
              >
                மீட்டமைக்கவும்
              </button>
            </div>

            {/* Version tile */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h4 className="text-xs font-bold">பயன்பாட்டு பதிப்பு (Version)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">UMN Ministry Official Release</p>
              </div>
              <span className="text-xs font-bold text-slate-400">1.0.0 (APK)</span>
            </div>
          </div>
        )}


        {/* SCREEN: ABOUT */}
        {currentScreen === "about" && (
          <div className="p-5 text-center space-y-5 animate-fadeIn">
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
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">UMN Ministry</p>
              <p className="text-[11px] text-slate-400">இறைவார்த்தை உலகெங்கும் பரவ...</p>
            </div>

            <div className={`p-4 rounded-2xl text-xs leading-relaxed text-slate-600 dark:text-zinc-300 border text-justify ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              எங்கள் <strong>UMN தமிழ் வேதாகமச் செயலி</strong> மூலம் இறைவார்த்தையை எளிய முறையில் வாசிக்கவும், தேடவும், தியானிக்கவும் வழிவகை செய்கிறோம். இது முற்றிலும் இலவசமாகவும், எந்தவொரு இணையத் தொடர்பும் இல்லாமலும் ஆஃப்லைனில் முழுமையாக இயங்கும் வகையில் வடிவமைக்கப்பட்டுள்ளது.
            </div>

             <div className="space-y-1.5 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">அதிகாரப்பூர்வ வலைத்தளம்</span>
              <button 
                onClick={(e) => handleLinkClick(e, "https://bibleonlineumnministry.blogspot.com/", "UMN அதிகாரப்பூர்வ வலைத்தளம்")}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-center bg-transparent border-none p-0"
              >
                bibleonlineumnministry.blogspot.com <ExternalLink size={12} />
              </button>
            </div>

            <div className="pt-8 text-[10px] text-slate-400">
              © 2026 UMN Ministry. All Rights Reserved.
            </div>
          </div>
        )}

        {currentScreen === "quiz" && (
          <div className="absolute inset-0 z-30 overflow-hidden flex flex-col h-full animate-fadeIn">
            <BibleQuiz isDarkMode={isDarkMode} onBack={navigateBack} />
          </div>
        )}

        {currentScreen === "audio" && (
          <div className="absolute inset-0 z-30 overflow-hidden flex flex-col h-full animate-fadeIn">
            <AudioBible isDarkMode={isDarkMode} onBack={navigateBack} />
          </div>
        )}

        {currentScreen === "poster" && (
          <div className="absolute inset-0 z-30 overflow-hidden flex flex-col h-full animate-fadeIn">
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

      </div>

      {/* Interactive Bottom Modal Dialog for taking notes */}
      {isNoteModalOpen && selectedVerseForAction && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end animate-fadeIn">
          <div className={`w-full rounded-t-3xl p-5 space-y-4 border-t ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <FileText size={14} /> குறிப்பு எழுதுதல் (Add Note)
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedVerseForAction.bookName} {selectedVerseForAction.chapter}:{selectedVerseForAction.verse}
              </span>
            </div>

            <div className={`p-3 rounded-xl border italic text-xs text-slate-500 bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800 font-serif`}>
              "{selectedVerseForAction.text}"
            </div>

            <textarea
              rows={4}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="உங்கள் தியானக்குறிப்புகள் அல்லது கருத்துக்களை இங்கே எழுதவும்..."
              className={`w-full p-3 text-xs border rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200'}`}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setSelectedVerseForAction(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 ${isDarkMode ? 'border-zinc-800 text-zinc-300' : 'border-slate-300 text-slate-700'}`}
              >
                ரத்து
              </button>
              <button
                onClick={saveNote}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                குறிப்பைச் சேமி
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone Navigation Bar simulation */}
      <div className={`h-14 border-t shrink-0 flex items-center justify-around select-none ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-100 border-slate-200'}`}>
        <button 
          onClick={() => {
            setHistory([]);
            setCurrentScreen("home");
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${currentScreen === "home" ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Compass size={18} />
          <span className="text-[9px] font-bold">முகப்பு</span>
        </button>

        <button 
          onClick={() => {
            setHistory([]);
            setCurrentScreen("books");
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${currentScreen === "books" || currentScreen === "chapters" || currentScreen === "read" ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <BookOpen size={18} />
          <span className="text-[9px] font-bold">வேதாகமம்</span>
        </button>

        <button 
          onClick={() => {
            setHistory([]);
            setCurrentScreen("search");
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${currentScreen === "search" ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Search size={18} />
          <span className="text-[9px] font-bold">தேடல்</span>
        </button>

        <button 
          onClick={() => {
            setHistory([]);
            setCurrentScreen("bookmarks");
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${currentScreen === "bookmarks" ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <BookMarked size={18} />
          <span className="text-[9px] font-bold">பிடித்தவை</span>
        </button>
      </div>

      {/* External Link Redirect Dialog */}
      {activeRedirectUrl && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-end animate-fadeIn">
          <div className={`w-full rounded-t-3xl p-5 space-y-4 border-t shadow-2xl relative ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800/60">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ExternalLink size={14} /> இணைப்பு உதவி (Open Link)
              </span>
              <button 
                onClick={() => setActiveRedirectUrl(null)}
                className={`p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-500`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">இணைப்பின் தலைப்பு:</span>
              <p className="text-xs font-bold">{activeRedirectTitle}</p>
            </div>

            <div className={`p-2.5 rounded-xl border font-mono text-[10px] bg-slate-50 dark:bg-zinc-950 dark:border-zinc-800/60 select-all break-all text-blue-600 dark:text-blue-400`}>
              {activeRedirectUrl}
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              குறிப்பு: உங்கள் APK அல்லது சாதனத்தில் நேரடி லிங்க் வேலை செய்யாவிட்டால், 'லிங்க் நகலெடுக்க' பொத்தானை அழுத்தி, கூகுள் குரோம் போன்ற உலாவியில் பேஸ்ட் செய்து திறக்கவும்.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  window.open(activeRedirectUrl, '_blank', 'noopener,noreferrer');
                }}
                className="py-2.5 px-3 text-[11px] font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center justify-center gap-1"
              >
                உலாவியில் திறக்க <ExternalLink size={11} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeRedirectUrl);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className={`py-2.5 px-3 text-[11px] font-bold rounded-xl border cursor-pointer hover:bg-slate-150 dark:hover:bg-zinc-800 flex items-center justify-center gap-1 ${isDarkMode ? 'border-zinc-800 bg-zinc-800/40 text-zinc-300' : 'border-slate-300 bg-slate-50 text-slate-700'}`}
              >
                <Copy size={11} /> லிங்க் நகலெடுக்க
              </button>
            </div>
            
            <button
              onClick={() => {
                window.location.href = activeRedirectUrl;
              }}
              className="w-full py-2 text-[10px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
            >
              நேரடித் திசைதிருப்புதல் (Direct Redirect Fallback)
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification for copying text */}
      {copiedText && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 dark:bg-zinc-900/95 text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-lg border border-slate-800 flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 size={12} className="text-green-400 shrink-0" />
          <span>நகலெடுக்கப்பட்டது! (Copied to Clipboard)</span>
        </div>
      )}

    </div>
  );
}
