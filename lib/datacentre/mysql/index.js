const mysql = require('mysql');
var connection;
const connectDb=()=>{

    
     return new Promise((resolve,reject)=>{
        connection=mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            port     : '3306',
            password : '123456',
            database : 'crud_db'   
         });
        
         connection.connect(function(err,res){
             console.log("Trying to connect to db");
             if(err){
                 console.error("Error in connecting to mysql",{error:err});
                 return reject('Error in connecting to mysql');
             }
             console.log("<<<Successfully connected to the database>>>");
             return resolve(true);
         });

     });
     
}


const executeQuery=(query)=>{

    return new Promise((resolve,reject)=>{
        connection.query(query, function(err,result){
            if(err){
                return reject(new Error(err));
            }
            // console.log("The reuslt is : ",result);
            return resolve(result);

        });
    })

    
 }

 module.exports={
     connectDb,
     executeQuery
 };