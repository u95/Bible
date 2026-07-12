import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Clock, 
  BookOpen, 
  ChevronDown, 
  Music, 
  Sparkles, 
  ArrowLeft,
  Volume1,
  Sliders,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { bibleBooks, getVersesForChapter, BibleBook, BibleVerse } from '../data/bibleData';

export default function AudioBible({ isDarkMode, onBack }: { isDarkMode: boolean; onBack: () => void }) {
  // Book & Chapter Selectors
  const [selectedBook, setSelectedBook] = useState<BibleBook>(bibleBooks[0]); // Default to Genesis
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);

  // Sleep Timer states
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null); // null = off, or 5, 15, 30, 45, 60
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null); // in seconds
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selector dropdown states
  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);
  const [showChapterSelector, setShowChapterSelector] = useState<boolean>(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false);

  // Speech synthesis reference
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Animated visualizer heights
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(Array(15).fill(4));
  const visualizerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll reference for verses
  const verseListContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize Speech Synthesis and load verses
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      setIsSpeechSupported(true);
    } else {
      setIsSpeechSupported(false);
      console.warn("Speech Synthesis is not supported in this browser.");
    }

    // Load active verses
    loadChapterVerses(selectedBook, selectedChapter);

    return () => {
      stopPlayback();
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [selectedBook, selectedChapter]);

  // Load verses from local assets or fallback generator
  const loadChapterVerses = (book: BibleBook, chapterNum: number) => {
    stopPlayback();
    
    // Attempt to load from JSON offline files
    fetch(`/bible/${encodeURIComponent(book.englishName)}.json`)
      .then(res => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then(data => {
        if (data && data.chapters && Array.isArray(data.chapters)) {
          const chData = data.chapters.find((c: any) => c.chapter === chapterNum.toString());
          if (chData && Array.isArray(chData.verses)) {
            const loaded = chData.verses.map((v: any) => ({
              bookId: book.id,
              bookName: book.tamilName,
              chapter: chapterNum,
              verse: parseInt(v.verse),
              text: v.text
            }));
            setVerses(loaded);
            setCurrentVerseIndex(0);
          } else {
            throw new Error("Chapter missing");
          }
        }
      })
      .catch(err => {
        // Fallback using our generator
        console.warn("Audio load fallback to static generator", err);
        const fallback = getVersesForChapter(book.id, chapterNum);
        setVerses(fallback);
        setCurrentVerseIndex(0);
      });
  };

  // Start visualizer bar animation
  const startVisualizerAnimation = () => {
    if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    
    visualizerIntervalRef.current = setInterval(() => {
      setVisualizerHeights(
        Array(15).fill(0).map(() => Math.floor(Math.random() * 32) + 6)
      );
    }, 150);
  };

  // Stop visualizer animation
  const stopVisualizerAnimation = () => {
    if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    setVisualizerHeights(Array(15).fill(4));
  };

  // Audio Playback Controllers
  const playActiveVerse = (index: number) => {
    if (!synthRef.current || verses.length === 0 || index >= verses.length) {
      setIsPlaying(false);
      stopVisualizerAnimation();
      return;
    }

    // Cancel ongoing speech
    synthRef.current.cancel();

    const activeVerse = verses[index];
    
    // Scroll active verse into view
    setTimeout(() => {
      const activeElement = document.getElementById(`audio-verse-${index}`);
      if (activeElement && verseListContainerRef.current) {
        verseListContainerRef.current.scrollTo({
          top: activeElement.offsetTop - 120,
          behavior: 'smooth'
        });
      }
    }, 100);

    // Filter Tamil characters and clean the text to avoid robot stuttering
    const cleanText = activeVerse.text
      .replace(/[0-9]+/g, '')
      .replace(/[\(\[\{\}\]\)]/g, '')
      .trim();

    // Setup voice synthesis utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;
    
    // Query available voices and set a Tamil voice if present
    const voices = synthRef.current.getVoices();
    const tamilVoice = voices.find(v => v.lang === 'ta-IN' || v.lang.startsWith('ta'));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }
    
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : volume;

    // Events
    utterance.onstart = () => {
      setIsPlaying(true);
      startVisualizerAnimation();
    };

    utterance.onend = () => {
      // Advance to next verse automatically
      const nextIndex = index + 1;
      if (nextIndex < verses.length) {
        setCurrentVerseIndex(nextIndex);
        playActiveVerse(nextIndex);
      } else {
        // Completed the chapter!
        stopPlayback();
        // Go to next chapter if available
        if (selectedChapter < selectedBook.chapters) {
          setSelectedChapter(prev => prev + 1);
        }
      }
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setIsPlaying(false);
      stopVisualizerAnimation();
    };

    // Speak!
    synthRef.current.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!synthRef.current) {
      // Mock playback if speech synthesis not available
      setIsPlaying(!isPlaying);
      if (!isPlaying) startVisualizerAnimation();
      else stopVisualizerAnimation();
      return;
    }

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
      stopVisualizerAnimation();
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
        startVisualizerAnimation();
      } else {
        playActiveVerse(currentVerseIndex);
      }
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    stopVisualizerAnimation();
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const handleSkipForward = () => {
    if (currentVerseIndex + 1 < verses.length) {
      const nextIdx = currentVerseIndex + 1;
      setCurrentVerseIndex(nextIdx);
      if (isPlaying) {
        playActiveVerse(nextIdx);
      }
    } else {
      // Next Chapter
      if (selectedChapter < selectedBook.chapters) {
        setSelectedChapter(prev => prev + 1);
      }
    }
  };

  const handleSkipBack = () => {
    if (currentVerseIndex > 0) {
      const prevIdx = currentVerseIndex - 1;
      setCurrentVerseIndex(prevIdx);
      if (isPlaying) {
        playActiveVerse(prevIdx);
      }
    } else {
      // Previous Chapter
      if (selectedChapter > 1) {
        setSelectedChapter(prev => prev - 1);
      }
    }
  };

  // Change playback speed
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedSelector(false);
    if (isPlaying && synthRef.current) {
      // Restart current verse with new speed
      playActiveVerse(currentVerseIndex);
    }
  };

  // Sleep Timer Controller
  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    setShowSpeedSelector(false); // Close other settings

    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);

    if (minutes === null) {
      setSleepTimeRemaining(null);
      return;
    }

    const totalSeconds = minutes * 60;
    setSleepTimeRemaining(totalSeconds);

    sleepTimerRef.current = setInterval(() => {
      setSleepTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(sleepTimerRef.current!);
          stopPlayback();
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER BAR */}
      <div className={`px-4 py-3 border-b shrink-0 flex items-center justify-between z-10 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              stopPlayback();
              onBack();
            }}
            className={`p-1.5 rounded-full cursor-pointer hover:bg-opacity-10 transition-all ${isDarkMode ? 'hover:bg-white text-zinc-300' : 'hover:bg-slate-900 text-slate-600'}`}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <Music size={14} className="text-blue-500 animate-pulse" /> ஆடியோ வேதாகமம் (Audio Bible)
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">பரிசுத்த வேதாகம உரை வாசிப்பு</p>
          </div>
        </div>
      </div>

      {/* BODY WORKSPACE */}
      <div className="flex-1 overflow-hidden flex flex-col relative">

        {/* SELECTOR PANEL */}
        <div className={`p-3 shrink-0 flex gap-2 border-b ${isDarkMode ? 'bg-zinc-900/60 border-zinc-900' : 'bg-white border-slate-100'} z-20`}>
          {/* Book Dropdown Button */}
          <div className="relative flex-1">
            <button 
              onClick={() => {
                setShowBookSelector(!showBookSelector);
                setShowChapterSelector(false);
              }}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{selectedBook.tamilName}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {/* Book Selector Dropdown Menu */}
            <AnimatePresence>
              {showBookSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border shadow-xl z-50 ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="p-1 divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {bibleBooks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBook(b);
                          setSelectedChapter(1);
                          setShowBookSelector(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex justify-between items-center cursor-pointer rounded-lg hover:bg-blue-50 dark:hover:bg-zinc-800/50 ${
                          selectedBook.id === b.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        <span>{b.tamilName}</span>
                        <span className="text-[10px] text-slate-400">{b.englishName}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chapter Dropdown Button */}
          <div className="relative w-28">
            <button 
              onClick={() => {
                setShowChapterSelector(!showChapterSelector);
                setShowBookSelector(false);
              }}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">அதி: {selectedChapter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {/* Chapter Selector Dropdown Menu */}
            <AnimatePresence>
              {showChapterSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`absolute right-0 w-32 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border shadow-xl z-50 ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-1 p-1.5">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => {
                          setSelectedChapter(ch);
                          setShowChapterSelector(false);
                        }}
                        className={`py-2 rounded-lg text-xs font-extrabold text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800 ${
                          selectedChapter === ch ? 'bg-blue-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* NOTIFICATION BOX IF NOT SUPPORTED */}
        {!isSpeechSupported && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-2.5 px-4 text-amber-500 text-[10px] font-bold flex items-center gap-1.5">
            <AlertCircle size={12} className="shrink-0" />
            <span>உங்கள் உலாவி உரை வாசிப்பை ஆதரிக்கவில்லை. ஆடியோ சிமுலேட்டர் காட்டப்படுகிறது.</span>
          </div>
        )}

        {/* VERSE READING STREAMING BOARD (SCROLLS AUTOMATICALLY) */}
        <div 
          ref={verseListContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {verses.map((v, index) => {
            const isActive = index === currentVerseIndex;
            return (
              <button
                key={v.verse}
                id={`audio-verse-${index}`}
                onClick={() => {
                  setCurrentVerseIndex(index);
                  if (isPlaying) {
                    playActiveVerse(index);
                  }
                }}
                className={`w-full text-left p-3 rounded-2xl border transition-all text-xs flex gap-2 items-start cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50/70 border-blue-400 shadow-xs dark:bg-blue-950/20 dark:border-blue-700 scale-102' 
                    : (isDarkMode ? 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/50' : 'bg-white border-slate-100 hover:bg-slate-50')
                }`}
              >
                <span className={`font-black text-[10px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                  {v.verse}
                </span>
                <p className={`font-serif leading-relaxed flex-1 ${isActive ? 'text-blue-900 dark:text-blue-300 font-extrabold' : 'text-slate-600 dark:text-zinc-300'}`}>
                  {v.text}
                </p>
              </button>
            );
          })}
        </div>

        {/* BOTTOM ACTIVE CONTROL BOARD */}
        <div className={`p-4 border-t shadow-lg shrink-0 ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-slate-200'}`}>
          
          {/* Visualizer and Sleep Timer row */}
          <div className="flex justify-between items-center mb-3.5">
            {/* Equalizer animation */}
            <div className="flex items-end gap-0.5 h-6">
              {visualizerHeights.map((h, i) => (
                <div 
                  key={i} 
                  className={`w-0.75 bg-blue-500 rounded-full transition-all duration-150`}
                  style={{ height: `${h}px` }}
                />
              ))}
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 ml-1.5 font-mono">
                {verses.length > 0 ? `${currentVerseIndex + 1}/${verses.length}` : '0/0'} வசனம்
              </span>
            </div>

            {/* Sleep Timer Indicator */}
            {sleepTimerMinutes !== null && sleepTimeRemaining !== null && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                <Clock size={11} className="animate-pulse" />
                <span>அணையும் நேரம்: {formatTime(sleepTimeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex justify-between items-center gap-2">
            
            {/* Speed selection */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowSpeedSelector(!showSpeedSelector);
                  setShowBookSelector(false);
                }}
                className={`p-2.5 rounded-xl border text-[10px] font-black cursor-pointer ${
                  isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                }`}
                title="Playback Speed & Timer"
              >
                {playbackRate}x / ⏰
              </button>

              <AnimatePresence>
                {showSpeedSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute bottom-12 left-0 w-44 p-2 rounded-2xl border shadow-xl z-50 ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div>
                        <div className="text-[9px] font-black text-slate-400 mb-1 px-1 uppercase tracking-wider">வேகம் (Speed)</div>
                        <div className="grid grid-cols-4 gap-1">
                          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => handleRateChange(rate)}
                              className={`py-1 text-[9px] font-bold rounded-md cursor-pointer ${
                                playbackRate === rate ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-zinc-800'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-1.5">
                        <div className="text-[9px] font-black text-slate-400 mb-1 px-1 uppercase tracking-wider">அணைக்கும் நேரம் (Timer)</div>
                        <div className="grid grid-cols-4 gap-1">
                          {[null, 10, 30, 60].map((mins) => (
                            <button
                              key={mins ?? 'off'}
                              onClick={() => setSleepTimer(mins)}
                              className={`py-1 text-[9px] font-bold rounded-md cursor-pointer ${
                                sleepTimerMinutes === mins ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-zinc-800'
                              }`}
                            >
                              {mins === null ? 'Off' : `${mins}m`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Media Player central core */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSkipBack}
                className={`p-2.5 rounded-full hover:bg-opacity-15 transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-white text-zinc-300' : 'hover:bg-slate-900 text-slate-600'
                }`}
                title="முந்தைய வசனம்"
              >
                <SkipBack size={18} />
              </button>

              <button 
                onClick={handlePlayPause}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
                title={isPlaying ? "இடைநிறுத்தம்" : "இயக்கு"}
              >
                {isPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white ml-0.5" />}
              </button>

              <button 
                onClick={handleSkipForward}
                className={`p-2.5 rounded-full hover:bg-opacity-15 transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-white text-zinc-300' : 'hover:bg-slate-900 text-slate-600'
                }`}
                title="அடுத்த வசனம்"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Volume toggle */}
            <button 
              onClick={() => {
                setIsMuted(!isMuted);
                if (utteranceRef.current) {
                  utteranceRef.current.volume = isMuted ? volume : 0;
                }
              }}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} className="text-red-500" /> : <Volume2 size={15} />}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
