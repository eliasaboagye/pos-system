const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeModels } = require('./models');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const paymentsRouter = require('./routes/payments');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', salesRouter);
app.use('/api/payments', paymentsRouter);

app.get('/', (req, res) => {
  res.json({ status: 'POS API running' });
});

async function startServer() {
  try {
    await initializeModels();

    app.listen(PORT, () => {
      console.log('POS server running on port ' + PORT);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
