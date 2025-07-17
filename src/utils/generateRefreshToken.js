const crypto = require("crypto");

const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  return { resetToken, resetTokenHash };
};

module.exports = generateResetToken;
