# PawPal 🐕

**Mission**: Reduce the street dog population humanely by connecting community feeders/residents with prospective adopters.

## Features ✨

### Core Functionality
- **Dog Listings**: Browse available dogs with photos, health info, and personality traits
- **User Authentication**: Secure login/signup with Supabase Auth
- **Advanced Search**: Filter by location, energy level, compatibility, and personality tags
- **Adoption Requests**: Submit and manage adoption requests with messaging

### Step 7: Adoption Management System
- **Dashboard**: Dual-role interface for caretakers and adopters
- **Request Workflow**: Approve/decline adoption requests with status tracking
- **Contact Revelation**: Automatic contact sharing upon approval
- **Notifications**: Visual indicators for pending requests

### Step 8: Enhanced Media & Visibility
- **Video Support**: Upload videos or link from YouTube, Google Drive, Vimeo
- **Adopter Status Banners**: Real-time request status on dog detail pages
- **Caretaker Contact**: Prominent contact display for approved requests
- **Enhanced UI**: Modern tab design with count chips and smooth animations

### Technical Features
- **Real-time Updates**: Live status changes across the platform
- **Mobile Responsive**: Optimized for all device sizes
- **File Uploads**: Supabase Storage integration for images and videos
- **Row Level Security**: Secure data access with Supabase RLS policies
- **API Documentation**: Comprehensive backend API with health checks

## Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express + TypeScript + Supabase
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (images & videos)
- **Package Manager**: pnpm workspaces

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm 8+

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Setup**
   ```bash
   # Copy example env files
   cp packages/frontend/.env.example packages/frontend/.env.local
   cp packages/backend/.env.example packages/backend/.env
   
   # Update with your Supabase credentials
   ```

3. **Start development**
   ```bash
   pnpm dev
   ```

   This runs:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000

### Available Scripts

- `pnpm dev` - Start both apps in development mode
- `pnpm build` - Build both apps for production
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier

### Health Check

Test the backend API:
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "ok": true,
  "service": "pawpal-api"
}
```

## Project Structure

```
pawpal/
├── packages/
│   ├── frontend/          # React + Vite app
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   │   ├── DogCard.tsx       # Dog listing card
│   │   │   │   ├── VideoUploader.tsx # Video upload component
│   │   │   │   ├── TagMultiSelect.tsx # Tag selection
│   │   │   │   └── Navbar.tsx        # Navigation
│   │   │   ├── pages/         # Route components
│   │   │   │   ├── Home.tsx          # Dog browsing
│   │   │   │   ├── PostDog.tsx       # Create listing
│   │   │   │   ├── DogDetails.tsx    # Dog profile page
│   │   │   │   ├── Dashboard.tsx     # Adoption management
│   │   │   │   └── Auth/             # Login/Signup
│   │   │   ├── lib/           # Utilities & API
│   │   │   │   ├── api.ts            # API client
│   │   │   │   ├── supabase.ts       # Supabase client
│   │   │   │   └── upload.ts         # File upload utilities
│   │   │   └── store/         # State management
│   │   │       └── useAuthStore.ts   # Auth state
│   │   └── ...
│   ├── backend/           # Express API
│   │   ├── src/
│   │   │   ├── routes/        # API endpoints
│   │   │   │   ├── dogs.ts           # Dog CRUD operations
│   │   │   │   ├── auth.ts           # Authentication
│   │   │   │   ├── protected.ts      # Adoption requests
│   │   │   │   └── health.ts         # Health check
│   │   │   ├── lib/           # Business logic
│   │   │   │   ├── dogs.ts           # Dog data layer
│   │   │   │   ├── users.ts          # User operations
│   │   │   │   └── supabase.ts       # Database client
│   │   │   ├── middleware/    # Auth & error handling
│   │   │   └── types/         # TypeScript definitions
│   │   └── ...
│   └── supabase/         # Database schemas & policies
│       ├── schema.sql        # Table definitions
│       ├── policies.sql      # Row Level Security
│       ├── storage.sql       # Storage buckets & policies
│       └── seed.sql          # Sample data
├── package.json      # Root workspace config
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration  
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user profile

### Dogs
- `GET /dogs` - Get all dogs with optional filters (location, energy, tags)
- `POST /dogs` - Create new dog listing (authenticated)
- `GET /dogs/:id` - Get specific dog with full details
- `PUT /dogs/:id` - Update dog listing (owner only)
- `DELETE /dogs/:id` - Delete dog listing (owner only)

### Adoption Requests
- `GET /adoption-requests` - Get user's adoption requests (authenticated)
- `POST /adoption-requests` - Submit new adoption request (authenticated)
- `PUT /adoption-requests/:id` - Update request status (caretaker only)
- `GET /adoption-requests/status/:dogId` - Check user's request status for dog

### Utility
- `GET /health` - API health check
- `GET /tags` - Get available personality tags

## Documentation

- **API Reference**: Comprehensive endpoint documentation above
- **Step 8 Details**: See `packages/backend/README_STEP8.md` for video system and adopter visibility implementation
- **Database Setup**: Check `supabase/` directory for schema, policies, and seed data
- **Environment Setup**: Follow environment variable configuration below

## Environment Variables

### Frontend (.env.local)
- `VITE_API_BASE` - Backend API URL (default: http://localhost:4000)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon public key

### Backend (.env)
- `PORT` - Server port (default: 4000)
- `CORS_ORIGIN` - Frontend URL for CORS (default: http://localhost:5173)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Development

To change the API base URL, update `VITE_API_BASE` in `packages/frontend/.env.local`.

## License

MIT
