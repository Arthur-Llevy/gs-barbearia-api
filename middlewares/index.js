const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const secret = process.env.SECRET;

let middlewares = {

  verifyToken: async (req, res, next) => {
    try {      	
      decoded = jwt.verify(req.headers['token'], secret);            
      req.decoded = decoded;      
      next();
    } catch (error) {      	      
      res.status(401).json({message: 'Você não tem permissão para executar essa ação.'})
    }
  }
};

module.exports = middlewares;
