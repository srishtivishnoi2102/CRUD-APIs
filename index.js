const express=require('express');
const app =new express();

const myToken= "21021999";

app.use(express.json());

function myTokenMiddleware(req,res,next){
    console.log("I am the best myTokenMiddleware");
    const token=req.headers.token;


    // console.log("token    ",token);
    // console.log("mytoken  ",myToken);
    
    
    if(token===myToken){
        console.log("Token Valid");
        next();
         
    }else{
        console.log("Token Invalid");
        return res.json({success: false, message: "Invalid Token"});
    }
}

app.use(myTokenMiddleware);


app.use('/api/courses',require('./routes/courses'));   //route for courses
app.use('/api/students',require('./routes/student'));   //route for student



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});