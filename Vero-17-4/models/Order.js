"use strict";

const mongoose = require("mongoose");

/**
 * Order Schema
 * Tracks customer orders with status lifecycle and financial data.
 *
 * Status lifecycle:
 *   pending_review → preparing → delivering → completed
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["pending_review", "preparing", "delivering", "completed"],
        message: "Invalid order status: {VALUE}",
      },
      default: "pending_review",
    },
    items: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    customerName: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// Index for fast status-based aggregations
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
