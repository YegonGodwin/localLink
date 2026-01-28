import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("LocalLink API is running!");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});