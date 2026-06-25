import React, { useState, useEffect } from "react";
import { KidProfile, Message, AvatarId, BuddyInfo } from "./types";
import { BUDDIES, BADGES, playSynthSound } from "./constants";
import ChatRoom from "./components/ChatRoom";
import QuizTime from "./components/QuizTime";
import Dashboard from "./components/Dashboard";
import { motion, AnimatePresence } from "motion/react";
import { 
  generateMagicCode, 
  saveProfileToCloudAndLocal, 
  fetchProfileByMagicCode, 
  saveChatHistory, 
  fetchChatHistory 
} from "./lib/db";

const PROFILE_LOCAL_STORAGE_KEY = "kids_ai_profile_data_v1";
const CHAT_LOCAL_STORAGE_KEY_PREFIX = "kids_ai_chat_history_";

export default function App() {
  const [profile, setProfile] = useState<KidProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "quiz" | "dashboard">("chat");
  const [activeBuddyId, setActiveBuddyId] = useState<AvatarId>("sparky");
  
  // Chat Room state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Level up celebration overlay trigger
  const [showLevelUpAlert, setShowLevelUpAlert] = useState<number | null>(null);

  // Onboarding registration form inputs
  const [onboardName, setOnboardName] = useState("");
  const [onboardBuddy, setOnboardBuddy] = useState<AvatarId>("sparky");

  // Magic Code retrieval inputs
  const [magicCodeInput, setMagicCodeInput] = useState("");
  const [retrievingProfile, setRetrievingProfile] = useState(false);
  const [retrieveError, setRetrieveError] = useState("");

  // 1. Initial Profile Load & Streak Calculation
  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: KidProfile = JSON.parse(stored);
        
        // Calculate Streak
        const todayStr = new Date().toISOString().split("T")[0];
        const lastDate = parsed.lastLearnedDate;
        
        let updatedStreak = parsed.streak;
        if (lastDate && lastDate !== todayStr) {
          const lastDateObj = new Date(lastDate);
          const todayObj = new Date(todayStr);
          const diffTime = Math.abs(todayObj.getTime() - lastDateObj.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            updatedStreak += 1; // Continued streak!
          } else if (diffDays > 1) {
            updatedStreak = 1; // Streak reset
          }
        }
        
        const updatedProfile: KidProfile = {
          ...parsed,
          magicCode: parsed.magicCode || generateMagicCode(), // Retro-compatibility
          streak: updatedStreak || 1,
          lastLearnedDate: todayStr
        };
        
        setProfile(updatedProfile);
        setActiveBuddyId(updatedProfile.avatarId);
        saveProfileToCloudAndLocal(updatedProfile);
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    }
  }, []);

  // 2. Load Chat History when companion is changed
  useEffect(() => {
    if (!profile) return;
    
    const loadHistory = async () => {
      const history = await fetchChatHistory(activeBuddyId, profile.magicCode);
      if (history && history.length > 0) {
        setChatMessages(history);
      } else {
        setChatMessages(getInitialWelcomeMessage(activeBuddyId));
      }
    };

    loadHistory();
  }, [activeBuddyId, profile?.magicCode]);

  const getInitialWelcomeMessage = (buddyId: AvatarId): Message[] => {
    const buddy = BUDDIES.find((b) => b.id === buddyId) || BUDDIES[0];
    return [
      {
        id: "welcome-default",
        role: "model",
        text: buddy.welcomeMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  };

  const activeBuddy = BUDDIES.find((b) => b.id === activeBuddyId) || BUDDIES[0];

  // 3. Complete Kid Registration Form
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim()) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const newProfile: KidProfile = {
      name: onboardName.trim(),
      magicCode: generateMagicCode(),
      avatarId: onboardBuddy,
      xp: 0,
      level: 1,
      points: 50, // Starting bonus
      streak: 1,
      lastLearnedDate: todayStr,
      questionsAsked: 0,
      quizzesCompleted: 0,
      badges: [],
      categoryCounts: {
        science: 0,
        animals: 0,
        creativity: 0,
        math: 0,
        general: 0
      }
    };

    setProfile(newProfile);
    setActiveBuddyId(onboardBuddy);
    await saveProfileToCloudAndLocal(newProfile);
    
    // Save welcome message
    const initialWelcome = getInitialWelcomeMessage(onboardBuddy);
    setChatMessages(initialWelcome);
    await saveChatHistory(onboardBuddy, newProfile.magicCode, initialWelcome);
    
    playSynthSound("levelup");
  };

  // Handle Loading an Existing Profile
  const handleRetrieveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicCodeInput.trim()) return;

    setRetrievingProfile(true);
    setRetrieveError("");
    playSynthSound("click");

    try {
      const retrieved = await fetchProfileByMagicCode(magicCodeInput.trim());
      if (retrieved) {
        setProfile(retrieved);
        setActiveBuddyId(retrieved.avatarId);
        playSynthSound("success");
      } else {
        setRetrieveError("Oops! We couldn't find that Magic Code. Double check it and try again! 🦉✨");
        playSynthSound("fail");
      }
    } catch (err) {
      console.error(err);
      setRetrieveError("Something went wrong! Please try again in a moment.");
    } finally {
      setRetrievingProfile(false);
    }
  };

  // 4. Update Profile Progress (XP, Level, Points, Badges)
  const awardPointsAndXp = (xpGained: number, starsGained: number, currentProfile: KidProfile) => {
    const oldXp = currentProfile.xp;
    const newXp = oldXp + xpGained;
    
    // Calculate new level (100 XP per level)
    const oldLevel = currentProfile.level;
    const newLevel = Math.floor(newXp / 100) + 1;
    
    let updatedBadges = [...currentProfile.badges];

    // Trigger visual celebration if leveled up!
    if (newLevel > oldLevel) {
      setTimeout(() => {
        playSynthSound("levelup");
        setShowLevelUpAlert(newLevel);
      }, 500);

      // Level 5 milestone badge check
      if (newLevel >= 5 && !updatedBadges.includes("high_level")) {
        updatedBadges.push("high_level");
      }
    }

    const updated = {
      ...currentProfile,
      xp: newXp,
      level: newLevel,
      points: currentProfile.points + starsGained,
      badges: updatedBadges
    };

    setProfile(updated);
    saveProfileToCloudAndLocal(updated);
    return updated;
  };

  // 5. Send message to Node-express backend
  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!profile) return;

    // Construct the user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      image: imageBase64,
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setIsSending(true);

    // Track questions counts & topics categorization
    let detectedCategory = "general";
    const lowercaseText = text.toLowerCase();
    
    if (lowercaseText.includes("space") || lowercaseText.includes("star") || lowercaseText.includes("planet") || lowercaseText.includes("moon") || lowercaseText.includes("sun") || lowercaseText.includes("gravity") || lowercaseText.includes("science")) {
      detectedCategory = "science";
    } else if (lowercaseText.includes("animal") || lowercaseText.includes("lion") || lowercaseText.includes("dog") || lowercaseText.includes("cat") || lowercaseText.includes("fish") || lowercaseText.includes("bird") || lowercaseText.includes("nature") || lowercaseText.includes("forest") || lowercaseText.includes("fossil") || lowercaseText.includes("dinosaur")) {
      detectedCategory = "animals";
    } else if (lowercaseText.includes("art") || lowercaseText.includes("draw") || lowercaseText.includes("color") || lowercaseText.includes("paint") || lowercaseText.includes("picture") || lowercaseText.includes("creative")) {
      detectedCategory = "creativity";
    } else if (lowercaseText.includes("math") || lowercaseText.includes("count") || lowercaseText.includes("number") || lowercaseText.includes("riddle") || lowercaseText.includes("puzzle") || lowercaseText.includes("sum")) {
      detectedCategory = "math";
    }

    // Prepare profile updates
    const updatedCategoryCounts = { ...profile.categoryCounts };
    updatedCategoryCounts[detectedCategory] = (updatedCategoryCounts[detectedCategory] || 0) + 1;

    const totalQuestions = profile.questionsAsked + 1;
    let newBadges = [...profile.badges];

    // Badge Check: Curiosity Starter (3 questions asked)
    if (totalQuestions >= 3 && !newBadges.includes("curiosity")) {
      newBadges.push("curiosity");
    }
    // Badge Check: Photographer Investigator (uploaded image)
    if (imageBase64 && !newBadges.includes("photographer")) {
      newBadges.push("photographer");
    }
    // Badge Check: Explorer (3 animal questions)
    if (updatedCategoryCounts["animals"] >= 3 && !newBadges.includes("explorer")) {
      newBadges.push("explorer");
    }
    // Badge Check: Space Cadet (3 science questions)
    if (updatedCategoryCounts["science"] >= 3 && !newBadges.includes("science_hero")) {
      newBadges.push("science_hero");
    }

    let progressProfile = {
      ...profile,
      questionsAsked: totalQuestions,
      categoryCounts: updatedCategoryCounts,
      badges: newBadges
    };

    // Calculate XP reward (+20 XP for standard question, +30 XP if contains a beautiful uploaded image)
    const xpReward = imageBase64 ? 30 : 20;
    const starReward = imageBase64 ? 15 : 10;
    progressProfile = awardPointsAndXp(xpReward, starReward, progressProfile);

    // Call express API route
    try {
      // Create lightweight history array for the Gemini model context
      const chatHistoryForModel = chatMessages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      // Trim header prefix "data:image/jpeg;base64," if image exists
      let imagePayload = null;
      if (imageBase64) {
        const matches = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
        if (matches && matches.length === 3) {
          imagePayload = {
            mimeType: matches[1],
            data: matches[2]
          };
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image: imagePayload,
          history: chatHistoryForModel,
          avatar: activeBuddyId
        })
      });

      if (!response.ok) throw new Error("Connection failed");
      const data = await response.json();

      const modelMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...newMessages, modelMsg];
      setChatMessages(finalMessages);

      // Save to localStorage and Cloud
      await saveChatHistory(activeBuddyId, profile.magicCode, finalMessages);
    } catch (e) {
      console.error(e);
      // Fallback kid message if server offline
      const fallbackMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "model",
        text: "Oops! My antennas are feeling a bit dizzy right now. Let's try typing that again, my friend! 🦖✨",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const errorHistory = [...newMessages, fallbackMsg];
      setChatMessages(errorHistory);
      await saveChatHistory(activeBuddyId, profile.magicCode, errorHistory);
    } finally {
      setIsSending(false);
    }
  };

  // 6. Handle quiz response rewards
  const handleQuizCompleted = (isCorrect: boolean, topic: string) => {
    if (!profile) return;

    let updatedCategoryCounts = { ...profile.categoryCounts };
    // Map topics to profile matrix
    const mappedCategory = topic === "dinosaurs" || topic === "animals" ? "animals" : topic === "space" ? "science" : topic === "math" ? "math" : "general";
    updatedCategoryCounts[mappedCategory] = (updatedCategoryCounts[mappedCategory] || 0) + 1;

    let updatedBadges = [...profile.badges];
    if (isCorrect && !updatedBadges.includes("quiz_wizard")) {
      updatedBadges.push("quiz_wizard");
    }

    let progressProfile = {
      ...profile,
      quizzesCompleted: profile.quizzesCompleted + 1,
      categoryCounts: updatedCategoryCounts,
      badges: updatedBadges
    };

    // Correct rewards: +50 XP, +25 Stars. Incorrect rewards: +10 XP for trying
    const xpEarned = isCorrect ? 50 : 10;
    const starsEarned = isCorrect ? 25 : 0;

    awardPointsAndXp(xpEarned, starsEarned, progressProfile);
  };

  // Reset Progress Logic
  const handleResetProfile = () => {
    localStorage.removeItem(PROFILE_LOCAL_STORAGE_KEY);
    BUDDIES.forEach((b) => localStorage.removeItem(`${CHAT_LOCAL_STORAGE_KEY_PREFIX}${b.id}`));
    setProfile(null);
    setChatMessages([]);
    setActiveTab("chat");
  };

  return (
    <div id="kids-ai-learning-companion-app" className="min-h-screen bg-doodle text-gray-800 flex flex-col justify-between">
      
      {/* HEADER NAVIGATION BAR */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-wiggle">🎨🌈</span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-pink-600 font-display">
                Kids AI Learning Companion
              </h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                Learn, Play, Level Up! 🚀
              </p>
            </div>
          </div>

          {profile && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  playSynthSound("click");
                  setActiveTab("chat");
                }}
                className={`kids-btn px-4 py-2 rounded-full font-bold text-sm ${
                  activeTab === "chat" 
                    ? "bg-yellow-400 text-black border-black" 
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                💬 Ask Buddies
              </button>

              <button
                onClick={() => {
                  playSynthSound("click");
                  setActiveTab("quiz");
                }}
                className={`kids-btn px-4 py-2 rounded-full font-bold text-sm ${
                  activeTab === "quiz" 
                    ? "bg-sky-400 text-white border-black" 
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                🧠 Quiz Challenge
              </button>

              <button
                onClick={() => {
                  playSynthSound("click");
                  setActiveTab("dashboard");
                }}
                className={`kids-btn px-4 py-2 rounded-full font-bold text-sm ${
                  activeTab === "dashboard" 
                    ? "bg-pink-500 text-white border-black" 
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                📊 My Progress
              </button>
            </div>
          )}

        </div>
      </header>

      {/* MAIN SCREEN ROUTER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {!profile ? (
            // ONBOARDING SCREEN
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-8 my-8 text-center"
            >
              <div className="space-y-3">
                <span className="text-6xl animate-bounce block">✨🦖🦉🧸🤖✨</span>
                <h2 className="text-4xl font-extrabold text-pink-600 font-display">
                  Welcome, Little Explorer!
                </h2>
                <p className="text-gray-500 font-bold max-w-lg mx-auto">
                  Create a new character or load your saved progress to chat with AI buddies, do educational quizzes, and collect super fun badges!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch text-left">
                
                {/* Column 1: New Game / Onboarding */}
                <div className="kids-card bg-white p-6 md:p-8 flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-pink-500 mb-2 flex items-center gap-2">
                      🎒 Start New Adventure
                    </h3>
                    <p className="text-xs text-gray-500 font-bold mb-4">
                      Create a brand new character and get a free 50 Stars bonus!
                    </p>

                    <form onSubmit={handleOnboarding} className="space-y-5">
                      {/* Kid Name Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          What is your name? ✨
                        </label>
                        <input
                          type="text"
                          required
                          value={onboardName}
                          onChange={(e) => setOnboardName(e.target.value)}
                          placeholder="Enter your cute name..."
                          className="w-full kids-bubble px-4 py-3 text-base bg-yellow-50 placeholder-gray-400 font-bold focus:outline-none"
                          maxLength={15}
                        />
                      </div>

                      {/* Choose Initial Mascot Buddy */}
                      <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700">
                          Choose your favorite companion:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {BUDDIES.map((buddy) => (
                            <button
                              key={buddy.id}
                              type="button"
                              onClick={() => {
                                playSynthSound("click");
                                setOnboardBuddy(buddy.id);
                              }}
                              className={`kids-bubble p-2.5 text-left transition-all flex items-center gap-2 ${
                                onboardBuddy === buddy.id
                                  ? "bg-yellow-100 border-black font-bold scale-[1.02]"
                                  : "bg-white border-gray-200 opacity-80"
                              }`}
                            >
                              <span className="text-3xl">{buddy.emoji}</span>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-gray-800 text-xs truncate">{buddy.name}</h4>
                                <p className="text-[9px] text-gray-400 font-bold leading-tight truncate">{buddy.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 text-center">
                        <button
                          type="submit"
                          className="kids-btn bg-green-500 hover:bg-green-600 text-white font-extrabold text-base px-6 py-3 rounded-2xl w-full"
                        >
                          Start My Adventure! 🚀💫
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Column 2: Load / Retrieve Game */}
                <div className="kids-card bg-white p-6 md:p-8 flex flex-col justify-between space-y-6 border-pink-200">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-purple-600 flex items-center gap-2">
                      🔑 Resume Saved Progress
                    </h3>
                    <p className="text-xs text-gray-500 font-bold">
                      Enter your secret <strong className="text-purple-600">Magic Code</strong> (e.g. Happy-Panda-882) to load your Level, Stars, and Chat history from any computer or tablet!
                    </p>

                    <form onSubmit={handleRetrieveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          Your Secret Magic Code:
                        </label>
                        <input
                          type="text"
                          required
                          value={magicCodeInput}
                          onChange={(e) => {
                            setMagicCodeInput(e.target.value);
                            if (retrieveError) setRetrieveError("");
                          }}
                          placeholder="e.g. Magic-Koala-123"
                          className="w-full kids-bubble px-4 py-3 text-base bg-purple-50 placeholder-gray-400 font-mono font-bold focus:outline-none uppercase"
                        />
                      </div>

                      {retrieveError && (
                        <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xl text-xs font-bold text-red-600">
                          {retrieveError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={retrievingProfile || !magicCodeInput.trim()}
                        className="kids-btn bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-base px-6 py-3 rounded-2xl w-full disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {retrievingProfile ? (
                          <>
                            <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Checking Magic Clouds...
                          </>
                        ) : (
                          "Load My Saved Game! 🔑🌌"
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-300 text-center text-[11px] text-yellow-800 font-bold">
                    💡 If you are already logged in on this computer, your progress is automatically saved to your browser!
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            // ACTIVE APP CONTENT
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "chat" && (
                <ChatRoom
                  profile={profile}
                  activeBuddy={activeBuddy}
                  onSelectBuddy={setActiveBuddyId}
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                />
              )}

              {activeTab === "quiz" && (
                <QuizTime
                  profile={profile}
                  onQuizCompleted={handleQuizCompleted}
                />
              )}

              {activeTab === "dashboard" && (
                <Dashboard
                  profile={profile}
                  onReset={handleResetProfile}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER COZY MESSAGE */}
      <footer className="bg-white border-t-4 border-black py-4 px-6 text-center text-xs font-bold text-gray-500 mt-8">
        <p className="flex items-center justify-center gap-1">
          Made with love and sparkles for smart children! ✨🦖🦉🧸🤖✨
        </p>
      </footer>

      {/* LEVEL UP EXTRAVAGANT ALERT MODAL */}
      <AnimatePresence>
        {showLevelUpAlert !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              className="kids-card bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500 text-white text-center p-8 max-w-md w-full space-y-6 shadow-2xl relative"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-7xl animate-bounce">
                👑⭐
              </div>

              <div className="space-y-2 pt-4">
                <h2 className="text-4xl font-extrabold text-yellow-100 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
                  LEVEL UP! 🎉
                </h2>
                <p className="text-lg font-bold text-purple-950">
                  You reached Level {showLevelUpAlert}!
                </p>
              </div>

              <p className="font-bold text-white drop-shadow-sm leading-relaxed">
                Beep-boop, rawr, hoot! You are getting super smart! Keep asking questions and solving quiz challenges to reach the sky! 🚀💫
              </p>

              <button
                onClick={() => {
                  playSynthSound("click");
                  setShowLevelUpAlert(null);
                }}
                className="kids-btn bg-white hover:bg-gray-100 text-purple-900 font-extrabold px-8 py-3 rounded-2xl w-full text-base"
              >
                Let's Go! 💪➔
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
