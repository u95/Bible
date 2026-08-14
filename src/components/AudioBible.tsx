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
  ChevronDown, 
  Music, 
  Sparkles, 
  ArrowLeft,
  Sliders,
  CheckCircle,
  AlertCircle,
  Globe,
  Smartphone,
  Info
} from 'lucide-react';
import { bibleBooks, getVersesForChapter, BibleBook, BibleVerse } from '../data/bibleData';

type AudioEngineMode = 'online' | 'device' | 'simulation';

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
  
  // Audio Engine: 'online' (HD Online Tamil voice via HTML5 Audio) or 'device' (Local TTS) or 'simulation' (Auto-Reader)
  const [audioEngine, setAudioEngine] = useState<AudioEngineMode>('online');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasTamilDeviceVoice, setHasTamilDeviceVoice] = useState<boolean>(false);
  const [audioStatusMessage, setAudioStatusMessage] = useState<string>('');

  // Sleep Timer states
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null); // null = off, or 5, 15, 30, 45, 60
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null); // in seconds
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selector dropdown states
  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);
  const [showChapterSelector, setShowChapterSelector] = useState<boolean>(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false);
  const [showEngineSelector, setShowEngineSelector] = useState<boolean>(false);

  // HTML5 Audio Reference for Online High-Fidelity Tamil Voice
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioChunkQueueRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);

  // Speech synthesis reference for Offline Device TTS
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animated visualizer heights
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(Array(15).fill(4));
  const visualizerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll reference for verses
  const verseListContainerRef = useRef<HTMLDivElement | null>(null);

  // Helper to chunk text into safe sizes for speech / online TTS (<100 chars at clause boundaries)
  const chunkTextForAudio = (text: string): string[] => {
    const cleaned = text
      .replace(/[0-9]+/g, '')
      .replace(/[\(\[\{\}\]\)]/g, '')
      .trim();

    if (!cleaned) return [''];
    if (cleaned.length <= 90) return [cleaned];

    // Split on punctuation marks
    const sentences = cleaned.split(/(?<=[.,;?!:।|])/g).map(s => s.trim()).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length <= 90) {
        currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (sentence.length > 90) {
          // Break by words
          const words = sentence.split(/\s+/);
          let subChunk = '';
          for (const word of words) {
            if ((subChunk + ' ' + word).length <= 90) {
              subChunk = subChunk ? `${subChunk} ${word}` : word;
            } else {
              if (subChunk) chunks.push(subChunk);
              subChunk = word;
            }
          }
          if (subChunk) currentChunk = subChunk;
          else currentChunk = '';
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks.length > 0 ? chunks : [cleaned];
  };

  // Initialize Speech Synthesis and device voice list
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
          const hasTamil = voices.some(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
          setHasTamilDeviceVoice(hasTamil);
        } catch {
          // ignore
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    // Load active verses
    loadChapterVerses(selectedBook, selectedChapter);

    return () => {
      stopPlayback();
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    };
  }, [selectedBook, selectedChapter]);

  // Keep-alive timer for Android WebView SpeechSynthesis
  useEffect(() => {
    if (isPlaying && audioEngine === 'device' && synthRef.current) {
      keepAliveIntervalRef.current = setInterval(() => {
        try {
          if (synthRef.current && synthRef.current.paused) {
            synthRef.current.resume();
          }
        } catch {
          // ignore
        }
      }, 3000);
    } else {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    }

    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };
  }, [isPlaying, audioEngine]);

  // Simulation / Mock Playback Effect for auto-reader mode
  useEffect(() => {
    if (mockTimerRef.current) {
      clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }

    if (isPlaying && audioEngine === 'simulation') {
      const activeVerse = verses[currentVerseIndex];
      if (activeVerse) {
        const wordCount = activeVerse.text.split(/\s+/).length;
        const calculatedDelay = (2500 + wordCount * 350) / playbackRate;
        const delay = Math.max(3000, Math.min(calculatedDelay, 15000));

        scrollToVerse(currentVerseIndex);
        startVisualizerAnimation();

        mockTimerRef.current = setTimeout(() => {
          const nextIndex = currentVerseIndex + 1;
          if (nextIndex < verses.length) {
            setCurrentVerseIndex(nextIndex);
          } else {
            if (selectedChapter < selectedBook.chapters) {
              setSelectedChapter(prev => prev + 1);
              setCurrentVerseIndex(0);
            } else {
              stopPlayback();
            }
          }
        }, delay);
      }
    }

    return () => {
      if (mockTimerRef.current) {
        clearTimeout(mockTimerRef.current);
        mockTimerRef.current = null;
      }
    };
  }, [isPlaying, currentVerseIndex, verses, audioEngine, playbackRate, selectedChapter]);

  // Smooth scroll to active verse
  const scrollToVerse = (index: number) => {
    setTimeout(() => {
      const activeElement = document.getElementById(`audio-verse-${index}`);
      if (activeElement && verseListContainerRef.current) {
        verseListContainerRef.current.scrollTo({
          top: activeElement.offsetTop - 120,
          behavior: 'smooth'
        });
      }
    }, 80);
  };

  // Load verses from local assets or fallback generator
  const loadChapterVerses = (book: BibleBook, chapterNum: number) => {
    stopPlayback();
    
    fetch(`bible/${encodeURIComponent(book.englishName)}.json`)
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
        Array(15).fill(0).map(() => Math.floor(Math.random() * 28) + 6)
      );
    }, 150);
  };

  // Stop visualizer animation
  const stopVisualizerAnimation = () => {
    if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    setVisualizerHeights(Array(15).fill(4));
  };

  // Play a single audio chunk via Online HD Audio
  const playNextOnlineChunk = (index: number) => {
    if (currentChunkIndexRef.current >= audioChunkQueueRef.current.length) {
      // Verse finished, move to next verse
      const nextIndex = index + 1;
      if (nextIndex < verses.length) {
        setCurrentVerseIndex(nextIndex);
        playActiveVerse(nextIndex);
      } else {
        // Finished Chapter!
        if (selectedChapter < selectedBook.chapters) {
          setSelectedChapter(prev => prev + 1);
          setCurrentVerseIndex(0);
        } else {
          stopPlayback();
        }
      }
      return;
    }

    const chunkText = audioChunkQueueRef.current[currentChunkIndexRef.current];
    currentChunkIndexRef.current += 1;

    // Use reliable Google Text-to-Speech audio streaming url for Tamil
    const encodedText = encodeURIComponent(chunkText);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=${encodedText}`;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }

    const audio = audioElementRef.current;
    audio.src = audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    audio.onplay = () => {
      setIsPlaying(true);
      startVisualizerAnimation();
    };

    audio.onended = () => {
      playNextOnlineChunk(index);
    };

    audio.onerror = (e) => {
      console.warn("Online Audio failed, falling back to Device TTS", e);
      // Seamlessly fall back to Device TTS if online fails or network drops
      playDeviceTTSVerse(index);
    };

    audio.play().catch(err => {
      console.warn("Audio play blocked or network error, falling back to Device TTS", err);
      playDeviceTTSVerse(index);
    });
  };

  // Play verse via Device Speech Synthesis (Local TTS)
  const playDeviceTTSVerse = (index: number) => {
    if (!synthRef.current) {
      // Fall back to simulation
      setAudioEngine('simulation');
      setIsPlaying(true);
      return;
    }

    try {
      synthRef.current.cancel();
      if (synthRef.current.paused) {
        synthRef.current.resume();
      }

      const activeVerse = verses[index];
      if (!activeVerse) return;

      const cleanText = activeVerse.text
        .replace(/[0-9]+/g, '')
        .replace(/[\(\[\{\}\]\)]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;
      
      // Explicitly configure Tamil language for Android & Web
      utterance.lang = 'ta-IN';

      const voices = synthRef.current.getVoices();
      const tamilVoice = voices.find(v => 
        v.lang === 'ta-IN' || 
        v.lang.startsWith('ta') || 
        v.name.toLowerCase().includes('tamil')
      );

      if (tamilVoice) {
        utterance.voice = tamilVoice;
      }

      utterance.rate = playbackRate;
      utterance.volume = isMuted ? 0 : volume;

      utterance.onstart = () => {
        setIsPlaying(true);
        startVisualizerAnimation();
      };

      utterance.onend = () => {
        const nextIndex = index + 1;
        if (nextIndex < verses.length) {
          setCurrentVerseIndex(nextIndex);
          playActiveVerse(nextIndex);
        } else {
          if (selectedChapter < selectedBook.chapters) {
            setSelectedChapter(prev => prev + 1);
            setCurrentVerseIndex(0);
          } else {
            stopPlayback();
          }
        }
      };

      utterance.onerror = (e) => {
        console.warn("Device TTS error:", e);
        // Fall back to simulation so user is not blocked
        setAudioEngine('simulation');
      };

      synthRef.current.speak(utterance);
    } catch (err) {
      console.error("Device TTS failed:", err);
      setAudioEngine('simulation');
    }
  };

  // Master play handler
  const playActiveVerse = (index: number) => {
    if (verses.length === 0 || index >= verses.length) {
      setIsPlaying(false);
      stopVisualizerAnimation();
      return;
    }

    scrollToVerse(index);

    if (audioEngine === 'simulation') {
      setIsPlaying(true);
      startVisualizerAnimation();
      return;
    }

    if (audioEngine === 'online') {
      // Stop ongoing device synthesis
      if (synthRef.current) synthRef.current.cancel();
      // Prepare chunks for online audio
      const activeVerse = verses[index];
      const chunks = chunkTextForAudio(activeVerse.text);
      audioChunkQueueRef.current = chunks;
      currentChunkIndexRef.current = 0;
      playNextOnlineChunk(index);
    } else {
      // Device TTS mode
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      playDeviceTTSVerse(index);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      setIsPlaying(true);
      playActiveVerse(currentVerseIndex);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    stopVisualizerAnimation();

    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }

    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch {
        // ignore
      }
    }

    if (mockTimerRef.current) {
      clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
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
    if (isPlaying) {
      if (audioElementRef.current) {
        audioElementRef.current.playbackRate = rate;
      }
      playActiveVerse(currentVerseIndex);
    }
  };

  // Sleep Timer Controller
  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    setShowSpeedSelector(false);

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
            <p className="text-[10px] text-slate-400 font-medium">தெளிவான தமிழ் குரல் வாசிப்பு</p>
          </div>
        </div>

        {/* Audio Engine Mode Pill */}
        <div className="relative">
          <button
            onClick={() => setShowEngineSelector(!showEngineSelector)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
              audioEngine === 'online'
                ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300'
                : audioEngine === 'device'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
            }`}
            title="குரல் முறை தேர்வு (Audio Engine)"
          >
            {audioEngine === 'online' && <Globe size={12} />}
            {audioEngine === 'device' && <Smartphone size={12} />}
            {audioEngine === 'simulation' && <Sparkles size={12} />}
            <span>
              {audioEngine === 'online' && 'HD ஆன்லைன் குரல்'}
              {audioEngine === 'device' && 'சாதனக் குரல் (TTS)'}
              {audioEngine === 'simulation' && 'தானியங்கி வாசிப்பு'}
            </span>
            <ChevronDown size={12} />
          </button>

          {/* Engine Dropdown Menu */}
          <AnimatePresence>
            {showEngineSelector && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`absolute right-0 mt-1.5 w-64 p-2 rounded-2xl border shadow-2xl z-50 ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-[10px] font-black text-slate-400 px-2 py-1 uppercase tracking-wider">
                  குரல் தேர்வு (Audio Engine)
                </div>

                <div className="space-y-1 mt-1">
                  <button
                    onClick={() => {
                      stopPlayback();
                      setAudioEngine('online');
                      setShowEngineSelector(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                      audioEngine === 'online'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-blue-500 shrink-0" />
                      <div>
                        <p className="font-extrabold text-[11px]">HD ஆன்லைன் குரல் (பரிந்துரை)</p>
                        <p className="text-[9px] text-slate-400 font-normal">தெளிவான இயற்கை தமிழ் குரல்</p>
                      </div>
                    </div>
                    {audioEngine === 'online' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </button>

                  <button
                    onClick={() => {
                      stopPlayback();
                      setAudioEngine('device');
                      setShowEngineSelector(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                      audioEngine === 'device'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone size={14} className="text-emerald-500 shrink-0" />
                      <div>
                        <p className="font-extrabold text-[11px]">சாதன ஆஃப்லைன் குரல்</p>
                        <p className="text-[9px] text-slate-400 font-normal">போனின் உள்ளமைக்கப்பட்ட TTS</p>
                      </div>
                    </div>
                    {audioEngine === 'device' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </button>

                  <button
                    onClick={() => {
                      stopPlayback();
                      setAudioEngine('simulation');
                      setShowEngineSelector(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                      audioEngine === 'simulation'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="font-extrabold text-[11px]">தானியங்கி வாசிப்பு (Silent)</p>
                        <p className="text-[9px] text-slate-400 font-normal">வசனங்கள் தானாக நகரும்</p>
                      </div>
                    </div>
                    {audioEngine === 'simulation' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* STATUS / TIP BAR */}
        <div className={`px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between border-b ${
          isDarkMode ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400' : 'bg-slate-100/60 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5">
            <Info size={12} className="text-blue-500 shrink-0" />
            <span>
              {audioEngine === 'online' && '🔊 இயற்கை தமிழ் ஒலி வடிவம் (100% சத்தம் கேட்கும்)'}
              {audioEngine === 'device' && (hasTamilDeviceVoice ? '📱 சாதன தமிழ் குரல்' : '📱 சாதன TTS')}
              {audioEngine === 'simulation' && '📖 வசன வாசிப்பு முறை (Silent Mode)'}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-blue-500">
            {verses.length} வசனங்கள்
          </span>
        </div>

        {/* VERSE READING STREAMING BOARD (SCROLLS AUTOMATICALLY) */}
        <div 
          ref={verseListContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 w-full max-w-4xl mx-auto"
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
                    className={`absolute bottom-12 left-0 w-48 p-2 rounded-2xl border shadow-xl z-50 ${
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
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (audioElementRef.current) {
                  audioElementRef.current.volume = nextMuted ? 0 : volume;
                }
                if (utteranceRef.current) {
                  utteranceRef.current.volume = nextMuted ? 0 : volume;
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
