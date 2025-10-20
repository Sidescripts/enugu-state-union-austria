const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 12;

module.exports = {
  generateToken: function(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified
      },
      JWT_SECRET,
      { expiresIn: '1h' } // 1 hour expiration
    );
  },

  verifyToken: function(token) {
    return jwt.verify(token, JWT_SECRET);
  },

  hashPassword: function(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  comparePassword: function(password, hash) {
    return bcrypt.compare(password, hash);
  }

};
