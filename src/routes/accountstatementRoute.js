const express = require("express");
const {
  getAccountStatement,
} = require("../controllers/accountstatementcontroller");
const {
  getFinanceSummary,
  getFinancialReport,
} = require("../controllers/financesummarycontroller");

const router = express.Router();

router.post("/statement", getAccountStatement);
router.get("/summary", getFinancialReport);

module.exports = router;
