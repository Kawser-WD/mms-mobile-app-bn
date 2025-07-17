const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    expense_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    expense_details: {
      type: String,
      required: true,
      trim: true,
    },
    expense_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expenses = mongoose.model("expense", expenseSchema);

module.exports = Expenses;
