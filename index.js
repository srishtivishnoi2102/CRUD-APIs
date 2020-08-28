const express=require('express');
const mydb=require("./lib/datacentre/mysql")
const bodyParser=require('body-parser');
const courseRouter=require('./routes/courses');
const studentRouter=require('./routes/student');
const authRouter=require('./routes/auth');



const app =new express();

mydb.connectDb();

app.use(express.json());
app.use(bodyParser.json());

app.use('/api/courses',courseRouter);   //route for courses
app.use('/api/students',studentRouter);   //route for student
app.use('/auth',authRouter);   //route for auth



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});