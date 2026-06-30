/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Sprout, Heart, Leaf, Trophy, Gift, ArrowUpRight } from "lucide-react";
import { Achievement } from "../types.js";
import gardenImg from "../assets/images/digital_garden_illustration_1782840634439.jpg";

interface GardenProps {
  token: string;
}

export default function Garden({ token }: GardenProps) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGarden = async () => {
    try {
      const response = await fetch("/api/achievements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setAchievements(result.achievements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarden();
  }, [token]);

  const getPlantDetails = (plantType: string, stage: number) => {
    const cleanType = plantType.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
    
    let emoji = "🌱";
    let text = "Seed";
    let desc = "The beginning of your active journey. Water it with daily efforts!";

    if (stage === 0) {
      emoji = "🌱";
      text = "Sprouting Seed";
    } else if (stage === 1) {
      emoji = "🌿";
      text = "Sprout";
      desc = "Your consistency has broken through! Leaves are beginning to grow.";
    } else if (stage === 2) {
      emoji = "🍃";
      text = "Sapling";
      desc = "Strong roots established. You're building solid daily momentum.";
    } else if (stage === 3) {
      emoji = "🌸";
      text = "Flowering Plant";
      desc = "Blooms are unfolding. You are incredibly close to your destination.";
    } else if (stage === 4) {
      emoji = "🌳";
      text = "Mighty Tree";
      desc = "Absolute triumph! Goal fully completed. Your effort stands tall and strong.";
    }

    return { emoji, text, desc, name: cleanType };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Watering your virtual garden...</p>
      </div>
    );
  }

  const completedTrees = achievements.filter(a => a.stage === 4).length;

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Garden Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-sans">
            <Sprout className="w-5.5 h-5.5 text-emerald-500" />
            Your Achievement Garden
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Every active goal grows a virtual plant. Stay consistent to blossom your workspace.</p>
        </div>
        
        {/* Statistics row */}
        <div className="flex gap-4">
          <div className="bg-white border border-slate-100 rounded-[18px] px-5 py-3 flex items-center gap-2.5 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Goals</span>
              <span className="text-xs font-bold text-slate-800">{completedTrees} fully grown</span>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[18px] px-5 py-3 flex items-center gap-2.5 shadow-sm">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Garden</span>
              <span className="text-xs font-bold text-slate-800">{achievements.length} plants growing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful Garden Banner */}
      <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
        <div className="h-64 sm:h-72 w-full overflow-hidden relative">
          <img 
            src={gardenImg} 
            alt="Virtual Achievement Garden Illustration" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent flex items-end p-6 sm:p-8">
            <div className="text-white">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/90 backdrop-blur-xs px-2.5 py-1 rounded-full">Digital Sanctuary</span>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2.5 font-sans">The Meadow of Consistency</h3>
              <p className="text-xs text-white/95 mt-1 font-semibold">Cultivated by your real-life productivity and focus hours.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of plants */}
      {achievements.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((ach) => {
            const plant = getPlantDetails(ach.plantType, ach.stage);
            
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Glowing status ring */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  ach.stage === 4 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-100'
                }`}></div>

                {/* Growth Stage Graphic */}
                <div className="relative w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  {ach.stage === 4 && (
                    <div className="absolute top-1 right-1 p-1 bg-amber-50 rounded-full border border-amber-200 text-amber-500">
                      <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                  )}
                  <span className="text-5xl">{plant.emoji}</span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{plant.name}</h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {plant.text}
                  </span>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-2 px-2">
                    {plant.desc}
                  </p>
                </div>

                {/* Connected Goal */}
                <div className="pt-3 border-t border-slate-100 w-full">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Cultivated by Goal</span>
                  <span className="text-xs font-bold text-slate-600 block truncate mt-0.5 max-w-[160px] mx-auto">
                    {ach.goalTitle}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <span className="text-4xl block">🌻</span>
          <div>
            <h4 className="text-base font-bold text-slate-800">Your Garden is Sleeping</h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-1 font-semibold">
              There are no digital seeds planted here yet. Create an active Goal Journey to automatically plant your first virtual sprout in the Achievement Garden!
            </p>
          </div>
        </div>
      )}

      {/* Encouraging Gamification Hint */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-5 flex gap-3 text-xs shadow-sm">
        <Gift className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold text-slate-800">Garden Guidelines</h5>
          <p className="text-slate-500 leading-relaxed mt-1 font-semibold">
            Each plant starts as a tiny seed. As you complete milestones and check off mini-tasks inside your goals, your virtual plant receives water and care, growing into a beautiful flowering bush or a sturdy oak tree. Fully grown mighty trees represent your major life accomplishments.
          </p>
        </div>
      </div>

    </div>
  );
}
