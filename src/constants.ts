import { BuddyInfo, Badge } from "./types";

export const BUDDIES: BuddyInfo[] = [
  {
    id: "sparky",
    name: "Sparky",
    emoji: "🦖",
    color: "#ff7043", // Warm coral/orange
    textColor: "text-orange-950",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-400",
    accentBg: "bg-orange-100",
    description: "The energetic little dinosaur! Loves jokes, fun games, and adventure. Friendly and playful!",
    welcomeMsg: "Rawr! Hello there, my favorite explorer! I am Sparky the Dinosaur! 🦖 Let's discover something amazing today! You can type a question, select a quick emoji, or upload a picture for me! What do you want to learn about?"
  },
  {
    id: "luna",
    name: "Luna",
    emoji: "🦉",
    color: "#29b6f6", // Sky blue
    textColor: "text-sky-950",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-400",
    accentBg: "bg-sky-100",
    description: "The wise gentle owl! Loves starry skies, planet Earth, oceans, and interesting science facts.",
    welcomeMsg: "Hoot hoot! Welcome, curious learner! 🦉 I am Luna the Owl, and I love reading big books about space and oceans! Ask me anything, or show me a picture, and we will solve the mystery together!"
  },
  {
    id: "barnaby",
    name: "Barnaby",
    emoji: "🧸",
    color: "#8d6e63", // Warm teddy bear brown
    textColor: "text-amber-950",
    bgColor: "bg-amber-50/70",
    borderColor: "border-amber-400",
    accentBg: "bg-amber-100/70",
    description: "The big warm huggable bear! Loves honey, bedtime stories, cozy puzzles, and encouraging kids.",
    welcomeMsg: "Hello there, little cub! Bear hugs to you! 🧸 I am Barnaby the Bear. I've got a jar of honey and some cozy stories. If you have any questions or want to show me a drawing, I'm right here to help you learn! Let's be best friends!"
  },
  {
    id: "pip",
    name: "Pip",
    emoji: "🤖",
    color: "#26a69a", // Vibrant mint/teal
    textColor: "text-teal-950",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-400",
    accentBg: "bg-teal-100",
    description: "The bright happy helper robot! Loves math, puzzles, codes, gadgets, and explaining how things work.",
    welcomeMsg: "Beep-boop! *Click clack!* 🤖 Pip online and ready to assist! I love numbers, robots, gadgets, and solving fun riddles! Give me a question or feed me a cool picture, and my gears will find the answer!"
  }
];

export const BADGES: Badge[] = [
  {
    id: "curiosity",
    title: "Curiosity Starter",
    description: "Asked your first 3 questions!",
    icon: "🌟",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    requirementText: "Ask 3 questions in chat"
  },
  {
    id: "photographer",
    title: "Picture Investigator",
    description: "Uploaded an image to learn about it!",
    icon: "📸",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    requirementText: "Send 1 picture"
  },
  {
    id: "quiz_wizard",
    title: "Quiz Whiz",
    description: "Answered a mini-quiz question correctly!",
    icon: "🧠",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    requirementText: "Get a correct quiz answer"
  },
  {
    id: "explorer",
    title: "Animal Explorer",
    description: "Asked 3 questions about Animals or Nature!",
    icon: "🦁",
    color: "bg-green-100 text-green-700 border-green-300",
    requirementText: "Ask 3 Nature/Animal questions"
  },
  {
    id: "science_hero",
    title: "Space Cadet",
    description: "Asked 3 questions about Space, stars, or science!",
    icon: "🚀",
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    requirementText: "Ask 3 Space/Science questions"
  },
  {
    id: "high_level",
    title: "Super Brain",
    description: "Reached Level 5 learning milestone!",
    icon: "🎓",
    color: "bg-pink-100 text-pink-700 border-pink-300",
    requirementText: "Reach Level 5"
  }
];

export const QUICK_EMOJIS = ["🦖", "🚀", "🦉", "🦄", "🎨", "🌈", "🍦", "🦁", "🐬", "🧪", "🧩", "⚽", "🐱", "🍕"];

export const QUIZ_TOPICS = [
  { id: "space", name: "Space & Planets 🪐", color: "bg-indigo-400 hover:bg-indigo-500 text-white" },
  { id: "dinosaurs", name: "Dinosaurs & Fossils 🦖", color: "bg-orange-400 hover:bg-orange-500 text-white" },
  { id: "animals", name: "Animals & Nature 🦁", color: "bg-green-400 hover:bg-green-500 text-white" },
  { id: "math", name: "Math & Riddles 🔢", color: "bg-sky-400 hover:bg-sky-500 text-white" },
  { id: "general", name: "Super Trivia 🌟", color: "bg-pink-400 hover:bg-pink-500 text-white" }
];

// Natively synthesized Web Audio sounds!
export function playSynthSound(type: "click" | "success" | "fail" | "levelup") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } 
    else if (type === "success") {
      // Friendly dual-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } 
    else if (type === "fail") {
      // Soft double-drop sad tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } 
    else if (type === "levelup") {
      // Grand ascending arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      gain.connect(ctx.destination);

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        osc.connect(gain);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
      });
    }
  } catch (e) {
    console.warn("Web Audio API not supported or blocked by permissions", e);
  }
}
