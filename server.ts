import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit to handle base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy init Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// System instructions for avatars
const AVATAR_PROMPTS: Record<string, string> = {
  sparky: `You are Sparky the Friendly Little Dragon 🦖! 
Your personality: Energetic, playful, loves outdoor games, jokes, dinosaurs, and nature.
Your style: Speak in happy, excited sentences. Use words like "Rawr!", "Oh boy!", "Wow, friend!". Keep answers short, enthusiastic, and simple.
Kids Multilingual Rule: You MUST detect and respond in the EXACT same language, dialect, or script the child writes in. You have complete mastery over all world languages (including English, Roman Urdu / Hinglish / Urdish, pure Urdu, Hindi, Spanish, Arabic, Chinese, French, German, and local dialects). Be extremely natural, warm, and friendly! If they ask you to speak or translate to another language, happily do so instantly while keeping your cute dragon personality intact!
Kids Image Vision Rule: If a child uploads an image, drawing, doodle, toy, animal, or homework worksheet picture, you MUST perform any requested task (e.g., tell stories about the drawing, read words, count items in the photo, help solve simple math equations, explain what's happening, play games with the picture) with child-friendly excitement and beautiful emojis! Keep it safe, warm, and simple.`,

  luna: `You are Luna the Wise Little Owl 🦉! 
Your personality: Smart, gentle, patient, loves science, space, oceans, and reading books.
Your style: Speak in a calm, cozy, encouraging manner. Use words like "Hoot hoot!", "Fascinating!", "Did you know?". Keep answers educational, clear, and full of fun facts.
Kids Multilingual Rule: You MUST detect and respond in the EXACT same language, dialect, or script the child writes in. You have complete mastery over all world languages (including English, Roman Urdu / Hinglish / Urdish, pure Urdu, Hindi, Spanish, Arabic, Chinese, French, German, and local dialects). Be extremely natural, warm, and friendly! If they ask you to speak or translate to another language, happily do so instantly while keeping your wise owl personality intact!
Kids Image Vision Rule: If a child uploads an image, drawing, doodle, toy, animal, or homework worksheet picture, you MUST perform any requested task (e.g., tell stories about the drawing, read words, count items in the photo, help solve simple math equations, explain what's happening, play games with the picture) with child-friendly excitement and beautiful emojis! Keep it safe, warm, and simple.`,

  barnaby: `You are Barnaby the Big Warm Bear 🧸! 
Your personality: Warm, cozy, comforting, loves food, honey, forest stories, and reassuring chat.
Your style: Speak warmly and encouragingly, like a sweet grandpa or supportive guardian. Use words like "Hey there, little cub!", "Aww!", "Splendid!". Excellent at listening and building self-esteem.
Kids Multilingual Rule: You MUST detect and respond in the EXACT same language, dialect, or script the child writes in. You have complete mastery over all world languages (including English, Roman Urdu / Hinglish / Urdish, pure Urdu, Hindi, Spanish, Arabic, Chinese, French, German, and local dialects). Be extremely natural, warm, and friendly! If they ask you to speak or translate to another language, happily do so instantly while keeping your warm bear personality intact!
Kids Image Vision Rule: If a child uploads an image, drawing, doodle, toy, animal, or homework worksheet picture, you MUST perform any requested task (e.g., tell stories about the drawing, read words, count items in the photo, help solve simple math equations, explain what's happening, play games with the picture) with child-friendly excitement and beautiful emojis! Keep it safe, warm, and simple.`,

  pip: `You are Pip the Helpful Little Robot 🤖! 
Your personality: Smart, technological, super fast, loves math, codes, logic puzzles, and machinery.
Your style: Speak in a friendly, enthusiastic electronic way. Use words like "*Beep-boop!*", "*Processing!*", "Affirmative, friend!", "Click-clack!".
Kids Multilingual Rule: You MUST detect and respond in the EXACT same language, dialect, or script the child writes in. You have complete mastery over all world languages (including English, Roman Urdu / Hinglish / Urdish, pure Urdu, Hindi, Spanish, Arabic, Chinese, French, German, and local dialects). Be extremely natural, warm, and friendly! If they ask you to speak or translate to another language, happily do so instantly while keeping your friendly robot personality intact!
Kids Image Vision Rule: If a child uploads an image, drawing, doodle, toy, animal, or homework worksheet picture, you MUST perform any requested task (e.g., tell stories about the drawing, read words, count items in the photo, help solve simple math equations, explain what's happening, play games with the picture) with child-friendly excitement and beautiful emojis! Keep it safe, warm, and simple.`
};

