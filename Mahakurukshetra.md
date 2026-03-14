# 🚀 AI Mahakurukshetra — Participant Guide
### Vibe Coding Hackathon | March 14, 2026 | 10 Hours | Build. Deploy. Launch.

---

## 📋 Event Overview

| | |
|---|---|
| **Date** | March 14, 2026 |
| **Duration** | 10 Hours |
| **Format** | Solo — every participant is a single-person team |
| **Stack** | Next.js + Supabase (mandatory) |
| **Deployment** | Vercel (mandatory) |
| **AI Tools** | Claude CLI or Codex CLI (mandatory — one of these must be used) |

You will design, build, and deploy a working SaaS application using AI-assisted development within the 10-hour window. All work — code, deployment, video, and submission — must be completed before the deadline.

---

## 🧭 Overall Flow

1. Sign up on Product Hunt today (if not done)
2. Pick your project definition on the event platform
3. Create GitHub repo in the Bacancy org
4. Build using Claude CLI or Codex CLI
5. Set up Supabase and add seed data
6. Deploy on Vercel
7. Record 5-minute demo video
8. Submit all links on the event platform
9. Launch on Product Hunt on your assigned date

---

## 0️⃣ Product Hunt Setup (Do This Today)

Every participant must create a Product Hunt account **before** the hackathon. Accounts created on launch day are flagged as suspicious. Do this now so your account has time to build credibility.

