"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function SettingsThemesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-base md:text-lg font-semibold text-foreground">Themes</h2>
        <p className="mt-1 text-xs md:text-sm text-muted">
          Customize the appearance of your workspace.
        </p>
      </div>

      <div className="h-px bg-glass-border" />

      <div className="space-y-4">
        <h3 className="text-xs md:text-sm font-medium text-foreground">Active Theme</h3>
        
        <div>
          {mounted ? (
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full md:w-1/2 rounded-xl bg-surface border border-glass-border px-4 py-2.5 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
            >
              <option value="deep-dark">Deep Dark</option>
              <option value="deep-forest">Deep Forest</option>
              <option value="crimson">Crimson Forge</option>
            </select>
          ) : (
            <div className="w-full md:w-1/2 h-10 rounded-xl bg-surface border border-glass-border animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
