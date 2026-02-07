
import React, { useState, useEffect } from 'react';
import { GameLevel, QuizQuestion } from '../types';
import { generateQuiz, generateWordImage } from '../services/geminiService';
import { Trophy, Star, ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const Games: React.FC = () => {
  const [level, setLevel] = useState<GameLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startLevel = async (selectedLevel: GameLevel) => {
    setLevel(selectedLevel);
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    try {
      const q = await generateQuiz(selectedLevel);
      setQuestions(q);
      if (q.length > 0) {
        loadQuestionImage(q[0].imageHint || q[0].correctAnswer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionImage = async (word: string) => {
    setCurrentImage(null);
    try {
      const img = await generateWordImage(word);
      setCurrentImage(img);
    } catch (err) {
      setCurrentImage('https://picsum.photos/300/300');
    }
  };

  const handleAnswer = (option: string) => {
    if (feedback) return;
    const isCorrect = option === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < questions.length) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        loadQuestionImage(questions[next].imageHint || questions[next].correctAnswer);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (!level) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <h2 className="text-4xl font-black text-sky-600 dark:text-sky-400 mb-8 flex items-center justify-center gap-3">
           <Star className="text-yellow-400 fill-yellow-400" />
           اختر مستوى التحدي!
           <Star className="text-yellow-400 fill-yellow-400" />
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <button onClick={() => startLevel(GameLevel.EASY)} className="bg-green-400 hover:bg-green-500 text-white rounded-3xl p-8 shadow-lg transition-all active:scale-95">
            <span className="text-6xl mb-4 block">🐣</span>
            <span className="text-2xl font-bold">سهل</span>
          </button>
          <button onClick={() => startLevel(GameLevel.MEDIUM)} className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-3xl p-8 shadow-lg transition-all active:scale-95">
            <span className="text-6xl mb-4 block">🚀</span>
            <span className="text-2xl font-bold">متوسط</span>
          </button>
          <button onClick={() => startLevel(GameLevel.HARD)} className="bg-pink-400 hover:bg-pink-500 text-white rounded-3xl p-8 shadow-lg transition-all active:scale-95">
            <span className="text-6xl mb-4 block">🦁</span>
            <span className="text-2xl font-bold">صعب</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-20 h-20 text-sky-400 animate-spin" />
        <p className="mt-4 text-2xl font-bold text-sky-600 dark:text-sky-400">نجهز التحدي الممتع...</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-200 dark:border-yellow-900/30 text-center animate-in zoom-in duration-500">
        <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-4xl font-black text-gray-800 dark:text-slate-100 mb-2">رائع جداً!</h2>
        <p className="text-2xl text-gray-500 dark:text-slate-400 mb-6">لقد حصلت على {score} من أصل {questions.length}</p>
        <div className="flex gap-4">
          <button onClick={() => setLevel(null)} className="flex-1 bg-sky-500 text-white rounded-2xl p-4 font-bold flex items-center justify-center gap-2">
            <ArrowLeft /> العودة
          </button>
          <button onClick={() => startLevel(level)} className="flex-1 bg-green-500 text-white rounded-2xl p-4 font-bold">
            إعادة
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setLevel(null)} className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 hover:underline">
          <ArrowLeft size={18} /> انسحاب
        </button>
        <div className="flex items-center gap-4">
          <div className="bg-sky-100 dark:bg-slate-700 px-4 py-2 rounded-full font-bold text-sky-600 dark:text-sky-400">
            السؤال {currentIndex + 1} / {questions.length}
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <Star size={18} fill="currentColor" /> {score}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl border-b-8 border-gray-100 dark:border-slate-900 relative overflow-hidden">
        {feedback && (
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-300 ${feedback === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
            {feedback === 'correct' ? <CheckCircle2 size={120} /> : <XCircle size={120} />}
            <span className="text-4xl font-black mt-4">{feedback === 'correct' ? 'ممتاز! صح!' : 'حاول مرة أخرى!'}</span>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-slate-200 text-center mb-6 leading-relaxed">
            {currentQ?.question}
          </h3>
          <div className="flex justify-center">
            {currentImage ? (
              <img src={currentImage} className="w-64 h-64 object-cover rounded-3xl border-4 border-sky-50 dark:border-slate-700 shadow-inner" alt="Hint" />
            ) : (
              <div className="w-64 h-64 bg-gray-50 dark:bg-slate-700 rounded-3xl flex items-center justify-center border-4 border-dashed border-gray-100 dark:border-slate-600">
                <Loader2 className="animate-spin text-gray-300" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ?.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!feedback}
              className="bg-sky-50 dark:bg-slate-700 hover:bg-sky-400 dark:hover:bg-sky-600 hover:text-white text-sky-700 dark:text-sky-300 text-2xl font-bold p-6 rounded-2xl border-b-4 border-sky-100 dark:border-slate-900 transition-all text-center disabled:opacity-50"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;
