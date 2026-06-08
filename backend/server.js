const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Shivanetra V12 is running',
        timestamp: new Date().toISOString()
    });
});

// Import routes (will add one by one)
// const userRoutes = require('./routes/userRoutes');
// const chartRoutes = require('./routes/chartRoutes');
// app.use('/api/users', userRoutes);
// app.use('/api/charts', chartRoutes);

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/../frontend/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`⚡ MARDUKH SYSTEM™ Shivanetra V12 running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
