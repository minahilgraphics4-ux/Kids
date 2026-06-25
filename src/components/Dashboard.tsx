import React from "react";
import { KidProfile, Badge } from "../types";
import { BADGES } from "../constants";
import { motion } from "motion/react";
import { playSynthSound } from "../constants";

interface DashboardProps {
  profile: KidProfile;
  onReset: () => void;
}

export default function Dashboard({ profile, onReset }: DashboardProps) {
  const [copied, setCopied] = React.useState(false);

  // Safe calculation of progress to next level
  // e.g. level 1 is 0-99 XP, level 2 is 100-199 XP, etc.
  const currentLevelXp = profile.xp % 100;
  const xpPercentage = Math.min(100, Math.max(0, currentLevelXp));

  const handleCopyCode = () => {
    playSynthSound("success");
    navigator.clipboard.writeText(profile.magicCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryLabels: Record<string, { label: string; emoji: string; color: string }> = {
    science: { label: "Science & Space", emoji: "🪐", color: "bg-indigo-400" },
    animals: { label: "Animals & Nature", emoji: "🦁", color: "bg-green-400" },
    creativity: { label: "Art & Creativity", emoji: "🎨", color: "bg-pink-400" },
    math: { label: "Math & Logic", emoji: "🔢", color: "bg-sky-400" },
    general: { label: "General Knowledge", emoji: "🌟", color: "bg-amber-400" }
  };

  return (
    <div id="learning-dashboard-panel" className="space-y-8 pb-8">
      {/* Level and XP Header Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="kids-card bg-gradient-to-br from-yellow-100 to-amber-200 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-amber-400 flex items-center justify-center text-5xl shadow-md animate-bounce">
            {profile.avatarId === "sparky" ? "🦖" : profile.avatarId === "luna" ? "🦉" : profile.avatarId === "barnaby" ? "🧸" : "🤖"}
          </div>
          <span className="absolute -bottom-2 -right-2 bg-pink-500 text-white font-bold border-2 border-black rounded-full w-10 h-10 flex items-center justify-center shadow">
            Lv{profile.level}
          </span>
        </div>

        <div className="flex-1 text-center md:text-left space-y-3 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-3xl font-bold text-amber-950">
                Hi, {profile.name || "Explorer"}! 🎉
              </h2>
              <p className="text-amber-900 font-medium">Keep up the brilliant learning work!</p>
            </div>
            
            {/* Streak & Star Counter */}
            <div className="flex justify-center md:justify-end gap-3">
              <div className="bg-orange-500 text-white font-bold px-4 py-2 rounded-full border-2 border-black flex items-center gap-2 shadow-sm">
                <span>🔥</span> {profile.streak} Day Streak!
              </div>
              <div className="bg-yellow-400 text-amber-950 font-bold px-4 py-2 rounded-full border-2 border-black flex items-center gap-2 shadow-sm">
                <span>⭐</span> {profile.points} Stars
              </div>
            </div>
          </div>

          {/* Playful XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-amber-900 px-1">
              <span>Level Progress</span>
              <span>{currentLevelXp} / 100 XP</span>
            </div>
            <div className="w-full bg-white/60 h-8 rounded-full border-3 border-black overflow-hidden p-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-end pr-2"
              >
                {xpPercentage > 15 && (
                  <span className="text-[10px] font-bold text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,0.6)]">
                    🚀 {currentLevelXp} XP
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Whimsical Magic Code Reminder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="kids-bubble bg-purple-50 border-purple-400 p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="text-3xl animate-pulse">🗝️</span>
          <div>
            <h4 className="font-extrabold text-purple-900 text-sm">
              Your Secret Magic Code: <span className="font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-300 font-bold select-all uppercase">{profile.magicCode}</span>
            </h4>
            <p className="text-xs text-purple-700 font-medium">
              Save this code! You can type this code to resume your levels, stars, and chats on any other phone, laptop, or tablet!
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyCode}
          className={`kids-btn text-xs font-extrabold px-4 py-2 rounded-xl transition-all whitespace-nowrap min-w-[120px] ${
            copied ? "bg-green-500 text-white border-green-700" : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {copied ? "Copied! 🌟" : "📋 Copy Code"}
        </button>
      </motion.div>

      {/* Learning Progress / Question Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="kids-card bg-white p-6"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📊 Your Brain Power Matrix
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            See which topics you are exploring the most! Ask your AI Buddy more questions to grow your scores!
          </p>

          <div className="space-y-4">
            {Object.entries(categoryLabels).map(([key, info]) => {
              const count = profile.categoryCounts[key] || 0;
              // Normalize counts to a fun visual scale (cap at 10 for bar progress representation, but allow actual score to grow)
              const visualWidth = Math.min(100, Math.max(8, count * 15));
              
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{info.emoji}</span> {info.label}
                    </span>
                    <span className="bg-gray-100 border-2 border-gray-300 px-2.5 py-0.5 rounded-full text-xs">
                      {count} Questions
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-6 rounded-full border-2 border-black overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${visualWidth}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${info.color} rounded-full border-r border-black`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quest & Activity Stats Card */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="kids-card bg-sky-50 p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-2xl font-bold text-sky-900 mb-2 flex items-center gap-2">
              🎯 Super Learning Quests
            </h3>
            <p className="text-sm text-sky-700 mb-4 font-medium">
              Complete these quests to earn massive Star points and XP!
            </p>
            
            <div className="space-y-3">
              {/* Quest 1 */}
              <div className="kids-bubble bg-white p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center border-2 border-black">💬</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Ask your AI Buddy</h4>
                    <p className="text-xs text-gray-500">Ask any questions to gain wisdom</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-pink-600 block">+20 XP</span>
                  <span className="text-[10px] font-bold text-amber-600">⭐ +10 Stars</span>
                </div>
              </div>

              {/* Quest 2 */}
              <div className="kids-bubble bg-white p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center border-2 border-black">📸</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Send a Cool Picture</h4>
                    <p className="text-xs text-gray-500">Upload a picture of toys, nature, or sketches</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-pink-600 block">+30 XP</span>
                  <span className="text-[10px] font-bold text-amber-600">⭐ +15 Stars</span>
                </div>
              </div>

              {/* Quest 3 */}
              <div className="kids-bubble bg-white p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center border-2 border-black">🧠</div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Mini Quiz Challenge</h4>
                    <p className="text-xs text-gray-500">Answer correct answers in Quiz mode!</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-pink-600 block">+50 XP</span>
                  <span className="text-[10px] font-bold text-amber-600">⭐ +25 Stars</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-dashed border-sky-200 mt-4 flex items-center justify-between gap-4">
            <div className="text-xs text-sky-800 font-bold">
              📚 Lifetime Questions: {profile.questionsAsked} <br />
              🧠 Quizzes Answered: {profile.quizzesCompleted}
            </div>
            <button
              onClick={() => {
                playSynthSound("click");
                if (window.confirm("Are you sure you want to reset your learning progress? You will lose your stars and badges!")) {
                  onReset();
                }
              }}
              className="text-xs text-red-500 hover:text-red-700 underline font-bold"
            >
              Reset My Scores
            </button>
          </div>
        </motion.div>
      </div>

      {/* Badges Locker Display */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="kids-card bg-pink-50 p-6"
      >
        <h3 className="text-2xl font-bold text-pink-900 mb-2 flex items-center gap-2">
          🏆 Your Shiny Badges Locker ({profile.badges.length} / {BADGES.length})
        </h3>
        <p className="text-sm text-pink-700 mb-6 font-medium">
          Unlock gorgeous badges by asking questions and solving mini quizzes! Can you collect them all?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {BADGES.map((badge) => {
            const isUnlocked = profile.badges.includes(badge.id);
            
            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
                className={`kids-bubble p-4 text-center flex flex-col items-center justify-between min-h-[160px] ${
                  isUnlocked 
                    ? `${badge.color} transform rotate-1` 
                    : "bg-gray-100 border-gray-300 text-gray-400 opacity-60"
                }`}
              >
                <div className="text-4xl mb-2 filter drop-shadow">
                  {isUnlocked ? badge.icon : "🔒"}
                </div>
                
                <div>
                  <h4 className="font-bold text-sm leading-tight">
                    {badge.title}
                  </h4>
                  <p className="text-[10px] mt-1 text-gray-500 font-medium">
                    {badge.description}
                  </p>
                </div>

                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border mt-2 ${
                  isUnlocked 
                    ? "bg-white/80 border-current" 
                    : "bg-gray-200 text-gray-500 border-gray-300"
                }`}>
                  {badge.requirementText}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
