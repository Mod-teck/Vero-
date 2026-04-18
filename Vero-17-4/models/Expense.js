'use strict';

const mongoose = require('mongoose');

/**
 * Expense Schema
 * Records business expenses for profit/loss calculation in analytics.
 */
const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
