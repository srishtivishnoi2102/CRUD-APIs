const express = require('express');
const fs= require('fs');
const { get } = require('http');
const { to } = require('await-to-js');
const { Console } = require('console');
const mydb=require("../lib/datacentre/mysql")
const router = express.Router();

// List all Students:
router.get('/', async(req, res) => {
    console.log("In student.js");
    
    const getAllStudentSql =`select id,name from users`;
    var err, response;
    [err, response]=await to(mydb.executeQuery(getAllStudentSql));
    if(err){
         console.log("Error in executing query, ",{error:err});
         return res.json({
             msg:`Error in executing query`,
             err:err
         });
     }
 
     return  res.json({
                 success:true,
                 data:{
                     students:response
                 },
                 err:null
             });


});

module.exports=router;