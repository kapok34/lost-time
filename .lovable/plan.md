# Proust Questionnaire Members Club — Build Plan

A private community where members share their answers to the classic 35-question Proust Questionnaire. New people apply by submitting all answers; you approve them. Approved members can browse profiles (filterable by language and location) and hold one active conversation at a time.

## Core Experience

### Public (not logged in)
- **Landing page** — short intro to what the club is, the spirit of the Proust Questionnaire, and an "Apply to join" CTA.
- **Apply page** — email + password + display name + language + location + all 35 questionnaire answers in one long form (with progress indicator and autosave to local storage so applicants don't lose work). On submit: account is created in a "pending" state and the user sees a "Thanks, you'll hear back by email" screen.
- **Login page**.

### Pending applicant
- Logs in and sees a single "Your application is under review" screen. No browsing access.

### Approved member
- **Browse / Members directory** — grid of member cards (avatar + display name + language + location). Filters at the top: Language (multi-select) and Location (text search + dropdown of existing values). Sort: newest, alphabetical.
- **Profile page** — avatar, display name, language, location, then all 35 questions and answers rendered as a clean Q&A list. "Message" button at the top.
- **Own profile / Settings** — edit avatar, display name, language, location, and any of the 35 answers. Change password.
- **Messages** — inbox showing the one active conversation (if any). Real-time chat thread. To start a new conversation with someone else, the member must first **end (archive) their current conversation** — confirmation dialog explains this clearly. The "Message" button on other profiles is disabled (with a tooltip "End your current conversation to message someone new") when an active conversation exists.

### Admin (you)
- **Admin dashboard** at `/admin`, gated by an admin role.
  - **Pending applications** queue: each entry shows the applicant's profile + all 35 answers. Approve / Reject buttons. Optional rejection note (sent by email).
  - **Members list**: search, suspend, or remove members.
  - Visibility into reported messages (basic report button on conversations).

## Key Rules

- **One active conversation per member, total.** Enforced both in UI and on the backend (database check + RLS). Ending a conversation archives it (kept in history, read-only) and frees the slot for both participants.
- **Profiles are only filterable by language and location** — no other filters exposed.
- **Only approved members can see other profiles or message.**
- **Language** is a controlled list (e.g., English, French, Spanish, German, Italian, Portuguese, …) so filtering works cleanly.
- **Location** is free-text "City, Country" with autocomplete from values already in the database.

## The 35 Classic Questions

The full Vanity Fair / Proust set, including: principal aspect of my personality; quality I desire in a man / in a woman; what I appreciate most in my friends; main fault; favorite occupation; idea of happiness; idea of misery; if not myself, who I'd be; where I'd like to live; favorite color and flower; favorite bird; favorite prose authors; favorite poets; favorite heroes/heroines in fiction and in real life; favorite composers; favorite painters; favorite virtue; favorite names; what I detest most; historical figures I despise most; military event I admire most; reform I admire most; natural gift I'd most like to possess; how I wish to die; present state of mind; faults for which I have most toleration; motto. (We'll lock the exact wording in during build — easy to tweak.)

## Visual Direction

Editorial, literary, calm. Serif headings (something like Cormorant or Playfair), generous whitespace, off-white background, subtle warm accent. Profile pages read like a magazine interview.

## Technical Notes

- **Backend:** Lovable Cloud (Supabase) with email/password + Google sign-in.
- **Database tables:**
  - `profiles` (id → auth.users, display_name, avatar_url, language, location, status: pending/approved/suspended, created_at)
  - `user_roles` (user_id, role) — separate table with `has_role()` security definer function for admin checks.
  - `questionnaire_answers` (user_id, question_id, answer) — 35 rows per member; question list stored as a constant in code.
  - `conversations` (id, member_a, member_b, status: active/archived, created_at, archived_at)
  - `messages` (id, conversation_id, sender_id, body, created_at, read_at)
  - `reports` (id, message_id, reporter_id, reason, created_at)
- **One-active-conversation enforcement:** partial unique index on `conversations` where `status='active'` keyed on each participant (using a helper table or trigger), plus an RLS-checked RPC `start_conversation(other_user_id)` that fails if either party already has an active one.
- **RLS:** profiles readable only by approved members; pending users only see their own row. Messages only readable by the two participants. Admin policies use `has_role(auth.uid(), 'admin')`.
- **Realtime:** Supabase Realtime on `messages` for live chat.
- **Email:** transactional emails for "application received," "approved," "rejected" via Lovable's built-in transactional email.
- **Admin bootstrap:** after first deploy, you'll grant yourself the `admin` role via a one-off SQL insert into `user_roles`.

## Build Order

1. Auth (email/password + Google), profiles table, pending status flow, landing + apply + login pages.
2. Questionnaire data model + apply form with all 35 questions and autosave.
3. Admin role, admin dashboard, approve/reject with email notifications.
4. Members directory + profile pages + language/location filters.
5. Settings page (edit profile + answers).
6. Messaging: conversations, one-active rule, real-time thread, end-conversation flow.
7. Reports + admin moderation tools, polish, empty states, mobile pass.

## Out of Scope (for v1)

- Likes, comments, follows, feeds.
- Group chats, voice/video.
- Public profile sharing outside the member wall.
- Payment / paid membership.
