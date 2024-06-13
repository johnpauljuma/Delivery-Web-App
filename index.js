if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// import data from './db.json' assert { type: 'json' };
// console.log(data);

const express = require("express");
const app = express();
// const bcrypt = require("bcrypt");
// const passport = require("passport");
// const flash = require("express-flash");
const sessions = require("express-session");
// const methodOverride = require("method-override");
const fs = require("fs");
const bodyParser = require("body-parser");
// const jsonParser = bodyParser.json();
const filestore = require("session-file-store")(sessions)
const cookieParser = require("cookie-parser");
const fileName = "db.json";
const oneDay = 1000 * 60 * 60 * 24;

// Load data from db.json file
let rawData = fs.readFileSync(fileName);
let data = JSON.parse(rawData);
let userData = data.users;
console.log(userData);

// console.log(data.users[0].id)

const port = 3001;

// const initializePassport = require('./passport-config');
// initializePassport(
//     passport,
//     email => data.find(user => user.email === email),
//     id => data.find(user => user.id === id)
// );

// Setting up the view engine and static files
app.set("views", "views");
app.set("view engine", "hbs");
app.use(express.static("public"));
app.use(bodyParser.json());
//
app.use(express.urlencoded({ extended: false }));
// app.use(flash());

// app.use(passport.initialize());
// app.use(passport.session());
// app.use(methodOverride("_method"));

//Remove cache

app.use((request, response, next) => {
  response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  next()
});

// cookie parser middleware
app.use(cookieParser());

//session middleware
app.use(sessions({
    name: "User_Session",
    secret: "8Ge2xLWOImX2HP7R1jVy9AmIT0ZN68oSH4QXIyRZyVqtcl4z1I",
    saveUninitialized: false,
    cookie: { maxAge: oneDay, httpOnly: false },
    resave: false,
    store: new filestore({ logFn: function() {} }),
    path: "./sessions/"
}));


// Home route
app.get("/", (request, response) => {
  response.render("home");
});

// login routes
app.get("/login", (req, res) => {
  res.render("home");
});


// Delivery Personnel
app.get('/delivery-personnel',checkAuthenticated,(request,response)=>{
  response.render('deliveryPersonnel')
})

app.post("/login-admin", (request, response) => {
  console.log(request.body);
  const { adminUser, adminPassword } = request.body;
  // const isAuth = true;
  const user = userData.filter(
    (elt) =>
      elt.password === adminPassword &&
      elt.name === adminUser &&
      elt.role === "Admin"
  );
  console.log(user.length);
  if (user.length) {
    request.session.user = user[0]
    return (
      response.status(200).json({
      message: "User is authenticated",
    }),
     response.render('deliveryPersonel'));
  } else {
    return response.status(401).json({
      message: "User does not exist",
    });
  }
});


app.post("/login-user",  (request, response) => {
    console.log(request.body);
    const { user, userPassword } = request.body;
    // const isAuth = true;
    const userDetails = userData.filter(
      (elt) =>
        elt.password === user &&
        elt.name === userPassword &&
        elt.role === "User"
    );
    console.log(userDetails.length);
    if (userDetails.length) {
      request.session.user = userDetails[0]
      return response.status(200).json({
        message: "User is authenticated",
      });
    } else {
      return response.status(401).json({
        message: "User does not exist",
      });
    }
  });
  

//Logout route
app.get('/logout', (request, response) => {
  
  request.session.destroy((err) => {
      if (err) throw err;
      response.clearCookie('user')
      response.clearCookie('User_Session')
      response.redirect('/')
  })
})

// authentication check functions
function checkAuthenticated(req, res, next) {
  // if (req.isAuthenticated()) {
  //   return next();
  // }
  const {user} = req.session
  if(user){
    next()
  }
  else
    res.redirect("/login");
}

// function checkNotAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return res.redirect("/login");
//   }
//   next();
// }

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
