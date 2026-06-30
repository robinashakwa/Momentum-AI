/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User as UserIcon, Clock, Coffee, Globe, Shield, LogOut, CheckCircle2, 
  Settings as SettingsIcon, Save, Heart, RefreshCw
} from "lucide-react";
import { Settings as UserSettings } from "../types.js";

interface SettingsProps {
  token: string;
  onLogout: () => void;
  username: string;
}

export default function Settings({ token, onLogout, username }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Editable fields state
  const [workingHours, setWorkingHours] = useState("09:00 - 17:00");
  const [breakPreference, setBreakPreference] = useState("5m every 25m");
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("default");

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setSettings(result.settings);
        setWorkingHours(result.settings.workingHours);
        setBreakPreference(result.settings.breakPreference);
        setLanguage(result.settings.language);
        setTheme(result.settings.theme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          theme,
          workingHours,
          breakPreference,
          language
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-semibold font-sans">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12 font-sans">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-sans">
            <SettingsIcon className="w-5.5 h-5.5 text-slate-500" />
            Workspace Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold font-sans">Configure your personal preferences for your AI coach.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
        
        {/* Profile Card */}
        <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[24px]">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Active Workspace User</h4>
            <span className="text-base font-bold text-slate-800 font-sans">{username}</span>
          </div>
        </div>

        {/* Settings form */}
        <form onSubmit={handleSaveSettings} className="space-y-4 font-sans">
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4.5 h-4.5" />
              Settings saved successfully! Future schedules will automatically sync with your updates.
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Core Working Hours
            </label>
            <input
              type="text"
              required
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="e.g. 09:00 - 17:00"
              className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs rounded-xl transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <Coffee className="w-3.5 h-3.5 text-slate-400" />
              Preferred Break Interval
            </label>
            <input
              type="text"
              required
              value={breakPreference}
              onChange={(e) => setBreakPreference(e.target.value)}
              placeholder="e.g. 5m every 25m"
              className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs rounded-xl transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs rounded-xl transition-all cursor-pointer font-medium"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Japanese">Japanese (日本語)</option>
            </select>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100/30 rounded-2xl p-3.5 flex gap-2.5">
            <Heart className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              These settings configure how the AI coach customizes recommendations and structures breaks in your timeline. Keeping a balanced layout preserves long-term stamina and momentum.
            </p>
          </div>

          <div className="pt-2 flex gap-3 font-sans">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex justify-center items-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-colors"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-3 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
