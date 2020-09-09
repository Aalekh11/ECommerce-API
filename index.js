var express =require('express');
var bodyParser=require('body-parser');
var cors=require('cors');
var multer=require('multer')
var connection=require("./Config.js");
var randomstring=require("randomstring");
var datetime = require('node-datetime');
var nodemailer = require('nodemailer');
const { query } = require('express');
const conn = require('./Config.js');
const { Console } = require('console');


var app=express();
app.use(cors());
app.use(bodyParser.json());

var filename;
const storage=multer.diskStorage({
destination:'./uploads',
filename: function(req,file,cb){
cb(null,file.originalname.split(" ").join(""))
filename=file.originalname.split(" ").join("");
console.log(filename)
}
})

app.use(express.static('uploads'))
var upload=multer({storage:storage})



app.post('/fileUpload',upload.single('Image'),function(req,res,next){
const file=req.file;
console.log('File uploaded');

});
connection.connect((err)=>{
    if(err) console.log(err);
    console.log('My Sql Connected');
    });





app.post('/LoginCheck/',function(req,res){
var query="select Customer_Address,Customer_Address_Type,Customer_City,Customer_Email,Customer_Id,Customer_Locality,Customer_Name,Customer_Phone,Customer_PinCode,Customer_State from Customer where Customer_Email='"+req.body.email+"' and Customer_Password='"+req.body.password+"';"

connection.query(query,function(err,result){

    if(err) console.log(err);
       if(result.length>0)
       {
    res.send({found:true,data:result})
       }
    else
    {
    res.send({found:false})
    }

})
})   


app.get('/getAddress/:Id',function(req,res){

var Id=req.params.Id
var query="select Customer_Address,Customer_PinCode,Customer_Address_Type,Customer_City,Customer_State,Customer_Locality from Customer where Customer_Id="+Id+""
connection.query(query,function(err,result){

 if(err)console.log(err)
 if(result.length>0)
 {
     res.send(result)
 }
 else
 {
     res.send(null)
 }
})
})


app.post('/UpdateAddress',function(req,res){

console.log(req.body)
var Id=req.body.ID;
var Address=req.body.Customer_Address;
var Locality=req.body.Customer_Locality;
var City=req.body.Customer_City;
var type=req.body.Customer_Address_Type;
var state=req.body.Customer_State;
var pincode=req.body.Customer_PinCode;


var query="Update Customer set Customer_Address='"+Address+"',Customer_State='"+state+"',Customer_City='"+City+"',Customer_Address_Type='"+type+"',Customer_PinCode="+pincode+",Customer_Locality='"+Locality+"' where Customer_Id="+Id+""

connection.query(query,function(err,result){

    if(err) console.log(err)
    if(result){
    console.log("Updates Successfully")
    res.send({"Success":true})
    }


})
})


