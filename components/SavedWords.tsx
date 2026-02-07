
import React, { useState } from 'react';
import { SavedWord } from '../types';
import { Volume2, Trash2, Ghost, PlayCircle, Sparkles, Heart, History, MessageSquareQuote } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface SavedWordsProps {
  savedWords: SavedWord[];
  historyWords: SavedWord[];
  onRemoveSaved: (id: string) => void;
  onRemoveHistory: (id: string) => void;
}

const SavedWords: React.FC<SavedWordsProps> = ({ savedWords, historyWords, onRemoveSaved, onRemoveHistory }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'favorites' | 'history'>('favorites');

  const playAudio = async (text: string, id: string) => {
    if (playingId) return;
    setPlayingId(id);
    try {
      const buffer = await generateSpeech(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => setPlayingId(null);
      source.start();
    } catch (err) {
      console.error(err);
      setPlayingId(null);
    }
  };

  const currentWords = viewType === 'favorites' ? savedWords : historyWords;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="text-yellow-400" />
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">
            {viewType === 'favorites' ? 'كلماتي المميزة' : 'سجل تعلمي'}
          </h2>
          <Sparkles className="text-yellow-400" />
        </div>

        {/* أزرار التبديل بين المفضلة والسجل */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full max-w-sm">
          <button 
            onClick={() => setViewType('favorites')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all ${viewType === 'favorites' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Heart size={18} fill={viewType === 'favorites' ? 'currentColor' : 'none'} />
            المفضلة ({savedWords.length})
          </button>
          <button 
            onClick={() => setViewType('history')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all ${viewType === 'history' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <History size={18} />
            السجل ({historyWords.length})
          </button>
        </div>
      </div>
      
      {currentWords.length === 0 ? (
        <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-[3rem] border-4 border-dashed border-sky-100 dark:border-slate-700">
          <Ghost size={80} className="mx-auto text-sky-200 mb-6" />
          <h2 className="text-2xl font-black text-sky-600 dark:text-sky-400 mb-2">
            {viewType === 'favorites' ? 'لا توجد كلمات مميزة بعد!' : 'سجلك نظيف يا بطل!'}
          </h2>
          <p className="text-slate-400 font-medium px-4">
            {viewType === 'favorites' 
              ? 'ابحث عن كلمات واضغط على القلب لتظهر هنا.' 
              : 'ابدأ بالبحث عن الكلمات وسنقوم بحفظها لك هنا تلقائياً.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentWords.map((word) => (
            <div key={word.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl border-b-[8px] border-sky-100 dark:border-slate-900 group transition-all hover:-translate-y-2">
              <div className="h-56 overflow-hidden relative">
                {word.imageUrl ? (
                  <img src={word.imageUrl} alt={word.english} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-sky-50 dark:bg-slate-700 flex items-center justify-center text-sky-200"><Sparkles size={40} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                   <button 
                    onClick={() => playAudio(word.english, word.id)} 
                    className={`p-4 rounded-2xl shadow-xl transition-all ${playingId === word.id ? 'bg-green-500' : 'bg-white hover:bg-sky-50'} text-sky-600`}
                   >
                      <Volume2 size={24} />
                   </button>
                   <div className="mr-auto text-left">
                      <span className="text-white text-3xl font-black uppercase tracking-tighter drop-shadow-lg">{word.english}</span>
                   </div>
                </div>
                <button 
                    onClick={() => viewType === 'favorites' ? onRemoveSaved(word.id) : onRemoveHistory(word.id)}
                    className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md text-white/70 hover:text-red-400 rounded-full transition-colors"
                >
                    <Trash2 size={20} />
                </button>
              </div>
              
              <div className="p-6 text-right space-y-4">
                <div className="flex items-center justify-end gap-3">
                   <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{word.arabic}</h3>
                </div>

                {/* العبارات (Phrases) المحفوظة */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border-r-4 border-sky-400 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => playAudio(word.exampleEnglish, word.id + '-ex')} className="shrink-0 p-1.5 bg-sky-100 dark:bg-sky-900/40 text-sky-600 rounded-lg"><PlayCircle size={16} /></button>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 text-left leading-relaxed">{word.exampleEnglish}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sky-400/60 justify-end">
                    <span className="text-[11px] font-black italic">"{word.exampleArabic}"</span>
                    <MessageSquareQuote size={12} />
                  </div>
                </div>

                <div className="flex gap-2">
                   <button 
                    onClick={() => playAudio(word.exampleEnglish, word.id + '-ex')}
                    className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${playingId === word.id + '-ex' ? 'bg-green-500 text-white animate-pulse' : 'bg-sky-500 text-white hover:bg-sky-600'}`}
                   >
                     سماع العبارة
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedWords;
