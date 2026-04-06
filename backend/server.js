const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeModels } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'POS API running' });
});

async function startServer() {
  try {
    await initializeModels();

    app.listen(PORT, () => {
      console.log(`POS server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
