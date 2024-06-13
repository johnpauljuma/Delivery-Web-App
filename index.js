if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override')

const port = 3001;

const initializePassport = require('./passport-config');
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

const users = [
    {
        "id": 20240613,
        "name": "zeke",
        "email": "eadwera@usiu.ac.ke",
        "password": "1234"
      }
];

// Setting up the view engine and static files
app.set('views', 'views');
app.set('view engine', 'hbs');
app.use(express.static('public'));
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

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/deliveryPersonel',
    failureRedirect: '/login',
    failureFlash: true

}));

// <% if (messages.error) { %>
// <% messages.error %>
// <% } %>

app.get('/register', checkNotAuthenticated, (req, res) => {

});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            password: hashedPassword
        })
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
    console.log(users)
});

app.delete('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/program', (req, res) => {
    const program = req.query.program; 

    if (program === 'delivery') {
        res.render('deliveryPersonel'); 
    } 
    else if(program === 'admin'){
        
        res.render('logisticManager');
    }
    else {
        res.status(404).send('Program not found');
    }

});

// authentication check functions
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next();
    }

    res.redirect('/');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}
  
// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
