const express = require('express');
const fs= require('fs');
const { strict } = require('assert');
// const { get } = require('http');
const router = express.Router();
const {checkToken}=require('./middleware/index');



// List all courses:
router.get('/', checkToken, (req, res,next) => {

    fs.readFile('data/courses.json',(err,data)=>{
        if(err){
            return res.json({
                 error: "Failed to read the file"
             });
        }
        console.log(data);

        data=JSON.parse(data);
        // console.log(data);
        // console.log(data.courses);
        if(data.courses.length ==0){
             return res.json({
                 success: false,
                 message:"No course to display"
             });
        }
        // console.log(data);
        const courseList=[];
        data.courses.forEach(course => {
            courseList.push({
            "id":course.id,
            "name":course.name
            });
        });
         return res.json({
             "data":courseList,
             "error":null
         });
        

    });
});

// Get information about course of given courseid
router.get('/:courseid',checkToken, (req, res) => {
    const courseid= parseInt(req.params.courseid);
    fs.readFile('data/courses.json',(err,data)=>{
        if(err){
             res.json({
                 "error": "Failed to read the file"
             });
        }
        data=JSON.parse(data);
     
        if(data.courses.length ==0){
             res.json({
                 "error":"No course to display"
             });
        }
        
        if(courseid>0  && courseid<=data.courses.length){
            return  res.json(data.courses[courseid-1]);
        }
        return res.json({
             "error":"No course available with course id "
         });
        

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