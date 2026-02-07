
import React, { useState } from 'react';
import { dictionaryLookup, generateWordImage, generateSpeech } from '../services/geminiService';
import { WordResult, SavedWord } from '../types';
import { Search, Volume2, Loader2, Sparkles, Heart } from 'lucide-react';

interface DictionaryProps {
  onSaveWord: (word: SavedWord) => void;
  isSaved: (english: string) => boolean;
  onSearchSuccess?: (word: SavedWord) => void;
}

const Dictionary: React.FC<DictionaryProps> = ({ onSaveWord, isSaved, onSearchSuccess }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setImage(null);
    try {
      const wordRes = await dictionaryLookup(query);
      setResult(wordRes);
      const imgRes = await generateWordImage(wordRes.english);
      setImage(imgRes);

      // إضافة للسجل تلقائياً
      const wordToStore: SavedWord = {
        ...wordRes,
        id: Date.now().toString(),
        imageUrl: imgRes,
        savedAt: Date.now()
      };
      if (onSearchSuccess) onSearchSuccess(wordToStore);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (text: string) => {
    if (playing) return;
    setPlaying(true);
    try {
      const buffer = await generateSpeech(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => setPlaying(false);
      source.start();
    } catch (err) {
      console.error(err);
      setPlaying(false);
    }
  };

  const handleSave = () => {
    if (result) {
      const newSavedWord: SavedWord = {
        ...result,
        id: Date.now().toString(),
        imageUrl: image,
        savedAt: Date.now()
      };
      onSaveWord(newSavedWord);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border-4 border-sky-100 dark:border-slate-700 transition-colors">
        <h2 className="text-2xl md:text-3xl font-black text-sky-600 dark:text-sky-400 mb-8 text-center flex items-center justify-center gap-3">
          <Sparkles className="text-yellow-400" />
          الباحث الذكي للأحفاد
        </h2>
        
        <form onSubmit={handleSearch} className="relative mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب كلمة لنتعلمها سوياً..."
            className="w-full text-xl md:text-2xl p-6 pr-16 rounded-[2rem] border-4 border-sky-50 dark:border-slate-600 focus:border-sky-400 outline-none text-right shadow-inner bg-sky-50/30 dark:bg-slate-700 dark:text-white text-slate-900 placeholder:text-gray-300 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-lg transition-transform active:scale-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
          </button>
        </form>

        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-16 h-16 text-sky-400 animate-spin mx-auto" />
            <p className="mt-4 text-sky-500 dark:text-sky-400 font-black text-2xl">جاري رسم المفاجأة...</p>
          </div>
        )}

        {result && !loading && (
          <div className="grid md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col items-center justify-center bg-sky-50/50 dark:bg-slate-700/50 rounded-[2rem] p-6 border-4 border-dashed border-sky-100 dark:border-slate-600 relative overflow-hidden group">
              {image ? (
                <img src={image} alt={result.english} className="w-full max-w-[320px] h-auto rounded-[1.5rem] shadow-2xl transform hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                   <Loader2 className="animate-spin text-sky-200 w-12 h-12" />
                </div>
              )}
              <button 
                onClick={handleSave}
                className={`absolute top-4 right-4 p-4 rounded-full shadow-xl transition-all hover:scale-125 ${isSaved(result.english) ? 'bg-pink-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-pink-400 hover:bg-pink-50'}`}
              >
                <Heart fill={isSaved(result.english) ? "currentColor" : "none"} size={28} />
              </button>
            </div>

            <div className="space-y-8 text-right flex flex-col justify-center">
              <div>
                <div className="flex items-center justify-end gap-6 mb-2">
                  <button 
                    onClick={() => playAudio(result.english)}
                    className={`p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] shadow-xl ${playing ? 'bg-green-500 animate-pulse' : 'bg-sky-500 hover:bg-sky-400'} text-white transition-all`}
                  >
                    <Volume2 size={32} />
                  </button>
                  <h3 className="text-5xl md:text-7xl font-black text-sky-600 dark:text-sky-400 uppercase tracking-tighter">
                    {result.english}
                  </h3>
                </div>
              </div>

              <div className={`p-6 md:p-8 rounded-[2rem] border-r-[12px] md:border-r-[20px] shadow-inner transition-colors ${isSaved(result.english) ? 'bg-pink-50 dark:bg-pink-900/10 border-pink-400' : 'bg-slate-50 dark:bg-slate-700 border-sky-400'}`}>
                <p className="text-4xl md:text-6xl font-black text-slate-800 dark:text-slate-100 leading-tight">{result.arabic}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border-r-8 border-amber-400 flex items-center justify-between gap-4">
                   <button onClick={() => playAudio(result.exampleEnglish)} className="p-2 bg-amber-400 text-white rounded-lg"><Volume2 size={20} /></button>
                   <div className="text-right">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-snug">{result.exampleEnglish}</p>
                      <p className="text-sm text-amber-600 dark:text-amber-400 italic font-medium">"{result.exampleArabic}"</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dictionary;
