import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Create Express app
const app = express();

// Environment variables with defaults
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'development' ? CORS_ORIGIN : false,
  credentials: true,
}));

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({
    ok: true,
    service: 'pawpal-api',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Basic API info
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    name: 'PawPal API',
    version: '0.1.0',
    description: 'Connecting street dogs with loving homes',
    endpoints: {
      health: '/health',
    },
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

export default app;
