# Ajo Tracker

A production-ready daily contribution group (Ajo/Esusu) tracker built with Vite + React + Tailwind CSS.

## Features

- 📊 **Dashboard** — Total collected, days elapsed, progress bar, today's collector
- 👥 **Hands list** — All 30 hands with payout dates, paid days, status indicators
- 💰 **Log Payment** — Password-protected admin area for logging, editing & deleting payments
- ⚠️ **Defaults** — After 8pm, unpaid hands flagged as defaulted with ₦500 fine
- 🔄 **Swap Order** — Swap any two hands' payout positions
- 📤 **CSV Export** — Export all payment records
- 💾 **Persistent** — All data saved in localStorage
- 📱 **Mobile-first** — Optimized for Android phones

## Setup & Deploy

### Local Development

```bash
npm install
npm run dev
```

### Deploy to Vercel

1. Push this folder to a new GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**

No environment variables required.

## Default Admin Password

`3914`

Change it inside the app: Log tab → **Change PW**

## Customization

- **Start date**: Edit `START_DATE` in `src/App.jsx`
- **Daily amount**: Edit `DAILY_AMOUNT` (default: ₦1,000)
- **Fine amount**: Edit `FINE_AMOUNT` (default: ₦500)
- **Hands list**: Edit `INITIAL_HANDS` array
