const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    `<h1 style="color: blue; font-size: 24px; font-weight: bold; text-align: center;">Job Finder SYL Server Running</h1>`
  );
});

app.listen(port, () => {
  console.log(`http://localhost:${port}/`);
});