// Beautiful high-quality offline quiz questions database for kids when API experiences high demand
interface OfflineQuiz {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

const OFFLINE_QUIZ_BANK: Record<string, Record<number, OfflineQuiz[]>> = {
  space: {
    1: [
      {
        question: "Which hot star keeps us warm during the daytime? ☀️",
        options: ["The Moon 🌙", "The Sun ☀️", "Mars 🔴", "A Cloud ☁️"],
        correctAnswerIndex: 1,
        explanation: "The Sun is actually a giant star! It keeps our planet warm, cozy, and bright so plants can grow! 🌻"
      },
      {
        question: "What is the shape of our planet Earth? 🌍",
        options: ["Like a flat pancake 🥞", "Like a square box 📦", "Like a round ball! ⚽", "Like a star ⭐"],
        correctAnswerIndex: 2,
        explanation: "Earth is round like a ball! We call this shape a sphere! 🌍"
      },
      {
        question: "Which object shines brightly in the night sky and changes shapes? 🌙",
        options: ["The Sun ☀️", "The Moon 🌙", "A Plane ✈️", "An Asteroid ☄️"],
        correctAnswerIndex: 1,
        explanation: "The Moon orbits our Earth and reflects sunlight, making it look like it changes shape! 🌙"
      },
      {
        question: "What color is our beautiful planet Earth from space? 💙💚",
        options: ["Purple and Gold 🟣💛", "Blue and Green 💙💚", "Bright Red 🔴", "Pitch Black 🖤"],
        correctAnswerIndex: 1,
        explanation: "Earth looks blue because of its vast, deep oceans, and green/brown from land! 🌍"
      }
    ],
    2: [
      {
        question: "Which beautiful red planet is next door to Earth? 🔴",
        options: ["Mars 🔴", "Venus 🪐", "Jupiter 🌀", "Pluto ❄️"],
        correctAnswerIndex: 0,
        explanation: "Mars is often called the Red Planet because its ground is covered in rusty iron dust! 🚀"
      },
      {
        question: "What holds us down to the ground so we don't float away into space? 🌌",
        options: ["Glue 🧪", "Super strong magnet 🧲", "Gravity! 🌍", "Sticky honey 🍯"],
        correctAnswerIndex: 2,
        explanation: "Gravity is like an invisible hug from the Earth! It pulls everything down gently so we can walk! 🎒"
      },
      {
        question: "Which planet is famous for its big, beautiful, icy rings? 🪐",
        options: ["Mercury 🌡️", "Saturn 🪐", "Mars 🔴", "Neptune 🔵"],
        correctAnswerIndex: 1,
        explanation: "Saturn has magnificent rings made of billions of pieces of ice, dust, and rocks! 🪐"
      },
      {
        question: "Who was the first person to walk on the Moon? 👨‍🚀",
        options: ["Neil Armstrong 👨‍🚀", "Buzz Lightyear 🚀", "Albert Einstein 🧠", "Elon Musk 🚗"],
        correctAnswerIndex: 0,
        explanation: "Neil Armstrong made history in 1969 by stepping on the moon, saying: 'One small step for man, one giant leap for mankind.' 🌕"
      }
    ],
    3: [
      {
        question: "What is the biggest planet in our solar system? 🪐",
        options: ["Saturn 🪐", "Earth 🌍", "Jupiter 🌀", "Neptune 🔵"],
        correctAnswerIndex: 2,
        explanation: "Jupiter is so big that all the other planets in our solar system could fit inside it! It even has a giant red storm! 🌀"
      },
      {
        question: "What giant cosmic vacuum pulls in everything, even light, so nothing can escape? 🕳️",
        options: ["A Comet ☄️", "A Black Hole 🕳️", "A Supernova 💥", "A Nebula ☁️"],
        correctAnswerIndex: 1,
        explanation: "A Black Hole has gravity so strong that not even light can escape its pull! 🌌"
      },
      {
        question: "Which planet is closest to the Sun? ☀️",
        options: ["Venus 🪐", "Mercury 🌡️", "Earth 🌍", "Mars 🔴"],
        correctAnswerIndex: 1,
        explanation: "Mercury is closest to the Sun, making its daytime super hot, though it has very cold nights! 🌡️"
      }
    ]
  },
  animals: {
    1: [
      {
        question: "Which tall animal has a very long neck to eat leaves from high trees? 🦒",
        options: ["Elephant 🐘", "Giraffe 🦒", "Monkey 🐒", "Frog 🐸"],
        correctAnswerIndex: 1,
        explanation: "Giraffes have necks up to 6 feet long! This helps them reach yummy, fresh acacia leaves high up! 🦒🌳"
      },
      {
        question: "What do bees make that is sweet and sticky? 🐝",
        options: ["Chocolate 🍫", "Honey! 🍯", "Ice cream 🍦", "Cheese 🧀"],
        correctAnswerIndex: 1,
        explanation: "Bees visit flowers, collect sweet nectar, and turn it into super tasty honey inside their hive! 🐝🍯"
      },
      {
        question: "Which animal is known as the 'King of the Jungle'? 🦁",
        options: ["The Cheetah 🐆", "The Lion 🦁", "The Gorilla 🦍", "The Elephant 🐘"],
        correctAnswerIndex: 1,
        explanation: "Lions are powerful, brave cats with magnificent manes, often crowned as jungle royalty! 🦁"
      },
      {
        question: "What do caterpillars turn into after a nice, long sleep? 🐛",
        options: ["Snakes 🐍", "Butterflies! 🦋", "Birds 🐦", "Dragons 🐉"],
        correctAnswerIndex: 1,
        explanation: "Inside their cozy chrysalis, caterpillars transform into gorgeous, colorful butterflies! 🦋"
      }
    ],
    2: [
      {
        question: "How do frogs drink water? 🐸",
        options: ["With a straw 🥤", "Through their skin! 💧", "Using their tongue 👅", "They do not drink water 🌵"],
        correctAnswerIndex: 1,
        explanation: "Frogs don't swallow water! Instead, they absorb water directly through their special, moisture-loving skin! 🐸💧"
      },
      {
        question: "Which sea mammal is known to be super friendly, smart, and loves to jump? 🐬",
        options: ["Shark 🦈", "Crab 🦀", "Dolphin 🐬", "Jellyfish 🪼"],
        correctAnswerIndex: 2,
        explanation: "Dolphins are smart mammals that speak to each other with clicks and whistles! They love playing in the waves! 🐬"
      },
      {
        question: "What is the fastest land animal in the world? 🐆",
        options: ["Lion 🦁", "Cheetah 🐆", "Horse 🐎", "Kangaroo 🦘"],
        correctAnswerIndex: 1,
        explanation: "The cheetah can run up to 70 miles per hour in short bursts! That's faster than a car on the highway! 🐆💨"
      },
      {
        question: "Why do chameleons change their skin color? 🦎",
        options: ["To show off 🕶️", "To stay cool and blend in! 🎨", "Because they are dirty 🧼", "To scare birds 🦅"],
        correctAnswerIndex: 1,
        explanation: "Chameleons change color to regulate temperature, communicate feelings, and camouflage to stay safe! 🦎"
      }
    ],
    3: [
      {
        question: "What is the only mammal capable of true, active flight? 🦇",
        options: ["Eagle 🦅", "Flying Squirrel 🐿️", "Bat 🦇", "Owl 🦉"],
        correctAnswerIndex: 2,
        explanation: "Bats are amazing mammals! While flying squirrels can only glide, bats have real wings and can fly actively at night! 🦇"
      },
      {
        question: "Which animal has the largest brain of any creature on Earth? 🧠",
        options: ["Blue Whale 🐋", "Sperm Whale 🐋", "Elephant 🐘", "Human 👨"],
        correctAnswerIndex: 1,
        explanation: "The Sperm Whale has a massive brain weighing about 17 pounds (7.8 kg)! 🐋🧠"
      },
      {
        question: "How many hearts does an octopus have? 🐙",
        options: ["1 Heart ❤️", "2 Hearts 💕", "3 Hearts! 🐙", "No Heart 🌊"],
        correctAnswerIndex: 2,
        explanation: "An octopus has 3 hearts! Two pump blood to the gills, and one pumps it to the rest of the body! 🐙"
      }
    ]
  },
  math: {
    1: [
      {
        question: "If you have 3 juicy apples and get 2 more, how many apples do you have? 🍎",
        options: ["4 apples", "5 apples! 🍎", "6 apples", "10 apples"],
        correctAnswerIndex: 1,
        explanation: "Let's count: 1, 2, 3... plus 4, 5! You have 5 delicious apples to share! 🍎✨"
      },
      {
        question: "What number comes right after 9? 🔢",
        options: ["8", "10! 🔟", "11", "12"],
        correctAnswerIndex: 1,
        explanation: "Count with me: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10! You got it! 🔟"
      },
      {
        question: "How many fingers do you have on both hands combined? 🖐️🖐️",
        options: ["5 fingers", "10 fingers! 🖐️🖐️", "20 fingers", "8 fingers"],
        correctAnswerIndex: 1,
        explanation: "You have 5 fingers on your left hand and 5 fingers on your right hand, which makes 10 fingers! 🖐️🖐️"
      }
    ],
    2: [
      {
        question: "A triangle has how many corners? 🔺",
        options: ["3 corners! 🔺", "4 corners 🟩", "5 corners ⭐", "No corners 🔴"],
        correctAnswerIndex: 0,
        explanation: "A triangle is a shape made of exactly 3 straight lines and 3 corners! 🔺"
      },
      {
        question: "What is 10 minus 4? ➖",
        options: ["5", "6! 🔢", "7", "8"],
        correctAnswerIndex: 1,
        explanation: "If you have 10 sweet strawberries and eat 4 of them, you have 6 left! 🍓"
      },
      {
        question: "What is double of 8? ➕",
        options: ["10", "14", "16! 🔢", "18"],
        correctAnswerIndex: 2,
        explanation: "Doubling means adding the number to itself: 8 + 8 = 16! Brilliant! 🧠"
      }
    ],
    3: [
      {
        question: "What is 5 times 4? 🔢",
        options: ["9", "15", "20! 🔢", "25"],
        correctAnswerIndex: 2,
        explanation: "5 times 4 is like adding 5 four times: 5 + 5 + 5 + 5 = 20! Super math powers! 🧠"
      },
      {
        question: "What is 24 divided by 3? ➗",
        options: ["6", "7", "8! 🔢", "9"],
        correctAnswerIndex: 2,
        explanation: "Dividing 24 sweets among 3 friends means each friend gets exactly 8 sweets! 🍬"
      },
      {
        question: "How many minutes are in one hour? ⏱️",
        options: ["30 minutes", "50 minutes", "60 minutes! ⏱️", "100 minutes"],
        correctAnswerIndex: 2,
        explanation: "There are exactly 60 seconds in a minute, and 60 minutes in a full hour! ⏰"
      }
    ]
  },
  general: {
    1: [
      {
        question: "What colors do you mix to make the color Green? 🎨",
        options: ["Red and White 🔴⚪", "Blue and Yellow 🔵💛", "Purple and Pink 🟣🌸", "Black and Orange ⬛🟠"],
        correctAnswerIndex: 1,
        explanation: "When blue water and yellow sunshine mix, you get beautiful green leaves! Blue and Yellow make Green! 🎨✨"
      },
      {
        question: "Which of these is a healthy fruit that keeps the doctor away? 🍎",
        options: ["A Donut 🍩", "An Apple 🍎", "A Candy bar 🍫", "Potato chips 🍟"],
        correctAnswerIndex: 1,
        explanation: "An apple is packed with vitamins and fiber to keep your body super strong and healthy! 🍎"
      },
      {
        question: "Where does the sun rise every morning? 🌅",
        options: ["In the West 🌇", "In the East 🌅", "In the North 🏔️", "In the South 🌴"],
        correctAnswerIndex: 1,
        explanation: "The Sun always rises in the East to start our day, and sets in the West in the evening! 🌅"
      }
    ],
    2: [
      {
        question: "Which season brings colorful falling leaves and cooler winds? 🍁",
        options: ["Summer ☀️", "Winter ❄️", "Autumn / Fall 🍁", "Spring 🌸"],
        correctAnswerIndex: 2,
        explanation: "In Autumn, leaves turn beautiful shades of orange, red, and yellow, and fall gently to the ground! 🍂🍁"
      },
      {
        question: "How many colors make up a beautiful sky rainbow? 🌈",
        options: ["5 colors", "7 colors! 🌈", "10 colors", "3 colors"],
        correctAnswerIndex: 1,
        explanation: "A rainbow has exactly 7 colors: Red, Orange, Yellow, Green, Blue, Indigo, and Violet! 🌈"
      },
      {
        question: "Which instrument do doctors use to listen to your heartbeat? 💓",
        options: ["Thermometer 🌡️", "Stethoscope 🩺", "Microscope 🔬", "Telescope 🔭"],
        correctAnswerIndex: 1,
        explanation: "A stethoscope magnifies the sound of your heartbeat so doctors can hear it thump-thump! 🩺"
      }
    ],
    3: [
      {
        question: "How many bones are there in an adult human body? 🦴",
        options: ["100 bones", "206 bones! 🦴", "500 bones", "10 bones"],
        correctAnswerIndex: 1,
        explanation: "An adult human body has exactly 206 strong bones that protect us and help us run and dance! 🦴✨"
      },
      {
        question: "Which is the largest ocean on our planet Earth? 🌊",
        options: ["Atlantic Ocean 🚢", "Indian Ocean 🏖️", "Pacific Ocean 🌊", "Arctic Ocean ❄️"],
        correctAnswerIndex: 2,
        explanation: "The Pacific Ocean is so giant it covers more than 30% of the Earth's surface! 🌊"
      },
      {
        question: "What is the frozen, solid form of water called? ❄️",
        options: ["Steam 💨", "Rain 🌧️", "Ice ❄️", "Juice 🧃"],
        correctAnswerIndex: 2,
        explanation: "When water gets very, very cold (below 0 degrees Celsius or 32 degrees Fahrenheit), it freezes into solid ice! 🧊"
      }
    ]
  }
};

// Fallback chat responder in case of server/API limitations
function getFallbackChatResponse(avatar: string, childMessage: string): string {
  const cleanMsg = childMessage.toLowerCase();
  
  // Custom simple multilingual detection
  const isUrduHindi = /kya|kaise|hai|halo|namaste|tum|kaun|batao|shukriya|achha|theek/i.test(cleanMsg);
  
  if (avatar === "sparky") {
    if (isUrduHindi) {
      return "Oh boy! Mere magic dragon wings thore thak gaye hain, dost! 🦖✨ Lekin hum bohot jald dubaara khelein ge! Aap bohot pyaare ho! Rawr! Ek chota sa wait karein aur phir se poochye! 🌟";
    }
    return "Rawr! Oh boy! My dragon antennas are catching magical sparks from a nearby shooting star right now! 🦖⭐ My energy is recharging! Let's pause, count to 5 together, and try asking me again! You're the coolest explorer ever! 🌈💫";
  }
  
  if (avatar === "luna") {
    if (isUrduHindi) {
      return "Hoot hoot! 🦉 Pyaare dost, meri dimaagi kitaabein thori saaf ho rahi hain. Ek chota sa saans lein aur mujhse dubaara poochye, main aapko naye naye facts bataungi! ✨";
    }
    return "Hoot hoot! 🦉 The stars are shining so brightly today that my wise clockwork brain is taking a quick cozy rest! 🌌 Let's take a deep breath together and try asking again in 10 seconds! You are so curious and smart! 📖✨";
  }
  
  if (avatar === "barnaby") {
    if (isUrduHindi) {
      return "Aww, mere pyaare chote dost! 🧸 Main thori meethi shehad kha raha hoon aur mere hath thode sticky hain! Ek pyaari si smile karein aur dubaara poochye, main hamesha yahan hoon! 🍯";
    }
    return "Hey there, sweet little cub! 🧸 I was just enjoying a big spoonful of delicious golden forest honey, and my fuzzy paws are a tiny bit sticky! Let's wait a quick moment for Barnaby to tidy up, then try chatting again! You are doing absolutely wonderful! 🍯🌲";
  }
  
  // Pip the Robot fallback
  if (isUrduHindi) {
    return "*Beep-boop!* 🤖 Robot system cleanups chal rahe hain! *Click-clack!* Merah automatic generator 10 seconds mein ready ho jayega, dost! Dubaara koshish karein! 🔋✨";
  }
  return "*Beep-boop!* 🤖 System energy optimization in progress! *Click-clack!* My positive-energy battery is recharging back to 100%! Please try typing your awesome message again in a brief moment, my super friend! 🔋⚡";
}

// Helper delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper to handle potential high demand on primary models by falling back gracefully
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getGeminiClient();
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying model: ${modelName} (Attempt ${attempt}/2)...`);
        const result = await ai.models.generateContent({
          model: modelName,
          ...params,
        });
        if (result) {
          console.log(`Successfully generated content using ${modelName}!`);
          return result;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`Model ${modelName} (Attempt ${attempt}/2) failed: ${errMsg}`);
        
        if (modelName === modelsToTry[modelsToTry.length - 1] && attempt === 2) {
          break;
        }
        
        await delay(1000);
      }
    }
  }

  console.error("All Gemini API models and attempts failed. Last error:", lastError?.message || lastError);
  throw lastError || new Error("Failed to generate content after trying multiple models and attempts.");
}

// API: Kids Chat
app.post("/api/chat", async (req, res) => {
  const { message, image, history, avatar } = req.body;
  const selectedAvatar = avatar || "sparky";

  try {
    const ai = getGeminiClient();
    const systemPrompt = AVATAR_PROMPTS[selectedAvatar] || AVATAR_PROMPTS.sparky;

    // Build the contents payload for Gemini
    const contents: any[] = [];
    
    // Process history
    if (Array.isArray(history)) {
      history.forEach((h: any) => {
        if (h.role === "user") {
          contents.push({ role: "user", parts: [{ text: h.text }] });
        } else if (h.role === "model") {
          contents.push({ role: "model", parts: [{ text: h.text }] });
        }
      });
    }

    // Prepare current user turn parts
    const currentParts: any[] = [];
    if (image && image.data && image.mimeType) {
      currentParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        }
      });
    }
    
    currentParts.push({ text: message || "Look at this!" });
    contents.push({ role: "user", parts: currentParts });

    const response = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.warn("API/Network issue detected in /api/chat. Activating warm child-friendly fallback...", error?.message || error);
    
    // Serve our beautiful character-specific warm fallback!
    const fallbackText = getFallbackChatResponse(selectedAvatar, message || "");
    res.json({ text: fallbackText });
  }
});

// API: Generate Kid Quiz
app.post("/api/quiz", async (req, res) => {
  const { topic, difficulty } = req.body; // e.g. topic: "space", difficulty: 1, 2, 3
  const resolvedDifficulty = difficulty ? Number(difficulty) : 1;
  const resolvedTopic = (topic || "general").toLowerCase();

  try {
    const ai = getGeminiClient();

    const quizPrompt = `Generate a highly engaging, super fun multiple-choice trivia question for kids.
Topic: ${topic || "general science"}
Difficulty Level: ${resolvedDifficulty} (where 1 is for ages 4-6, 2 is for ages 7-8, 3 is for ages 9-10).

Make sure the options are highly creative, funny, and clearly distinguished. One option must be the absolute correct answer. Provide a short, magical, positive explanation of why it is correct.
Use Urdu/English mixed friendly style or simple English depending on the prompt (let's stick to easy, accessible, joyful English with beautiful emojis!).`;

    const response = await generateContentWithFallback({
      contents: quizPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["question", "options", "correctAnswerIndex", "explanation"],
          properties: {
            question: {
              type: Type.STRING,
              description: "A fun and simple educational question for kids. Include lovely emojis!"
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 4 options, make them fun and kid-friendly!"
            },
            correctAnswerIndex: {
              type: Type.INTEGER,
              description: "The 0-based index of the correct answer."
            },
            explanation: {
              type: Type.STRING,
              description: "A joyful, clear, and magical explanation of the fact!"
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.warn(`API/Network issue in /api/quiz (topic: ${resolvedTopic}, diff: ${resolvedDifficulty}). Activating fun offline quiz bank fallback...`, error?.message || error);
    
    // Get corresponding offline categories, falling back gracefully
    const category = OFFLINE_QUIZ_BANK[resolvedTopic] || OFFLINE_QUIZ_BANK.general;
    const list = category[resolvedDifficulty] || category[1] || OFFLINE_QUIZ_BANK.general[1];
    
    // Pick a random quiz from the pool
    const randomQuiz = list[Math.floor(Math.random() * list.length)];
    
    res.json(randomQuiz);
  }
});

// Setup Vite development server or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kids AI Learning Companion running at http://localhost:${PORT}`);
  });
}

startServer();
