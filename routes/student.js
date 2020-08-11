const express = require('express');
const fs= require('fs');
const { get } = require('http');
const { Console } = require('console');
const router = express.Router();

// List all Students:
router.get('/', (req, res) => {
    console.log("In student.js");
    fs.readFile('data/student.json',(err,data)=>{
        if(err){
             res.json({

                 error: "Failed to read the file"
             });
        }

        data=JSON.parse(data);
        console.log(data);

        if(data.students.length ==0){
             res.json({
                 error:"No Student to display"
             });
        }
       
         res.json({
             data:data.students,
             success:true
         });
        

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