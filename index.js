const express = require('express');
const app = express();
const port = 3000;

// Setting up the view engine and static files
app.set('views', 'views');
app.set('view engine', 'hbs');
app.use(express.static('public'));

// Home route
app.get('/', function (request, response) {
    response.render('home');
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

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
