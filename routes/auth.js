const express = require('express');
const bcrypt=require('bcrypt');
const mydb = require("../lib/datacentre/mysql");

const { post } = require('./courses');
const { to } = require('await-to-js');
const jwt = require('jsonwebtoken');
const router = express.Router();

let user;

const dbHandleError=(res,err)=>{
    console.log("Error in executing query, ",{error:err});
        return res.json({
            msg:`Error in executing query`,
            err:err
        });
}


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

    var err,response;
    const checkIfUserExistsSql=`SELECT * from users where email='${email}';`;
    [err,response]=await to(mydb.executeQuery(checkIfUserExistsSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length!=0){
        console.log("Email already registered");
        return res.json({
            success:false,
            msg:`Email ${email} already registered. Please Login`,
        });
    }

    const signupUserQuery=`INSERT INTO users (email, name, hashPassword) VALUES ( '${email}', '${username}', '${encryptedPassword}')`;

    [err,response]=await to(mydb.executeQuery(signupUserQuery));
    if(err){
        dbHandleError(res,err);
    }
    console.log("Successfully inserted data into user table::Signup Done");
    return  res.json({
        suceess:true,        
        msg:"signup successfull"
    });
});

const salt = 'c3Jpc2h0aQo';
const generateToken= (userDetails)=>{
    console.log(userDetails);
    const token = jwt.sign(userDetails, salt, {
        expiresIn:24*60*60*100
    })
    return token;

}


router.post('/login', async function(req, res){
    let {email,password}=req.body;
    var ifUserExistsSql=`select * from users where email = '${email}'`;
    var err,response;
    [err,response]=await to(mydb.executeQuery(ifUserExistsSql));
    if(err){
        dbHandleError(res,err);
    }
    
    if(response.length==0){
         return res.json({
             msg: "Email not registered, please signup first"
         });
    }
 
    const encryptedPassword= response[0]['hashPassword'];
    let isValid;
    [ err, isValid] = await to(
        bcrypt.compare(password, encryptedPassword)
    );
    console.log("Is valid:",isValid);
    if(!isValid){    
        return  res.json({
            msg:"Entered Password is incorrect"
        });
        
    }
    user={
        name:response[0]['name'],
        email:response[0]['email']
    };
    const token=generateToken(user);

    const loginSql= `UPDATE users SET loggedIn ='1'  WHERE email = '${email}'`;    
    console.log("login query ::",loginSql);
    [err,response]=await to(mydb.executeQuery(loginSql));
    if(err){
        dbHandleError(res,err);
    }
    return res.json({
        msg:"login successful",
        token:token,
        err:null
    });    
});

module.exports=router;
