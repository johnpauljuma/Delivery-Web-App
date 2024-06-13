const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Define your helper function
function eq(value1, value2) {
    return value1 === value2;
}

// Register the helper with Handlebars
Handlebars.registerHelper('eq', eq);

const session = require('express-session');

const app = express();
const port = 3000;


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key', // Replace with a secure key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to check if user is authenticated
function isAuthenticated(role) {
    return (req, res, next) => {
        if (req.session.user && req.session.user.role === role) {
            return next();
        } else {
            res.redirect('/');
        }
    }
}

// Home route
app.get('/', (req, res) => {
    res.render('home');
});

// Program route for delivery personnel and admin
app.get('/program', (req, res) => {
    const program = req.query.program; 

    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');

    if (program === 'delivery' && req.session.user.role === 'delivery') {
        let deliveriesData = [];
        try {
            deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
        } catch (error) {
            console.error('Error reading JSON file:', error);
        }

        const filteredDeliveries = deliveriesData.filter(delivery => delivery.personel === req.session.user.personelID).map(delivery => ({
            ...delivery,
            isDelivered: delivery.status === 'Delivered'
        }));
        res.render('deliveryPersonel', { deliveries: filteredDeliveries });
    } else if (program === 'admin' && req.session.user.role === 'admin') {
        let deliveriesData = [];
        let personelsData = [];
        try {
            deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
        } catch (error) {
            console.error('Error reading JSON file:', error);
        }

        const personelsFilePath = path.join(__dirname, 'data', 'personels.json');
        try {
            personelsData = JSON.parse(fs.readFileSync(personelsFilePath));
        } catch (error) {
            console.error('Error reading JSON file:', error);
        }

        res.render('logisticManager', { deliveries: deliveriesData, personels: personelsData });
    } else {
        res.status(404).send('Program not found');
    }
});

// POST route to handle new delivery form submission
app.post('/new-delivery', isAuthenticated('admin'), (req, res) => {
    const { deliveryID, productName, description, location, dateCreated, personel } = req.body;

    const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');
    let deliveriesData = [];
    try {
        deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
    }

    const existingDelivery = deliveriesData.find(delivery => delivery.deliveryID === deliveryID);
    if (existingDelivery) {
        return res.status(400).send('Error: Delivery ID already exists.');
    }

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

    deliveriesData.push(newDelivery);

    try {
        fs.writeFileSync(deliveriesFilePath, JSON.stringify(deliveriesData, null, 2));
        res.redirect('/program?program=admin&success=true');
    } catch (error) {
        console.error('Error writing to JSON file:', error);
        res.status(500).send('Error saving delivery.');
    }
});

