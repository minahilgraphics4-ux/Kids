import React, { useState } from "react";
import { QuizQuestion, KidProfile } from "../types";
import { QUIZ_TOPICS, playSynthSound } from "../constants";
import { motion, AnimatePresence } from "motion/react";

interface QuizTimeProps {
  profile: KidProfile;
  onQuizCompleted: (isCorrect: boolean, topic: string) => void;
}

export default function QuizTime({ profile, onQuizCompleted }: QuizTimeProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [streak, setStreak] = useState(0);

  const startQuiz = async (topicId: string, isNextQuestion = false) => {
    setSelectedTopic(topicId);
    setLoading(true);
    setCurrentQuiz(null);
    setSelectedAnswer(null);
    setHasAnswered(false);
    
    if (isNextQuestion) {
      setQuestionNumber(prev => prev + 1);
    } else {
      setQuestionNumber(1);
      setStreak(0);
    }
    
    playSynthSound("click");

    try {
      // Determine kid difficulty based on their profile level
      let difficulty = 1;
      if (profile.level >= 3) difficulty = 2;
      if (profile.level >= 6) difficulty = 3;

      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicId, difficulty }),
      });

      if (!response.ok) throw new Error("Could not fetch quiz");
      const quizData: QuizQuestion = await response.json();
      setCurrentQuiz(quizData);
    } catch (e) {
      console.error(e);
      // Fallback kid question if service fails or offline
      setCurrentQuiz({
        question: "How many planets are there in our beautiful Solar System? 🪐",
        options: ["5 Planets", "8 Planets", "12 Planets", "1 Planet"],
        correctAnswerIndex: 1,
        explanation: "Correct! There are exactly 8 planets orbiting our wonderful Sun, including our green Earth!"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
    setHasAnswered(true);

    const isCorrect = index === currentQuiz?.correctAnswerIndex;
    if (isCorrect) {
      playSynthSound("success");
      setStreak(prev => prev + 1);
    } else {
      playSynthSound("fail");
      setStreak(0);
    }

    if (selectedTopic) {
      onQuizCompleted(isCorrect, selectedTopic);
    }
  };

  const goBackToTopics = () => {
    playSynthSound("click");
    setSelectedTopic(null);
    setCurrentQuiz(null);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setQuestionNumber(1);
    setStreak(0);
  };

  return (
    <div id="kids-quiz-time" className="max-w-3xl mx-auto space-y-6 pb-8">
      
      {!selectedTopic ? (
        // TOPICS SELECTION SCREEN
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="kids-card bg-gradient-to-br from-indigo-100 to-purple-200 p-6 text-center space-y-3"
          >
            <div className="text-5xl animate-bounce">🧠✨</div>
            <h2 className="text-3xl font-bold text-indigo-950">
              Quiz Challenge Adventure!
            </h2>
            <p className="text-indigo-900 max-w-lg mx-auto font-medium">
              Choose an educational topic to play with the smart AI! Answer questions correctly to earn **Stars** and **XP** to Level Up!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUIZ_TOPICS.map((topic, index) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => startQuiz(topic.id)}
                className={`kids-btn ${topic.color} p-6 rounded-3xl text-left flex items-center justify-between group min-h-[100px]`}
              >
                <div>
                  <h3 className="text-xl font-bold drop-shadow-sm group-hover:underline">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-white/90 mt-1 font-medium">
                    Test your smart brain on {topic.id}!
                  </p>
                </div>
                <span className="text-3xl transition-transform duration-150 group-hover:scale-125">
                  👉
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        // ACTIVE QUIZ SCREEN
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={goBackToTopics}
              className="kids-btn bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-xs font-bold"
            >
              ⬅ Back to Topics
            </button>
            <span className="bg-yellow-400 border-2 border-black font-bold px-3 py-1 rounded-full text-xs shadow-sm">
              ⭐ {profile.points} Stars
            </span>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              // Loading State
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="kids-card bg-white p-12 text-center space-y-4"
              >
                <div className="text-6xl animate-spin inline-block">🔮</div>
                <h3 className="text-2xl font-bold text-gray-800">
                  AI is creating a magical question...
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto font-medium">
                  We are formulating a brain puzzle especially tailored for Level {profile.level}! Hold on tight!
                </p>
              </motion.div>
            ) : currentQuiz ? (
              // Quiz Question Card
              <motion.div
                key="question-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="kids-card bg-white p-6 md:p-8 space-y-6"
              >
                {/* Category Header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 border-2 border-purple-300 font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wide">
                    Level {profile.level} Quiz Challenge
                  </span>
                  <span className="bg-blue-100 text-blue-700 border-2 border-blue-300 font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wide">
                    Question #{questionNumber}
                  </span>
                  {streak > 0 && (
                    <span className="bg-rose-100 text-rose-700 border-2 border-rose-300 font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wide animate-pulse">
                      🔥 {streak} Streak!
                    </span>
                  )}
                </div>

                {/* The Question */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
                  {currentQuiz.question}
                </h3>

                {/* Options List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {currentQuiz.options.map((option, index) => {
                    let btnStyle = "bg-amber-50 hover:bg-amber-100 text-gray-800 border-gray-300";
                    
                    if (hasAnswered) {
                      const isCorrectAnswer = index === currentQuiz.correctAnswerIndex;
                      const isSelectedAnswer = index === selectedAnswer;

                      if (isCorrectAnswer) {
                        btnStyle = "bg-green-100 text-green-900 border-green-500 scale-[1.01] font-bold";
                      } else if (isSelectedAnswer) {
                        btnStyle = "bg-red-100 text-red-950 border-red-500 opacity-80";
                      } else {
                        btnStyle = "bg-gray-50 text-gray-400 border-gray-200 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(index)}
                        disabled={hasAnswered}
                        className={`kids-btn p-4 rounded-2xl text-left transition-all duration-150 flex items-center justify-between text-base md:text-lg ${btnStyle}`}
                      >
                        <span className="flex-1 font-bold">{option}</span>
                        {hasAnswered && index === currentQuiz.correctAnswerIndex && (
                          <span className="text-2xl">✅</span>
                        )}
                        {hasAnswered && index === selectedAnswer && index !== currentQuiz.correctAnswerIndex && (
                          <span className="text-2xl">❌</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card and Reward Celebration */}
                {hasAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`kids-card p-5 space-y-3 ${
                      selectedAnswer === currentQuiz.correctAnswerIndex
                        ? "bg-gradient-to-r from-emerald-50 to-green-100 border-green-400"
                        : "bg-gradient-to-r from-rose-50 to-pink-100 border-pink-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">
                        {selectedAnswer === currentQuiz.correctAnswerIndex ? "🎉 Awesome Work!" : "💡 Learning Moment!"}
                      </span>
                    </div>

                    <p className="text-gray-800 leading-relaxed font-semibold">
                      {currentQuiz.explanation}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedAnswer === currentQuiz.correctAnswerIndex ? (
                        <>
                          <span className="bg-yellow-400 border border-black font-bold text-xs px-3 py-1 rounded-full shadow-sm">
                            ⭐ +25 Stars
                          </span>
                          <span className="bg-pink-500 text-white border border-black font-bold text-xs px-3 py-1 rounded-full shadow-sm">
                            🚀 +50 XP
                          </span>
                        </>
                      ) : (
                        <span className="bg-sky-400 text-white border border-black font-bold text-xs px-3 py-1 rounded-full shadow-sm">
                          💪 +10 XP for trying!
                        </span>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => startQuiz(selectedTopic, true)}
                        className="kids-btn bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
                      >
                        Next Question! ➔
                      </button>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
