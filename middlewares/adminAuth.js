const tokenUtil = require('../utils/token');
const { Admin } = require('../model');


async function AuthMid(req,res,next){
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenUtil.verifyToken(token);

    const a = await Admin.findByPk(decoded.id);
    // console.log(a)
    if (!a) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.admin = a;


    next();
  } catch (error) {
    console.error('Authentication error:', error);
      
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }
      
    return res.status(401).json({ error: 'Invalid token' });
  }
}


module.exports = {AuthMid};
