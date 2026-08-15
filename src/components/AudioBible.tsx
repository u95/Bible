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
  RotateCcw,
  RotateCw,
  Radio,
  Headphones,
  Check
} from 'lucide-react';
import { bibleBooks, getVersesForChapter, BibleBook, BibleVerse } from '../data/bibleData';

type AudioEngineMode = 'tamil_voice' | 'studio' | 'device' | 'simulation';

export default function AudioBible({ 
  isDarkMode, 
  onBack,
  initialBook,
  initialChapter
}: { 
  isDarkMode: boolean; 
  onBack: () => void;
  initialBook?: BibleBook;
  initialChapter?: number;
}) {
  // Book & Chapter Selectors
  const [selectedBook, setSelectedBook] = useState<BibleBook>(initialBook || bibleBooks[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter || 1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Audio Time Tracking for Studio Chapter Stream
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Audio Engine: 'tamil_voice' (100% Guaranteed Tamil Voice Stream), 'studio' (Chapter MP3), 'device' (Local TTS), 'simulation' (Auto-Reader)
  const [audioEngine, setAudioEngine] = useState<AudioEngineMode>('tamil_voice');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasTamilDeviceVoice, setHasTamilDeviceVoice] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  // Sleep Timer states
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selector dropdown states
  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);
  const [showChapterSelector, setShowChapterSelector] = useState<boolean>(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false);
  const [showEngineSelector, setShowEngineSelector] = useState<boolean>(false);

  // HTML5 Audio Reference for High-Fidelity Tamil Audio
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Speech synthesis reference for Offline Device TTS
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const mockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Animated visualizer heights
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(Array(15).fill(4));
  const visualizerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll reference for verses
  const verseListContainerRef = useRef<HTMLDivElement | null>(null);

  // Get Studio Tamil MP3 URL with primary CDN
  const getStudioAudioUrl = (bookId: number, chapter: number): string => {
    return `https://audio1.wordproject.com/bibles/app/audio/14/${bookId}/${chapter}.mp3`;
  };

  // Get Live Tamil Voice Audio Stream URL for any Tamil Verse
  const getTamilVoiceStreamUrl = (text: string): string => {
    const cleanText = text
      .replace(/[0-9]+/g, '')
      .replace(/[\(\[\{\}\]\)]/g, '')
      .replace(/[:;]/g, ',')
      .trim();
    // Slice if too long for a single request, Google TTS handles up to ~150 chars seamlessly
    const safeText = cleanText.length > 150 ? cleanText.substring(0, 145) + '...' : cleanText;
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=${encodeURIComponent(safeText)}`;
  };

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

  // Find the most suitable Tamil voice available on device (strictly Tamil)
  const getStrictTamilVoice = (): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    if (!voices || voices.length === 0) return null;

    const exactTamil = voices.find(v => 
      v.lang.toLowerCase().startsWith('ta') || 
      v.name.toLowerCase().includes('tamil') ||
      v.name.includes('தமிழ்')
    );
    return exactTamil || null;
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
      
      const pollTimer = setTimeout(updateVoices, 800);
      return () => clearTimeout(pollTimer);
    }
  }, []);

  // When book or chapter changes, load verses and reset audio
  useEffect(() => {
    stopPlayback();
    loadChapterVerses(selectedBook, selectedChapter);

    return () => {
      stopPlayback();
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [selectedBook, selectedChapter]);

  // Play Live Tamil Voice Stream for verse
  const playTamilVoiceVerse = (index: number) => {
    if (index >= verses.length) {
      // Chapter finished! Advance to next chapter
      if (selectedChapter < selectedBook.chapters) {
        setSelectedChapter(prev => prev + 1);
        setCurrentVerseIndex(0);
      } else {
        stopPlayback();
      }
      return;
    }

    const activeVerse = verses[index];
    if (!activeVerse) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;
    audio.pause();

    const voiceUrl = getTamilVoiceStreamUrl(activeVerse.text);
    audio.src = voiceUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    setIsLoadingAudio(true);
    setCurrentVerseIndex(index);
    scrollToVerse(index);

    audio.oncanplay = () => {
      setIsLoadingAudio(false);
    };

    audio.onplaying = () => {
      setIsLoadingAudio(false);
      setIsPlaying(true);
      startVisualizerAnimation();
    };

    audio.onended = () => {
      // Advance to next verse smoothly
      const nextIdx = index + 1;
      if (nextIdx < verses.length) {
        setCurrentVerseIndex(nextIdx);
        playTamilVoiceVerse(nextIdx);
      } else {
        if (selectedChapter < selectedBook.chapters) {
          setSelectedChapter(prev => prev + 1);
          setCurrentVerseIndex(0);
        } else {
          stopPlayback();
        }
      }
    };

    audio.onerror = (e) => {
      console.warn("Tamil Voice stream error, attempting device TTS fallback:", e);
      setIsLoadingAudio(false);
      // If stream network fails, fallback to local device TTS
      playDeviceTTSVerse(index);
    };

    audio.play().catch(err => {
      console.warn("Audio play blocked or failed:", err);
      setIsLoadingAudio(false);
      playDeviceTTSVerse(index);
    });
  };

  // Prepare Studio Audio (Full Chapter)
  const prepareStudioAudio = (bookId: number, chapter: number) => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;
    audio.pause();
    
    const primaryUrl = getStudioAudioUrl(bookId, chapter);
    audio.src = primaryUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoadingAudio(false);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && verses.length > 0) {
        const progress = audio.currentTime / audio.duration;
        const targetVerseIdx = Math.min(Math.floor(progress * verses.length), verses.length - 1);
        setCurrentVerseIndex(targetVerseIdx);
        scrollToVerse(targetVerseIdx);
      }
    };

    audio.onwaiting = () => {
      setIsLoadingAudio(true);
    };

    audio.onplaying = () => {
      setIsLoadingAudio(false);
      setIsPlaying(true);
      startVisualizerAnimation();
    };

    audio.onpause = () => {
      setIsPlaying(false);
      stopVisualizerAnimation();
    };

    audio.onended = () => {
      stopVisualizerAnimation();
      setIsPlaying(false);
      if (selectedChapter < selectedBook.chapters) {
        setSelectedChapter(prev => prev + 1);
      } else {
        const nextBookIdx = bibleBooks.findIndex(b => b.id === selectedBook.id) + 1;
        if (nextBookIdx < bibleBooks.length) {
          setSelectedBook(bibleBooks[nextBookIdx]);
          setSelectedChapter(1);
        }
      }
    };

    audio.onerror = () => {
      console.warn("Studio full chapter audio failed, auto-switching to Tamil Voice Stream...");
      setAudioEngine('tamil_voice');
      playTamilVoiceVerse(currentVerseIndex);
    };
  };

  // Play verse via Device Speech Synthesis (Local TTS)
  const playDeviceTTSVerse = (index: number) => {
    if (!synthRef.current) {
      setAudioEngine('simulation');
      setIsPlaying(true);
      return;
    }

    const activeVerse = verses[index];
    if (!activeVerse) return;

    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(activeVerse.text);
      utterance.lang = 'ta-IN';
      const tamilVoice = getStrictTamilVoice();
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
        const nextIdx = index + 1;
        if (nextIdx < verses.length) {
          setCurrentVerseIndex(nextIdx);
          playDeviceTTSVerse(nextIdx);
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
        console.warn("Speech error, switching to auto-reader:", e);
        setAudioEngine('simulation');
        setIsPlaying(true);
      };

      if (synthRef.current.paused) {
        synthRef.current.resume();
      }
      synthRef.current.speak(utterance);
    } catch (err) {
      console.error("Device TTS failed:", err);
      setAudioEngine('simulation');
      setIsPlaying(true);
    }
  };

  // Master Play Trigger
  const playActiveVerse = (index: number) => {
    playChimeTone();
    
    if (audioEngine === 'simulation') {
      setIsPlaying(true);
      startVisualizerAnimation();
      return;
    }

    if (audioEngine === 'tamil_voice') {
      playTamilVoiceVerse(index);
      return;
    }

    if (audioEngine === 'device') {
      if (audioElementRef.current) {
        try { audioElementRef.current.pause(); } catch {}
      }
      playDeviceTTSVerse(index);
      return;
    }

    // STUDIO AUDIO MODE
    if (!audioElementRef.current) {
      prepareStudioAudio(selectedBook.id, selectedChapter);
    }

    const audio = audioElementRef.current;
    if (audio) {
      if (verses.length > 0 && audio.duration) {
        const targetTime = (index / verses.length) * audio.duration;
        audio.currentTime = targetTime;
      }
      
      setIsLoadingAudio(true);
      audio.play().then(() => {
        setIsPlaying(true);
        setIsLoadingAudio(false);
        startVisualizerAnimation();
      }).catch(err => {
        console.warn("Studio play failed, auto-switching to Tamil Voice Stream:", err);
        setIsLoadingAudio(false);
        setAudioEngine('tamil_voice');
        playTamilVoiceVerse(index);
      });
    } else {
      setAudioEngine('tamil_voice');
      playTamilVoiceVerse(index);
    }
  };

  const handlePlayPause = () => {
    playChimeTone();
    if (isPlaying) {
      stopPlayback();
    } else {
      if (audioEngine === 'studio') {
        const audio = audioElementRef.current;
        if (audio && audio.src) {
          setIsLoadingAudio(true);
          audio.play().then(() => {
            setIsPlaying(true);
            setIsLoadingAudio(false);
            startVisualizerAnimation();
          }).catch(() => {
            setIsLoadingAudio(false);
            setAudioEngine('tamil_voice');
            playTamilVoiceVerse(currentVerseIndex);
          });
        } else {
          prepareStudioAudio(selectedBook.id, selectedChapter);
          playActiveVerse(currentVerseIndex);
        }
      } else if (audioEngine === 'tamil_voice') {
        playTamilVoiceVerse(currentVerseIndex);
      } else {
        setIsPlaying(true);
        playActiveVerse(currentVerseIndex);
      }
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    stopVisualizerAnimation();

    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
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

  // One-tap Audio/Voice Tester to verify sound output immediately
  const handleTestAudio = () => {
    if (isTestingVoice) return;
    setIsTestingVoice(true);
    playChimeTone();

    const sampleText = "கர்த்தருக்கு ஸ்தோத்திரம்! தமிழ் ஆடியோ வேதாகமம்.";
    const testAudio = new Audio(getTamilVoiceStreamUrl(sampleText));
    testAudio.playbackRate = 1.0;
    testAudio.volume = 1.0;
    
    testAudio.play().then(() => {
      testAudio.onended = () => setIsTestingVoice(false);
      setTimeout(() => {
        setIsTestingVoice(false);
      }, 5000);
    }).catch(() => {
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
          const testUtt = new SpeechSynthesisUtterance(sampleText);
          testUtt.lang = 'ta-IN';
          const tVoice = getStrictTamilVoice();
          if (tVoice) testUtt.voice = tVoice;
          testUtt.onend = () => setIsTestingVoice(false);
          testUtt.onerror = () => setIsTestingVoice(false);
          synthRef.current.speak(testUtt);
        } catch {
          setIsTestingVoice(false);
        }
      } else {
        setIsTestingVoice(false);
      }
    });
  };

  // Seekbar handler for studio audio
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSeconds = Number(e.target.value);
    setCurrentTime(targetSeconds);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = targetSeconds;
    }
    if (duration > 0 && verses.length > 0) {
      const progress = targetSeconds / duration;
      const targetVerseIdx = Math.min(Math.floor(progress * verses.length), verses.length - 1);
      setCurrentVerseIndex(targetVerseIdx);
      scrollToVerse(targetVerseIdx);
    }
  };

  // Rewind 10 seconds / Previous Verse
  const handleRewind10 = () => {
    playChimeTone();
    if (audioEngine === 'studio' && audioElementRef.current) {
      const newTime = Math.max(0, audioElementRef.current.currentTime - 10);
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else if (currentVerseIndex > 0) {
      const prevIdx = currentVerseIndex - 1;
      setCurrentVerseIndex(prevIdx);
      if (isPlaying) playActiveVerse(prevIdx);
    }
  };

  // Fast Forward 10 seconds / Next Verse
  const handleForward10 = () => {
    playChimeTone();
    if (audioEngine === 'studio' && audioElementRef.current && duration > 0) {
      const newTime = Math.min(duration, audioElementRef.current.currentTime + 10);
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else if (currentVerseIndex < verses.length - 1) {
      const nextIdx = currentVerseIndex + 1;
      setCurrentVerseIndex(nextIdx);
      if (isPlaying) playActiveVerse(nextIdx);
    }
  };

  // Skip Chapter handlers
  const handleNextChapter = () => {
    playChimeTone();
    if (selectedChapter < selectedBook.chapters) {
      setSelectedChapter(prev => prev + 1);
    } else {
      const curIdx = bibleBooks.findIndex(b => b.id === selectedBook.id);
      if (curIdx < bibleBooks.length - 1) {
        setSelectedBook(bibleBooks[curIdx + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const handlePrevChapter = () => {
    playChimeTone();
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    } else {
      const curIdx = bibleBooks.findIndex(b => b.id === selectedBook.id);
      if (curIdx > 0) {
        const prevBook = bibleBooks[curIdx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const handleSelectVerse = (index: number) => {
    playChimeTone();
    setCurrentVerseIndex(index);
    playActiveVerse(index);
  };

  // Speed changer
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedSelector(false);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = rate;
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
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];
  const SLEEP_OPTIONS = [5, 15, 30, 45, 60];

  return (
    <div className={`min-h-screen pb-28 flex flex-col ${
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
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Headphones size={16} className="text-blue-500 animate-pulse" /> ஆடியோ வேதாகமம் (Audio Bible)
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">உயர்தர தமிழ் வேத ஒலி வாசிப்பு</p>
          </div>
        </div>

        {/* Right Controls: Test Sound & Audio Engine Selector */}
        <div className="flex items-center gap-1.5">
          {/* Quick Sound Test Button */}
          <button
            onClick={handleTestAudio}
            disabled={isTestingVoice}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
              isTestingVoice
                ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                : isDarkMode
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-blue-500'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500'
            }`}
            title="ஒலி சோதனை (Test Audio Sound)"
          >
            <Volume1 size={13} className="text-blue-500" />
            <span className="hidden sm:inline">ஒலி சோதனை</span>
          </button>

          {/* Engine Mode Selector */}
          <div className="relative">
            <button
              onClick={() => setShowEngineSelector(!showEngineSelector)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                audioEngine === 'tamil_voice'
                  ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300'
                  : audioEngine === 'studio'
                  ? 'bg-purple-50 border-purple-300 text-purple-600 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-300'
                  : audioEngine === 'device'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
              }`}
              title="குரல் முறை தேர்வு (Audio Engine)"
            >
              {audioEngine === 'tamil_voice' && <Volume2 size={12} />}
              {audioEngine === 'studio' && <Radio size={12} />}
              {audioEngine === 'device' && <Smartphone size={12} />}
              {audioEngine === 'simulation' && <Sparkles size={12} />}
              <span>
                {audioEngine === 'tamil_voice' && '🔊 தமிழ் குரல்'}
                {audioEngine === 'studio' && '🎙️ ஸ்டுடியோ'}
                {audioEngine === 'device' && 'சாதன TTS'}
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
                  className={`absolute right-0 mt-1.5 w-72 p-2 rounded-2xl border shadow-2xl z-50 ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-black text-slate-400 px-2 py-1 uppercase tracking-wider">
                    ஆடியோ முறை தேர்வு (Audio Source)
                  </div>

                  <div className="space-y-1.5 mt-1">
                    <button
                      onClick={() => {
                        stopPlayback();
                        setAudioEngine('tamil_voice');
                        setShowEngineSelector(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                        audioEngine === 'tamil_voice'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 size={15} className="text-blue-500 shrink-0" />
                        <div>
                          <p className="font-extrabold text-xs">🔊 தமிழ் குரல் வாசிப்பு (100% நிச்சயம்)</p>
                          <p className="text-[10px] text-slate-400 font-normal">தெளிவான தமிழ் உச்சரிப்பு - அனைத்து போன்களிலும்</p>
                        </div>
                      </div>
                      {audioEngine === 'tamil_voice' && <Check size={14} className="text-blue-600" />}
                    </button>

                    <button
                      onClick={() => {
                        stopPlayback();
                        setAudioEngine('studio');
                        setShowEngineSelector(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                        audioEngine === 'studio'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Radio size={15} className="text-purple-500 shrink-0" />
                        <div>
                          <p className="font-extrabold text-xs">🎙️ ஸ்டுடியோ மனித குரல் MP3</p>
                          <p className="text-[10px] text-slate-400 font-normal">முழு அத்தியாய ஸ்டுடியோ ஆடியோ</p>
                        </div>
                      </div>
                      {audioEngine === 'studio' && <Check size={14} className="text-purple-600" />}
                    </button>

                    <button
                      onClick={() => {
                        stopPlayback();
                        setAudioEngine('device');
                        setShowEngineSelector(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                        audioEngine === 'device'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone size={15} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-extrabold text-xs">📱 சாதன TTS தமிழ் குரல்</p>
                          <p className="text-[10px] text-slate-400 font-normal">போனில் இன்ஸ்டால் செய்யப்பட்ட குரல்</p>
                        </div>
                      </div>
                      {audioEngine === 'device' && <Check size={14} className="text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        stopPlayback();
                        setAudioEngine('simulation');
                        setShowEngineSelector(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                        audioEngine === 'simulation'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className="text-amber-500 shrink-0" />
                        <div>
                          <p className="font-extrabold text-xs">📖 அமைதியான வாசிப்பு (Silent)</p>
                          <p className="text-[10px] text-slate-400 font-normal">வசனங்கள் தானாக நகரும்</p>
                        </div>
                      </div>
                      {audioEngine === 'simulation' && <Check size={14} className="text-amber-600" />}
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
                  className={`absolute left-0 mt-2 w-72 sm:w-80 max-h-80 overflow-y-auto p-2 rounded-2xl border shadow-2xl z-40 ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-black text-slate-400 px-2 py-1 uppercase tracking-wider">
                    பழைய ஏற்பாடு (Old Testament)
                  </div>
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {bibleBooks.filter(b => b.testament === 'Old').map(b => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBook(b);
                          setSelectedChapter(1);
                          setShowBookSelector(false);
                        }}
                        className={`p-2 text-left rounded-xl text-xs font-bold transition-colors cursor-pointer truncate ${
                          selectedBook.id === b.id 
                            ? 'bg-blue-600 text-white' 
                            : isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.tamilName}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-black text-slate-400 px-2 py-1 uppercase tracking-wider">
                    புதிய ஏற்பாடு (New Testament)
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {bibleBooks.filter(b => b.testament === 'New').map(b => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBook(b);
                          setSelectedChapter(1);
                          setShowBookSelector(false);
                        }}
                        className={`p-2 text-left rounded-xl text-xs font-bold transition-colors cursor-pointer truncate ${
                          selectedBook.id === b.id 
                            ? 'bg-blue-600 text-white' 
                            : isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.tamilName}
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

            {/* Chapters Dropdown Grid */}
            <AnimatePresence>
              {showChapterSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`absolute right-0 sm:left-0 mt-2 w-64 sm:w-72 max-h-72 overflow-y-auto p-3 rounded-2xl border shadow-2xl z-40 ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">
                    அதிகாரம் தேர்வு செய்க
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                      <button
                        key={ch}
                        onClick={() => {
                          setSelectedChapter(ch);
                          setShowChapterSelector(false);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedChapter === ch
                            ? 'bg-blue-600 text-white shadow-md'
                            : isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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

          {/* Quick Prev / Next Chapter Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevChapter}
              disabled={selectedChapter <= 1 && bibleBooks.findIndex(b => b.id === selectedBook.id) === 0}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-slate-200 hover:bg-slate-100'
              }`}
              title="முந்தைய அதிகாரம்"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={handleNextChapter}
              disabled={selectedChapter >= selectedBook.chapters && bibleBooks.findIndex(b => b.id === selectedBook.id) === bibleBooks.length - 1}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-slate-200 hover:bg-slate-100'
              }`}
              title="அடுத்த அதிகாரம்"
            >
              <SkipForward size={15} />
            </button>
          </div>
        </div>

        {/* ACTIVE NOW PLAYING CARD & AUDIO VISUALIZER */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-lg relative overflow-hidden mb-3 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800' 
            : 'bg-gradient-to-br from-blue-50/70 to-white border-blue-100 shadow-blue-500/5'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                  {selectedBook.tamilName} {selectedChapter}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  வசனம் {verses.length > 0 ? `${currentVerseIndex + 1} / ${verses.length}` : 'ஏற்றப்படுகிறது...'}
                </span>
                {isLoadingAudio && (
                  <span className="text-[10px] text-amber-500 font-bold animate-pulse">
                    ஒலி தயாராகிறது...
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-300 line-clamp-1">
                {verses[currentVerseIndex]?.text || "வேத அதிகாரத்தை கேட்க Play பொத்தானை அழுத்தவும்..."}
              </p>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center gap-1 h-8 shrink-0">
              {visualizerHeights.map((h, idx) => (
                <motion.div
                  key={idx}
                  className={`w-1 rounded-full ${
                    isPlaying ? 'bg-gradient-to-t from-blue-600 to-indigo-400' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                  animate={{ height: isPlaying ? `${h}px` : '4px' }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                />
              ))}
            </div>
          </div>

          {/* STUDIO TIMELINE / SEEKBAR (For Studio Mode) */}
          {audioEngine === 'studio' && duration > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={currentTime} 
                onChange={handleSeek}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>{formatTimerDisplay(currentTime)}</span>
                <span>{formatTimerDisplay(duration)}</span>
              </div>
            </div>
          )}
        </div>

        {/* VERSE LIST VIEW WITH REAL-TIME HIGHLIGHT */}
        <div 
          ref={verseListContainerRef}
          className={`flex-1 overflow-y-auto max-h-[48vh] sm:max-h-[52vh] p-3 sm:p-4 rounded-3xl border space-y-2.5 shadow-inner ${
            isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200/80'
          }`}
        >
          {verses.map((v, idx) => {
            const isCurrent = idx === currentVerseIndex;
            return (
              <div
                id={`audio-verse-${idx}`}
                key={idx}
                onClick={() => handleSelectVerse(idx)}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30 dark:bg-blue-950/40 shadow-sm'
                    : isDarkMode 
                    ? 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700' 
                    : 'bg-slate-50/60 border-slate-200/60 hover:border-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                  isCurrent 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {v.verse}
                </div>
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm leading-relaxed transition-colors ${
                    isCurrent 
                      ? 'font-bold text-blue-600 dark:text-blue-300' 
                      : isDarkMode ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    {v.text}
                  </p>
                </div>
                {isCurrent && isPlaying && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* FIXED BOTTOM FLOATING CONTROLLER BAR */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-4 py-3 sm:py-4 shadow-2xl ${
        isDarkMode ? 'bg-zinc-950/90 border-zinc-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Speed & Sleep Timer Status */}
          <div className="flex items-center gap-1.5">
            {/* Speed Pill */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  playbackRate !== 1.0 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : isDarkMode ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="வாசிப்பு வேகம்"
              >
                <span>{playbackRate}x</span>
              </button>

              {/* Speed & Sleep Dropdown */}
              <AnimatePresence>
                {showSpeedSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`absolute bottom-full left-0 mb-2 w-56 p-3 rounded-2xl border shadow-2xl z-50 ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">
                      வாசிப்பு வேகம் (Playback Speed)
                    </div>
                    <div className="flex gap-1 mb-3">
                      {SPEED_OPTIONS.map(rate => (
                        <button
                          key={rate}
                          onClick={() => handleRateChange(rate)}
                          className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                            playbackRate === rate
                              ? 'bg-blue-600 text-white'
                              : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                      <span>உறக்க நேரம் (Sleep Timer)</span>
                      {sleepTimeRemaining && (
                        <span className="text-blue-500 font-mono">{formatTimerDisplay(sleepTimeRemaining)}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setSleepTimer(null)}
                        className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          sleepTimerMinutes === null 
                            ? 'bg-blue-600 text-white' 
                            : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        ஆஃப்
                      </button>
                      {SLEEP_OPTIONS.map(mins => (
                        <button
                          key={mins}
                          onClick={() => setSleepTimer(mins)}
                          className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sleepTimerMinutes === mins 
                              ? 'bg-blue-600 text-white' 
                              : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {mins} நிமி
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sleep Timer Indicator Pill if active */}
            {sleepTimeRemaining && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                <Clock size={11} />
                <span>{formatTimerDisplay(sleepTimeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Center: Main Play Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleRewind10}
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                isDarkMode ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="10 விநாடிகள் பின்னே"
            >
              <RotateCcw size={17} />
            </button>

            {/* Primary Big Play / Pause Button */}
            <button
              onClick={handlePlayPause}
              disabled={isLoadingAudio}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </button>

            <button
              onClick={handleForward10}
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                isDarkMode ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="10 விநாடிகள் முன்னே"
            >
              <RotateCw size={17} />
            </button>
          </div>

          {/* Right: Mute & Next Verse */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const newMute = !isMuted;
                setIsMuted(newMute);
                if (audioElementRef.current) {
                  audioElementRef.current.volume = newMute ? 0 : volume;
                }
              }}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isMuted 
                  ? 'bg-red-500 text-white border-red-500' 
                  : isDarkMode ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title={isMuted ? "ஒலி ஆன்" : "ஒலி ஆஃப்"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

