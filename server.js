const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

const config = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/flightdb',
};

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'static')));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: true,
});

app.use(limiter);

async function connectDB() {
    try {
        await mongoose.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

const itemSchema = new mongoose.Schema({
    altitude: {
        type: Number,
        min: 0,
        max: 3000,
        required: true
    },
    HIS: {
        type: Number,
        min: 0,
        max: 360,
        required: true
    },
    ADI: {
        type: Number,
        min: -100,
        max: 100,
        required: true
    },
});

const Item = mongoose.model('Item', itemSchema);

const validateItemInput = (req, res, next) => {
    const { altitude, HIS, ADI } = req.body;

    if (typeof altitude !== 'number' || altitude < 0 || altitude > 3000) {
        return res.status(400).json({ message: "Invalid altitude value" });
    }
    if (typeof HIS !== 'number' || HIS < 0 || HIS > 360) {
        return res.status(400).json({ message: "Invalid HIS value" });
    }
    if (typeof ADI !== 'number' || ADI < -100 || ADI > 100) {
        return res.status(400).json({ message: "Invalid ADI value" });
    }

    next();
};

const loadItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: "Failed to load items", error: err });
    }
};

const addItem = async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(500).json({ message: "Failed to add item", error: error.message });
    }
};

app.get('/load-items', loadItems);
app.post('/add-item', validateItemInput, addItem);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

async function startServer() {
    try {
        await connectDB();
        app.listen(config.port, () => {
            console.log(`Listening on port ${config.port}`);
        });
    } catch (error) {
        console.error('Server error:', error);
        process.exit(1);
    }
}
startServer();

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, Closing server....');
    await mongoose.connection.close();
    process.exit(0);
});
