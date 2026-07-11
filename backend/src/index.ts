import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import searchRoutes from './routes/searchRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'LeadFinderPro Backend chal raha hai!' });
});

// Routes
console.log('Loading search routes...');
app.use('/api/search', searchRoutes);

app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} pe`);
});

export default app;