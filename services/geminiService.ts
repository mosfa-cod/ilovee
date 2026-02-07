
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordResult, GameLevel, QuizQuestion } from "../types";

// Note: API_KEY is provided via process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const dictionaryLookup = async (query: string): Promise<WordResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate and provide details for the word: "${query}". 
               The target audience is kids aged 4-10. 
               Provide: English word, Arabic translation, a simple kid-friendly English example sentence, and its Arabic translation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          english: { type: Type.STRING },
          arabic: { type: Type.STRING },
          exampleEnglish: { type: Type.STRING },
          exampleArabic: { type: Type.STRING },
          phonetic: { type: Type.STRING }
        },
        required: ["english", "arabic", "exampleEnglish", "exampleArabic"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateWordImage = async (word: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A vibrant, cheerful, high-quality cartoon 3D illustration of "${word}" for children, white background, simple, cute style.` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return 'https://picsum.photos/400/400';
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly and slowly for a child: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Kore' is often clear and warm
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Custom PCM decoding as per Gemini docs
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

export const generateQuiz = async (level: GameLevel): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const prompt = `Generate 5 multiple-choice questions for learning English for kids. Level: ${level}. 
                  Each question should have 4 options and one correct answer. 
                  Provide a word that can be visualized as an image hint for the question.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            imageHint: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
