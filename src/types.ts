export interface User {
  id: string;
  name: string;
  xp: number;
  level: number;
  badges: string[];
}

export interface Question {
  q: string;
  a: string[];
  correct: number;
}

export interface Quest {
  id: string;
  title: string;
  type: 'vocabulary' | 'grammar';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpAward: number;
  questions: Question[];
}
