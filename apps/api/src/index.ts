import express from "express";
import dotenv from 'dotenv';

dotenv.config({path: "../../.env", override: false });

const app = express()

app.get("/", (req, res) => {
  res.send("Hello, World!")
})

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

const PORT = process.env.API_PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app