// POST route to handle new personel form submission
app.post('/new-personel', isAuthenticated('admin'), (req, res) => {
    const { personelID, name, email, phone, dateJoined, password } = req.body;

    const personelsFilePath = path.join(__dirname, 'data', 'personels.json');
    let personelsData = [];
    try {
        personelsData = JSON.parse(fs.readFileSync(personelsFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
    }

    const existingPersonel = personelsData.find(personel => personel.personelID === personelID);
    if (existingPersonel) {
        return res.status(400).send('Error: Personel ID already exists.');
    }

    const newPersonel = {
        personelID,
        name,
        email,
        phone,
        dateJoined,
        password,
        status: 'Pending'
    };

    personelsData.push(newPersonel);

    try {
        fs.writeFileSync(personelsFilePath, JSON.stringify(personelsData, null, 2));
        res.redirect('/program?program=admin&success=true');
    } catch (error) {
        console.error('Error writing to JSON file:', error);
        res.status(500).send('Error saving personel.');
    }
});

// Admin Login route and logic
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;

    const adminFilePath = path.join(__dirname, 'data', 'admin.json');
    let adminData = [];
    try {
        adminData = JSON.parse(fs.readFileSync(adminFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
    }

    const admin = adminData.find(admin => admin.username === username && admin.password === password);
    if (admin) {
        req.session.user = { role: 'admin', username: admin.username };
        res.redirect('/program?program=admin');
    } else {
        res.render('home', { loginError: 'Invalid username or password' });
    }
});

// Personel Login route and logic
app.post('/plogin', (req, res) => {
    const { personelID, password } = req.body;

    const personelsFilePath = path.join(__dirname, 'data', 'personels.json');
    let ploginData = [];
    try {
        ploginData = JSON.parse(fs.readFileSync(personelsFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
    }

    const personel = ploginData.find(personel => personel.personelID === personelID && personel.password === password);
    if (personel) {
        req.session.user = { role: 'delivery', personelID: personel.personelID };
        res.redirect('/program?program=delivery');
    } else {
        res.render('home', { loginError: 'Invalid username or password' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// Handling delivery cards
app.post('/deliver/:deliveryID', isAuthenticated('delivery'), (req, res) => {
    const deliveryID = req.params.deliveryID;

    const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');
    let deliveries = [];
    try {
        deliveries = JSON.parse(fs.readFileSync(deliveriesFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return res.json({ success: false });
    }

    const delivery = deliveries.find(delivery => delivery.deliveryID === deliveryID);
    if (delivery) {
        const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        delivery.dateDelivered = currentDate;
        delivery.status = 'Delivered';

        try {
            fs.writeFileSync(deliveriesFilePath, JSON.stringify(deliveries, null, 2));
            res.json({ success: true, delivery });
        } catch (error) {
            console.error('Error writing to JSON file:', error);
            res.json({ success: false });
        }
    } else {
        res.json({ success: false });
    }
});

//deletion of a delivery
app.delete('/delete-delivery/:deliveryID', isAuthenticated('admin', 'delivery'), (req, res) => {
    const deliveryID = req.params.deliveryID;

    const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');
    let deliveriesData = [];
    try {
        deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return res.status(500).send('Error reading deliveries data.');
    }

    // Filter out the delivery to be deleted
    const updatedDeliveries = deliveriesData.filter(delivery => delivery.deliveryID !== deliveryID);

    // Write updated deliveries data back to JSON file
    try {
        fs.writeFileSync(deliveriesFilePath, JSON.stringify(updatedDeliveries, null, 2));
        res.status(200).json({ message: 'Delivery deleted successfully' });
    } catch (error) {
        console.error('Error writing to JSON file:', error);
        res.status(500).send('Error deleting delivery.');
    }
});

//personel deletion
app.delete('/api/personels/:personelID', isAuthenticated('admin'), (req, res) => {
    const personelID = req.params.personelID;

    const personelsFilePath = path.join(__dirname, 'data', 'personels.json');

    fs.readFile(personelsFilePath, 'utf8', (readError, data) => {
        if (readError) {
            console.error('Error reading JSON file:', readError);
            return res.status(500).send('Error reading personnel data.');
        }

        let personelsData;
        try {
            personelsData = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
            return res.status(500).send('Error parsing personnel data.');
        }

        const updatedPersonels = personelsData.filter(personel => personel.personelID !== personelID);

        fs.writeFile(personelsFilePath, JSON.stringify(updatedPersonels, null, 2), (writeError) => {
            if (writeError) {
                console.error('Error writing to JSON file:', writeError);
                return res.status(500).send('Error deleting personnel.');
            }

            res.status(200).json({ message: 'Personnel deleted successfully' });
        });
    });
});

//render edit delivery form
app.get('/edit-delivery/:deliveryID', isAuthenticated('admin'), (req, res) => {
    const deliveryID = req.params.deliveryID;

    // Read deliveries data from JSON file
    const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');
    let deliveriesData = [];
    try {
        deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return res.status(500).send('Error reading deliveries data.');
    }

    // Find the specific delivery by deliveryID
    const delivery = deliveriesData.find(delivery => delivery.deliveryID === deliveryID);
    if (!delivery) {
        return res.status(404).send('Delivery not found.');
    }

    // Render the editDelivery view with delivery data
    res.render('editDelivery', { delivery });
});


//handle editing delivery
app.post('/edit-delivery/:deliveryID', isAuthenticated('admin'), (req, res) => {
    const deliveryID = req.params.deliveryID;
    const { productName, description, location, dateCreated, personel } = req.body;

    // Read deliveries data from JSON file
    const deliveriesFilePath = path.join(__dirname, 'data', 'deliveries.json');
    let deliveriesData = [];
    try {
        deliveriesData = JSON.parse(fs.readFileSync(deliveriesFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return res.status(500).send('Error reading deliveries data.');
    }

    // Find the index of the delivery to update
    const index = deliveriesData.findIndex(delivery => delivery.deliveryID === deliveryID);
    if (index !== -1) {
        // Update the delivery data
        deliveriesData[index] = {
            ...deliveriesData[index],
            productName,
            description,
            location,
            dateCreated,
            personel
        };

        // Write updated data back to JSON file
        try {
            fs.writeFileSync(deliveriesFilePath, JSON.stringify(deliveriesData, null, 2));
            res.redirect('/program?program=admin&success=true');
        } catch (error) {
            console.error('Error writing to JSON file:', error);
            res.status(500).send('Error saving delivery.');
        }
    } else {
        res.status(404).send('Delivery not found.');
    }
});

//render edit personel
app.get('/edit-personel/:personelID', isAuthenticated('admin'), (req, res) => {
    const personelID = req.params.personelID;

    // Read deliveries data from JSON file
    const personelsFilePath = path.join(__dirname, 'data', 'personels.json');
    let personelsData = [];
    try {
        personelsData = JSON.parse(fs.readFileSync(personelsFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return res.status(500).send('Error reading deliveries data.');
    }

    // Find the specific delivery by deliveryID
    const personel = personelsData.find(personel => personel.personelID === personelID);
    if (!personel) {
        return res.status(404).send('Personel not found.');
    }

    // Render the editDelivery view with delivery data
    res.render('editPersonel', { personel });
});


// PUT route to handle editing personnel
app.post('/edit-personel/:personelID', isAuthenticated('admin'), (req, res) => {
    const personelID = req.params.personelID;
    const { name, email, phone, dateJoined, password } = req.body;

    const personelsFilePath = path.join(__dirname, 'data', 'personels.json');
    let personelsData = [];
    try {
        personelsData = JSON.parse(fs.readFileSync(personelsFilePath));
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return res.status(500).send('Error reading personnel data.');
    }

    const index = personelsData.findIndex(personel => personel.personelID === personelID);
    if (index !== -1) {
        // Update the personnel data
        personelsData[index] = {
            ...personelsData[index],
            name,
            email,
            phone,
            dateJoined,
            password
        };

        try {
            fs.writeFileSync(personelsFilePath, JSON.stringify(personelsData, null, 2));
            res.redirect('/program?program=admin&success=true');
        } catch (error) {
            console.error('Error writing to JSON file:', error);
            res.status(500).send('Error saving personnel.');
        }
    } else {
        res.status(404).send('Personnel not found.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
