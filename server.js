const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes =
    require("./backend/routes/authRoutes");

const orderRoutes =
    require("./backend/routes/orderRoutes");

const app = express();

// CORS
app.use(cors({
    origin: "*"
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {

})
.then(() => {

    console.log("MongoDB Connected");

})
.catch((err) => {

    console.log("MongoDB Error:", err);

});

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/orders", orderRoutes);

// Test Route
app.get("/", (req, res) => {

    res.send(
        "LPU Canteen Backend Running"
    );

});

// Start Server
const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});