
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Package, X, ChevronRight, Zap, Box, Command, Loader2, Sparkles, Tag, Mic, MicOff, Globe } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/calculations';

interface ProductSearchProps {
  onSelect: (product: Product, initialStatus?: 'Low' | 'Critical' | 'Out of Stock', preferredMode?: 'sales' | 'shortages') => void;
  onManual: (query: string) => void;
  onCommand?: (command: 'finalize') => void;
}

// Common Pharmacy Arabic-to-English Mapping for Smart Search
const MEDICINE_TRANSLATION_MAP: Record<string, string> = {
  'بندول': 'Panadol',
  'باندول': 'Panadol',
  'أدول': 'Adol',
  'ادول': 'Adol',
  'سولبادين': 'Solpadeine',
  'بروفين': 'Brufen',
  'فولتارين': 'Voltaren',
  'نيكسيوم': 'Nexium',
  'اموكسيل': 'Amoxyl',
  'بانتوزول': 'Pantozol',
  'كونكور': 'Concor',
  'ليبيدور': 'Lipitor',
  'دياميكرون': 'Diamicron',
  'جالفوس': 'Galvus',
  'جانوميت': 'Janumet',
  'اوجمنتين': 'Augmentin',
  'زيرتك': 'Zyrtec',
  'كلاريتين': 'Claritin',
  'فنستيل': 'Fenistil',
  'موتيلات': 'Motilium',
  'جافيسكون': 'Gaviscon',
  'كولجيت': 'Colgate',
  'سنسوداين': 'Sensodyne',
  'بنسلين': 'Penicillin',
  'انسولين': 'Insulin',
  'فياجرا': 'Viagra',
  'سيدوفاج': 'Glucophage',
  'جلوكوفاج': 'Glucophage',
  'فنتولين': 'Ventolin',
  'سبازموكانيولاز': 'Spasmo-Canulase',
  'بسكوبان': 'Buscopan',
  'كحة': 'Cough',
  'شراب': 'Syrup',
  'حبوب': 'Tablets',
  'لوست': 'Lost',
  'مفقود': 'Lost',
  'بيع': 'Sale'
};

const translateArabicToEnglish = (text: string): string => {
  let processed = text;
  Object.entries(MEDICINE_TRANSLATION_MAP).forEach(([ar, en]) => {
    if (processed.includes(ar)) {
      processed = processed.replace(new RegExp(ar, 'g'), en);
    }
  });
  return processed;
};

