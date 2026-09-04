# Dev-Pulse — Supabase Integration Documentation

**Project:** Dev-Pulse  
**Framework:** Next.js 16.2.6 (App Router)  
**Database:** Supabase (PostgreSQL)  
**Client Library:** `@supabase/ssr`  
**Date Generated:** June 10, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Configuration](#2-environment-configuration)
3. [Supabase Client Setup Code](#3-supabase-client-setup-code)
   - 3.1 Browser Client
   - 3.2 Server Client
   - 3.3 Proxy / Session Refresh Utility
   - 3.4 Root Proxy (Middleware)
4. [Authentication Flow](#4-authentication-flow)
   - 4.1 OAuth Callback Route
   - 4.2 Login Server Actions
5. [Database Schema (Tables)](#5-database-schema-tables)
6. [All Database Queries by Feature](#6-all-database-queries-by-feature)
   - 6.1 Root Layout
   - 6.2 Home Feed
   - 6.3 Onboarding
   - 6.4 Navbar & Notifications
   - 6.5 Snippet Card (Feed Item)
   - 6.6 Snippet Detail Page
   - 6.7 Snippet Viewer (Client Interactions)
   - 6.8 Comment Section
   - 6.9 Snippet Edit Page
   - 6.10 Snippet Edit Form
   - 6.11 Create New Snippet
   - 6.12 User Profile Page
   - 6.13 Profile View (Client Interactions)
   - 6.14 Leaderboard
   - 6.15 Settings — Profile
   - 6.16 Settings — Notifications
   - 6.17 Settings — Privacy
   - 6.18 Settings — Security
7. [RPC Functions](#7-rpc-functions)
8. [Database Views](#8-database-views)
9. [Summary Tables](#9-summary-tables)

---

## 1. Architecture Overview

Dev-Pulse uses the `@supabase/ssr` package to create Supabase clients that are compatible with Next.js App Router's server and client component architecture. The project defines **three** separate client factories:

| Client Factory | File | Usage Context |
|---|---|---|
| **Browser Client** | `lib/supabase/client.ts` | Client Components (`"use client"`) — runs in the browser |
| **Server Client** | `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers — runs on the server |
| **Proxy Client** | `lib/supabase/proxy.ts` | Next.js Middleware (Proxy) — runs on the edge for session refresh |

All three clients connect to the **same** Supabase project using the same environment variables, but they handle cookie-based session management differently based on their runtime context.

### Connection Flow

```
Browser (Client Components)
    └── createBrowserClient() → reads/writes cookies automatically via browser APIs

Server (Server Components / Actions)
    └── createServerClient() → reads cookies from Next.js `cookies()` API
                              → writes cookies via `cookieStore.set()`

Proxy (Middleware / Edge)
    └── createServerClient() → reads cookies from `request.cookies`
                              → writes cookies to both request AND response
                              → calls auth.getUser() to refresh the session token
```

---

## 2. Environment Configuration

The project stores Supabase credentials in a `.env.local` file at the project root. Two environment variables are required:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your Supabase project (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public anonymous API key for your Supabase project |

> **Note:** Both variables are prefixed with `NEXT_PUBLIC_` because the browser client also needs access to them. The `anon` key is safe to expose — Row Level Security (RLS) on the database enforces access control.

---

## 3. Supabase Client Setup Code

### 3.1 Browser Client — `lib/supabase/client.ts`

This is the simplest client. It is used by all `"use client"` components that need to interact with Supabase from the browser.

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**How it works:**
- `createBrowserClient` automatically reads and writes Supabase auth cookies using browser `document.cookie` APIs.
- No manual cookie handling is required.
- Called in components like `snippet-card.tsx`, `navbar.tsx`, `snippet-viewer.tsx`, all settings pages, etc.

---

### 3.2 Server Client — `lib/supabase/server.ts`

This client is used by Server Components, Server Actions, and Route Handlers that run on the Node.js server.

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy.ts refreshing sessions.
          }
        },
      },
    }
  );
}
```

**How it works:**
- Uses Next.js's `cookies()` API from `next/headers` to read incoming request cookies.
- The `setAll` method writes refreshed session tokens back as response cookies.
- The `try/catch` block handles the case where `setAll` is called from a Server Component (where cookies cannot be set). This is safe because the root `proxy.ts` middleware handles session refresh before the request reaches any Server Component.
- Called in `app/layout.tsx`, `app/page.tsx`, `app/snippet/[id]/page.tsx`, `app/profile/[username]/page.tsx`, `app/leaderboard/page.tsx`, `app/auth/callback/route.ts`, etc.

---

### 3.3 Proxy / Session Refresh Utility — `lib/supabase/proxy.ts`

This utility creates a Supabase client specifically for the middleware/proxy layer, handling the complex cookie forwarding between the incoming request and the outgoing response.

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not remove this line — it refreshes the user's session
  // and must be called before any auth checks in the proxy.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse, supabase };
}
```

**How it works:**
- Reads cookies from the raw `NextRequest` object.
- When Supabase refreshes a token, `setAll` is called which:
  1. Updates the cookies on the **request** (so downstream server components see the fresh token).
  2. Recreates the `NextResponse` and sets the cookies on the **response** (so the browser receives the fresh token).
- The critical `supabase.auth.getUser()` call triggers the token refresh cycle.
- Returns the `user`, the `supabaseResponse`, and the `supabase` client for use by the proxy.

---

### 3.4 Root Proxy (Middleware) — `proxy.ts`

This is the application's middleware. It runs on every request and handles authentication guards, onboarding redirects, and session token refresh.

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const publicPaths = ["/login", "/auth/callback", "/auth/auth-code-error", "/onboarding"];

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Helper to safely redirect while preserving Supabase session cookies.
  const safeRedirect = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.headers.getSetCookie().forEach((cookie) => {
      redirectResponse.headers.append("Set-Cookie", cookie);
    });
    return redirectResponse;
  };

  // Rule 1: Unauthenticated user trying to access protected routes → redirect to /login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return safeRedirect(url);
  }

  // Rule 2: Authenticated user trying to access /login → redirect to /
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return safeRedirect(url);
  }

  // Rule 3: Check onboarding status for authenticated users
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    const hasProfile = !!profile;

    if (!hasProfile && pathname !== "/onboarding" && pathname !== "/auth/callback") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return safeRedirect(url);
    }

    if (hasProfile && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "//"
      return safeRedirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Database queries in Proxy:**

| # | Query | Purpose |
|---|---|---|
| 1 | `supabase.auth.getUser()` | Refreshes session token (via `updateSession`) |
| 2 | `.from("profiles").select("id").eq("id", user.id).single()` | Checks if user has completed onboarding |

---

## 4. Authentication Flow

### 4.1 OAuth Callback Route — `app/auth/callback/route.ts`

This route handles the redirect from Supabase Auth after a successful OAuth sign-in (e.g., Google).

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

**Database query:**

| # | Query | Purpose |
|---|---|---|
| 1 | `supabase.auth.exchangeCodeForSession(code)` | Exchanges the OAuth authorization code for a user session |

---

### 4.2 Login Server Actions — `app/login/actions.ts`

```typescript
supabase.auth.signInWithPassword({ email, password })        // Email login
supabase.auth.signUp({ email, password, options: { data: { full_name } } })  // Email registration
supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })  // Google OAuth
supabase.auth.signOut()                                       // Sign out
```

---

## 5. Database Schema (Tables)

The following tables exist in the Supabase database (from `database.types.ts`):

| Table | Primary Key | Key Columns | Foreign Keys |
|---|---|---|---|
| **profiles** | `id` (uuid) | username, full_name, bio, avatar_url, reputation, notify_likes, notify_comments, notify_forks, notify_followers, profile_visibility, default_snippet_visibility, who_can_comment, github_url, linkedin_url, instagram_url, email_public | — |
| **snippets** | `id` (uuid) | title, description, owner_id, language_id, forked_from_id, is_public, star_count, fork_count, view_count | owner_id → profiles, language_id → languages, forked_from_id → snippets |
| **versions** | `id` (uuid) | snippet_id, author_id, code, code_hash, commit_msg, version_number, is_current, lines_added, lines_removed | snippet_id → snippets, author_id → profiles |
| **stars** | `id` (uuid) | user_id, snippet_id | user_id → profiles, snippet_id → snippets |
| **comments** | `id` (uuid) | content, snippet_id, user_id | snippet_id → snippets, user_id → profiles |
| **followers** | composite | follower_id, following_id | follower_id → profiles, following_id → profiles |
| **languages** | `id` (uuid) | name, extension, icon_class | — |
| **tags** | `id` (uuid) | name, usage_count | — |
| **snippet_tags** | composite | snippet_id, tag_id | snippet_id → snippets, tag_id → tags |
| **notifications** | `id` (uuid) | recipient_id, sender_id, type, snippet_id, status | recipient_id → profiles, sender_id → profiles |
| **snippet_collaborators** | `id` (uuid) | snippet_id, user_id, role | snippet_id → snippets, user_id → profiles |

**Views:** `bundled_notifications` — aggregates and groups notifications for efficient fetching.

**RPC Functions:** `increment_view_count(target_snippet_id)` — atomically increments a snippet's view count.

---

## 6. All Database Queries by Feature

### 6.1 Root Layout — `app/layout.tsx`
**Client:** Server (`lib/supabase/server.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets the current authenticated user |
| 2 | SELECT | `.from("profiles").select("username").eq("id", user.id).single()` | Fetches the user's username to pass to the Navbar component |

---

### 6.2 Home Feed — `app/page.tsx`
**Client:** Server (`lib/supabase/server.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | SELECT | `.from("snippets").select("*, profiles!snippets_owner_id_fkey(username, avatar_url), languages!snippets_language_id_fkey(name, extension), versions!inner(code)").eq("is_public", true).eq("versions.is_current", true)` | Fetches all public snippets with joined author profile, language info, and current version code for the feed. Supports sort by `star_count`, `view_count`, or `created_at`. Limited to 24 results. |

---

### 6.3 Onboarding — `app/onboarding/page.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user to pre-fill form |
| 2 | SELECT | `.from("profiles").select("id").eq("username", val).maybeSingle()` | Checks if a username is already taken (real-time validation) |
| 3 | INSERT | `.from("profiles").insert({ id, username, full_name, avatar_url })` | Creates the user's profile row after onboarding |

---

### 6.4 Navbar & Notifications — `app/components/navbar.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user for notification fetch |
| 2 | SELECT | `.from("bundled_notifications").select("*").eq("recipient_id", userId).order("created_at", { ascending: false })` | Fetches all bundled notifications for the bell dropdown |
| 3 | UPDATE | `.from("notifications").update({ status: "read" }).eq("recipient_id", userId).eq("status", "pending")` | "Mark all as read" — sets all pending notifications to read |
| 4 | UPDATE | `.from("notifications").update({ status: action }).eq("id", notifId)` | Accepts or declines a specific notification (e.g., collaboration invite) |
| 5 | INSERT | `.from("snippet_collaborators").insert({ snippet_id, user_id, role: "editor" })` | When a collaboration invite is accepted, inserts the user as an editor |

---

### 6.5 Snippet Card (Feed Item) — `app/components/snippet-card.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user to check star status |
| 2 | SELECT | `.from("stars").select("*").eq("snippet_id", id).eq("user_id", userId).maybeSingle()` | Checks if the current user has starred this snippet |
| 3 | DELETE | `.from("stars").delete().eq("snippet_id", id).eq("user_id", userId)` | Removes a star (unstar action) |
| 4 | INSERT | `.from("stars").insert({ snippet_id, user_id })` | Adds a star |

---

### 6.6 Snippet Detail Page — `app/snippet/[id]/page.tsx`
**Client:** Server (`lib/supabase/server.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user |
| 2 | SELECT | `.from("snippets").select("title, description").eq("id", id).single()` | Fetches snippet title/description for page metadata (SEO) |
| 3 | SELECT | `.from("snippets").select("*, profiles!snippets_owner_id_fkey(username, avatar_url), languages!snippets_language_id_fkey(name, extension)").eq("id", snippetId).single()` | Fetches the full snippet with author and language data |
| 4 | SELECT | `.from("versions").select("*").eq("snippet_id", snippetId).order("created_at", { ascending: false })` | Fetches all version history for the snippet |
| 5 | SELECT | `.from("snippet_collaborators").select("user_id, role, profiles!snippet_collaborators_user_id_fkey(username, avatar_url)").eq("snippet_id", snippetId)` | Fetches all collaborators for this snippet |

---

### 6.7 Snippet Viewer (Client Interactions) — `app/snippet/[id]/snippet-viewer.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | RPC | `supabase.rpc("increment_view_count", { target_snippet_id: snippet.id })` | Atomically increments the snippet's view count |
| 2 | SELECT | `.from("stars").select("*").eq("snippet_id", id).eq("user_id", userId).maybeSingle()` | Checks if user has starred |
| 3 | DELETE | `.from("stars").delete().eq("snippet_id", id).eq("user_id", userId)` | Removes star |
| 4 | INSERT | `.from("stars").insert({ snippet_id, user_id })` | Adds star |
| 5 | SELECT | `.from("profiles").select("id, username, avatar_url").ilike("username", query).neq("id", userId).limit(5)` | Searches users by username for collaboration invite modal |
| 6 | INSERT | `.from("notifications").insert({ recipient_id, sender_id, type: "collaboration_invite", snippet_id })` | Sends a collaboration invite notification |

---

### 6.8 Comment Section — `app/snippet/[id]/comment-section.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user |
| 2 | SELECT | `.from("profiles").select("username, avatar_url").eq("id", userId).single()` | Fetches current user's profile for display next to comment box |
| 3 | SELECT | `.from("comments").select("*, profiles!comments_user_id_fkey(username, avatar_url)").eq("snippet_id", snippetId).order("created_at", { ascending: true })` | Fetches all comments with author profiles |
| 4 | INSERT | `.from("comments").insert({ snippet_id, user_id, content }).select().single()` | Posts a new comment and returns the inserted row |

---

### 6.9 Snippet Edit Page — `app/snippet/[id]/edit/page.tsx`
**Client:** Server (`lib/supabase/server.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Auth check |
| 2 | SELECT | `.from("snippets").select("title").eq("id", id).single()` | Fetches snippet title for page metadata |
| 3 | SELECT | `.from("snippets").select("id, title, description, language_id, owner_id, languages!snippets_language_id_fkey(name, extension)").eq("id", snippetId).single()` | Fetches snippet data for the edit form |
| 4 | SELECT | `.from("versions").select("id, version_number, code, commit_msg").eq("snippet_id", snippetId).order("version_number", { ascending: false }).limit(1).single()` | Fetches the latest version to pre-fill the code editor |

---

### 6.10 Snippet Edit Form — `app/snippet/[id]/edit/edit-form.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Auth check |
| 2 | UPDATE | `.from("versions").update({ is_current: false }).eq("snippet_id", id)` | Marks all existing versions as not current |
| 3 | INSERT | `.from("versions").insert({ snippet_id, version_number, code, code_hash, commit_msg, author_id, is_current: true, lines_added, lines_removed })` | Creates a new version (the new "current" version) |
| 4 | UPDATE | `.from("snippets").update({ updated_at }).eq("id", snippet.id)` | Updates the snippet's `updated_at` timestamp |

---

### 6.11 Create New Snippet — `app/snippet/new/page.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Auth check |
| 2 | SELECT | `.from("languages").select("*").order("name")` | Fetches all programming languages for the dropdown |
| 3 | INSERT | `.from("snippets").insert({ title, description, language_id, owner_id, is_public }).select("id").single()` | Creates the snippet row and returns its ID |
| 4 | INSERT | `.from("versions").insert({ snippet_id, version_number: 1, code, code_hash, commit_msg, author_id, is_current: true, lines_added, lines_removed: 0 })` | Creates the initial version (v1) |

---

### 6.12 User Profile Page — `app/profile/[username]/page.tsx`
**Client:** Server (`lib/supabase/server.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user (to check if viewing own profile) |
| 2 | SELECT | `.from("profiles").select("*").ilike("username", username).limit(1).maybeSingle()` | Fetches the profile by username (case-insensitive) |
| 3 | SELECT | `.from("snippets").select("*, profiles!snippets_owner_id_fkey(username, avatar_url), languages!snippets_language_id_fkey(name, extension), versions!inner(code)").eq("owner_id", profileId).eq("versions.is_current", true).order("created_at", { ascending: false })` | Fetches all snippets owned by this user |
| 4 | SELECT | `.from("stars").select("snippet_id").eq("user_id", profileId)` | Gets IDs of snippets the user has starred |
| 5 | SELECT | `.from("snippets").select("*, profiles!..., languages!..., versions!inner(code)").in("id", starredIds).eq("versions.is_current", true).order("created_at", { ascending: false })` | Fetches full snippet data for starred snippets |
| 6 | SELECT | `.from("followers").select("*", { count: "exact", head: true }).eq("following_id", profileId)` | Gets follower count (head-only count query) |
| 7 | SELECT | `.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", profileId)` | Gets following count (head-only count query) |

---

### 6.13 Profile View (Client Interactions) — `app/profile/[username]/profile-view.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user |
| 2 | SELECT | `.from("followers").select("*").eq("follower_id", userId).eq("following_id", profileId).maybeSingle()` | Checks if the current user is following this profile |
| 3 | DELETE | `.from("followers").delete().eq("follower_id", userId).eq("following_id", profileId)` | Unfollows the user |
| 4 | INSERT | `.from("followers").insert({ follower_id, following_id })` | Follows the user |
| 5 | SELECT | `.from("followers").select("follower:profiles!followers_follower_id_fkey(id, username, avatar_url)").eq("following_id", profileId)` | Fetches follower list with profiles (for follower modal) |
| 6 | SELECT | `.from("followers").select("following:profiles!followers_following_id_fkey(id, username, avatar_url)").eq("follower_id", profileId)` | Fetches following list with profiles (for following modal) |

---

### 6.14 Leaderboard — `app/leaderboard/page.tsx`
**Client:** Server (`lib/supabase/server.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | SELECT | `.from("profiles").select("id, username, full_name, avatar_url, reputation").order("reputation", { ascending: false, nullsFirst: false }).limit(50)` | Fetches top 50 profiles ordered by reputation |
| 2 | SELECT | `.from("snippets").select("owner_id, star_count").in("owner_id", ownerIds)` | Batch-fetches star counts for all leaderboard users' snippets |

---

### 6.15 Settings — Profile — `app/settings/page.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user (load + save) |
| 2 | SELECT | `.from("profiles").select("full_name, bio, github_url, linkedin_url, instagram_url, email_public").eq("id", userId).single()` | Loads current profile data for the edit form |
| 3 | UPDATE | `.from("profiles").update({ full_name, bio, github_url, linkedin_url, instagram_url, email_public }).eq("id", userId)` | Saves updated profile data |

---

### 6.16 Settings — Notifications — `app/settings/notifications/page.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user |
| 2 | SELECT | `.from("profiles").select("notify_likes, notify_comments, notify_forks, notify_followers").eq("id", userId).single()` | Loads current notification preferences |
| 3 | UPDATE | `.from("profiles").update({ [key]: value }).eq("id", userId)` | Toggles an individual notification preference |

---

### 6.17 Settings — Privacy — `app/settings/privacy/page.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.getUser()` | Gets current user |
| 2 | SELECT | `.from("profiles").select("profile_visibility, default_snippet_visibility, who_can_comment").eq("id", userId).single()` | Loads current privacy settings |
| 3 | UPDATE | `.from("profiles").update({ [key]: value }).eq("id", userId)` | Updates an individual privacy setting |

---

### 6.18 Settings — Security — `app/settings/security/page.tsx`
**Client:** Browser (`lib/supabase/client.ts`)

| # | Operation | Query Code | Purpose |
|---|---|---|---|
| 1 | AUTH | `supabase.auth.updateUser({ email })` | Changes the user's email address |
| 2 | AUTH | `supabase.auth.updateUser({ password })` | Changes the user's password |
| 3 | AUTH | `supabase.auth.getUser()` | Gets current user for account deletion |
| 4 | DELETE | `.from("profiles").delete().eq("id", userId)` | Deletes the user's profile (cascading to related data) |
| 5 | AUTH | `supabase.auth.signOut()` | Signs the user out after account deletion |

---

## 7. RPC Functions

| Function Name | Arguments | Called In | Purpose |
|---|---|---|---|
| `increment_view_count` | `target_snippet_id: number` | `snippet-viewer.tsx` | Atomically increments a snippet's `view_count` column. Uses a database function to avoid race conditions from concurrent reads. |

**Invocation code:**
```typescript
supabase.rpc("increment_view_count", { target_snippet_id: snippet.id });
```

---

## 8. Database Views

| View Name | Security | Purpose |
|---|---|---|
| `bundled_notifications` | `SECURITY INVOKER` | Aggregates and groups notifications server-side. If a notification type (e.g., stars on a single snippet) exceeds 9 entries, the view bundles them into a single row with a `total_count` field. Otherwise, returns them individually. Used by the Navbar to render the notification dropdown efficiently. |

---

## 9. Summary Tables

### 9.1 Tables × Operations Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | ✅ | ✅ | ✅ | ✅ |
| snippets | ✅ | ✅ | ✅ | — |
| versions | ✅ | ✅ | ✅ | — |
| stars | ✅ | ✅ | — | ✅ |
| comments | ✅ | ✅ | — | — |
| followers | ✅ | ✅ | — | ✅ |
| notifications | ✅ | ✅ | ✅ | — |
| bundled_notifications (view) | ✅ | — | — | — |
| snippet_collaborators | ✅ | ✅ | — | — |
| languages | ✅ | — | — | — |
| tags | — | — | — | — |
| snippet_tags | — | — | — | — |

### 9.2 Auth Operations Summary

| Operation | Count | Files |
|---|---|---|
| `auth.getUser()` | 20+ | layout.tsx, navbar.tsx, snippet-card.tsx, snippet-viewer.tsx, comment-section.tsx, edit-form.tsx, new/page.tsx, profile-view.tsx, settings/*.tsx, proxy.ts |
| `auth.signInWithPassword()` | 1 | login/actions.ts |
| `auth.signUp()` | 1 | login/actions.ts |
| `auth.signInWithOAuth()` | 1 | login/actions.ts |
| `auth.signOut()` | 2 | login/actions.ts, security/page.tsx |
| `auth.exchangeCodeForSession()` | 1 | auth/callback/route.ts |
| `auth.updateUser()` | 2 | security/page.tsx |

### 9.3 Total Query Count

| Category | Count |
|---|---|
| SELECT queries | ~25 |
| INSERT queries | ~10 |
| UPDATE queries | ~8 |
| DELETE queries | ~4 |
| AUTH operations | ~28 |
| RPC calls | 1 |
| **Total database interactions** | **~76** |

---

*End of Document*
