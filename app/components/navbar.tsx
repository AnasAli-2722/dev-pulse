"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";

// Define Notification type
interface AppNotification {
  id: string;
  type: string;
  snippet_id: number;
  status: string;
  total_count: number;
  sender_username: string;
  sender_avatar_url: string | null;
  snippet_title: string | null;
}

interface NavbarProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  username: string | null;
  userId: string | null;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/snippet/new", label: "New Snippet" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar({ user, username }: NavbarProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!user.email) return; // Basic auth check
    
    // Fetch pending notifications
    const fetchNotifications = async () => {
      // Need user id to fetch. We passed userId in props
      if (!user) return;
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("bundled_notifications")
        .select("*")
        .eq("recipient_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (data && !error) {
        setNotifications(data as AppNotification[]);
      }
    };
    
    fetchNotifications();
  }, [user, supabase]);

  const handleMarkAllAsRead = async () => {
    setNotifications([]);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    
    await supabase
      .from("notifications")
      .update({ status: "read" })
      .eq("recipient_id", userData.user.id)
      .eq("status", "pending");
  };

  const handleNotificationAction = async (notifId: string, action: "accepted" | "declined", snippetId: number, senderId: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));

    try {
      // 1. Update notification status
      const { error: notifError } = await supabase
        .from("notifications")
        .update({ status: action })
        .eq("id", notifId);
        
      if (notifError) throw notifError;

      // 2. If accepted, insert into snippet_collaborators
      if (action === "accepted") {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { error: collabError } = await supabase
            .from("snippet_collaborators")
            .insert({
              snippet_id: snippetId,
              user_id: userData.user.id,
              role: "editor"
            });
          if (collabError) throw collabError;
        }
      }
    } catch (err) {
      console.error("Failed to process notification:", err);
      // We could revert optimistic update here if desired
    }
  };

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="pulse-dot w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm md:text-base font-bold tracking-tight text-foreground group-hover:text-accent-hover transition-colors">
              Dev Pulse
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Right side: Notifications + Profile + Mobile hamburger ── */}
          <div className="flex items-center gap-3">
            {/* Desktop Notification Bell */}
            {user.email && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsProfileOpen(false);
                  }}
                  className="relative p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-80 rounded-xl border border-border bg-surface shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border bg-background/50 flex items-center justify-between">
                        <h3 className="text-xs md:text-sm font-semibold text-foreground">Notifications</h3>
                        {notifications.length > 0 && (
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] md:text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs md:text-sm text-muted">
                            No new notifications.
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {notifications.map((notif) => (
                              <motion.div 
                                key={notif.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 hover:bg-surface-hover/50 transition-colors"
                              >
                                {notif.type === "collaboration_invite" ? (
                                  <div className="flex gap-3">
                                    {notif.sender_avatar_url ? (
                                      <img src={notif.sender_avatar_url} alt={notif.sender_username} className="w-8 h-8 rounded-full object-cover ring-1 ring-border shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-border">
                                        {notif.sender_username.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs md:text-sm text-foreground leading-snug">
                                        <span className="font-semibold">{notif.sender_username}</span> invited you to collaborate on <span className="font-semibold text-accent">{notif.snippet_title || "a snippet"}</span>
                                      </p>
                                      <div className="mt-2 flex gap-2">
                                        <button 
                                          onClick={() => handleNotificationAction(notif.id, "accepted", notif.snippet_id, "")}
                                          className="flex-1 py-1.5 px-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-[10px] md:text-xs font-medium transition-colors"
                                        >
                                          Accept
                                        </button>
                                        <button 
                                          onClick={() => handleNotificationAction(notif.id, "declined", notif.snippet_id, "")}
                                          className="flex-1 py-1.5 px-3 rounded-lg bg-surface-hover hover:bg-border text-foreground text-[10px] md:text-xs font-medium transition-colors"
                                        >
                                          Decline
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-3 items-center">
                                    {notif.sender_avatar_url ? (
                                      <img src={notif.sender_avatar_url} alt={notif.sender_username} className="w-8 h-8 rounded-full object-cover ring-1 ring-border shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-border">
                                        {notif.sender_username.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs md:text-sm text-foreground leading-snug">
                                        {notif.type === "follow" && (
                                          <>
                                            <span className="font-semibold">@{notif.sender_username}</span>
                                            {notif.total_count > 9 && ` and ${notif.total_count - 1} others`}
                                            {" started following you."}
                                          </>
                                        )}
                                        {notif.type === "star" && (
                                          <>
                                            <span className="font-semibold">@{notif.sender_username}</span>
                                            {notif.total_count > 9 && ` and ${notif.total_count - 1} others`}
                                            {` starred your snippet `}
                                            <span className="font-semibold text-accent">'{notif.snippet_title}'</span>.
                                          </>
                                        )}
                                        {notif.type === "comment" && (
                                          <>
                                            <span className="font-semibold">@{notif.sender_username}</span>
                                            {notif.total_count > 9 && ` and ${notif.total_count - 1} others`}
                                            {` commented on `}
                                            <span className="font-semibold text-accent">'{notif.snippet_title}'</span>.
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Desktop profile dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                onBlur={() => setTimeout(() => setIsProfileOpen(false), 150)}
                id="profile-dropdown-btn"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                    {initials}
                  </div>
                )}
                <span className="text-xs md:text-sm text-muted max-w-[120px] truncate">
                  {displayName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-muted transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-surface shadow-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs md:text-sm font-medium text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                      href={username ? `/profile/${username}` : "/"}
                        className="block px-4 py-2 text-xs md:text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-xs md:text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        Settings
                      </Link>
                      <form action={signOut}>
                        <button
                          type="submit"
                          id="sign-out-btn"
                          className="w-full text-left px-4 py-2 text-xs md:text-sm text-error/80 hover:text-error hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
              id="mobile-menu-btn"
              aria-label="Toggle menu"
            >
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {isMobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                      isActive
                        ? "text-foreground bg-surface-hover"
                        : "text-muted hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="border-t border-border pt-2 mt-2">
                <Link
                  href={username ? `/profile/${username}` : "/"}
                  onClick={() => setIsMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs md:text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  Profile
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full text-left px-3 py-2 rounded-lg text-xs md:text-sm font-medium text-error/80 hover:text-error hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
