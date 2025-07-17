const Expenses = require("../models/expensemodel");

// add expense
const addExpense = async (req, res) => {
  try {
    const { expense_amount, expense_details, expense_date } = req.body;
    const newExpense = await Expenses.create({
      expense_amount,
      expense_details,
      expense_date,
    });
    res.status(201).json({
      message: "Expense added successfully",
      data: newExpense,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get all expenses
const getAllExpenses = async (req, res) => {
  try {
    const { date, from, to } = req.query;
    let filter = {};

    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.expense_date = { $gte: dayStart, $lte: dayEnd };
    }

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filter.expense_date = { $gte: fromDate, $lte: toDate };
    }

    const expenses = await Expenses.find(filter).sort({ expense_date: -1 });

    if (expenses.length === 0) {
      return res.status(200).json({
        message: "No expenses found for the given date or range",
        data: [],
      });
    }

    res.status(200).json({
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get single expense
const getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expenses.findById(id);
    res.status(200).json({
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { expense_amount, expense_details, expense_date } = req.body;
    const updatedExpense = await Expenses.findByIdAndUpdate(
      id,
      { expense_amount, expense_details, expense_date },
      { new: true }
    );
    res.status(200).json({
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExpense = await Expenses.findByIdAndDelete(id);
    res.status(200).json({
      message: "Expense deleted successfully",
      data: deletedExpense,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  addExpense,
  getAllExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
};
