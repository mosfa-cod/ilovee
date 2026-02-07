
export interface WordResult {
  english: string;
  arabic: string;
  exampleEnglish: string;
  exampleArabic: string;
  phonetic?: string;
}

export interface SavedWord extends WordResult {
  id: string;
  imageUrl: string | null;
  savedAt: number;
}

export enum GameLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  imageHint?: string;
}

export interface MatchingPair {
  id: string;
  english: string;
  arabic: string;
  imageUrl?: string;
}