### Create Your Account
- Go to [producthunt.com](https://producthunt.com)
- Sign up using your **Bacancy email address only**
- Add a real profile photo
- Write a short bio (even one sentence is fine)
- Follow at least 5–10 products to look like an active account

### Your Launch Date
You will be assigned a specific Product Hunt launch date by the organizers. Launches are staggered so each product gets proper visibility. **Do not launch before your assigned date.**

---

## 1️⃣ Pick Your Project Definition

Go to the event platform and browse available definitions. Each definition includes:
- **Product definition** — what it does and who it's for
- **Alternatives** — existing tools or competitors
- **Category** — the problem space

Up to two participants can pick the same definition. If you submitted a definition that was approved, it is automatically assigned to you.

You may refine scope once building starts, but must stay aligned with the core definition.

---

## 2️⃣ Create GitHub Repository

Inside the Bacancy GitHub organization:

1. Create a new **public** repository
2. Use the naming format: `[format provided by organizers]`
3. Add a README with:
   - Product name
   - What it does
   - Which tool it is an alternative to

---

## 3️⃣ Build With AI CLI Tools

You must use one of these two tools for all development. Manual coding is allowed only where AI assistance is not practical (e.g. env variable setup).

### Option A — Claude CLI (your own account)
If you already have Claude CLI set up from client work, use that. This is the recommended option for most participants.

### Option B — Codex CLI (Bacancy provides access)
If you don't have Claude CLI, Bacancy will provide Codex CLI access. Credentials will be shared on hackathon day.

### Initial Prompt to Get Started

```
Build a production-ready Next.js application.

Requirements:
- Latest Next.js with App Router
- Clean, responsive UI
- Supabase integration (auth + database)
- Seed/demo data so the app looks populated on first visit
- Ready for Vercel deployment

Ask for any missing details before building.
```

### Tips
- Be specific in prompts — vague prompts produce vague code
- Iterate quickly — build → test → fix in tight loops
- Use AI to fix errors too — paste the error message directly into the CLI
- Don't spend more than 30 minutes stuck on one problem — use the troubleshooter chat

---

## 4️⃣ Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Save your database password
4. Go to **Settings → API** and copy your Project URL and Anon public key

### Connect to Your App

Ask your AI CLI tool:

```
Integrate Supabase into this project. Use environment variables 
NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. 
Implement authentication, database tables, and a seed data script.
```

---

## 5️⃣ Add Seed / Demo Data (Required)

Your deployed app must not be empty. Judges and Product Hunt visitors need to see a working, populated product.

Ask your AI CLI tool to create a seed script that inserts demo users, sample records, and dashboard data so the app looks real on first visit.

---

## 6️⃣ Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** and import your repo
3. Framework will auto-detect as Next.js
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy** and wait for the build to complete
6. Copy your live URL

### Before Recording Your Video, Verify:
- App loads correctly
- Login / signup works
- Database is connected and seed data is visible
- No console errors on core flows
- Mobile view is usable

---

## 7️⃣ Record 5-Minute Demo Video

**Maximum duration: 5 minutes.** Use Loom, OBS, or any screen recorder. Upload to Google Drive and set sharing to "Anyone with the link can view".

### Video Structure

| Section | Time | What to Cover |
|---|---|---|
| **Hook** | 0:00 – 0:30 | What problem does this solve? Who is it for? |
| **Product Demo** | 0:30 – 2:30 | Show the live app — key user flows, main features, data |
| **Tech Stack** | 2:30 – 3:30 | Next.js + Supabase + Vercel. Mention the AI CLI tool you used |
| **Why Better** | 3:30 – 4:30 | How is it different from existing alternatives? |
| **CTA** | 4:30 – 5:00 | End with one of the Bacancy CTAs below |

### Bacancy CTA — Use One at the End

Choose whichever fits your tone:

> *"Build fast. Scale smart. Stay secure. Connect with Bacancy and launch your application the right way."*

> *"Speed matters. Quality matters. Scale matters. If you want your application built quickly with enterprise-grade security and performance — Bacancy is your technology partner. Connect with us today."*

> *"Have an idea? Let's turn it into a powerful, scalable, and secure product — fast. Bacancy combines AI, cloud, and modern engineering to help you launch and scale without limits."*

---

## 8️⃣ Product Hunt Launch

You will receive an assigned launch date from the organizers. All launches are staggered across 30 days to maximize visibility for each product.

### Preparing Your PH Listing
- **Product name and tagline** — keep it clear and punchy
- **Short description** — what problem it solves and who it's for
- **Screenshots** — minimum 3, show the key screens
- **Demo video link** — link to your 5-minute video
- **Live URL** — your Vercel deployment
- **GitHub repo link**

### On Launch Day
- Post at **12:01 AM PST** on your assigned date for maximum exposure
- Share the link in the Bacancy Slack channel — your teammates will upvote
- Respond to every comment on PH — engagement boosts ranking
- Share on your personal LinkedIn and Twitter/X

PH ranking is one of the judging criteria — treat your launch seriously.

---

## 9️⃣ Final Submission

Submit on the event platform before the 10-hour deadline:

- GitHub repository link (public, in Bacancy org)
- Live deployed app URL (Vercel)
- Google Drive video link (anyone with link can view)
- Product Hunt listing URL

You may update your submission until the deadline. No changes accepted after.

---

## 🏆 Judging Criteria

| Criteria | What Judges Look For |
|---|---|
| **Product Hunt Ranking** | Upvotes, engagement, and comments on your launch day |
| **Functionality** | Core features work, no critical bugs, app is usable end-to-end |
| **Usability** | Clean UI, intuitive flows, seed data visible, mobile-friendly |
| **Code Quality** | Clean structure, readable code, good practices |
| **Code Security** | No exposed secrets, input validation, auth implemented correctly |
| **Video Quality** | Clear demo, good audio/video, follows the 5-section template |

---

## 🆘 Getting Help

If you're stuck, don't waste more than 15–20 minutes on one problem — use the **troubleshooter chat** inside the event platform. Troubleshooters are most available in the first hour and the final hour of the hackathon.

- Check the **FAQ in the event platform** first — common issues are already answered
- Use the **troubleshooter chat** for anything not covered
- For AI CLI issues — paste the full error message into your CLI before giving up

---

> **Build fast. Ship clean. Deploy working.**
> 
> Good luck. — Bacancy AI Mahakurukshetra 2026