import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  BookOpen, 
  User as UserIcon, 
  Map, 
  Zap, 
  BrainCircuit, 
  ArrowRight,
  Sparkles,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { User, Quest } from './types';
import { getGrammarFeedback } from './lib/gemini';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'quests' | 'leaderboard' | 'coach'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [questStep, setQuestStep] = useState(0);
  const [score, setScore] = useState(0);
  const [aiSentence, setAiSentence] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, qRes, lRes] = await Promise.all([
        fetch('/api/user/1'),
        fetch('/api/quests'),
        fetch('/api/leaderboard')
      ]);
      const [userData, questsData, leaderboardData] = await Promise.all([
        uRes.json(),
        qRes.json(),
        lRes.json()
      ]);
      setUser(userData);
      setQuests(questsData);
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const startQuest = (quest: Quest) => {
    setActiveQuest(quest);
    setQuestStep(0);
    setScore(0);
  };

  const handleAnswer = async (index: number) => {
    if (!activeQuest) return;
    
    if (index === activeQuest.questions[questStep].correct) {
      setScore(s => s + 1);
    }

    if (questStep + 1 < activeQuest.questions.length) {
      setQuestStep(s => s + 1);
    } else {
      const finalScore = score + (index === activeQuest.questions[questStep].correct ? 1 : 0);
      if (finalScore === activeQuest.questions.length) {
        await updateXp(activeQuest.xpAward);
        alert(`🌟 YAY! YOU ARE A SUPERSTAR! 🌟\nYou found all answers correctly! +${activeQuest.xpAward} Magic Points!`);
      } else {
        alert(`Good job! You got ${finalScore}/${activeQuest.questions.length} correct. Let's try again to get them all! 🎈`);
      }
      setActiveQuest(null);
    }
  };

  const updateXp = async (amount: number) => {
    try {
      const res = await fetch('/api/update-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '1', xpToAdd: amount })
      });
      const updatedUser = await res.json();
      setUser(updatedUser);
      setTimeout(fetchData, 500);
    } catch (err) {
      console.error("Failed to update XP", err);
    }
  };

  const checkAiGrammar = async () => {
    if (!aiSentence.trim()) return;
    setIsAiLoading(true);
    const feedback = await getGrammarFeedback(aiSentence);
    setAiFeedback(feedback || '');
    setIsAiLoading(false);
  };

  if (!user) return <div className="flex items-center justify-center h-screen bg-[#FFF4E0] font-bold text-[#FF85A2] text-2xl animate-bounce">Loading... 🍭</div>;

  return (
    <div className="min-h-screen font-sans text-[#433E3F] selection:bg-[#FF85A2] selection:text-white pb-24 md:pb-0 relative overflow-x-hidden">
      {/* Cartoon clouds and stars */}
      <div className="fixed top-10 left-10 text-white/40 pointer-events-none -z-10"><Sparkles size={48} /></div>
      <div className="fixed bottom-20 right-10 text-white/40 pointer-events-none -z-10"><Sparkles size={64} /></div>

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b-4 border-[#FEE2E2] sticky top-0 z-50 rounded-b-[32px] shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveTab('home'); setActiveQuest(null); }}>
            <div className="w-12 h-12 bg-[#FFD93D] rounded-2xl flex items-center justify-center border-b-4 border-[#D9B600] group-hover:scale-110 transition-transform">
              <Zap className="text-white" size={28} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-black text-[#FF6B6B] tracking-tight uppercase">LINGUALAND</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#E0FBFC] px-4 py-2 rounded-2xl border-b-4 border-[#98D8E1] flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span className="font-black text-[#457B9D]">{user.xp}</span>
            </div>
            <div className="bg-[#FF85A2] text-white px-4 py-2 rounded-2xl border-b-4 border-[#E65F7E] flex items-center gap-2 shadow-md">
              <span className="font-black">LVL {user.level}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:py-10">
        <AnimatePresence mode="wait">
          {activeQuest ? (
            <motion.div 
              key="quest"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 md:p-12 rounded-[48px] border-4 border-[#FEE2E2] shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-[#FEE2E2]">
                <motion.div 
                  className="h-full bg-[#FFD93D]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((questStep + 1) / activeQuest.questions.length) * 100}%` }}
                />
              </div>

              <div className="text-center mb-10 pt-6">
                 <div className="inline-block px-4 py-1 bg-[#6BCB77] text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  {activeQuest.type === 'vocabulary' ? '🔤 Words' : '✨ Magic Sentences'}
                 </div>
                 <h3 className="text-4xl font-black text-[#2D2926] leading-tight">{activeQuest.title}</h3>
              </div>

              <div className="mb-14">
                <div className="bg-[#F8F9FA] p-10 rounded-[40px] border-4 border-dashed border-[#DEE2E6] mb-10 text-center">
                  <p className="text-3xl font-bold text-[#495057]">
                    {activeQuest.questions[questStep].q}
                  </p>
                </div>
                <div className="grid gap-6">
                  {activeQuest.questions[questStep].a.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className="w-full text-center p-8 rounded-[32px] bg-white border-b-8 border-[#DEE2E6] hover:border-[#6BCB77] hover:bg-[#EFFFF0] hover:translate-y-[-2px] transition-all relative overflow-hidden active:translate-y-[4px] active:border-b-0 shadow-sm"
                    >
                      <span className="text-2xl font-bold text-[#2D2926]">{option}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setActiveQuest(null)}
                className="text-[#ADB5BD] hover:text-[#FF6B6B] font-bold uppercase text-sm tracking-widest transition-colors flex items-center gap-2 mx-auto"
              >
                Go Back Home
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'home' && (
                <div className="space-y-10">
                  <section className="bg-[#4D96FF] rounded-[48px] p-8 md:p-14 text-white relative border-b-8 border-[#3A7EE6] shadow-2xl overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
                        <div className="text-center lg:text-left">
                          <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
                            HELLO, <br />
                            <span className="text-[#FFD93D]">{user.name.toUpperCase()}! 🚀</span>
                          </h2>
                          <p className="text-white/90 text-2xl font-medium max-w-lg leading-relaxed">Let's learn something new today! Which magic door will you open?</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                          {user.badges.map((b, i) => (
                            <motion.div 
                              key={i} 
                              whileHover={{ rotate: 10, scale: 1.1 }}
                              className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border-b-4 border-[#E0E0E0] shadow-lg relative cursor-help" 
                              title={b}
                            >
                              <Trophy className="text-[#FFD93D]" size={36} fill="currentColor" />
                              <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#FF6B6B] rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">1</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[48px] border-b-8 border-[#FEE2E2] shadow-xl text-center">
                       <div className="w-20 h-20 bg-[#F3F0FF] rounded-3xl mx-auto flex items-center justify-center mb-6">
                        <BarChart3 className="text-[#6C5CE7]" size={40} />
                       </div>
                       <h3 className="font-black text-2xl text-[#2D2926] mb-4">YOUR PROGRESS</h3>
                       <div className="space-y-4">
                          <div className="p-4 bg-[#F8F9FA] rounded-[24px] flex justify-between items-center">
                            <span className="font-bold text-[#8E8B82]">Quests Done</span>
                            <span className="font-black text-[#6C5CE7]">12 🎁</span>
                          </div>
                          <div className="p-4 bg-[#F8F9FA] rounded-[24px] flex justify-between items-center">
                            <span className="font-bold text-[#8E8B82]">Day Streak</span>
                            <span className="font-black text-[#FF6B6B]">5 🔥</span>
                          </div>
                       </div>
                    </div>
                    <div className="bg-[#FFD93D] p-10 rounded-[48px] border-b-8 border-[#D9B600] flex flex-col justify-center items-center text-center shadow-xl">
                       <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white mb-6 shadow-lg">
                        <Zap className="text-[#FF6B6B]" size={40} fill="currentColor" />
                       </div>
                       <h3 className="font-black text-3xl text-[#2D2926] mb-4">ENERGY</h3>
                       <p className="text-[#2D2926]/70 font-bold mb-6 italic">Almost full! Keep going!</p>
                       <div className="w-full bg-black/10 h-6 rounded-full overflow-hidden border-2 border-white/50">
                          <motion.div 
                            className="bg-white h-full" 
                            initial={{ width: 0 }}
                            animate={{ width: '80%' }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                          />
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'quests' && (
                <div className="space-y-10 px-2">
                  <div className="text-center">
                    <h2 className="text-5xl font-black text-[#2D2926] tracking-tight uppercase mb-2">Magic Missions</h2>
                    <p className="text-[#ADB5BD] font-black uppercase text-xs tracking-widest">Choose an adventure</p>
                  </div>
                  <div className="grid gap-8">
                    {quests.map(q => (
                      <button 
                        key={q.id}
                        onClick={() => startQuest(q)}
                        className="flex flex-col sm:flex-row items-center justify-between p-8 bg-white rounded-[40px] border-b-8 border-[#FEE2E2] hover:translate-y-[-4px] hover:border-[#6BCB77] transition-all group outline-none shadow-xl"
                      >
                        <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                          <div className={cn(
                            "w-24 h-24 rounded-3xl flex items-center justify-center border-b-4 shadow-inner",
                            q.type === 'vocabulary' ? "bg-[#FFEFD5] border-[#D9C4A6]" : "bg-[#E0F2FF] border-[#B8D8E6]"
                          )}>
                            {q.type === 'vocabulary' ? <BookOpen size={48} className="text-[#FF6B6B]" /> : <BrainCircuit size={48} className="text-[#4D96FF]" />}
                          </div>
                          <div>
                            <div className="flex justify-center sm:justify-start gap-2 mb-2">
                               <span className="px-3 py-1 bg-[#6BCB77] text-white rounded-full text-[10px] font-bold uppercase">{q.difficulty}</span>
                               <span className="px-3 py-1 bg-[#F8F9FA] text-[#ADB5BD] rounded-full text-[10px] font-bold border border-[#DEE2E6] uppercase">{q.type}</span>
                            </div>
                            <h3 className="font-black text-3xl text-[#2D2926]">{q.title}</h3>
                            <div className="mt-2 text-[#4D96FF] font-black text-sm uppercase">🎁 +{q.xpAward} Points</div>
                          </div>
                        </div>
                        <div className="w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center group-hover:bg-[#FFD93D] group-hover:text-white transition-all mt-6 sm:mt-0 shadow-inner">
                          <ArrowRight size={32} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="bg-white rounded-[56px] border-b-8 border-[#FEE2E2] shadow-2xl overflow-hidden">
                  <div className="bg-[#6BCB77] p-10 text-white text-center border-b-8 border-[#54A05E]">
                    <Trophy className="mx-auto mb-4 text-[#FFD93D] drop-shadow-lg" size={80} fill="currentColor" />
                    <h2 className="text-5xl font-black tracking-tight uppercase">SUPER HEROES</h2>
                    <p className="text-white/80 font-bold uppercase text-[10px] tracking-[0.2em]">Top Players This Week</p>
                  </div>
                  <div className="p-8 space-y-4">
                    {leaderboard.map((item, idx) => (
                      <div 
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between p-6 rounded-[32px] transition-all",
                          item.id === '1' ? "bg-[#FFF9C4] border-2 border-[#FFD93D]" : "bg-transparent border-2 border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-6">
                          <span className="w-8 font-black text-2xl text-[#ADB5BD]">{idx + 1}</span>
                          <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center font-black text-3xl text-[#2D2926] border-2 border-[#DEE2E6] shadow-sm uppercase italic">
                            {item.name[0]}
                          </div>
                          <div>
                            <p className="font-black text-2xl text-[#2D2926] leading-none uppercase">{item.name}</p>
                            <p className="text-xs font-bold text-[#ADB5BD] uppercase mt-2">Hero Level {item.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-3xl text-[#6BCB77]">{item.xp}</span>
                          <p className="text-[10px] font-black text-[#ADB5BD] uppercase">Gems</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'coach' && (
                <div className="bg-white p-10 md:p-14 rounded-[56px] border-b-8 border-[#FEE2E2] shadow-2xl">
                  <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-[#FF85A2] rounded-[40px] mx-auto flex items-center justify-center shadow-xl border-b-8 border-[#E65F7E] mb-6 transform hover:rotate-12 transition-transform">
                      <BrainCircuit className="text-white" size={48} />
                    </div>
                    <h2 className="text-4xl font-black text-[#2D2926] uppercase mb-2">Magic Mirror</h2>
                    <p className="text-[#ADB5BD] font-bold">Write in English and I will help you! ✨</p>
                  </div>
                  
                  <div className="relative mb-8">
                    <textarea 
                      value={aiSentence}
                      onChange={(e) => setAiSentence(e.target.value)}
                      placeholder="Type a sentence... (Example: I like apples!)"
                      className="w-full p-10 rounded-[48px] border-4 border-[#F8F9FA] bg-[#F8F9FA] focus:bg-white focus:border-[#FFD93D] outline-none transition-all min-h-[220px] text-2xl font-bold text-[#2D2926] placeholder:text-[#ADB5BD] shadow-inner"
                    />
                  </div>

                  <button 
                    onClick={checkAiGrammar}
                    disabled={isAiLoading || !aiSentence.trim()}
                    className="w-full bg-[#4D96FF] text-white py-8 rounded-[48px] font-black text-3xl uppercase tracking-tighter border-b-8 border-[#3A7EE6] transition-all hover:translate-y-[-4px] hover:border-b-12 active:translate-y-[8px] active:border-b-0 disabled:opacity-30 flex items-center justify-center gap-4 shadow-xl"
                  >
                    {isAiLoading ? "WITCHCRAFT..." : <><Sparkles size={32} /> CHECK MAGIC</>}
                  </button>

                  <AnimatePresence>
                    {aiFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-12 p-10 bg-[#EFFFF0] rounded-[48px] border-2 border-dashed border-[#6BCB77] relative"
                      >
                         <div className="flex gap-6 italic">
                            <div className="mt-1 shrink-0 p-3 bg-[#6BCB77] rounded-2xl text-white h-fit shadow-md">
                              <MessageSquare size={32} />
                            </div>
                            <p className="text-2xl font-bold leading-relaxed text-[#2D2926]">{aiFeedback}</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl px-3 py-3 z-[60] flex items-center gap-3 border-4 border-[#FEE2E2]">
        {[
          { id: 'home', icon: UserIcon, label: 'Hero', color: '#4D96FF' },
          { id: 'quests', icon: Map, label: 'Map', color: '#6BCB77' },
          { id: 'leaderboard', icon: Trophy, label: 'Stars', color: '#FFD93D' },
          { id: 'coach', icon: BrainCircuit, label: 'Magic', color: '#FF85A2' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setActiveQuest(null); }}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-[24px] transition-all relative group",
              activeTab === tab.id ? "text-white shadow-lg" : "text-[#ADB5BD] hover:text-[#2D2926] hover:bg-[#F8F9FA]"
            )}
            style={{ backgroundColor: activeTab === tab.id ? tab.color : 'transparent' }}
          >
            <tab.icon size={26} className={cn("transition-transform", activeTab === tab.id ? "scale-110" : "")} />
            <span className={cn(
              "text-sm font-black uppercase tracking-widest transition-all",
              activeTab === tab.id ? "block" : "hidden md:block"
            )}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
