const express = require("express");
const {
  addExpense,
  getAllExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expensecontroller");

const router = express.Router();

router.route("/expenses").post(addExpense);
router.route("/expenses").get(getAllExpenses);
router.route("/expenses/:id").get(getExpense);
router.route("/expenses/:id").put(updateExpense);
router.route("/expenses/:id").delete(deleteExpense);

module.exports = router;
