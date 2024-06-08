const express = require('express');
const app = express();
const port = 3000;

// Courses data
const programs = {
    apt: ["APT1030", 'APT1040', 'APT2060'],
    ist: ['IST2010', 'IST2040', 'IST2060']
};

// Setting up the view engine and static files
app.set('views', 'views');
app.set('view engine', 'hbs');
app.use(express.static('public'));

// Home route
app.get('/', function (request, response) {
    response.render('home');
});

// Courses route
app.get('/program', (req, res) => {
    const programType = req.query.program;
    const program = programs[programType.toLowerCase()];

    if (program) {
        res.render('result', { programName: programType.toUpperCase(), courses: program });
    } else {
        res.status(404).send('Program not found');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
