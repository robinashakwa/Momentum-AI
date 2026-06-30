/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, Sprout, BrainCircuit, Clock, Trophy, Settings as SettingsIcon, 
  Menu, X, Sparkles, LogOut, ChevronRight, User as UserIcon
} from "lucide-react";

import Auth from "./components/Auth.tsx";
import LandingPage from "./components/LandingPage.tsx";
import Dashboard from "./components/Dashboard.tsx";
import GoalJourney from "./components/GoalJourney.tsx";
import AICoach from "./components/AICoach.tsx";
import FocusTimer from "./components/FocusTimer.tsx";
import Garden from "./components/Garden.tsx";
import Settings from "./components/Settings.tsx";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  // Stats trigger to reload stats across tabs
  const [statsTrigger, setStatsTrigger] = useState(0);

  useEffect(() => {
    // Check for existing token in localStorage on load
    const storedToken = localStorage.getItem("momentum_token");
    const storedUser = localStorage.getItem("momentum_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("momentum_token");
        localStorage.removeItem("momentum_user");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: { id: number; username: string }) => {
    localStorage.setItem("momentum_token", newToken);
    localStorage.setItem("momentum_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setActiveTab("Dashboard");
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem("momentum_token");
    localStorage.removeItem("momentum_user");
    setToken(null);
    setUser(null);
  };

  const triggerStatsRefresh = () => {
    setStatsTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center gap-4 font-sans">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium font-sans">Preparing your plan...</p>
      </div>
    );
  }

  // Render Landing Page or Auth screen if not logged in
  if (!token || !user) {
    if (showAuth) {
      return (
        <Auth 
          onLoginSuccess={handleLoginSuccess} 
          onBackToLanding={() => setShowAuth(false)} 
        />
      );
    }
    return (
      <LandingPage 
        onGetStarted={() => setShowAuth(true)} 
        onSignIn={() => setShowAuth(true)} 
      />
    );
  }

  // Navigation Items
  const navItems = [
    { name: "Dashboard", icon: Compass },
    { name: "Goals & Journeys", icon: Sprout },
    { name: "Focus Timer", icon: Clock },
    { name: "AI Coach", icon: BrainCircuit },
    { name: "Achievement Garden", icon: Trophy },
    { name: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-sans flex">
      
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 space-y-8 shrink-0">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-sm shadow-red-600/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-950 block leading-tight tracking-tight">Last-Minute Rescuer</span>
            <span className="text-[10px] text-slate-400 font-medium">Beat the Deadline</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              </button>
            );
          })}
        </nav>

        {/* User Workspace Profile Card inside sidebar bottom */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <UserIcon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">{user.username}</span>
              <span className="text-[9px] text-slate-400 font-medium">Workspace</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-950 font-sans tracking-tight">Last-Minute Rescuer</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 p-6 z-30 space-y-4 shadow-lg"
          >
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveTab(item.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center px-2">
              <span className="text-xs font-bold text-slate-600">Signed in as: {user.username}</span>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT FIELD */}
      <main className="flex-1 min-w-0 pt-20 lg:pt-8 px-4 sm:px-8 lg:px-12 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + statsTrigger}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {activeTab === "Dashboard" && (
                <Dashboard 
                  token={token} 
                  onSelectTab={(tab) => setActiveTab(tab)} 
                  onGoalCreated={triggerStatsRefresh}
                />
              )}
              {activeTab === "Goals & Journeys" && (
                <GoalJourney 
                  token={token} 
                  onGoalModified={triggerStatsRefresh}
                />
              )}
              {activeTab === "Focus Timer" && (
                <FocusTimer token={token} />
              )}
              {activeTab === "AI Coach" && (
                <AICoach token={token} />
              )}
              {activeTab === "Achievement Garden" && (
                <Garden token={token} />
              )}
              {activeTab === "Settings" && (
                <Settings 
                  token={token} 
                  onLogout={handleLogout} 
                  username={user.username}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
