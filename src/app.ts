import express from 'express';
import cors from 'cors';
import path from 'path';
import chartRouter  from './routes/chart';
import placesRouter from './routes/places';

const app = express();

// CORS — allow all origins for every method, including preflight OPTIONS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files — served from public/ in both local and Vercel environments.
// On Vercel, __dirname points inside the bundle so we use process.cwd() instead.
const publicDir = process.env.VERCEL
  ? path.join(process.cwd(), 'public')
  : path.join(__dirname, '../public');

app.use(express.static(publicDir));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hd-engine', version: '1.0.0' });
});

// API routes
app.use('/api/chart',  chartRouter);
app.use('/api/places', placesRouter);

export default app;
