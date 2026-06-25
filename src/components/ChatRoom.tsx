import React, { useState, useRef, useEffect } from "react";
import { BuddyInfo, Message, AvatarId, KidProfile } from "../types";
import { BUDDIES, QUICK_EMOJIS, playSynthSound } from "../constants";
import { motion, AnimatePresence } from "motion/react";

interface ChatRoomProps {
  profile: KidProfile;
  activeBuddy: BuddyInfo;
  onSelectBuddy: (id: AvatarId) => void;
  messages: Message[];
  onSendMessage: (text: string, imageBase64?: string) => Promise<void>;
  isSending: boolean;
}

export default function ChatRoom({
  profile,
  activeBuddy,
  onSelectBuddy,
  messages,
  onSendMessage,
  isSending,
}: ChatRoomProps) {
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const textToSend = inputText;
    const imgToSend = selectedImage || undefined;

    setInputText("");
    setSelectedImage(null);
    setImageMime(null);
    setShowEmojiPicker(false);

    playSynthSound("click");
    await onSendMessage(textToSend, imgToSend);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Oops! Please select a lovely image file 📸");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      setImageMime(file.type);
      playSynthSound("success");
    };
    reader.readAsDataURL(file);
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    playSynthSound("click");
  };

  return (
    <div id="kids-ai-chatroom" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)] min-h-[550px]">
      
      {/* Sidebar: AI Buddy Selector */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="kids-card bg-white p-4 flex flex-col h-full justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              👋 Choose Your Buddy!
            </h3>
            <div className="space-y-2">
              {BUDDIES.map((buddy) => {
                const isActive = buddy.id === activeBuddy.id;
                return (
                  <button
                    key={buddy.id}
                    onClick={() => {
                      playSynthSound("click");
                      onSelectBuddy(buddy.id);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-3 transition-all duration-150 text-left ${
                      isActive
                        ? "border-black bg-yellow-100 font-bold scale-[1.02]"
                        : "border-transparent hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <span className="text-3xl filter drop-shadow-sm">{buddy.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold flex items-center justify-between">
                        <span className="text-sm truncate text-gray-800">{buddy.name}</span>
                        {isActive && (
                          <span className="bg-pink-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-black">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{buddy.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200">
            <div className="kids-bubble bg-amber-50 p-3 text-xs text-amber-950 font-medium space-y-1">
              <span className="font-bold">✨ Quick Tip!</span>
              <p>You can send a drawing or a toy picture, and your buddy will tell you all about it!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3 flex flex-col h-full kids-card bg-white overflow-hidden relative">
        
        {/* Chat Room Buddy Header Banner */}
        <div className={`p-4 border-b-4 border-black ${activeBuddy.bgColor} flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-wiggle">{activeBuddy.emoji}</div>
            <div>
              <h2 className={`font-bold text-xl ${activeBuddy.textColor}`}>
                Chatting with {activeBuddy.name}
              </h2>
              <p className="text-xs text-gray-600 font-medium">
                I am super ready to answer your questions!
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs bg-white/70 border border-black px-2.5 py-1 rounded-full font-bold">
              ⭐ {profile.points} Stars
            </span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-doodle space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Avatar Bubble */}
                    <div className="text-2xl w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center shrink-0 shadow-sm">
                      {isUser ? "🎒" : activeBuddy.emoji}
                    </div>

                    {/* Chat Bubble Body */}
                    <div className="space-y-1">
                      <div className={`kids-bubble px-4 py-3 text-sm md:text-base font-medium ${
                        isUser 
                          ? "bg-yellow-100 text-gray-900" 
                          : `${activeBuddy.bgColor} ${activeBuddy.textColor}`
                      }`}>
                        
                        {/* Display uploaded image thumbnail if exists */}
                        {msg.image && (
                          <div className="mb-2 max-w-xs overflow-hidden rounded-lg border border-black shadow">
                            <img src={msg.image} alt="Uploaded mystery" className="w-full h-auto object-cover" />
                          </div>
                        )}

                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 block px-1 text-right">
                        {msg.timestamp}
                      </span>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading bubble */}
          {isSending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className="text-2xl w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center animate-spin">
                  ⏳
                </div>
                <div className={`kids-bubble px-4 py-3 text-sm ${activeBuddy.bgColor} ${activeBuddy.textColor} font-bold flex items-center gap-2`}>
                  <span>Thinking super fast...</span>
                  <span className="flex gap-1">
                    <span className="animate-bounce inline-block">⭐</span>
                    <span className="animate-bounce inline-block delay-100">✨</span>
                    <span className="animate-bounce inline-block delay-200">🔮</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Image Preview Area */}
        {selectedImage && (
          <div className="px-4 py-2 bg-pink-50 border-t-2 border-black flex items-center gap-3">
            <div className="relative w-16 h-16 border-2 border-black rounded-xl overflow-hidden shadow-sm bg-white shrink-0">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => {
                  setSelectedImage(null);
                  setImageMime(null);
                  playSynthSound("click");
                }}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg w-5 h-5 flex items-center justify-center text-xs font-bold border-l border-b border-black"
                title="Remove Image"
              >
                ✕
              </button>
            </div>
            <div className="text-xs">
              <p className="font-bold text-pink-700">📸 Picture selected!</p>
              <p className="text-gray-500">Press Send to show it to {activeBuddy.name}.</p>
            </div>
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="p-4 bg-gray-50 border-t-4 border-black">
          <form onSubmit={handleSend} className="flex gap-2">
            
            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => {
                playSynthSound("click");
                fileInputRef.current?.click();
              }}
              className="kids-btn bg-pink-400 hover:bg-pink-500 text-white p-3 rounded-2xl flex items-center justify-center"
              title="Upload picture"
              disabled={isSending}
            >
              📸
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Emoji Picker toggle button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  playSynthSound("click");
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="kids-btn bg-yellow-400 hover:bg-yellow-500 text-black p-3 rounded-2xl flex items-center justify-center"
                title="Insert Emoji"
                disabled={isSending}
              >
                😊
              </button>

              {/* Kid friendly simple emojis popup */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-0 bg-white border-3 border-black rounded-2xl p-3 shadow-lg z-20 w-64">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                    <span className="font-bold text-xs text-gray-700">Tap to add!</span>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-gray-400 hover:text-black font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl hover:scale-125 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Typing Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask ${activeBuddy.name} anything! (e.g., "Why is sky blue?")`}
              className="flex-1 kids-bubble px-4 py-2 bg-white text-gray-800 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-black"
              disabled={isSending}
            />

            {/* Send Button */}
            <button
              type="submit"
              className="kids-btn bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-1 shrink-0"
              disabled={isSending || (!inputText.trim() && !selectedImage)}
            >
              <span>Send</span> 🚀
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
