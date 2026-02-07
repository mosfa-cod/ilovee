
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  Search, Volume2, Loader2, ChevronLeft, Heart, 
  Trophy, Cloud, Sparkles, PlayCircle, Star, Moon, Sun, 
  Share2, Copy, Check, X, Info, AlertTriangle, ExternalLink, Globe, Palette,
  Trash2, Ghost, History, BookOpen
} from 'lucide-react';

// --- نظام الصوت الذكي لأكاديمية الأستاذ مصطفى ---
class MustafaAcademyAudio {
  private static instance: MustafaAcademyAudio;
  private ctx: AudioContext | null = null;
  static getInstance() {
    if (!MustafaAcademyAudio.instance) MustafaAcademyAudio.instance = new MustafaAcademyAudio();
    return MustafaAcademyAudio.instance;
  }
  async speak(base64: string) {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const pcm16 = new Int16Array(bytes.buffer);
      const buffer = this.ctx.createBuffer(1, pcm16.length, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) channel[i] = pcm16[i] / 32768.0;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start();
    } catch (err) { console.error("Audio Error:", err); }
  }
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const academyAPI = {
  async searchWord(word: string) {
    const ai = getAI();
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a teacher for kids. Translate "${word}". Return ONLY JSON: {"en": "Word", "ar": "الكلمة", "exEn": "Sentence", "exAr": "جملة"}.`,
    });
    return JSON.parse(res.text.replace(/```json|```/g, '').trim());
  },
  async generateArt(word: string) {
    const ai = getAI();
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Vibrant and highly colorful 3D Pixar-style cartoon of ${word}, cheerful and happy expression, bright studio lighting, soft 3D textures, professional children's book illustration, high contrast, solid white background.` }] }
    });
    const part = res.candidates?.[0]?.content.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  },
  async textToSpeech(text: string, isAr: boolean) {
    const ai = getAI();
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: isAr ? `انطق: ${text}` : `Say: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
};

interface WordData {
  en: string;
  ar: string;
  exEn: string;
  exAr: string;
  art?: string | null;
  id: string;
}

const KidDictionary = ({ isDarkMode, onSave, isWordSaved }: { isDarkMode: boolean, onSave: (word: WordData) => void, isWordSaved: (en: string) => boolean }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordData | null>(null);
  const [art, setArt] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const performSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResult(null); setArt(null);
    try {
      const data = await academyAPI.searchWord(query);
      const wordObj = { ...data, id: Date.now().toString() };
      setResult(wordObj);
      setLoading(false);
      academyAPI.generateArt(data.en).then(img => {
        setArt(img);
        setResult(prev => prev ? { ...prev, art: img } : null);
      }).catch(() => {});
    } catch (err) { setLoading(false); alert("عذراً، حدث خطأ بسيط!"); }
  };

  const playVoice = async (text: string, isAr: boolean, id: string) => {
    setSpeakingId(id);
    try {
      const b64 = await academyAPI.textToSpeech(text, isAr);
      if (b64) await MustafaAcademyAudio.getInstance().speak(b64);
    } finally { setSpeakingId(null); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-10">
      {!result && !loading ? (
        <div className={`p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl text-center border-b-[10px] md:border-b-[12px] transition-all duration-500 ${isDarkMode ? 'bg-slate-800/50 border-indigo-900/50 backdrop-blur-md' : 'bg-white border-sky-100'}`}>
           <div className="relative inline-block mb-6 md:mb-8">
             <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"></div>
             <Palette className={`${isDarkMode ? 'text-indigo-400' : 'text-pink-400'} w-14 h-14 md:w-20 md:h-20 mx-auto animate-bounce relative z-10`} />
             <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse z-10" />
           </div>
           <h2 className={`text-2xl md:text-4xl font-medium mb-8 md:mb-12 ${isDarkMode ? 'text-indigo-300' : 'text-sky-600'}`}>مرحباً بك في عالم الألوان يا بطل!</h2>
           <form onSubmit={performSearch} className="relative group">
             <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="اكتب كلمة هنا.." className={`w-full text-xl md:text-3xl p-6 md:p-10 pr-12 md:pr-14 rounded-[2rem] md:rounded-[3rem] border-4 outline-none shadow-inner text-right font-medium transition-all ${isDarkMode ? 'bg-slate-900 border-indigo-700 text-indigo-100 placeholder:text-indigo-800' : 'bg-slate-50 border-sky-100 focus:border-sky-400'}`} />
             <button type="submit" className={`absolute left-4 md:left-6 top-1/2 -translate-y-1/2 p-4 md:p-6 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-sky-400 to-blue-600 text-white'}`}>
               <Search size={26} className="md:w-10 md:h-10" />
             </button>
           </form>
        </div>
      ) : loading ? (
        <div className="text-center py-24 md:py-40">
           <div className="relative inline-block">
              <Loader2 className={`w-20 h-20 md:w-32 md:h-32 animate-spin mx-auto mb-6 md:mb-10 ${isDarkMode ? 'text-indigo-400' : 'text-sky-400'}`} />
              <Sparkles className="absolute top-0 right-0 text-yellow-400 animate-ping" />
           </div>
           <p className={`text-2xl md:text-4xl font-medium animate-pulse ${isDarkMode ? 'text-indigo-300' : 'text-sky-600'}`}>جاري رسم الكلمة بألوان مبهجة...</p>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-12 animate-in slide-in-from-bottom-10 duration-700">
          <button onClick={() => {setResult(null); setQuery('');}} className={`flex items-center gap-2 md:gap-4 text-lg md:text-xl font-medium px-8 md:px-10 py-4 md:py-5 rounded-[2rem] md:rounded-[3rem] shadow-xl transition-all ${isDarkMode ? 'bg-slate-800 text-indigo-300 hover:bg-slate-700' : 'bg-white text-sky-500 hover:bg-sky-50'}`}>
            <ChevronLeft size={22} className="md:w-6 md:h-6" /> كلمة جديدة يا أستاذ مصطفى
          </button>
          
          <div className={`p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-b-[12px] transition-all duration-500 flex flex-col gap-10 ${isDarkMode ? 'bg-slate-800/80 border-indigo-700' : 'bg-white border-sky-50'}`}>
             
             <div className="relative group mx-auto w-full max-w-2xl">
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-yellow-400 to-sky-400 rounded-[2rem] md:rounded-[3rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                <div className={`relative rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 flex items-center justify-center min-h-[350px] md:min-h-[450px] border-4 border-white overflow-hidden shadow-2xl ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                   {art ? (
                     <img src={art} className="max-w-full max-h-[500px] rounded-[1.5rem] md:rounded-[2.5rem] transform hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className="flex flex-col items-center gap-4 opacity-20">
                        <Sparkles size={80} className="md:w-32 md:h-32 text-sky-300" />
                        <span className="font-bold text-xl uppercase tracking-widest">تحميل الصورة الكرتونية...</span>
                     </div>
                   )}
                </div>
                {/* زر الحفظ (القلب) */}
                <button 
                  onClick={() => onSave(result)}
                  className={`absolute top-8 right-8 p-5 rounded-full shadow-2xl transition-all hover:scale-125 z-20 ${isWordSaved(result.en) ? 'bg-pink-500 text-white animate-bounce' : 'bg-white/90 text-pink-400'}`}
                >
                  <Heart size={32} fill={isWordSaved(result.en) ? "white" : "none"} />
                </button>
             </div>

             <div className="text-right flex flex-col justify-center space-y-8 md:space-y-12">
                <div className="flex items-center justify-end gap-6 md:gap-10">
                   <button 
                    onClick={() => playVoice(result.en, false, 'word')} 
                    className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl transition-all ${speakingId === 'word' ? 'bg-green-500 scale-110 animate-pulse' : (isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gradient-to-br from-sky-400 to-blue-600 hover:scale-105 text-white')}`}
                   >
                     <Volume2 size={32} className="md:w-12 md:h-12" />
                   </button>
                   <h3 className={`text-5xl md:text-8xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-indigo-200' : 'text-sky-600'}`}>
                    {result.en}
                   </h3>
                </div>
                
                <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-5xl md:text-8xl font-black shadow-inner border-r-[12px] md:border-r-[20px] ${isDarkMode ? 'bg-slate-900 text-indigo-100 border-indigo-600' : 'bg-slate-50 text-slate-800 border-sky-400'}`}>
                  {result.ar}
                </div>
                
                <div className="space-y-4 md:space-y-6">
                  <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-r-8 flex items-center justify-end gap-6 md:gap-8 shadow-xl ${isDarkMode ? 'bg-slate-900/50 border-amber-600' : 'bg-amber-50 border-amber-400'}`}>
                    <p className={`text-xl md:text-3xl font-medium text-left flex-1 order-2 ${isDarkMode ? 'text-amber-200' : 'text-slate-600'}`}>{result.exEn}</p>
                    <button onClick={() => playVoice(result.exEn, false, 'exEn')} className={`p-3 md:p-4 rounded-xl shrink-0 ${isDarkMode ? 'bg-amber-600 text-white' : 'bg-amber-400 text-white'}`}><PlayCircle size={24} className="md:w-8 md:h-8" /></button>
                  </div>
                  <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-r-8 flex items-center justify-end gap-6 md:gap-8 shadow-xl ${isDarkMode ? 'bg-slate-900/50 border-emerald-600' : 'bg-emerald-50 border-emerald-400'}`}>
                    <p className={`text-2xl md:text-4xl font-medium flex-1 order-2 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>{result.exAr}</p>
                    <button onClick={() => playVoice(result.exAr, true, 'exAr')} className={`p-3 md:p-4 rounded-xl shrink-0 ${isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-400 text-white'}`}><PlayCircle size={24} className="md:w-8 md:h-8" /></button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SavedWordsView = ({ words, onRemove, isDarkMode }: { words: WordData[], onRemove: (id: string) => void, isDarkMode: boolean }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const playVoice = async (text: string, isAr: boolean, id: string) => {
    setPlayingId(id);
    try {
      const b64 = await academyAPI.textToSpeech(text, isAr);
      if (b64) await MustafaAcademyAudio.getInstance().speak(b64);
    } finally { setPlayingId(null); }
  };

  if (words.length === 0) {
    return (
      <div className={`text-center py-32 rounded-[3rem] border-4 border-dashed animate-in fade-in duration-700 ${isDarkMode ? 'bg-slate-900 border-indigo-800' : 'bg-white border-sky-100'}`}>
        <Ghost size={100} className="mx-auto text-sky-200 mb-8 opacity-50" />
        <h3 className={`text-3xl font-black ${isDarkMode ? 'text-indigo-200' : 'text-sky-600'}`}>حقيبتك فارغة يا بطل!</h3>
        <p className="text-xl opacity-60 mt-4">اذهب للقاموس وابحث عن كلمات واضغط على ❤️ لحفظها هنا.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 pb-20 animate-in slide-in-from-bottom-10 duration-700">
      {words.map((word) => (
        <div key={word.id} className={`group relative rounded-[2.5rem] overflow-hidden shadow-2xl border-b-[8px] transition-all hover:-translate-y-2 ${isDarkMode ? 'bg-slate-800 border-indigo-700' : 'bg-white border-sky-100'}`}>
          <div className="h-56 relative overflow-hidden bg-slate-100">
            {word.art ? (
              <img src={word.art} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={word.en} />
            ) : (
              <div className="flex items-center justify-center h-full opacity-20"><Sparkles size={60} /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
               <button onClick={() => playVoice(word.en, false, word.id)} className={`p-4 rounded-2xl shadow-xl transition-all ${playingId === word.id ? 'bg-green-500 animate-pulse' : 'bg-white/90 text-sky-600 hover:scale-110'}`}>
                  <Volume2 size={24} />
               </button>
               <div className="mr-auto text-left">
                  <span className="text-white text-3xl font-black uppercase tracking-tighter drop-shadow-lg">{word.en}</span>
               </div>
            </div>
            <button onClick={() => onRemove(word.id)} className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md text-white/70 hover:text-red-400 rounded-full transition-colors">
                <Trash2 size={20} />
            </button>
          </div>
          <div className="p-6 text-right space-y-4">
             <h4 className={`text-3xl font-black ${isDarkMode ? 'text-indigo-100' : 'text-slate-800'}`}>{word.ar}</h4>
             <div className={`p-4 rounded-2xl text-sm border-r-4 ${isDarkMode ? 'bg-slate-900 border-amber-600 text-amber-100' : 'bg-amber-50 border-amber-400 text-slate-600'}`}>
                <p className="font-bold text-left mb-1">{word.exEn}</p>
                <p className="opacity-70 italic">"{word.exAr}"</p>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MustafaAcademyApp = () => {
  const [tab, setTab] = useState('learn');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedWords, setSavedWords] = useState<WordData[]>([]);
  
  // تحميل الكلمات المحفوظة من localStorage عند البدء
  useEffect(() => {
    const saved = localStorage.getItem('mustafa_academy_saved');
    if (saved) {
      try { setSavedWords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // تحديث localStorage عند تغيير الكلمات
  useEffect(() => {
    localStorage.setItem('mustafa_academy_saved', JSON.stringify(savedWords));
  }, [savedWords]);

  const toggleSaveWord = (word: WordData) => {
    setSavedWords(prev => {
      const exists = prev.find(w => w.en.toLowerCase() === word.en.toLowerCase());
      if (exists) {
        return prev.filter(w => w.en.toLowerCase() !== word.en.toLowerCase());
      } else {
        return [word, ...prev];
      }
    });
  };

  const removeWordById = (id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id));
  };

  const isWordSaved = (en: string) => {
    return !!savedWords.find(w => w.en.toLowerCase() === en.toLowerCase());
  };

  const currentUrl = window.location.href;
  const isBlob = currentUrl.startsWith('blob:');

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 pb-20 md:pb-32 overflow-x-hidden ${isDarkMode ? 'bg-slate-950 text-indigo-100' : 'bg-[#f0f9ff] text-slate-900'}`}>
      
      {isBlob && (
        <div className="fixed top-0 w-full z-[60] bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] md:text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-2xl">
          <AlertTriangle size={14} /> هذا "رابط معاينة مؤقت" - لا يعمل عند التلاميذ إلا بعد النشر <Info size={14} className="cursor-pointer" onClick={() => setIsGuideOpen(true)} />
        </div>
      )}

      {isGuideOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
           <div className={`w-full max-w-2xl rounded-[3rem] p-6 md:p-12 shadow-2xl relative animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] ${isDarkMode ? 'bg-slate-900 border-2 border-indigo-500' : 'bg-white'}`}>
              <button onClick={() => setIsGuideOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={32} /></button>
              <div className="text-right">
                <div className="flex items-center justify-end gap-4 mb-8">
                   <h2 className="text-3xl md:text-4xl font-black">دليل الأستاذ مصطفى</h2>
                   <Globe className="text-sky-500" size={40} />
                </div>
                <div className="space-y-8">
                   <div className={`p-6 rounded-[2rem] border-r-8 ${isDarkMode ? 'bg-slate-800 border-indigo-600' : 'bg-sky-50 border-sky-400'}`}>
                      <h4 className="font-bold text-xl mb-4">لماذا لا يفتح الرابط مع التلاميذ؟</h4>
                      <p className="text-lg opacity-80 leading-relaxed font-medium">أنت الآن ترى نسخة تجريبية على جهازك. لكي يراها الجميع، نحتاج لرفع هذه الملفات على موقع استضافة حقيقي.</p>
                   </div>
                </div>
                <button onClick={() => setIsGuideOpen(false)} className="w-full mt-10 py-5 rounded-[2rem] font-black text-xl bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-2xl hover:scale-105 transition-all">فهمت، شكراً لك!</button>
              </div>
           </div>
        </div>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
           <div className={`w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-900 border-2 border-indigo-500' : 'bg-white'}`}>
              <button onClick={() => setIsShareModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={32} /></button>
              <div className="text-center">
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-sky-100 text-sky-500'}`}>
                    <Share2 size={40} />
                 </div>
                 <h2 className="text-3xl font-black mb-4">مشاركة الأكاديمية</h2>
                 <div className={`p-6 rounded-[2rem] flex items-center gap-4 border-2 mb-8 ${isDarkMode ? 'bg-slate-950 border-indigo-900' : 'bg-slate-50 border-sky-100 shadow-inner'}`}>
                    <input readOnly value={currentUrl} className="bg-transparent flex-1 text-xs truncate outline-none text-left font-mono opacity-60 font-bold" />
                    <button onClick={copyLink} className={`p-4 rounded-2xl transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white shadow-green-200 shadow-lg' : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-200 shadow-lg'}`}>
                       {copied ? <Check size={20} /> : <Copy size={20} />}
                       <span className="text-sm font-black">{copied ? 'تم' : 'نسخ'}</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {isDarkMode ? (
          <>
             <div className="absolute top-20 left-10 text-indigo-900/20 animate-pulse"><Star size={80} fill="currentColor" /></div>
             <div className="absolute bottom-40 right-10 text-purple-900/20 animate-bounce"><Moon size={120} fill="currentColor" /></div>
          </>
        ) : (
          <>
             <div className="absolute top-20 left-10 text-sky-100/60 animate-pulse"><Cloud size={100} /></div>
             <div className="absolute bottom-40 right-20 text-pink-100/60 animate-bounce"><Heart size={80} fill="currentColor" /></div>
             <div className="absolute top-1/2 right-10 text-yellow-100/40 animate-spin-slow"><Sun size={150} fill="currentColor" /></div>
          </>
        )}
      </div>

      <nav className={`fixed ${isBlob ? 'top-8 md:top-10' : 'top-0'} w-full z-50 p-4 md:p-8 flex flex-col md:flex-row justify-between items-center backdrop-blur-2xl border-b-4 transition-all duration-500 ${isDarkMode ? 'bg-slate-900/80 border-indigo-900 shadow-2xl' : 'bg-white/70 border-sky-50 shadow-xl'}`}>
        <div className="flex items-center gap-3 md:gap-6 order-2 md:order-1 mt-4 md:mt-0">
           <div className="flex gap-2 md:gap-3 bg-slate-200/20 p-1.5 rounded-[1.5rem] md:rounded-[2rem]">
             <button onClick={() => setTab('learn')} className={`flex items-center gap-2 px-5 md:px-8 py-2 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-sm md:text-lg transition-all ${tab === 'learn' ? (isDarkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-sky-500 text-white shadow-lg shadow-sky-200') : 'text-slate-400 hover:text-slate-600'}`}>
                <BookOpen size={18} className="hidden sm:block" /> القاموس
             </button>
             <button onClick={() => setTab('play')} className={`flex items-center gap-2 px-5 md:px-8 py-2 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-sm md:text-lg transition-all ${tab === 'play' ? (isDarkMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-500 text-white shadow-lg shadow-purple-200') : 'text-slate-400 hover:text-slate-600'}`}>
                <Trophy size={18} className="hidden sm:block" /> الألعاب
             </button>
             <button onClick={() => setTab('saved')} className={`flex items-center gap-2 px-5 md:px-8 py-2 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-sm md:text-lg transition-all ${tab === 'saved' ? (isDarkMode ? 'bg-pink-600 text-white shadow-lg' : 'bg-pink-500 text-white shadow-lg shadow-pink-200') : 'text-slate-400 hover:text-slate-600'}`}>
                <Heart size={18} className="hidden sm:block" fill={tab === 'saved' ? "white" : "none"} /> حقيبتي <span className="text-[10px] bg-white/20 px-2 rounded-full">{savedWords.length}</span>
             </button>
           </div>
           
           <div className="h-10 w-[2px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
           
           <button onClick={() => setIsShareModalOpen(true)} className={`p-3 md:p-4 rounded-full transition-all transform hover:scale-125 active:scale-95 ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-white text-sky-500 shadow-xl border border-sky-50'}`} title="مشاركة">
             <Share2 size={24} />
           </button>
           <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 md:p-4 rounded-full transition-all transform hover:scale-125 active:rotate-90 ${isDarkMode ? 'bg-amber-400 text-slate-900 shadow-amber-400/50 shadow-2xl' : 'bg-slate-800 text-yellow-400 shadow-2xl'}`} title="الوضع">
             {isDarkMode ? <Sun size={24} fill="currentColor" /> : <Moon size={24} fill="currentColor" />}
           </button>
        </div>
        
        <div className="text-center md:text-right order-1 md:order-2">
          <h1 className={`rainbow-title text-2xl md:text-5xl font-black tracking-tighter px-2 leading-tight ${isDarkMode ? 'rainbow-glow' : ''}`}>أكاديمية مصطفى عبد العال دحروج</h1>
          <div className="flex justify-center md:justify-end gap-3 items-center mt-1 opacity-60">
             <Sparkles size={14} className="text-yellow-500" />
             <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em]">بوابة العلم والمرح للأحفاد</p>
          </div>
        </div>
      </nav>

      <main className={`container mx-auto px-4 max-w-7xl ${isBlob ? 'pt-56 md:pt-64' : 'pt-48 md:pt-56'}`}>
        {tab === 'learn' && <KidDictionary isDarkMode={isDarkMode} onSave={toggleSaveWord} isWordSaved={isWordSaved} />}
        
        {tab === 'play' && (
          <div className={`text-center py-24 md:py-40 rounded-[3rem] md:rounded-[5rem] shadow-2xl mx-2 border-b-8 transition-all duration-500 border-purple-500 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <Trophy size={80} className={`mx-auto animate-bounce mb-8 ${isDarkMode ? 'text-amber-500' : 'text-amber-400'}`} />
            <h2 className={`text-3xl md:text-5xl font-black ${isDarkMode ? 'text-indigo-200' : 'text-slate-800'}`}>الألعاب قادمة بكل حب!</h2>
            <p className="text-lg md:text-2xl opacity-60 mt-6 font-medium max-w-2xl mx-auto px-4">نحن نجهز الآن ألعاباً ذكية تجعل أحفاد الأستاذ مصطفى عباقرة في اللغة الإنجليزية!</p>
          </div>
        )}

        {tab === 'saved' && <SavedWordsView words={savedWords} onRemove={removeWordById} isDarkMode={isDarkMode} />}
      </main>

      <footer className="mt-32 md:mt-56 mb-16 md:mb-24 text-center px-4 flex flex-col items-center justify-center">
        <div className={`w-24 md:w-40 h-1 mx-auto mb-10 md:mb-14 rounded-full opacity-20 ${isDarkMode ? 'bg-indigo-500' : 'bg-sky-400'}`}></div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5 scale-110 md:scale-125">
           <p className={`text-xl md:text-3xl font-black tracking-wide ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>صنع بكل الحب</p>
           <Heart className="text-red-500 fill-red-500 animate-pulse transition-transform hover:scale-150 my-2 md:my-0" size={32} />
           <p className={`text-xl md:text-3xl font-black tracking-wide ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>لأغلى أحفاد الأستاذ مصطفى عبد العال دحروج</p>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
        body { font-family: 'Tajawal', sans-serif; transition: background-color 0.7s ease; -webkit-tap-highlight-color: transparent; }
        .rainbow-title { background: linear-gradient(to right, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444, #3b82f6); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: rainbow-flow 5s linear infinite; }
        .rainbow-glow { filter: drop-shadow(0 0 8px rgba(255,255,255,0.6)); }
        @keyframes rainbow-flow { to { background-position: 200% center; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<MustafaAcademyApp />);
