const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

let syncPromise;

async function syncDatabase() {
  if (!syncPromise) {
    syncPromise = sequelize.sync({ alter: true }).then(() => {
      console.log('Database synced');
    });
  }

  return syncPromise;
}

module.exports = sequelize;
module.exports.syncDatabase = syncDatabase;
