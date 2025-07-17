const donationmemberRoutes = require("./donationmemberRoute");
const donationRoutes = require("./donationRoute");
const expenseRoutes = require("./expenseRoutes");
const accountstatementRoutes = require("./accountstatementRoute");
const authRoutes = require("./authRoute");

module.exports = [
  donationmemberRoutes,
  donationRoutes,
  expenseRoutes,
  accountstatementRoutes,
  authRoutes,
];
