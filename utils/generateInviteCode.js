const crypto = require("crypto");

const generateInviteCode = () => {
  return crypto.randomBytes(4).toString("hex"); 
};

module.exports = generateInviteCode;