export const ProductSearch: React.FC<ProductSearchProps> = ({ onSelect, onManual, onCommand }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState<'ar-SA' | 'en-US'>('en-US'); // Set English as default
  const recognitionRef = useRef<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length >= 1) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const matches = await supabase.products.search(query);

        // AUTO-SELECT LOGIC for Barcode Scanners (Direct exact match)
        const q = query.trim().toLowerCase();
        const exactMatch = matches.find(p =>
          p.internalCode?.toLowerCase() === q ||
          p.internationalCode?.toLowerCase() === q
        );

        if (exactMatch && query.length >= 4) { // Typical min barcode length
          onSelect(exactMatch);
          setQuery('');
          setIsOpen(false);
          setIsSearching(false);
          return;
        }

        setResults(matches.slice(0, 8));
        setIsOpen(true);
        setActiveIndex(0);
        setIsSearching(false);
      }, 100); // Faster bounce for scanners
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setIsSearching(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        onSelect(results[activeIndex]);
        setQuery('');
      } else if (results.length === 0 && query.trim()) {
        onManual(query);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Initialize Voice Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = voiceLang; // Use the selected language
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          setVoiceTranscript(transcript);
          processVoiceCommand(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            alert('يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.');
          } else if (event.error === 'network') {
            alert('خطأ في الاتصال بالإنترنت. يرجى التحقق من الاتصال.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [voiceLang]); // Re-initialize when language changes

  // Process Voice Command
  const processVoiceCommand = async (transcript: string) => {
    console.log('Voice command received:', transcript);

    // SMART TRANSLATION: If we are in Arabic mode or hear Arabic, translate it to English for DB search
    const translatedTranscript = translateArabicToEnglish(transcript);
    console.log('Processed transcript:', translatedTranscript);

    setIsSearching(true);

    try {
      // 1. Check for Action Commands (in both languages)
      if (translatedTranscript.match(/(finalize|انهاء|إنهاء|خلاص|حفظ|تاكيد|تأكيد)/i)) {
        onCommand?.('finalize');
        return;
      }

      // 2. Extract Intent (Mode)
      let preferredMode: 'sales' | 'shortages' | undefined = undefined;
      if (translatedTranscript.match(/(lost|لوست|بيع مفقود|طلب مفقود|مفقود|sale)/i)) {
        preferredMode = 'sales';
      } else if (translatedTranscript.match(/(shortage|شورتاج|نقص|ناقص)/i)) {
        preferredMode = 'shortages';
      }

      // 3. Extract Status
      let detectedStatus: 'Low' | 'Critical' | 'Out of Stock' | undefined = undefined;

      if (translatedTranscript.match(/(oos|out of stock|خلص|مخلص|غير متوفر|بح|انتهى)/i)) {
        detectedStatus = 'Out of Stock';
      } else if (translatedTranscript.match(/(low|ضعيف|قليل|بسيط)/i)) {
        detectedStatus = 'Low';
      } else if (translatedTranscript.match(/(critical|حرج|خطير|ضروري|اخر علبه|على الرف|آخر علبة|اخر قطعة)/i)) {
        detectedStatus = 'Critical';
      }

      // Clean transcript from commands to extract product name
      const cleanTranscript = translatedTranscript
        .replace(/^(سجل|أضف|ابحث عن|shortage|add|search for|record|record item)\s+/i, '')
        .replace(/(oos|out of stock|خلص|مخلص|غير متوفر|بح|انتهى|low|ضعيف|قليل|بسيط|critical|حرج|خطير|ضروري|اخر علبه|على الرف|آخر علبة|اخر قطعة|lost|لوست|بيع مفقود|طلب مفقود|مفقود|شورتاج|ناقص|sale)/gi, '')
        .trim();

      if (!cleanTranscript) return;

      // 4. Search in DB (which primarily contains English names)
      const matches = await supabase.products.search(cleanTranscript);

      if (matches.length > 0) {
        // Find high confidence match
        const exactMatch = matches.find(p =>
          p.name.toLowerCase() === cleanTranscript.toLowerCase() ||
          p.internalCode?.toLowerCase() === cleanTranscript.toLowerCase()
        );

        if (exactMatch) {
          onSelect(exactMatch, detectedStatus, preferredMode);
          setQuery('');
          setIsOpen(false);
          return;
        }

        // Show results if no exact match
        setQuery(cleanTranscript);
        setResults(matches.slice(0, 8));
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        // Fallback: If no DB result, set query to translated text for manual entry
        setQuery(cleanTranscript);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Voice processing failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Start Voice Recognition
  const startVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('المتصفح لا يدعم التعرف على الصوت. يرجى استخدام متصفح Google Chrome.');
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert('التعرف على الصوت يتطلب استخدام اتصال آمن (HTTPS).');
    }

    try {
      setVoiceTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
    }
  };

  // Stop Voice Recognition
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
    }
    setIsListening(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
          {isSearching ? (
            <Loader2 className="text-brand w-6 h-6 animate-spin" />
          ) : (
            <Search className={`w-6 h-6 transition-colors duration-300 ${isOpen ? 'text-brand' : 'text-slate-300 group-focus-within:text-brand'}`} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          className="w-full h-16 md:h-22 pl-16 md:pl-20 pr-24 md:pr-32 bg-white border-2 border-slate-100 rounded-[2rem] text-lg md:text-2xl font-black text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-[12px] focus:ring-brand/5 focus:border-brand shadow-2xl shadow-slate-200/40 transition-all duration-500"
          placeholder="SEARCH BY NAME OF ITEM..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
        />

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-2 md:space-x-4">
          {/* Language Toggle */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setVoiceLang(prev => prev === 'en-US' ? 'ar-SA' : 'en-US');
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
            title="Switch Voice Language"
          >
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-black uppercase text-slate-600">
              {voiceLang === 'en-US' ? 'EN' : 'AR'}
            </span>
          </button>

          {/* Voice Recognition Button */}
          <button
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            className={`p-3 md:p-4 rounded-2xl transition-all flex items-center justify-center shadow-lg ${isListening
              ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
            title={isListening ? 'Stop Listening' : 'Voice Search'}
          >
            {isListening ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
          </button>

          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-2 md:p-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 select-none shadow-sm">
            <Command className="w-3.5 h-3.5" />
            <span className="text-[11px] font-black tracking-widest">K</span>
          </div>
        </div>
      </div>

      {/* Voice Transcript Display */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-[1.5rem] p-4 shadow-xl z-[2001] animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-rose-500 rounded-full animate-ping opacity-40"></div>
            </div>
            <p className="text-xs font-black text-indigo-900 uppercase tracking-widest leading-none">Listening for Command...</p>
          </div>
          {voiceTranscript && (
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <p className="text-lg font-bold text-indigo-700 italic">"{voiceTranscript}"</p>
            </div>
          )}
          <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {voiceLang === 'en-US'
              ? 'Try saying: "Panadol" or "Finalize"'
              : 'جرب قول: "باندول" أو "إنهاء التقرير"'}
          </p>
        </div>
      )}

      {isOpen && (
        <div className="absolute mt-4 w-full bg-white rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(139,0,0,0.15)] border border-slate-100 overflow-hidden z-[2000] animate-in fade-in slide-in-from-top-6 duration-500">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {results.length > 0 ? (
              <div className="py-4">
                {results.map((product, idx) => (
                  <button
                    key={product.id}
                    onClick={() => { onSelect(product); setQuery(''); setIsOpen(false); }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full px-10 py-5 md:py-6 flex items-center justify-between transition-all group ${activeIndex === idx ? 'bg-brand/5' : 'bg-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center space-x-6 overflow-hidden">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner ${activeIndex === idx ? 'bg-brand text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <Package className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-baseline space-x-3 mb-1">
                          <p className={`text-lg md:text-xl font-black tracking-tighter leading-none truncate ${activeIndex === idx ? 'text-brand' : 'text-slate-900'}`}>{product.name}</p>
                          {/* Display Price next to name */}
                          <span className="text-sm font-mono font-black text-brand bg-brand/5 px-2 py-0.5 rounded-lg shrink-0">
                            {formatCurrency(product.defaultPrice)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{product.agent || 'N/A'}</span>
                          <span className="text-[10px] md:text-xs font-bold text-slate-300">|</span>
                          <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{product.internalCode || 'NO-CODE'}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${activeIndex === idx ? 'bg-brand/10 text-brand translate-x-1' : 'bg-slate-50 text-slate-200'}`}>
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center">
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No matching products found.</p>
                <button
                  onClick={() => { onManual(query); setQuery(''); setIsOpen(false); }}
                  className="mt-6 bg-brand text-white font-black px-10 py-5 rounded-2xl hover:bg-brand-hover transition-all text-xs uppercase tracking-widest"
                >
                  Create Manual Entry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
