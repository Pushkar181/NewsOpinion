const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Import routes
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const userRoutes = require('./routes/user');
const summarizeRoutes = require('./routes/summarize');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/user', userRoutes);
app.use('/api/summarize', summarizeRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

const PORT = 4000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/', (req, res) => {
    res.send('Welcome to NewsOpinions API');
});

app.get('/test', (req, res) => {
    res.send('Test route working');
  });
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 