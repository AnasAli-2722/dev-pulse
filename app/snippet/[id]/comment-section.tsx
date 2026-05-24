"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface CommentProfile {
  username: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  snippet_id: number | null;
  user_id: string | null;
  content: string;
  created_at: string | null;
  profiles: CommentProfile | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "just now";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CommentSection({ snippetId }: { snippetId: number }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<CommentProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Fetch current user and their profile (for optimistic UI avatars)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && mounted) {
        setCurrentUser(data.user);
        supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData && mounted) {
              setCurrentProfile(profileData as CommentProfile);
            }
          });
      }
    });

    // Fetch existing comments
    supabase
      .from("comments")
      .select(`
        *,
        profiles!comments_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq("snippet_id", snippetId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && mounted) {
          // Type assertion to bypass strict type checking for the join
          setComments(data as unknown as Comment[]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [snippetId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !currentProfile) return;

    const commentText = newComment.trim();
    setIsSubmitting(true);
    setNewComment("");

    // Optimistic UI update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      snippet_id: snippetId,
      user_id: currentUser.id,
      content: commentText,
      created_at: new Date().toISOString(),
      profiles: currentProfile,
    };

    setComments((prev) => [...prev, optimisticComment]);

    // Background sync
    const { data: insertedData, error } = await supabase
      .from("comments")
      .insert({
        snippet_id: snippetId,
        user_id: currentUser.id,
        content: commentText,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to post comment:", error);
      // Revert optimistic update
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      setNewComment(commentText); // Restore their text
    } else if (insertedData) {
      // Replace temporary ID with real ID from database
      setComments((prev) =>
        prev.map((c) =>
          c.id === optimisticComment.id
            ? { ...c, id: insertedData.id, created_at: insertedData.created_at }
            : c
        )
      );
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="mt-12 w-full max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="text-lg font-bold text-slate-200">Discussion</h3>
        <span className="text-xs font-semibold text-slate-500 bg-slate-800/50 px-2.5 py-1 rounded-full border border-white/[0.04]">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Input Section */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="shrink-0 pt-1">
            {currentProfile?.avatar_url ? (
              <img
                src={currentProfile.avatar_url}
                alt="Your Avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 ring-2 ring-slate-800">
                {currentProfile?.username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add to the discussion..."
              className="w-full min-h-[100px] resize-y rounded-xl bg-slate-900/50 border border-white/[0.06] p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all shadow-inner shadow-black/20"
            />
            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-lg bg-accent/90 hover:bg-accent text-white text-xs font-semibold tracking-wide transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </motion.button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-slate-900/30 p-8 text-center backdrop-blur-sm">
          <p className="text-slate-400 text-sm mb-4">You must be logged in to join the discussion.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold tracking-wide transition-colors border border-white/[0.1]"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Feed Section */}
      <div className="space-y-6 pb-20">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex gap-4 group"
            >
              <Link href={`/profile/${comment.profiles?.username}`} className="shrink-0 pt-1">
                {comment.profiles?.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.username}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-slate-700 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 ring-2 ring-transparent group-hover:ring-slate-700 transition-all">
                    {comment.profiles?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </Link>
              
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${comment.profiles?.username}`}
                    className="text-sm font-bold text-slate-200 hover:text-accent hover:underline transition-colors"
                  >
                    {comment.profiles?.username || "Unknown"}
                  </Link>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">
            No comments yet. Be the first to start the discussion!
          </div>
        )}
      </div>
    </div>
  );
}