function SendMail(Message,Email,Subject){
    


var transporter = nodemailer.createTransport({
  service: 'gmail',
  host:'smtp.gamil.com',
  auth: {
    user: 'staysafe2020ace@gmail.com',
    pass: 'Staysafe2020@'
  }
});

var mailOptions = {
  from: 'staysafe2020ace@gmail.com',
  to: Email,
  subject: Subject,
  html: Message
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
    

}

app.post('/AddReview',function(req,res){

    sqlquery="Insert into ProductReview(Customer_Name,Product_Id,Rating,Customer_Review) values('"+req.body.Name+"',"+req.body.ID+","+req.body.stars+",'"+req.body.message+"')"
    connection.query(sqlquery,function(err,result){
        if(err) console.log(err)
        if(result){
        res.send({"Success":true})
        }
    })
})

app.get('/Reviews/:Id',function(req,res){
    sql2="Select * from ProductReview where Product_Id="+req.params.Id+" order by Serial_Number DESC limit 5"
        connection.query(sql2,function(err,result){
        if(err) console.log(err)
        if(result.length>0)
        {   console.log(result)
            res.send(result)
        }
        
    })
    
})

app.post('/changePassword',function(req,res){

sql="Update Customer set Customer_Password='"+req.body.Password+"' where Customer_Email='"+req.body.Email+"' and Customer_Password='"+req.body.OldPassword+"'"
connection.query(sql,function(err,result){

    if(err) console.log(err)
    if(result.affectedRows>0)
    {
        
        var Message='<h2>Hello User</h2></br><h2>You Password has been Successfully Changed</h2></br><h2>Your New Password is '+req.body.Password+'</h2></br><h3>You can Login to Mobikart from  <a href="http://localhost:4200/">Here</a></h3>'
        var Subject="Mobikart Password Changed"
        SendMail(Message,req.body.Email,Subject)
        res.send({"success":true})
    }
    else res.send({"success":false})
    
})
})






app.post('/CustomerData/',function(req,res){

console.log(typeof(req.body))
var Name=req.body.name
var Email= req.body.email
var Phone=req.body.phone
var Password=req.body.password
var ConfirmPassword=req.body.confirmPassword

var checkquery="select * from Customer where Customer_Email='"+Email+"' or Customer_Phone="+Phone+";"
connection.query(checkquery,function(err,result){
if(err) console.log(err)
if(result.length>0)
{
res.send({Registered:true,data:result})
}
else{
    var query="Insert ignore into Customer(Customer_Name,Customer_Email,Customer_Phone,Customer_Password) values('"+Name+"','"+Email+"',"+Phone+",'"+Password+"');"
    connection.query(query,function(err,result){
        if(err) console.log(err);
        console.log("Customer Registered");
        Message='<h2>Thank you for registering with Mobikart</h2>'
        Subject="Registered Successfully"
        SendMail(Message,Email,Subject)  
        sendSMS(Message,Phone) 
        res.send({Registered:false})
    });
}
})
})

app.post('/EmailCheck',function(req,res){
 var email=req.body.email
 sql1="select * from Customer where Customer_Email='"+email+"'"
 connection.query(sql1,function(err,result){
    if(err) console.log(err)
    if(result.length>0)
    {   var Message='<h2>Hello '+result[0].Customer_Name+'!</h2></br><h3>Reset Your Account with password as '+result[0].Customer_Password+' </h3></br><h3>You can change your password <a href="http://localhost:4200/changePassword?email='+result[0].Customer_Email+'">Here</a></h3>'
        var Subject="Reset Your Password"
        SendMail(Message,result[0].Customer_Email,Subject)
        res.send({"found":true})

    }
    else
    res.send({"found":false})


 })

})



app.post('/form',function(req,res)
{
console.log(req.body)

var CompanyName=req.body.company;
var ProductName=req.body.productName;
var Price=req.body.Price;
var variant=req.body.RAM+" "+"RAM"+"|"+req.body.ROM+" "+"ROM";
var colour=req.body.colour;
var battery=req.body.battery;
var display=req.body.display;
var processor=req.body.Processor;
var camera=req.body.camera;
var available=req.body.available;
var OS=req.body.OS;
console.log(typeof(available))
available=Boolean(available)
console.log(typeof(available))

var sql="INSERT IGNORE INTO company(Company_Name) values('"+CompanyName+"')";
var sql2="Insert into product(Company_Id,Product_Name,Price,Variant,Colour,Battery,Display,Processor,Camera,Available,ImageName,OS) values((select Company.Company_Id from company where company.Company_Name='"+CompanyName+"'),'"+ProductName+"','"+Price+"','"+variant+"','"+colour+"','"+battery+"','"+display+"','"+processor+"','"+camera+"',"+available+",'"+filename+"','"+OS+"')"
connection.query(sql,function(err,result){
    if(err) console.log(err);
    console.log("Company Inserted");   
});
connection.query(sql2,function(err,result){
    if(err) console.log(err);
    
    console.log("Product Inserted")
});
res.send(JSON.stringify(req.body)); 

});

app.post('/AllProduct',function(req,res){
    var query="select concat(company.Company_Name,' ',product.product_Name) as Product_Name,product.colour,product.Variant,product.Battery,product.Display,product.Camera,product.ImageName,product.Product_ID,product.Available,product.OS,product.Processor,product.Price from company inner join product on company.company_Id=product.Company_ID"

    connection.query(query,function(err,result){

        if(err) console.log(err)
        if(result.length)
        {   console.log(result)
            res.send(result)
        }
    
    })



});

function sendSMS(Message,Phone)
{

    const fast2sms = require('fast-two-sms')
    
    var number=Phone
    var message=Message
    console.log('number',number)
    console.log('messsage'.message)
    
    var options = {authorization :'pbOBqiZrlkXoIvVH26hgLmfEyt7dA5cMDY9U0usWjPJ8Kzwn3Qi7dLnIMhVQHsOXlkmFgG1ZpqU0o2br' , message : message ,  numbers : [number]} 
    fast2sms.sendMessage(options).then(response=>{
        console.log(response)
      })
      



}

app.post('/setOrders',function(req,res){

    console.log(req.body)
    var Phone=req.body.Customer_Phone
    orderID="#"+randomstring.generate(7)
    var dt=datetime.create()
    var time=dt.format('H:M:S')
    products=""
    total=0
    for(var x=0;x<req.body.Products.length;x++)
    {
        var query="insert into Orders values('"+orderID+"',"+req.body.Customer_Id+",'"+req.body.Products[x].Product+"','"+req.body.Products[x].Price+"','"+req.body.Payment_Mode+"','"+req.body.Products[x].Image+"','"+req.body.Customer_Name+"',CURRENT_DATE(),'"+time+"')"
        products=products+req.body.Products[x].Product+","
        total=total+req.body.Products[x].Price
        console.log(products)
        connection.query(query,function(err,result){
        
            if(err) console.log(err)
            console.log("Order Placed")
            

        })

        Message="Order Placed.Your Order for "+products+"... with OrderID "+orderID+" amounting to Rs."+total+" has been received.Thank you for shopping with Mobikart."
        Message2='<h2>Hooray..Order Placed.</h2></br><h3>Your Order for '+products+'... with OrderID '+orderID+' amounting to Rs.'+total+' has been received.Thank you for shopping with Mobikart.</h3>'
        var Subject="Order Received"
        
        

    }

    console.log(Message)
    sendSMS(Message,Phone)
    SendMail(Message2,req.body.Customer_Email,Subject)
    res.send({"success":true,"Time":time})

})


app.get('/DeleteProduct/:ID',function(req,res){

    var Id=req.params.ID
    sqlquery="Delete from Product where Product_ID="+Id+""
    connection.query(sqlquery,function(err,result){

        if(err) console.log(err)
        res.send({"Result":true})
    })


})


app.post('/Orders_On_Admin/',function(req,res){
    
    if(req.body.id==1){

    sqlquery="select ORDERS.ORDER_ID,ORDERS.CUSTOMER_NAME,ORDERS.PRODUCT_NAME,ORDERS.PRODUCT_PRICE,ORDERS.PAYMENT_MODE,ORDERS.ORDER_DATE,ORDERS.PURCHASE_TIME,CUSTOMER.CUSTOMER_PHONE,CUSTOMER.CUSTOMER_EMAIL,CONCAT(CUSTOMER.CUSTOMER_ADDRESS,' ',CUSTOMER.CUSTOMER_PINCODE,' ',CUSTOMER.CUSTOMER_CITY,' ',CUSTOMER.CUSTOMER_STATE) AS ADDRESS FROM ORDERS INNER JOIN CUSTOMER ON ORDERS.CUSTOMER_ID=CUSTOMER.CUSTOMER_ID"
    }
    else{
        sqlquery="Select * from Orders where Customer_Id="+req.body.id+""
    }
    connection.query(sqlquery,function(err,result){
        if(err) console.log(err)
        if(result.length>0)
        {
            res.send(result)
        }
    })
})


app.post('/getOrderDetail',function(req,res){

    console.log(req.body)
    sqlquery="select orders.Order_Id,orders.Order_Date,orders.Payment_Mode,SUM(orders.Product_Price) as total,Customer.Customer_Name,Customer.Customer_Address,customer.customer_city,Customer.Customer_PinCode from Orders inner join Customer on Orders.Customer_Id=Customer.Customer_Id where orders.Customer_Id="+req.body.Customer_Id+" and orders.Purchase_Time='"+req.body.Time+"' limit 1;"
    console.log(sqlquery)
  connection.query(sqlquery,function(err,result){
    
    if(err) console.log(err)
    res.send({"Success":true,"data":result})
  })


})

app.get('/SingleProduct/:ID',function(req,res){
    var product_ID=req.params.ID;
    var query="select company.Company_Name,product.product_Name,product.colour,product.Variant,product.Battery,product.Display,product.Camera,product.ImageName,product.Product_ID,product.Available,product.OS,product.Processor,product.Price from company inner join product on company.company_Id=product.Company_ID where Product_ID="+product_ID+";"

    connection.query(query,function(err,result){

        if(err) console.log(err)
        if(result.length)
        {   console.log(result)
            res.send(result)
        }
    
    })



});

app.get('/products/:limit',function(req,res){

var limit=req.params.limit;
console.log(limit)
var query="select company.Company_Name,product.product_Name,product.Product_ID,product.Price,product.ImageName from company inner join product on company.company_Id=product.Company_ID limit "+limit+";"
connection.query(query,function(err,result){

    if(err) console.log(err)
    if(result.length)
    {   console.log(result)
        res.send(result)
    }

  });

});

app.get('/showCompanyProducts/:companyid',function(req,res){
var companyID=req.params.companyid;

var query="select company.Company_Name,product.product_Name,product.Product_ID,product.Price,product.ImageName from company inner join product on company.company_Id=product.Company_ID where product.Company_id="+companyID;

connection.query(query,function(err,result){

    if(err) console.log(err)
    if(result.length){
        console.log(result)
        res.send(result)
    }
})

})








app.post('/Category/',function(req,res){
var query=" select company.company_id,Company.company_name,count(product.company_Id)as count from company inner join product on company.company_id=product.company_id group by company.company_id;"

connection.query(query,function(err,result){
if(err) console.log(err)
if(result.length)
{
    console.log(result)
    res.send(result)
}
});

});


app.get('/getStarted',function(req,res){

    res.send("Welcome to server")
})

var server =app.listen(4000,function(){
console.log("Server is listening on port 4000");
});