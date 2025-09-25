
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb://127.0.0.1:27017/moviestream", { useNewUrlParser: true, useUnifiedTopology: true });

const movieSchema = new mongoose.Schema({
  title: String,
  category: String,
  filename: String,
  createdAt: { type: Date, default: Date.now }
});
const Movie = mongoose.model("Movie", movieSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

app.post("/api/movies", upload.single("file"), async (req, res) => {
  const { title, category } = req.body;
  if(!title || !category || !req.file) return res.status(400).json({ error: "Missing fields" });
  const movie = new Movie({ title, category, filename: req.file.filename });
  await movie.save();
  res.json(movie);
});

app.put("/api/movies/:id", async (req, res) => {
  const { title, category } = req.body;
  const movie = await Movie.findByIdAndUpdate(req.params.id, { title, category }, { new: true });
  if(!movie) return res.status(404).json({ error: "Movie not found" });
  res.json(movie);
});

app.delete("/api/movies/:id", async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if(!movie) return res.status(404).json({ error: "Movie not found" });
  const filepath = path.join(__dirname, "uploads", movie.filename);
  if(fs.existsSync(filepath)) fs.unlinkSync(filepath);
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: "Movie deleted" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
