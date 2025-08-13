const mongoose = require('mongoose');
const Station = require('../models/Station');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parkpro', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const demoStations = [
    {
        name: "Central Park Station",
        location: "123 Main Street, Downtown",
        status: "received"
    },
    {
        name: "Westside Parking",
        location: "456 West Avenue, Westside",
        status: "received"
    },
    {
        name: "East End Garage",
        location: "789 East Boulevard, Eastside",
        status: "active"
    },
    {
        name: "North Plaza",
        location: "321 North Road, Northside",
        status: "active"
    },
    {
        name: "South Terminal",
        location: "654 South Street, Southside",
        status: "received"
    }
];

const insertDemoStations = async () => {
    try {
        // Clear existing stations
        await Station.deleteMany({});
        
        // Insert demo stations
        await Station.insertMany(demoStations);
        
        console.log('Demo stations inserted successfully');
        console.log(`Inserted ${demoStations.length} stations`);
        
        // Show inserted stations
        const stations = await Station.find({});
        console.log('Current stations:', stations);
        
    } catch (error) {
        console.error('Error inserting demo stations:', error);
    } finally {
        mongoose.connection.close();
    }
};

insertDemoStations();
