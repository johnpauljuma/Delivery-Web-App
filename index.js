if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// import data from './db.json' assert { type: 'json' };
// console.log(data);

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const fs = require('fs');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const fileName = 'db.json';

// Load data from db.json file
let rawData = fs.readFileSync(fileName);
let data = JSON.parse(rawData);
let userData = data.users;

console.log(data.users[0].id)

const port = 3001;

// const initializePassport = require('./passport-config');
// initializePassport(
//     passport, 
//     email => data.find(user => user.email === email),
//     id => data.find(user => user.id === id)
// );

// Setting up the view engine and static files
app.set('views', 'views');
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(bodyParser.json())
// 
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// Home route
app.get('/', checkAuthenticated, (request, response) => {
    response.render('home');
});

// login routes  
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('home');
});

// app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
//     successRedirect: '/deliveryPersonel',
//     failureRedirect: '/login',
//     failureFlash: true
// }));

app.post('/login',(request,response)=>{
    console.log(request.body)
    const {adminUser,adminPassword} = request.body
    // const isAuth = true;
    userData.forEach(element => {
        if(adminPassword === element.password && adminUser === element.name){
            return (
                response.status(201).json({
                message:'User is authenticated',
            }),
            response.render('deliveryPersonel')
        )
        }
        else{
            return response.status(401).json({
                message:'User does not exist'
            });
        }
    });

});

app.delete('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});


// authentication check functions
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
}
  
// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
