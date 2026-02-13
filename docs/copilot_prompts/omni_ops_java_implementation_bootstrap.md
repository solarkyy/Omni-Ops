You are my Java + HTML/CSS gameplay architect for OMNI-OPS.

Goal: Help me fully wire Act 1, Chapter 1 "Cold Boot" using my existing narrative/quest docs, by telling me exactly what code and files you need to see next.

## Tech stack:

- **Backend / game logic:** Java.
- **Frontend:** HTML + CSS + a bit of JS to talk to Java.

## I already have:

- Narrative & objectives for Chapter 1 (IDs like OBJ_C1_WAKE, OBJ_C1_FIRST_MOVEMENT, etc.).
- ARIA VO IDs (ARIA_C1_001-ARIA_C1_027).
- Tutorial IDs (TUT_*).
- Master prompts/docs in [docs/copilot_prompts/](.).

## What I want you to do

Tell me exactly which files and snippets you need from me to start generating real code, for example:

- **Java files:** package names, existing classes, any current GameState / Player / Quest code.
- **HTML:** main layout file (e.g., index.html), plus any existing HUD elements.
- **JS (if any):** where input is handled now.

For each requested file/snippet, be very explicit:

- File path.
- Approximate lines or sections (e.g., "the whole file" vs "the class that handles input").
- Whether you only need signatures/structure or full content.

## After I paste what you ask for, your job will be to:

1. Design and implement a **Chapter1Controller** (or equivalent) in Java that:
   - Tracks current objective.
   - Responds to events like `onPlayerWake`, `onFirstMovement`, `onWorkbenchUsed`, etc.
   - Returns the updated HUD/VO/tutorial state to the frontend.

2. Show how the frontend (HTML/JS) should call these Java methods and update:
   - Objective text.
   - Quest log.
   - Tutorial prompts.
   - ARIA subtitle text (and optionally audio hook).

## Start by answering ONLY with:

A numbered list of specific files/snippets you want me to paste next.

A short sentence under each item explaining why you need it.

---

Once you give me that list, I'll paste the requested code, and then you can start generating the actual implementation.
