
import React, { useState, useEffect } from 'react';
import Dictionary from './components/Dictionary';
import Games from './components/Games';
import SavedWords from './components/SavedWords';
import { SavedWord } from './types';
import { BookOpen, Gamepad2, Stars, Cloud, Sun, Moon, Music, Share2, Check, X, Copy, Gift, ExternalLink, Heart, History } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'games' | 'saved'>('dictionary');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // الكلمات التي ضغط عليها التلميذ (المفضلة)
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  // الكلمات التي تم البحث عنها (السجل التلقائي)
  const [historyWords, setHistoryWords] = useState<SavedWord[]>([]);

  // تحميل البيانات عند البداية
  useEffect(() => {
    const storedSaved = localStorage.getItem('mustafa_academy_saved_words');
    const storedHistory = localStorage.getItem('mustafa_academy_history_words');
    
    if (storedSaved) {
      try { setSavedWords(JSON.parse(storedSaved)); } catch (e) { console.error(e); }
    }
    if (storedHistory) {
      try { setHistoryWords(JSON.parse(storedHistory)); } catch (e) { console.error(e); }
    }
  }, []);

  // حفظ البيانات عند كل تغيير
  useEffect(() => {
    localStorage.setItem('mustafa_academy_saved_words', JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    localStorage.setItem('mustafa_academy_history_words', JSON.stringify(historyWords));
  }, [historyWords]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const currentUrl = window.location.href;
  const isBlob = currentUrl.startsWith('blob:');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // حفظ في السجل تلقائياً عند كل بحث ناجح
  const handleAddToHistory = (word: SavedWord) => {
    setHistoryWords(prev => {
      const filtered = prev.filter(w => w.english.toLowerCase() !== word.english.toLowerCase());
      // نبقي آخر 20 كلمة فقط في السجل لسرعة الأداء
      return [word, ...filtered].slice(0, 20);
    });
  };

  // حفظ/إزالة من المفضلة
  const handleSaveWord = (word: SavedWord) => {
    if (savedWords.find(w => w.english.toLowerCase() === word.english.toLowerCase())) {
      setSavedWords(prev => prev.filter(w => w.english.toLowerCase() !== word.english.toLowerCase()));
    } else {
      setSavedWords(prev => [word, ...prev]);
    }
  };

  const removeSavedWord = (id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id));
  };

  const removeHistoryWord = (id: string) => {
    setHistoryWords(prev => prev.filter(w => w.id !== id));
  };

  const isWordSaved = (english: string) => {
    return !!savedWords.find(w => w.english.toLowerCase() === english.toLowerCase());
  };

  return (
    <div className={`min-h-screen relative overflow-hidden pb-24 transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950' : 'bg-[#f0f9ff]'}`}>
      
      {/* عناصر خلفية مبهجة */}
      <div className="absolute top-10 left-10 text-sky-100 dark:text-indigo-900/10 animate-bounce -z-10"><Cloud size={100} /></div>
      <div className="absolute top-40 right-10 text-yellow-100 dark:text-yellow-900/10 animate-pulse -z-10"><Sun size={120} /></div>
      <div className="absolute bottom-20 left-20 text-pink-50 dark:text-pink-900/10 -z-10"><Music size={80} /></div>

      {/* أزرار التحكم الثابتة */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <button 
          onClick={toggleDarkMode}
          className="p-3 rounded-full shadow-xl transition-all transform active:scale-95 bg-white dark:bg-slate-800 text-yellow-500 dark:text-yellow-400 border-2 border-sky-50 dark:border-slate-700"
          title="تبديل الوضع الليلي"
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <button 
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full shadow-xl font-black transition-all transform active:scale-95 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-2 border-sky-50 dark:border-slate-700"
        >
          <Share2 size={22} />
          <span className="hidden sm:inline">مشاركة</span>
        </button>
      </div>

      {/* نافذة المشاركة */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-900/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-md p-10 shadow-2xl border-4 border-sky-200 dark:border-slate-700 relative animate-in zoom-in duration-300">
            <button onClick={() => setIsShareModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={32} /></button>
            <div className="text-center">
              <Gift className="text-pink-500 w-20 h-20 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl font-black text-sky-600 dark:text-sky-400 mb-4">أكاديمية الأستاذ مصطفى</h2>
              {isBlob ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border-2 border-red-100 dark:border-red-900/30 mb-6 text-right">
                  <p className="text-red-700 dark:text-red-400 text-sm font-black mb-4">هذا رابط مؤقت للمعاينة فقط على جهازك.</p>
                  <a href="https://www.netlify.com/" target="_blank" className="flex items-center justify-center gap-2 bg-red-500 text-white p-4 rounded-2xl font-black text-sm shadow-lg">كيفية نشر الموقع <ExternalLink size={18} /></a>
                </div>
              ) : (
                <div className="bg-sky-50 dark:bg-slate-700 p-5 rounded-[2rem] border-2 border-dashed border-sky-200 dark:border-slate-600 mb-8 flex items-center gap-4">
                  <input readOnly value={currentUrl} className="bg-transparent text-sky-700 dark:text-sky-300 text-[10px] flex-1 truncate outline-none font-bold" />
                  <button onClick={handleCopyLink} className={`p-4 rounded-xl shadow-lg transition-all ${copied ? 'bg-green-500 text-white' : 'bg-sky-500 text-white'}`}>
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              )}
              <button onClick={() => setIsShareModalOpen(false)} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-black py-4 rounded-2xl transition-colors hover:bg-slate-200">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      <header className="relative z-10 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-4 mb-4">
           <Stars className="text-yellow-400 animate-spin-slow" />
           <h1 className="text-4xl md:text-6xl font-black text-sky-600 dark:text-sky-400 drop-shadow-2xl tracking-tighter">
             أكاديمية <span className="text-pink-500">مصطفى</span>
           </h1>
           <Stars className="text-yellow-400 animate-spin-slow" />
        </div>
        <p className="text-sky-400 dark:text-indigo-300 text-xl font-black tracking-widest uppercase">تعلم بذكاء ومرح 🐾</p>
      </header>

      {/* القائمة الرئيسية المحدثة */}
      <nav className="relative z-10 max-w-2xl mx-auto mb-12 flex p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border-2 border-white/50 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-4 rounded-[2rem] font-black text-lg transition-all ${
            activeTab === 'dictionary' 
            ? 'bg-sky-500 text-white shadow-xl scale-105' 
            : 'text-slate-400 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen size={24} /> <span className="text-sm sm:text-lg">القاموس</span>
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-4 rounded-[2rem] font-black text-lg transition-all ${
            activeTab === 'games' 
            ? 'bg-purple-500 text-white shadow-xl scale-105' 
            : 'text-slate-400 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700'
          }`}
        >
          <Gamepad2 size={24} /> <span className="text-sm sm:text-lg">الألعاب</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-4 rounded-[2rem] font-black text-lg transition-all ${
            activeTab === 'saved' 
            ? 'bg-pink-500 text-white shadow-xl scale-105' 
            : 'text-slate-400 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700'
          }`}
        >
          <Heart size={24} fill={activeTab === 'saved' ? "white" : "none"} /> <span className="text-sm sm:text-lg">حقيبتي</span>
        </button>
      </nav>

      <main className="relative z-10 container mx-auto px-4 max-w-6xl">
        {activeTab === 'dictionary' ? (
          <Dictionary 
            onSaveWord={handleSaveWord} 
            isSaved={isWordSaved} 
            onSearchSuccess={handleAddToHistory}
          />
        ) : activeTab === 'games' ? (
          <Games />
        ) : (
          <SavedWords 
            savedWords={savedWords} 
            historyWords={historyWords}
            onRemoveSaved={removeSavedWord} 
            onRemoveHistory={removeHistoryWord}
          />
        )}
      </main>

      {/* شريط معلومات سفلي */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl py-4 border-t-2 border-sky-50 dark:border-slate-800 flex items-center justify-center gap-10 z-20">
        <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400 text-[10px] md:text-xs font-black uppercase tracking-widest">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
           متصل بالذكاء الاصطناعي
        </div>
        <div className="flex items-center gap-2 text-pink-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
           <Heart size={14} fill="currentColor" />
           {savedWords.length} كلمة مميزة
        </div>
        <div className="flex items-center gap-2 text-indigo-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
           <History size={14} />
           {historyWords.length} بحثت عنهم
        </div>
      </footer>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
        body { -webkit-tap-highlight-color: transparent; font-family: 'Tajawal', sans-serif; }
      `}</style>
    </div>
  );
};

export default App;
