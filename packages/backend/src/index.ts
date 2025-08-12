import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Routes
import healthRouter from './routes/health';
import protectedRouter from './routes/protected';
import authRouter from './routes/auth';
import dogsRouter from './routes/dogs';
import tagsRouter from './routes/tags';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errors';

const app: express.Application = express();

// Configure CORS
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/dogs', dogsRouter);
app.use('/tags', tagsRouter);
app.use('/protected', protectedRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
