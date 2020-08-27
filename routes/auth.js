const express = require('express');
const bcrypt=require('bcrypt');
const { post } = require('./courses');
const { to } = require('await-to-js');
const jwt = require('jsonwebtoken');
const router = express.Router();

let user;



const encryptPassword = async(password) => {
    const saltRounds = 12;
    const [err,encryptedPassword] = await to(bcrypt.hash(password, saltRounds));
    console.log("encryptedPassword::",encryptedPassword);
    if(err){
        console.log("Error while generating password hash",{error:err});
        throw Error('Error while generating password hash');
    }
    return encryptedPassword;

}

router.post('/signup', async function (req, res)  {
    let {username, email, password}=req.body;
    const encryptedPassword= await encryptPassword(password);
    user={
        username,
        email,
        encryptedPassword
    }
    return res.json({
        msg:"success",
        data:{user},
        err:null

    });
});

const salt = 'c3Jpc2h0aQo=';
const generateToken= (userDetails)=>{
    const token = jwt.sign(userDetails, salt, {
        expiresIn:24*60*60*100
    })
    return token;

}


router.post('/login', async function(req, res){

    let {email,password}=req.body;
    let err, isValid;
    [ err, isValid] = await to(
        bcrypt.compare(password, user.encryptedPassword)
    );

    if(isValid){

            return res.json({
            msg:"login successful",
            token:generateToken(user),
            data:{
                email,
                password
            }
    
        });


    }

    return  res.json({
        msg:"Invalid user"
    });
    
});

module.exports=router;
