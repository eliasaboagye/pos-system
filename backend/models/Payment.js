const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'sales',
        key: 'id',
      },
    },
    paystack_reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GHS',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = Payment;
