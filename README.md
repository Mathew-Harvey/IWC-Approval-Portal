# IWC Approval Portal

**In-Water Cleaning Notification Package Generator**  
Franmarine Underwater Services

## Overview

A comprehensive web application for generating IWC (In-Water Cleaning) documentation packages including Work Method Statements (WMS), Safe Work Method Statements (SWMS), Emergency Response Plans (ERP), and WHS Management Plans.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (SPA)                        │
│   HTML/JS/CSS with Handlebars templates                     │
│   Google OAuth Login  │  Form Validation  │  PDF Generation  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend                        │
│   API Routes  │  Passport.js Auth  │  Session Management    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL 17 (Render)                    │
│   Users  │  Jobs  │  Crew  │  Vessels  │  Documents          │
└─────────────────────────────────────────────────────────────┘
```

## Features

- 🔐 **Google OAuth Authentication** - Secure sign-in, no passwords
- 📋 **Job Management** - Create, save, and track IWC jobs
- 👥 **Crew Database** - Manage team members with certification tracking
- 🚢 **Vessel Database** - Store and reuse vessel information
- 📄 **Document Generation** - WMS, SWMS, ERP, WHSMP templates
- 🌏 **Multi-Jurisdiction** - AU-WA, NZ, SG, US-CA, JP support
- 💾 **Autosave** - Never lose your work
- 📊 **Progress Tracking** - Form completion indicator

## Tech Stack

- **Frontend**: Vanilla JS, Handlebars.js, CSS3
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL 17 with Prisma ORM
- **Auth**: Google OAuth 2.0 via Passport.js
- **Hosting**: Render.com

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 17 (or Render database)
- Google Cloud Console project with OAuth credentials

### Local Development

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd iwc-approval-portal
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your values
   ```

3. **Set up database:**
   ```bash
   npm run db:generate   # Generate Prisma client
   npm run db:push       # Push schema to database
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   ```
   http://localhost:3000
   ```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session encryption key (32+ chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `CLIENT_URL` | Frontend URL (for CORS) |

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://your-app.onrender.com/api/auth/google/callback` (production)
5. Copy Client ID and Client Secret to `.env`

## Deployment to Render

### Automatic (Blueprint)

1. Connect your GitHub repo to Render
2. Use the `render.yaml` blueprint
3. Add environment variables in Render dashboard
4. Deploy!

### Manual

1. **Create PostgreSQL database:**
   - Add > New PostgreSQL
   - Name: `iwc-portal-db`
   - PostgreSQL Version: 17

2. **Create Web Service:**
   - Add > New Web Service
   - Connect repository
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`

3. **Configure Environment Variables:**
   - `DATABASE_URL`: From PostgreSQL dashboard (Internal URL)
   - `SESSION_SECRET`: Generate secure random string
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `GOOGLE_CALLBACK_URL`: `https://your-app.onrender.com/api/auth/google/callback`
   - `CLIENT_URL`: `https://your-app.onrender.com`
   - `NODE_ENV`: `production`

## Project Structure

```
iwc-approval-portal/
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Database seed script
├── public/               # Frontend static files
│   ├── css/
│   ├── js/
│   │   ├── services/     # API, Auth, Storage
│   │   ├── jurisdictions/ # Multi-jurisdiction configs
│   │   └── utils/        # Form enhancements
│   ├── img/
│   ├── index.html        # Main application
│   └── login.html        # Login page
├── server/
│   ├── config/
│   │   └── passport.js   # OAuth configuration
│   ├── middleware/
│   │   └── auth.js       # Auth middleware
│   ├── routes/
│   │   ├── auth.js       # Login/logout routes
│   │   ├── jobs.js       # Job CRUD
│   │   ├── crew.js       # Crew management
│   │   ├── vessels.js    # Vessel database
│   │   └── users.js      # User settings
│   └── index.js          # Express server
├── package.json
├── render.yaml           # Render deployment config
└── env.example           # Environment template
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Jobs
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Crew
- `GET /api/crew` - List crew members
- `POST /api/crew` - Add crew member
- `PUT /api/crew/:id` - Update crew member
- `DELETE /api/crew/:id` - Delete crew member

### Vessels
- `GET /api/vessels` - List vessels
- `POST /api/vessels` - Add/update vessel
- `GET /api/vessels/imo/:imo` - Get by IMO

### User
- `GET /api/users/profile` - Get profile
- `GET /api/users/settings` - Get settings
- `PUT /api/users/settings` - Update settings
- `GET /api/users/dashboard` - Dashboard stats

## Document Types

| Document | Purpose |
|----------|---------|
| **WMS** | Work Method Statement - scope and procedures |
| **SWMS** | Safe Work Method Statement - hazards and controls |
| **ERP** | Emergency Response Plan - emergency procedures |
| **WHSMP** | WHS Management Plan - safety management system |

## Multi-Jurisdiction Support

The application supports different regulatory frameworks:

| Code | Region | Key Regulations |
|------|--------|-----------------|
| `AU-WA` | Western Australia | WHS Reg 2025, Biosecurity Act |
| `NZ` | New Zealand | HSWA 2015, Biosecurity Act |
| `SG` | Singapore | WSH Act, MPA regulations |
| `US-CA` | California, USA | Cal/OSHA, EPA Clean Water |
| `JP` | Japan | Industrial Safety, Port laws |

## License

Proprietary - Franmarine Underwater Services

## Support

For technical support, contact:
- Perth Office: 08 9437 3900
- NSW Office: 02 7228 9691
