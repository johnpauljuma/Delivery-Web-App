const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const path = require('path');
const port = 3000;

// Setting up the view engine and static files
app.set('views', 'views');
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

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
        //res.render('logisticManager');

         // Read existing data from deliveries JSON file
         const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');
         let deliveriesData = [];
         try {
             deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
         } catch (error) {
             console.error('Error reading JSON file:', error);
         }
 
         // Read existing data from personels JSON file
        const personelsFilePath = path.join(__dirname, 'data', 'personels.json');
        let personelsData = [];
        try {
            personelsData = JSON.parse(fs.readFileSync(personelsFilePath));
        } catch (error) {
            console.error('Error reading JSON file:', error);
        }

         // Render the admin program page with deliveries data
         res.render('logisticManager', { deliveries: deliveriesData, personels: personelsData });
    }
    else {
        res.status(404).send('Program not found');
    }
});

// POST route to handle new delivery form submission
app.post('/new-delivery', (req, res) => {
    const { deliveryID, productName, description, location, dateCreated, personel } = req.body;

   // Read existing data from JSON file
   const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');
   let deliveriesData = [];
   try {
       deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
   } catch (error) {
       console.error('Error reading JSON file:', error);
   }

   // Check if delivery ID already exists
   const existingDelivery = deliveriesData.find(delivery => delivery.deliveryID === deliveryID);
   if (existingDelivery) {
       // If delivery ID already exists, return an error response
       return res.status(400).send('Error: Delivery ID already exists.');
   }

    // Create new delivery object
    const newDelivery = {
        deliveryID,
        productName,
        description,
        location,
        dateCreated,
        personel,
        dateDelivered: '', 
        status: 'Pending'
    };

    // Add new delivery to data
    deliveriesData.push(newDelivery);

    // Write updated data back to JSON file
    fs.writeFileSync(deliveriesFilePath, JSON.stringify(deliveriesData, null, 2));

    // Redirect to the admin program page with success flag
    res.redirect('/program?program=admin&success=true');
});

// POST route to handle new personel form submission
app.post('/new-personel', (req, res) => {
    const { personelID, name, email, phone, dateJoined, password } = req.body;

   // Read existing data from JSON file
   const personelsFilePath = path.join(__dirname, 'data', 'personels.json');
   let personelsData = [];
   try {
       personelsData = JSON.parse(fs.readFileSync(personelsFilePath));
   } catch (error) {
       console.error('Error reading JSON file:', error);
   }

   // Check if personel ID already exists
   const existingPersonel = personelsData.find(personel => personel.personelID === personelID);
   if (existingPersonel) {
       // If personel ID already exists, return an error response
       return res.status(400).send('Error: Personel ID already exists.');
   }

    // Create new personel object
    const newPersonel = {
        personelID, 
        name, 
        email, 
        phone, 
        dateJoined, 
        password, 
        status: 'Pending'
    };

    // Add new personel to data
    personelsData.push(newPersonel);

    // Write updated data back to JSON file
    fs.writeFileSync(personelsFilePath, JSON.stringify(personelsData, null, 1));

    // Redirect to the admin program page with success flag
    res.redirect('/program?program=admin&success=true');
});


// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
