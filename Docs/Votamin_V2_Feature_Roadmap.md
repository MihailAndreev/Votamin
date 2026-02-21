# Votamin -- Version 2 (V2) Feature Roadmap

This document defines all planned features for Version 2 of the Votamin
platform. Version 1 (MVP) focuses on core stability, architecture
clarity, and Capstone compliance. Version 2 builds on that foundation
with advanced functionality and scalability.

------------------------------------------------------------------------

# 1. Internationalization (Full i18n)

## Bulgarian Version (BG)

-   Full UI translation (EN + BG)
-   Language switcher in header
-   Store user language preference in profile
-   Dynamic date/time formatting per locale
-   Translated validation messages and notifications

------------------------------------------------------------------------

# 2. Advanced Survey Structure

## 2.1 Multiple Questions per Poll

-   One poll can contain multiple questions
-   Each question stored separately in DB
-   Ordered question positions
-   Navigation between questions (Next / Previous)

## 2.2 Mixed Question Types in One Poll

Allow different types within the same survey: - Single Choice - Multiple
Choice - Rating - Image Poll - Slider - Number Input

Requires DB restructuring: - questions table - question_type enum -
answers linked per question

------------------------------------------------------------------------

# 3. Countdown Timer

Replace static close text with: - Live countdown (days / hours /
minutes) - Auto-update when poll expires - Visual warning when near
closing - Automatic status change when expired

------------------------------------------------------------------------

# 4. Email Notifications

Extend notification system beyond in-app:

Send email when: - Someone votes - Poll reaches closing date - Poll
reaches certain vote count - Poll is shared

Implementation: - Supabase Edge Functions - Secure email provider
integration

------------------------------------------------------------------------

# 5. Public Explore Page

Dedicated public discovery page:

Sections: - Most Voted - Recently Closed - Trending - Editor Picks
(manual)

Filters: - By poll type - By popularity - By date

------------------------------------------------------------------------

# 6. Poll Templates

Predefined templates for quick creation:

Examples: - Event Feedback - Product Choice - Yes / No Quick Vote - Team
Decision - Rating Survey

Templates contain: - Pre-filled structure - Suggested answers - Default
settings

------------------------------------------------------------------------

# 7. Poll Duplication

-   "Duplicate Poll" action
-   Copy structure and settings
-   Reset votes
-   Save as draft automatically

------------------------------------------------------------------------

# 8. Advanced Analytics

Extend basic result summary with:

-   Percentage breakdown
-   Participation rate
-   Visual charts (bar, pie)
-   Export results as CSV
-   Export results as PDF

Optional: - Compare polls - Time-based analytics

------------------------------------------------------------------------

# 9. Enhanced Sharing

-   QR code generator
-   Expiring share links
-   Vote limit restriction (close after X votes)
-   Social media share buttons

------------------------------------------------------------------------

# 10. Theme Customization (Advanced)

Extend predefined themes:

-   Custom color picker
-   Font selection
-   Logo upload
-   Background image upload
-   Save custom theme preset

------------------------------------------------------------------------

# 11. Real-Time Results

-   Live vote updates
-   Supabase Realtime integration
-   No page refresh required
-   Multi-user synchronization

------------------------------------------------------------------------

# 12. Admin Panel (Advanced)

Extend MVP Lite admin with:

-   Moderate reported polls
-   Platform statistics dashboard
-   User banning
-   Promote / demote admins
-   Audit logs

------------------------------------------------------------------------

# 13. Optional Future (V3+ Direction)

-   Poll comments
-   Poll labels / categories
-   Follow polls
-   Poll collections
-   Public API access
-   Embeddable poll widget (iframe)
-   Advanced user reputation system

------------------------------------------------------------------------

# Architectural Notes

Version 2 assumes:

-   Clean modular architecture from V1
-   Translation-ready structure already implemented
-   Proper DB normalization
-   Separation of concerns (UI / Services / DB / Utils)
-   RLS policies already in place

------------------------------------------------------------------------

# Summary

Version 2 transforms Votamin from: → Simple, fast, clean polling tool

Into: → Feature-rich, scalable survey platform with analytics, real-time
updates, customization and multilingual support.
