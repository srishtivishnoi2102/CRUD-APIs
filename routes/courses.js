const express = require('express');
const fs= require('fs');
const { strict } = require('assert');
const { to } = require('await-to-js');

// const { get } = require('http');
const router = express.Router();
const checkToken=require('./middleware/index');
const mydb=require("../lib/datacentre/mysql");
router.use(checkToken);



// List all courses:
router.get('/', checkToken, async(req, res,next) => {
    
   const getAllCoursesSql =`select id,name,description from courses`
   var err, response;
   [err, response]=await to(mydb.executeQuery(getAllCoursesSql));
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
                    courses:response
                },
                err:null
            });

    
});

// Get information about course of given courseid
router.get('/:courseid',checkToken, async(req, res) => {
    const courseid= parseInt(req.params.courseid);

    const getAllCoursesSql =`select * from courses where id='${courseid}'`
   var err, response;
   [err, response]=await to(mydb.executeQuery(getAllCoursesSql));
   if(err){
        console.log("Error in executing query, ",{error:err});
        return res.json({
            msg:`Error in executing query`,
            err:err
        });
    }
    
    if(response.length==0){
         return res.json({
             success:false,
             msg: "No course exist with the requested id"
         });
    }

    response=response[0];
    const enrolledStudentSql= `SELECT enrollment.studentId,users.name FROM enrollment JOIN users WHERE enrollment.studentId=users.id and enrollment.courseid='${courseid}'`;
    var enrolledStudents;
    [err,enrolledStudents]= await to (mydb.executeQuery(enrolledStudentSql));
    if(err){
        console.log("Error in executing query, ",{error:err});
        return res.json({
            msg:`Error in executing query`,
            err:err
        });
    }
    response['enrolledStudent']=enrolledStudents;
    console.log(response);
    return  res.json({
                success:true,
                data:{
                    courses:response
                },
                err:null
            });

    
    
});

// Add a course
router.post('/', (req, res) => {
    const name = req.body.name;
    const description= req.body.description;
    const availableSlots=req.body.availableSlots;

    if(!name || !description || !availableSlots || parseInt(availableSlots)<1){
         return res.send({
             Error:"Invalid Payload"
         });
    }
    fs.readFile('data/courses.json', (err, data) => {
        if (err) {
             return res.json({
                 Error:"Unable to access file"
             });
        }
        data= JSON.parse(data);
        var courses=data.courses;
        const id=courses.length + 1;
        const new_course= {
            id:String(id),
            name: name,
            description: description,
            enrolledStudents: [],
            availableSlots: availableSlots
        }
        courses.push(new_course);
        const JSONObj= {
            courses : courses
        }
        courses = JSON.stringify(JSONObj, null, 2);

        fs.writeFile('data/courses.json', courses, (err) => {
            if (err) {
                 res.json("Error in writing in file");
            }
             res.json("Course added successfully");
        });

       
    });



});

// Enroll student in course  “/courses/{courseId}/enroll”
router.post('/:courseId/enroll', (req, res) => {
    const courseId= req.params.courseId;
    const studentId=req.body.studentId;

    var coursesData=JSON.parse(fs.readFileSync("data/courses.json"));
    var studentData=JSON.parse(fs.readFileSync("data/student.json"));

    if(courseId<1 || courseId> coursesData.courses.length){
        return  res.json({
            success:false,
            message: `No course exists with course id - ${courseId}`
        });
    }
    const course=coursesData.courses[courseId-1];


    if(studentId<1 || studentId> studentData.students.length){
        return  res.json({
            success:false,
            error: `No student exists with studentId - ${studentId}`
        });
    }
    const student=studentData.students[studentId-1];
    
    if(course.availableSlots<1){
        return  res.json({
            success : false,
            message: "No slot is available"
        });
    }
    course.enrolledStudents.push({id:student.id, name:student.name});
    course.availableSlots= String(parseInt(course.availableSlots)-1);
    coursesData.courses[courseId-1]=course;
    jsonData = JSON.stringify(coursesData, null, 2);
    fs.writeFile("data/courses.json", jsonData,() => {
      res.json({ success: true, message:"successfully enrolled" });
    });



});

//Remove a student from course  |   Method: “PUT”  |  Path: “/courses/{courseId}/deregister”
router.put('/:courseId/deregister', (req, res) => {

    const courseId= req.params.courseId;
    const studentId=req.body.studentId;

    var coursesData=JSON.parse(fs.readFileSync("data/courses.json"));

    if(courseId<1 || courseId> coursesData.courses.length){
        return  res.json({
            success:false,
            error: `No course exists with course id - ${courseId}`
        });
    }
    const course=coursesData.courses[courseId-1];
    const newEnrolledStudent=[];
    course.enrolledStudents.forEach(student => {
        if(student.id!=studentId){
            newEnrolledStudent.push(student);
        }
    });
    if(course.enrolledStudents.length ==newEnrolledStudent.length){
         res.json({
             success : false,
             message : `Student with studentId ${studentId} is not enrolled in course with courseId - ${courseId}`
         });
    }
    course.enrolledStudents=newEnrolledStudent;
    course.availableSlots =String(parseInt(course.availableSlots)+1);

    coursesData.courses[courseId-1]=course;
    jsonData = JSON.stringify(coursesData, null, 2);
    fs.writeFile("data/courses.json", jsonData,() => {
      res.json({ success: true, message:"successfully removed the enrollment" });
    });

    


});

module.exports=router;