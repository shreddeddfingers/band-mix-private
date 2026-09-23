# Bandmix — Band Management Platform

> A web-based, social-style band management platform for music schools, student ensembles, directors, and teachers.

---

## 🌟 Features Implemented

### 1. User Roles & Permission Hierarchy
- **Administrator (Teacher / Director)**:
  - Exclusive authority over rehearsal scheduling and practice planning.
  - Full CRUD operations over bands, rosters, and assignments.
  - **Mandated Presence**: Automatically included and locked into all group chats and band channels.
- **Student Members**:
  - Organized into student roles with assigned instrument badges.
  - Communicate within band chat channels and discuss availability; cannot schedule or modify rehearsal events directly.
- **Perspective Switcher**:
  - Live role switcher in the navbar allowing instant preview between Director Marcus Vance and diverse student musicians.

### 2. Onboarding & Tagged Roster System
- **Dynamic QR-Based Onboarding (`/onboard`)**:
  - Directors can generate on-the-fly QR codes and printable rehearsal room flyers.
  - Mobile-friendly intake wizard for students to register their primary instrument, secondary instruments, skill level (beginner, intermediate, advanced, expert), age bracket, and musical styles.
  - Direct-to-band QR passes that automatically enroll the student into a specific ensemble upon scanning.
- **Tagged Roster Directory (`/roster`)**:
  - Multi-attribute indexing and filtering:
    - Instruments: Drums, Bass, Vocals, Piano, Keyboard, Guitars, Horns.
    - Skill levels: Beginner, Intermediate, Advanced, Expert.
    - Musical styles: Rock, Jazz, Funk, Pop, Blues, Metal, etc.
    - Age brackets: Youth (<13), Teens (13–18), Adults (18+).
  - Quick action to assign any student to a band with designated instrument.

### 3. Band Management & Customization (`/bands`)
- **Band CRUD Operations**:
  - Create new ensembles with name, genre, description, target rehearsal windows, and cover artwork.
  - Slot-based member assignment by instrument.
  - Disband / delete bands with director confirmation.
- **Member Instrument Icons**:
  - Custom SVG iconography and color badges for:
    - 🥁 Drums
    - 🎸 Bass
    - 🎤 Vocals
    - 🎹 Piano
    - 🎛️ Keyboard
    - 🎸 Guitars
    - 🎺 Horns

### 4. Dedicated Band Chat Channels (`/bands/[id]`)
- Auto-generated chat channel for each band.
- **Mandated Director Presence**: Director is automatically pinned and badged with official supervisory status.
- Real-time message streaming with auto-scroll.
- Member instrument icons on every student message.
- Rehearsal availability quick chips for students to easily share schedule openings.
- Official rehearsal announcement banners pinned in chat.

### 5. Admin-Led Scheduling Workflow (`/schedule` & Band Hub)
- Director-only rehearsal planner:
  - Date, start time, end time, room/studio selection, target setlist songs, and preparation agendas.
  - Automated chat notification broadcast when a rehearsal is booked.
- Student read-only view with confirmed practice times, studio location, and setlist details.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 15 (App Router)
- **UI & Styling**: React 19, Tailwind CSS, Lucide Icons
- **Data & Real-Time**: Firebase SDK (Firestore + Authentication) with built-in Interactive Demo Store fallback
- **QR Generation**: `qrcode.react` (SVG)
- **Deployment**: Vercel ready

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Connect to Live Firebase (Optional)
Copy `.env.example` to `.env.local` and add your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```
*(If omitted, Bandmix runs in Interactive Demo Mode with pre-seeded ensembles, students, and chat history).*
