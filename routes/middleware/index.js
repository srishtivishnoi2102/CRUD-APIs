const express = require('express');
const { to } = require('await-to-js');
const jwt = require('jsonwebtoken');


const salt = 'c3Jpc2h0aQo=';

const checkToken = (req,res,next)=>{
    const userToken=req.headers.token;
    console.log("User token::",userToken);
    if(!userToken){
        return res.json({
            data:null,
            error:"First Login/Signup"
        });
    }
    const data=verifyToken(userToken);
    console.log("verify  data::: ",data);
    if(data.email){
        console.log("Token verified");
        next();
    }
    else{
        return res.json({
        data:null,
        error:"Invalid Token"
    });
    }


}




const verifyToken=(token) =>{
    const data= jwt.verify(token, salt);
    return data;
}

module.exports= {
    checkToken
};