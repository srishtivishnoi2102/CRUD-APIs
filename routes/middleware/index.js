const { to } = require('await-to-js');
const jwt = require('jsonwebtoken');
const { use } = require('../courses');



const salt = 'c3Jpc2h0aQo';

const checkToken = (req,res,next)=>{
    console.log("Checking Token");
    const bearerHeader=req.headers["authorization"];
    if(bearerHeader!=undefined){
        const token= bearerHeader.split(" ")[1];
        const userData=verifyToken(token);

        if (userData.email){
            res.locals.id=userData.id;
            res.locals.email=userData.email;
            next();
        }else{
            return  res.status(401).json({
                success:false,
                msg: "Unauthorized"
            });
        }
    
    }else{
        return  res.status(400).json({
            success:false, 
            err : 'No token found'
        });
    }
}

const verifyToken=(token) =>{
    var err,data;
    data= jwt.verify(token, salt);
    if(err){
        console.log("Error in verifying token, ",{error:err});
        return  res.status(401).json({
            success:false,
            msg: "Unauthorized"
        });
    }
    // console.log("authorisation data :: ",data);
    return data;
}

module.exports = checkToken;