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



// Add a student
router.post('/', (req, res) => {
    const name = req.body.name;


    if(!name){
         return res.send({
             error:"Invalid Payload"
         });
    }
    fs.readFile('data/student.json', (err, data) => {
        if (err) {
             return res.json({
                 error:"Unable to access file"
             });
        }
        data= JSON.parse(data);
        console.log(data);
        var students=data.students;
        const id=students.length + 1;
        const new_student= {
            id:String(id),
            name: name,
        }
        students.push(new_student);
        const JSONObj= {
            students : students
        }
        students = JSON.stringify(JSONObj, null, 2);

        fs.writeFile('data/student.json', students, (err) => {
            if (err) {
                 res.json({success:false,error:"Error in writing in file"});
            }
             res.json({success:true,error:"student added successfully"});
        });

       
    });



});




module.exports=router;