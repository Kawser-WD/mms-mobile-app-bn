// // middleware/authMiddleware.js
// const jwt = require("jsonwebtoken");
// const DonationMember = require("../models/donationmembermodel");

// const protect = async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     try {
//       token = req.headers.authorization.split(" ")[1];

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await DonationMember.findById(decoded.id).select("-password");
//       next();
//     } catch (error) {
//       res.status(401).json({ error: "Not authorized, token failed" });
//     }
//   }

//   if (!token) {
//     res.status(401).json({ error: "Not authorized, no token" });
//   }
// };

// module.exports = { protect };

// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const DonationMember = require("../models/donationmembermodel");

const protect = async (req, res, next) => {
  let token;

  console.log("Auth Middleware: Initiating protection check."); // <-- Add this

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Auth Middleware: Token extracted:", token); // <-- Add this

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Auth Middleware: Token decoded (ID):", decoded.id); // <-- Add this

      req.user = await DonationMember.findById(decoded.id).select("-password");

      if (!req.user) {
        // <-- Important check
        console.log("Auth Middleware: User not found from decoded token ID."); // <-- Add this
        return res
          .status(401)
          .json({ error: "Not authorized, user not found" });
      }

      console.log(
        "Auth Middleware: User found and attached to req.user:",
        req.user.name
      ); // <-- Add this (or req.user._id)
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error(
        "Auth Middleware: Token verification failed:",
        error.message
      ); // <-- Add this for detailed error
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  } else {
    // <-- Add an else block here to catch cases where header is missing or malformed
    console.log(
      "Auth Middleware: No 'Bearer' token found in authorization header."
    ); // <-- Add this
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  // This 'if (!token)' block is redundant and potentially problematic
  // if the 'else' block above handles the 'no token' case correctly.
  // It's better to structure the `if/else` to avoid falling through.
  // However, for debugging now, let's keep it to see if it's hit.
  if (!token) {
    console.log(
      "Auth Middleware: Fallback check: Token is still null/undefined."
    ); // <-- Add this
    res.status(401).json({ error: "Not authorized, no token" });
  }
};

module.exports = { protect };
