const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Express server!');
});

// Load routes
app.use('/api/bikeActions', require('./routes/bikeActions'));
app.use('/api/rewardActions', require('./routes/rewardActions'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});