const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define(
  'Sale',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    paystack_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'sales',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = Sale;
