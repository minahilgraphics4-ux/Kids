export type AvatarId = "sparky" | "luna" | "barnaby" | "pip";

export interface BuddyInfo {
  id: AvatarId;
  name: string;
  emoji: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  accentBg: string;
  description: string;
  welcomeMsg: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  image?: string; // Optional base64 image thumbnail
}

export interface KidProfile {
  name: string;
  magicCode: string; // Whimsical magic code for child retrieval
  avatarId: AvatarId;
  xp: number;
  level: number;
  points: number; // Stars/Coins earned
  streak: number;
  lastLearnedDate: string;
  questionsAsked: number;
  quizzesCompleted: number;
  badges: string[]; // Unlocked badge IDs
  categoryCounts: Record<string, number>; // e.g., science, animals, creativity, math, general
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirementText: string;
}
