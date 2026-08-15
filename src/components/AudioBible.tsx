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
  Info,
  Volume1,
  RefreshCw
} from 'lucide-react';
import { bibleBooks, getVersesForChapter, BibleBook, BibleVerse } from '../data/bibleData';

type AudioEngineMode = 'device' | 'online' | 'simulation';

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
  
  // Audio Engine: 'device' (Local Android/Browser TTS with Google Tamil Pack) or 'online' (Online Stream) or 'simulation' (Auto-Reader)
  const [audioEngine, setAudioEngine] = useState<AudioEngineMode>('device');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasTamilDeviceVoice, setHasTamilDeviceVoice] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  // Sleep Timer states
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null); // null = off, or 5, 15, 30, 45, 60
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null); // in seconds
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selector dropdown states
  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);
  const [showChapterSelector, setShowChapterSelector] = useState<boolean>(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false);
  const [showEngineSelector, setShowEngineSelector] = useState<boolean>(false);

  // Audio Chunk Queue for chunk-based smooth Android speech
  const speechChunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);

  // HTML5 Audio Reference for Online High-Fidelity Tamil Voice
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Speech synthesis reference for Offline Device TTS
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const mockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Animated visualizer heights
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(Array(15).fill(4));
  const visualizerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll reference for verses
  const verseListContainerRef = useRef<HTMLDivElement | null>(null);

  // Play a gentle acoustic chime through Web Audio API to unlock audio & confirm sound
  const playChimeTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5 note
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // ignore
    }
  };

  // Helper to chunk text into safe sizes for speech (<80 chars at clause boundaries)
  // Essential for Android WebViews where long utterances get silently dropped or cut off!
  const chunkTextForAudio = (text: string): string[] => {
    const cleaned = text
      .replace(/[0-9]+/g, '')
      .replace(/[\(\[\{\}\]\)]/g, '')
      .replace(/[:;]/g, ',')
      .trim();

    if (!cleaned) return [''];
    if (cleaned.length <= 75) return [cleaned];

    // Split on punctuation marks
    const sentences = cleaned.split(/(?<=[.,?!।|])/g).map(s => s.trim()).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length <= 75) {
        currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (sentence.length > 75) {
          // Break by spaces / words
          const words = sentence.split(/\s+/);
          let subChunk = '';
          for (const word of words) {
            if ((subChunk + ' ' + word).length <= 75) {
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

  // Find the most suitable Tamil or Indian voice available on device
  const getBestTamilVoice = (): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Direct Tamil voice (e.g. ta-IN, ta_IN, Google தமிழ்)
    const exactTamil = voices.find(v => 
      v.lang.toLowerCase().startsWith('ta') || 
      v.name.toLowerCase().includes('tamil') ||
      v.name.includes('தமிழ்')
    );
    if (exactTamil) return exactTamil;

    // 2. Indian English / Indian voice fallback
    const indianVoice = voices.find(v => v.lang.toLowerCase().includes('in') || v.name.toLowerCase().includes('india'));
    if (indianVoice) return indianVoice;

    // 3. Default voice
    const defaultVoice = voices.find(v => v.default);
    return defaultVoice || voices[0] || null;
  };

  // Initialize Speech Synthesis and device voice list
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
          const tamilVoice = voices.find(v => 
            v.lang.toLowerCase().startsWith('ta') || 
            v.name.toLowerCase().includes('tamil') ||
            v.name.includes('தமிழ்')
          );
          setHasTamilDeviceVoice(!!tamilVoice);
        } catch {
          // ignore
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
      
      // Secondary poll for Android WebView where onvoiceschanged may not fire immediately
      const pollTimer = setTimeout(updateVoices, 800);
      return () => clearTimeout(pollTimer);
    }

    // Load active verses
    loadChapterVerses(selectedBook, selectedChapter);

    return () => {
      stopPlayback();
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    };
  }, [selectedBook, selectedChapter]);

  // Keep-alive timer for Android WebView SpeechSynthesis to prevent sleep
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
      }, 2500);
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
    }, 60);
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

  // One-tap Voice Tester to verify audio output immediately
  const handleTestVoice = () => {
    if (isTestingVoice) return;
    setIsTestingVoice(true);
    playChimeTone();

    if (!synthRef.current) {
      alert("உங்கள் சாதனத்தில் SpeechSynthesis வசதி இல்லை.");
      setIsTestingVoice(false);
      return;
    }

    try {
      synthRef.current.cancel();
      setTimeout(() => {
        if (!synthRef.current) {
          setIsTestingVoice(false);
          return;
        }
        if (synthRef.current.paused) synthRef.current.resume();

        const testUtt = new SpeechSynthesisUtterance("கர்த்தருக்கு ஸ்தோத்திரம்! தமிழ் ஆடியோ வேதாகமம்.");
        testUtt.lang = 'ta-IN';
        const bestVoice = getBestTamilVoice();
        if (bestVoice) testUtt.voice = bestVoice;
        testUtt.rate = 0.95;
        testUtt.volume = 1.0;

        (window as any).__testUtterance = testUtt;

        testUtt.onend = () => {
          setIsTestingVoice(false);
        };
        testUtt.onerror = () => {
          setIsTestingVoice(false);
        };

        synthRef.current.speak(testUtt);
      }, 50);
    } catch {
      setIsTestingVoice(false);
    }
  };

  // Play a single chunk in Device TTS mode
  const playNextDeviceTTSChunk = (verseIndex: number) => {
    if (!synthRef.current) return;

    if (currentChunkIndexRef.current >= speechChunksRef.current.length) {
      // Verse chunks completed! Advance to next verse
      const nextIndex = verseIndex + 1;
      if (nextIndex < verses.length) {
        setCurrentVerseIndex(nextIndex);
        playActiveVerse(nextIndex);
      } else {
        // Chapter finished!
        if (selectedChapter < selectedBook.chapters) {
          setSelectedChapter(prev => prev + 1);
          setCurrentVerseIndex(0);
        } else {
          stopPlayback();
        }
      }
      return;
    }

    const chunkText = speechChunksRef.current[currentChunkIndexRef.current];
    currentChunkIndexRef.current += 1;

    try {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = 'ta-IN';
      
      const bestVoice = getBestTamilVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.rate = playbackRate;
      utterance.volume = isMuted ? 0 : volume;

      // CRITICAL FOR ANDROID: Prevent Android V8 Garbage Collector from dropping utterance
      (window as any).__activeBibleUtterance = utterance;

      utterance.onstart = () => {
        setIsPlaying(true);
        startVisualizerAnimation();
      };

      utterance.onend = () => {
        playNextDeviceTTSChunk(verseIndex);
      };

      utterance.onerror = (e) => {
        console.warn("Speech chunk warning:", e);
        // Continue to next chunk gracefully without silencing
        setTimeout(() => {
          playNextDeviceTTSChunk(verseIndex);
        }, 100);
      };

      if (synthRef.current.paused) {
        synthRef.current.resume();
      }

      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn("Error in speak chunk:", err);
      // Advance to next chunk
      playNextDeviceTTSChunk(verseIndex);
    }
  };

  // Play verse via Device Speech Synthesis (Local TTS with Chunks)
  const playDeviceTTSVerse = (index: number) => {
    if (!synthRef.current) {
      setAudioEngine('simulation');
      setIsPlaying(true);
      return;
    }

    const activeVerse = verses[index];
    if (!activeVerse) return;

    // Split into safe small chunks (<75 chars)
    const chunks = chunkTextForAudio(activeVerse.text);
    speechChunksRef.current = chunks;
    currentChunkIndexRef.current = 0;

    try {
      synthRef.current.cancel();
      setTimeout(() => {
        if (!synthRef.current) return;
        if (synthRef.current.paused) synthRef.current.resume();
        playNextDeviceTTSChunk(index);
      }, 50);
    } catch (err) {
      console.error("Device TTS failed:", err);
    }
  };

  // Online Audio Chunk streaming with fallback
  const playNextOnlineChunk = (index: number) => {
    if (currentChunkIndexRef.current >= speechChunksRef.current.length) {
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
      return;
    }

    const chunkText = speechChunksRef.current[currentChunkIndexRef.current];
    currentChunkIndexRef.current += 1;

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

    audio.onerror = () => {
      // Seamlessly fall back to Device TTS if online streaming is blocked in APK
      playDeviceTTSVerse(index);
    };

    audio.play().catch(() => {
      playDeviceTTSVerse(index);
    });
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
      if (synthRef.current) synthRef.current.cancel();
      const activeVerse = verses[index];
      const chunks = chunkTextForAudio(activeVerse.text);
      speechChunksRef.current = chunks;
      currentChunkIndexRef.current = 0;
      playNextOnlineChunk(index);
    } else {
      // Device TTS mode (Default & most reliable on Android APK)
      if (audioElementRef.current) {
        try {
          audioElementRef.current.pause();
        } catch {
          // ignore
        }
      }
      playDeviceTTSVerse(index);
    }
  };

  const handlePlayPause = () => {
    playChimeTone();
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

  // Skip handlers
  const handleNextVerse = () => {
    playChimeTone();
    if (currentVerseIndex < verses.length - 1) {
      const nextIndex = currentVerseIndex + 1;
      setCurrentVerseIndex(nextIndex);
      if (isPlaying) playActiveVerse(nextIndex);
      else scrollToVerse(nextIndex);
    } else if (selectedChapter < selectedBook.chapters) {
      setSelectedChapter(prev => prev + 1);
      setCurrentVerseIndex(0);
    }
  };

  const handlePrevVerse = () => {
    playChimeTone();
    if (currentVerseIndex > 0) {
      const prevIndex = currentVerseIndex - 1;
      setCurrentVerseIndex(prevIndex);
      if (isPlaying) playActiveVerse(prevIndex);
      else scrollToVerse(prevIndex);
    } else if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
      setCurrentVerseIndex(0);
    }
  };

  const handleSelectVerse = (index: number) => {
    playChimeTone();
    setCurrentVerseIndex(index);
    if (isPlaying) {
      playActiveVerse(index);
    } else {
      setIsPlaying(true);
      playActiveVerse(index);
    }
  };

  // Speed changer
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

    let remainingSeconds = minutes * 60;
    setSleepTimeRemaining(remainingSeconds);

    sleepTimerRef.current = setInterval(() => {
      remainingSeconds -= 1;
      setSleepTimeRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
        stopPlayback();
        setSleepTimerMinutes(null);
        setSleepTimeRemaining(null);
      }
    }, 1000);
  };

  const formatTimerDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];
  const SLEEP_OPTIONS = [5, 15, 30, 45, 60];

  return (
    <div className={`min-h-screen pb-24 flex flex-col ${
      isDarkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Header bar */}
      <div className={`sticky top-0 z-30 px-4 py-3 border-b flex items-center justify-between backdrop-blur-md ${
        isDarkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              stopPlayback();
              onBack();
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="பின்செல்ல"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <Music size={14} className="text-blue-500 animate-pulse" /> ஆடியோ வேதாகமம் (Audio Bible)
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">தெளிவான தமிழ் குரல் வாசிப்பு</p>
          </div>
        </div>

        {/* Right Controls: Test Voice & Audio Engine Selector */}
        <div className="flex items-center gap-1.5">
          {/* Quick Voice Test Button */}
          <button
            onClick={handleTestVoice}
            disabled={isTestingVoice}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
              isTestingVoice
                ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                : isDarkMode
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-blue-500'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500'
            }`}
            title="குரல் ஒலி சோதனை (Test Voice)"
          >
            <Volume1 size={13} className="text-blue-500" />
            <span className="hidden sm:inline">குரல் சோதனை</span>
          </button>

          {/* Engine Mode Pill */}
          <div className="relative">
            <button
              onClick={() => setShowEngineSelector(!showEngineSelector)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                audioEngine === 'device'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300'
                  : audioEngine === 'online'
                  ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
              }`}
              title="குரல் முறை தேர்வு (Audio Engine)"
            >
              {audioEngine === 'device' && <Smartphone size={12} />}
              {audioEngine === 'online' && <Globe size={12} />}
              {audioEngine === 'simulation' && <Sparkles size={12} />}
              <span>
                {audioEngine === 'device' && 'சாதனக் குரல்'}
                {audioEngine === 'online' && 'HD ஆன்லைன்'}
                {audioEngine === 'simulation' && 'தானியங்கி'}
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
                          <p className="font-extrabold text-[11px]">சாதன குரல் (பரிந்துரை)</p>
                          <p className="text-[9px] text-slate-400 font-normal">போனின் தமிழ் TTS குரல்</p>
                        </div>
                      </div>
                      {audioEngine === 'device' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </button>

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
                          <p className="font-extrabold text-[11px]">HD ஆன்லைன் ஸ்ட்ரீம்</p>
                          <p className="text-[9px] text-slate-400 font-normal">இயற்கை தமிழ் குரல் (Network)</p>
                        </div>
                      </div>
                      {audioEngine === 'online' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
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
      </div>

      <div className="max-w-4xl mx-auto w-full px-3 sm:px-6 pt-3 flex-1 flex flex-col">
        {/* BOOK & CHAPTER SELECTOR STRIP */}
        <div className={`p-3 rounded-2xl border mb-3 flex flex-wrap items-center justify-between gap-2 shadow-sm ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          {/* Book Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBookSelector(!showBookSelector);
                setShowChapterSelector(false);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-blue-500' : 'bg-slate-100 border-slate-200 hover:border-blue-500'
              }`}
            >
              <span>{selectedBook.tamilName} ({selectedBook.englishName})</span>
              <ChevronDown size={14} />
            </button>

            {/* Books Dropdown */}
            <AnimatePresence>
              {showBookSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto p-2 rounded-2xl border shadow-2xl z-50 ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="grid grid-cols-1 gap-1">
                    {bibleBooks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBook(b);
                          setSelectedChapter(1);
                          setShowBookSelector(false);
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          selectedBook.id === b.id
                            ? 'bg-blue-600 text-white'
                            : isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{b.tamilName}</span>
                        <span className="text-[10px] opacity-70 font-normal">{b.englishName} ({b.chapters} அதி.)</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chapter Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowChapterSelector(!showChapterSelector);
                setShowBookSelector(false);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-blue-500' : 'bg-slate-100 border-slate-200 hover:border-blue-500'
              }`}
            >
              <span>அதிகாரம் {selectedChapter} / {selectedBook.chapters}</span>
              <ChevronDown size={14} />
            </button>

            {/* Chapters Grid Modal */}
            <AnimatePresence>
              {showChapterSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`absolute right-0 mt-2 w-64 max-h-72 overflow-y-auto p-3 rounded-2xl border shadow-2xl z-50 ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    அதிகாரம் தேர்வு (Chapters)
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => {
                          setSelectedChapter(ch);
                          setShowChapterSelector(false);
                        }}
                        className={`aspect-square rounded-xl text-xs font-black flex items-center justify-center cursor-pointer transition-all ${
                          selectedChapter === ch
                            ? 'bg-blue-600 text-white shadow-md'
                            : isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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

          {/* Quick Active Status Bar */}
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-500">
            <span>வசனம்: {currentVerseIndex + 1} / {verses.length}</span>
          </div>
        </div>

        {/* STATUS / TIP BAR */}
        <div className={`px-4 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between border mb-3 ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-blue-500 shrink-0" />
            <span>
              {audioEngine === 'device' && (hasTamilDeviceVoice ? '📱 சாதன தமிழ் குரல் செயலில் உள்ளது' : '📱 சாதன Google TTS தமிழ் குரல்')}
              {audioEngine === 'online' && '🔊 HD ஆன்லைன் தமிழ் குரல்'}
              {audioEngine === 'simulation' && '📖 வசன வாசிப்பு முறை (Silent Mode)'}
            </span>
          </div>
          <button 
            onClick={handleTestVoice}
            className="text-[10px] text-blue-500 hover:underline font-bold cursor-pointer"
          >
            குரல் சரிபார்க்க
          </button>
        </div>

        {/* VERSE READING STREAMING BOARD (SCROLLS AUTOMATICALLY) */}
        <div 
          ref={verseListContainerRef}
          className={`flex-1 overflow-y-auto max-h-[50vh] sm:max-h-[55vh] rounded-3xl p-4 sm:p-6 border space-y-3.5 shadow-inner transition-colors ${
            isDarkMode ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white/80 border-slate-200/80'
          }`}
        >
          {verses.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-semibold">
              வசனங்கள் ஏற்றப்படுகின்றன...
            </div>
          ) : (
            verses.map((v, index) => {
              const isCurrent = index === currentVerseIndex;
              return (
                <div
                  key={v.verse}
                  id={`audio-verse-${index}`}
                  onClick={() => handleSelectVerse(index)}
                  className={`p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-blue-600/15 border-blue-500/50 shadow-md ring-2 ring-blue-500/30 scale-[1.01]'
                      : isDarkMode 
                        ? 'border-transparent hover:bg-zinc-800/50 text-zinc-300' 
                        : 'border-transparent hover:bg-slate-100/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-xl font-mono text-xs font-black shrink-0 flex items-center justify-center ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {v.verse}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm sm:text-base leading-relaxed ${
                        isCurrent 
                          ? 'font-bold text-blue-600 dark:text-blue-300' 
                          : 'font-medium'
                      }`}>
                        {v.text}
                      </p>
                      {isCurrent && isPlaying && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-blue-500">
                          <Volume2 size={13} className="animate-pulse" />
                          <span>தற்போது வாசிக்கப்படுகிறது...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM MASTER AUDIO PLAYER CONTROLLER */}
        <div className={`mt-3 p-4 rounded-3xl border shadow-xl backdrop-blur-md ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          {/* Visualizer and verse display */}
          <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
            <div>
              <span className="text-xs font-black text-blue-500">
                {selectedBook.tamilName} {selectedChapter}:{currentVerseIndex + 1}
              </span>
              <p className="text-[10px] text-slate-400 font-medium">
                {isPlaying ? "இயங்குகிறது (Playing)" : "நிறுத்தப்பட்டுள்ளது (Paused)"}
              </p>
            </div>

            {/* Audio Wave Visualizer */}
            <div className="flex items-center gap-1 h-8 px-2">
              {visualizerHeights.map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-full transition-all duration-150"
                  style={{ height: isPlaying ? `${h}px` : '4px' }}
                />
              ))}
            </div>

            {/* Active Sleep Timer Badge */}
            {sleepTimeRemaining !== null && (
              <div className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <Clock size={11} />
                <span>{formatTimerDisplay(sleepTimeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Core Transport Controls */}
          <div className="flex items-center justify-between pt-3">
            {/* Speed & Sleep Dropdown button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-1 text-xs font-bold ${
                  isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="வேகம் & உறக்க நேரம் (Speed & Sleep Timer)"
              >
                <Sliders size={15} />
                <span className="font-mono text-[11px]">{playbackRate}x</span>
              </button>

              {/* Speed & Timer Menu */}
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
                    <div className="space-y-3 p-1">
                      {/* Playback speed */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          வாசிப்பு வேகம் (Speed)
                        </span>
                        <div className="flex items-center gap-1">
                          {SPEED_OPTIONS.map((rate) => (
                            <button
                              key={rate}
                              onClick={() => handleRateChange(rate)}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                                playbackRate === rate
                                  ? 'bg-blue-600 text-white'
                                  : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sleep Timer */}
                      <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                          <Clock size={10} /> உறக்க நேரம் (Sleep Timer)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => setSleepTimer(null)}
                            className={`py-1 rounded-lg text-[9px] font-bold cursor-pointer ${
                              sleepTimerMinutes === null
                                ? 'bg-blue-600 text-white'
                                : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            ஆஃப் (Off)
                          </button>
                          {SLEEP_OPTIONS.map((mins) => (
                            <button
                              key={mins}
                              onClick={() => setSleepTimer(mins)}
                              className={`py-1 rounded-lg text-[9px] font-bold cursor-pointer ${
                                sleepTimerMinutes === mins
                                  ? 'bg-amber-500 text-white'
                                  : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {mins} நிமி
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Middle Big Buttons (Prev, Play/Pause, Next) */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevVerse}
                className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="முந்தைய வசனம்"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={isPlaying ? "நிறுத்து (Pause)" : "இயக்கு (Play)"}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>

              <button
                onClick={handleNextVerse}
                className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
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
              }}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                isMuted 
                  ? 'bg-red-500 text-white border-red-500' 
                  : isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title={isMuted ? "சத்தம் ஆன் செய்" : "சத்தம் மியூட் செய்"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
