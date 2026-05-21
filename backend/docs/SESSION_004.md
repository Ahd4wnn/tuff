# Session 004 — Auth Flow

## What was built
- Auth page with login/signup toggle, glassmorphism card, Tuff design system
- Onboarding flow: 4-step questionnaire (name, username, tagline, vision)
- useAuth hook: fetches profile, detects if onboarding is complete
- App.jsx updated: loading screen → auth gate → onboarding gate → app

## Flow
1. App loads → LoadingScreen plays
2. No session → /auth (login or signup)
3. New user → Onboarding (4 steps, saves to profiles table)
4. Returning user with profile → App shell + Dashboard

## Tables used
- profiles (full_name, username, tagline, vision_statement)
