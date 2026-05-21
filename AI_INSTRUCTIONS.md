# Dev-Pulse AI System Instructions

## Project Overview
Dev-Pulse is a collaborative, gamified code snippet and version-tracking platform. It acts as a hybrid between GitHub Gists and a social feed, allowing users to create, fork, version, and star code snippets.

## Tech Stack
* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Backend/Auth:** Supabase & `@supabase/ssr`
* **Styling:** Tailwind CSS
* **Animations:** Framer Motion
* **Code Editor:** `@monaco-editor/react`

## 1. Architectural Rules
* **Server First:** Default to Next.js Server Components. Only use `"use client"` when absolutely necessary (e.g., for hooks like `useState`, event listeners, Monaco Editor, or Framer Motion animations).
* **Database Types:** Always import and use the generated Supabase types from `database.types.ts` located in the project root. Never hallucinate database schemas.
* **Data Fetching:** Perform data fetching in Server Components whenever possible. Pass the fetched data down to Client Components as props.
* **Auth Flow:** Rely on `@supabase/ssr` for authentication and session management. Respect the `middleware.ts` routing rules.

## 2. UI & Design Language
* **Theme:** Deep Dark Mode (Slate/Gray-900s backgrounds). Do not write light-mode overrides unless explicitly requested.
* **Aesthetics:** * **Glassmorphism:** Use translucent backgrounds, subtle borders, and `backdrop-blur` for modals, auth cards, and overlays.
    * **Neumorphism:** Use inset shadows (`shadow-inner`) to make code editors or search bars look physically embedded into the page.
    * **Bento Grids:** Use CSS Grid (`grid`, `col-span-x`, `row-span-x`) for complex dashboards and profile layouts.
* **Animations:** Use Framer Motion for subtle, buttery-smooth interactions (e.g., micro-interactions on hover, gentle fade/slide-ins on mount). Keep animations professional, not distracting.

## 3. Code Quality Standards
* **Strict Typing:** Do not use `any`. Define proper interfaces for component props.
* **Error Handling:** Always wrap database calls in `try/catch` blocks. Handle loading states cleanly and provide user feedback for success/failure.
* **Modularity:** Break down large pages into smaller, reusable components (e.g., `SnippetCard`, `VersionTimeline`). Keep components in the `/app/components` directory.
* **Clean Code:** Write concise, readable code. Avoid deep nesting. 

## 4. AI Behavior & Output Directives
* **Context is King:** Before generating code, check the `database.types.ts` to ensure your data models match the actual backend.
* **Clean Overrides & Refactoring:** When modifying files, confidently replace outdated or redundant code. Do not leave multiple functions doing the same thing. Keep the file clean and lean.
* **Code First, No Fluff:** Skip step-by-step explanations of the logic. Output the finalized code immediately.
* **Rapid Dependency Handling:** If a solution requires a new npm package, assume it is approved. Provide the one-line install command at the very top and immediately write the code using that package. Do not wait for permission.