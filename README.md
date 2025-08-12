# PawPal 🐕

**Mission**: Reduce the street dog population humanely by connecting community feeders/residents with prospective adopters.

## Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express + TypeScript + Supabase
- **Database**: Supabase (PostgreSQL)
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
│   ├── frontend/     # React + Vite app
│   └── backend/      # Express API
├── package.json      # Root workspace config
└── README.md
```

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
