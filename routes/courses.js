const express = require('express');
const fs= require('fs');
const { strict } = require('assert');
const { to } = require('await-to-js');

// const { get } = require('http');
const router = express.Router();
const checkToken=require('./middleware/index');
const mydb=require("../lib/datacentre/mysql");
const { response } = require('express');

router.use(checkToken);

const dbHandleError=(res,err)=>{
    console.log("Error in executing query, ",{error:err});
        return res.json({
            msg:`Error in executing query`,
            err:err
        });
}

// List all courses:
router.get('/', async(req, res,next) => {
    
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
router.get('/:courseid', async(req, res) => {
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

    // calculating available Seats
    // const courseCapacity=response['capacity'];
    const checkCourseEnrollmentsCountSql=`SELECT count(*) as countSeatsOccupied from enrollment where courseId='${courseid}';`;
    var seatsOccupied;
    [err,seatsOccupied]=await to(mydb.executeQuery(checkCourseEnrollmentsCountSql));
    if(err){
        dbHandleError(res,err);
    }
    seatsOccupied=seatsOccupied[0]['countSeatsOccupied'];
    console.log("seatsOccupied  ",seatsOccupied);
    const availableSlots=parseInt(response['capacity'])-parseInt(seatsOccupied);
     

    response['enrolledStudent']=enrolledStudents;
    response['availableSlots']=availableSlots;
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
router.post('/', async(req, res) => {
    const name = req.body.name;
    const description= req.body.description;
    const capacity=req.body.capacity;

    // payload validation
    // if(!name || !description || !availableSlots || parseInt(availableSlots)<1){
    //      return res.send({
    //          Error:"Invalid Payload"
    //      });
    // }
    var err,response;
    const checkIfCourseExistsSql=`SELECT * from courses where name='${name}';`;
    [err,response]=await to(mydb.executeQuery(checkIfCourseExistsSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length!=0){
        console.log("Course already exist");
        return res.json({
            success:false,
            msg:`Course ${name} already exists`,
        });
    }
    const addCourseSql=`INSERT INTO courses (name, description, capacity) VALUES ('${name}', '${description}' ,'${capacity}')`;
    [err,response]=await to(mydb.executeQuery(addCourseSql));
    if(err){
        dbHandleError(res,err);
    }else{
        console.log("Successfully added course :",name);
        return res.json({
            success:true,
            msg:`Course '${name}' successfully added`,
            err:null
        });
    }
    
    


});


// Enroll student in course  “/courses/{courseId}/enroll”
router.post('/:courseId/enroll', async(req, res) => {
    const courseId= req.params.courseId;
    const studentId=req.body.studentId;
    var err,response;
    const checkIfCourseExistsSql=`SELECT * from courses where id='${courseId}';`;
    const checkIfStudentExistsSql=`SELECT * from users where id='${studentId}';`;

    // check whether student exists or not 
    [err,response]=await to(mydb.executeQuery(checkIfStudentExistsSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==0){
        console.log("Student doesn't exist");
        return res.json({
            success:false,
            msg:`Student '${studentId}' doesn't exists`,
        });
    }

    // check whether course exists or not 
    [err,response]=await to(mydb.executeQuery(checkIfCourseExistsSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==0){
        console.log("Course doesn't exist");
        return res.json({
            success:false,
            msg:`Course '${courseId}' doesn't exists`,
        });
    }


    // to check whether seats are available or not
    const courseCapacity=response[0]['capacity'];
    const checkCourseEnrollmentsSql=`SELECT studentId from enrollment where courseId='${courseId}';`;

    [err,response]=await to(mydb.executeQuery(checkCourseEnrollmentsSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==courseCapacity){
        console.log("No seats available");
        return res.json({
            success:false,
            msg:`No seats available`,
        });
    }

        //  to check if the student is already enrolled in that course
        const checkIfAlreadyEnrolledSql=`SELECT * from enrollment where courseId='${courseId}' and studentId='${studentId}';`;

        [err,response]=await to(mydb.executeQuery(checkIfAlreadyEnrolledSql));
        if(err){
            dbHandleError(res,err);
        }
        console.log("duplicate ::",response);
        if(response.length!=0){
            console.log("Student already enrolled");
            return res.json({
                success:false,
                msg:`Student already enrolled`,
            });
        }
    

    // enroll the student into the course
    const enrollstudentSql=`INSERT INTO enrollment (studentId,courseId) VALUES ('${studentId}', '${courseId}')`;

    [err,response]=await to(mydb.executeQuery(enrollstudentSql));
    if(err){
        dbHandleError(res,err);
    }
    console.log(`student '${studentId}' enrolled in course '${courseId}'`);
    return res.json({
        success:true,
        msg:`Student Successfully Enrolled`,
    });

});

//Remove a student from course  |   Method: “PUT”  |  Path: “/courses/{courseId}/deregister”
router.put('/:courseId/deregister', async(req, res) => {

    const courseId= req.params.courseId;
    const studentId=req.body.studentId;

    var err,response;


    const checkIfCourseExistsSql=`SELECT * from courses where id='${courseId}';`;
    const checkIfStudentExistsSql=`SELECT * from users where id='${studentId}';`;

    // check whether student exists or not 
    [err,response]=await to(mydb.executeQuery(checkIfStudentExistsSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==0){
        console.log("Student doesn't exist");
        return res.json({
            success:false,
            msg:`Student '${studentId}' doesn't exists`,
        });
    }

    // check whether course exists or not 
    [err,response]=await to(mydb.executeQuery(checkIfCourseExistsSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==0){
        console.log("Course doesn't exist");
        return res.json({
            success:false,
            msg:`Course '${courseId}' doesn't exists`,
        });
    }

    //  to check if the student is enrolled in that course or not
    const checkIfEnrolledSql=`SELECT * from enrollment where courseId='${courseId}' and studentId='${studentId}';`;

    [err,response]=await to(mydb.executeQuery(checkIfEnrolledSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==0){
        console.log(`Student: ${studentId} is not enrolled in the course: ${courseId}`);
        return res.json({
            success:false,
            msg:`Student isn't enrolled in course`,
        });
    }


    // un-enroll the student into the course
    const unenrollstudentSql=`DELETE FROM enrollment where courseId='${courseId}' and studentId='${studentId}';`;

    [err,response]=await to(mydb.executeQuery(unenrollstudentSql));
    if(err){
        dbHandleError(res,err);
    }
    console.log(`student '${studentId}' deregistered from course '${courseId}'`);
    return res.json({
        success:true,
        msg:`Student Successfully Deregistered`,
    });



});

module.exports=router;