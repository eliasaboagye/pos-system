const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { syncDatabase } = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Payment = require('./Payment');

User.hasMany(Sale, {
  foreignKey: 'user_id',
  as: 'sales',
});

Sale.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Sale.hasMany(SaleItem, {
  foreignKey: 'sale_id',
  as: 'items',
});

SaleItem.belongsTo(Sale, {
  foreignKey: 'sale_id',
  as: 'sale',
});

SaleItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

Product.hasMany(SaleItem, {
  foreignKey: 'product_id',
  as: 'saleItems',
});

Sale.hasOne(Payment, {
  foreignKey: 'sale_id',
  as: 'payment',
});

Payment.belongsTo(Sale, {
  foreignKey: 'sale_id',
  as: 'sale',
});

let initializationPromise;

async function seedAdminUser() {
  const adminExists = await User.findOne({ where: { username: 'admin' } });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin123', 10);

    await User.create({
      username: 'admin',
      password_hash: passwordHash,
      role: 'admin',
    });

    console.log('Admin seeded');
  }
}

async function initializeModels() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await syncDatabase();
      await seedAdminUser();
    })();
  }

  return initializationPromise;
}

module.exports = {
  sequelize,
  User,
  Product,
  Sale,
  SaleItem,
  Payment,
  initializeModels,
};
