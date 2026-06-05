import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // For local image rendering/file serving from APIs
}));

app.use(cors({
  origin: '*', // Customize for production: specify Next.js app host
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased limit so local frontend polling doesn't trigger 429
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later' },
});
app.use('/api', limiter);

// Mount API routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`⚡ DRIFT DECK BACKEND OS OPERATIONAL`);
  console.log(`⚡ LISTENING ON PORT: http://localhost:${PORT}`);
  console.log(`========================================================`);

  // Local development: Poll Telegram and forward to our webhook
  if (process.env.NODE_ENV !== 'production' && process.env.TELEGRAM_BOT_TOKEN) {
    console.log(`⚡ Starting local Telegram polling...`);
    const TelegramBot = require('node-telegram-bot-api');
    const localBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    
    localBot.on('message', (msg: any) => {
      fetch(`http://localhost:${PORT}/api/auth/telegram-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      }).catch(err => console.error('Local webhook forward failed:', err));
    });
  }
});
