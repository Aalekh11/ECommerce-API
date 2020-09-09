var nodemailer = require('nodemailer');

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
  to: 'karhadkaraalekh@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'Hello Staysafe,That was easy and fun!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});