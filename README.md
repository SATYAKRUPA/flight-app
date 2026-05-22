# ✈️ FlightApp - Flight Management PWA

A full-stack flight booking web application built with Next.js 14, Supabase, and Zustand.

## 🚀 Live Demo
[Deploy link here after Vercel deploy]

## 🛠️ Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **State Management:** Zustand with persist middleware
- **Deployment:** Vercel

## ✨ Features
- 🔍 Flight search by origin, destination, and date
- 💺 Interactive seat map with real-time availability
- 📋 Passenger details collection
- 🎫 PNR code generation on booking confirmation
- 📅 Reschedule bookings with fee calculation
- ❌ Cancel bookings (blocked within 2 hours of departure)
- 🔐 Supabase Auth with Row Level Security

## 🗄️ Zustand Store Structure

### useFlightStore
- `searchQuery` — active search (origin, destination, date, passengers, class)
- `selectedFlight` — currently selected flight
- `selectedSeat` — optimistically selected seat
- `bookingStep` — current step in booking flow
- `passengerForm` — passenger details (passport_no excluded from localStorage via partialize)
- `resetStore()` — resets all state on booking cancel or logout

### useUserStore
- `session` — Supabase auth session (only token persisted)
- `cachedBookings` — cached bookings for offline access
- `resetUser()` — clears session on logout

## 📦 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/SATYAKRUPA/flight-app.git
cd flight-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials in `.env.local`

### 4. Setup Supabase
- Create a new project at [supabase.com](https://supabase.com)
- Run SQL files in order from `/supabase/migrations/`
- Enable Realtime on `seats` table in Supabase dashboard

### 5. Run the development server
```bash
npm run dev
```

## 🔑 Test Credentials
- **Email:** test@flightapp.com
- **Password:** Test@1234

## 🗃️ Supabase Configuration
- **Project URL:** https://usjudqxksadfjyhzruey.supabase.co
- Enable Realtime on `seats` table: Supabase Dashboard → Database → Replication → `seats` table enable cheyyi

## 📁 Project Structure
flight-app/
├── app/
│   ├── (auth)/          # Login, Signup pages
│   ├── (main)/          # Protected pages
│   │   ├── search/      # Flight search
│   │   ├── flights/     # Search results
│   │   ├── booking/     # Seats, Passengers, Confirmation
│   │   └── my-bookings/ # Booking management
│   └── auth/logout/     # Logout route
├── components/
│   ├── seat-map/        # Interactive seat grid
│   └── ui/              # Reusable components
├── lib/supabase/        # Supabase client setup
├── store/               # Zustand stores
└── supabase/migrations/ # SQL migration files

## 🔒 Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own bookings
- Passport numbers excluded from localStorage via Zustand partialize
- Service role key never exposed to client