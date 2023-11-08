require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    // origin: ["http://localhost:5173", "http://localhost:5174"],
    origin: [
      "https://jobfindersyl.web.app",
      "https://jobfindersyl.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(
    `<h1 style="color: blue; font-size: 24px; font-weight: bold; text-align: center;">Job Finder SYL Server Running</h1>`
  );
});

app.listen(port, () => {
  console.log(`http://localhost:${port}/`);
});

// _______________________________mongoDB
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.woa6wff.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//custom Middlewares
const logger = async (req, res, next) => {
  console.log("called: ", req.method, req.host, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("token in middleware-----------" + token);
  if (!token) {
    return res.status(401).send({ message: "not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SEC, (err, decoded) => {
    //error
    if (err) {
      // console.log(err);

      return res.status(401).send({ message: "unauthorized" });
    }

    //decode
    req.user = decoded;
    // console.log("user====", req.user);
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const database = client.db("jobFinderSylDB");
    const jobCollection = database.collection("jobCollection");
    const applyCollection = database.collection("applyCollection");

    // AUTH________________
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      // console.log(user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SEC, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.get("/jobdetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.get("/alljobspersonal", verifyToken, async (req, res) => {
      console.log("asdasds", req.cookies.token);
      // console.log(req.query.employerEmail);
      let query = {};
      if (req.query?.employerEmail) {
        query = { employerEmail: req.query.employerEmail };
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/alljobs", async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/addajob", async (req, res) => {
      const newjob = req.body;
      const result = await jobCollection.insertOne(newjob);
      res.send(result);
    });

    app.patch("/updatejob/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };
      const updatedJob = req.body;
      console.log(updatedJob);
      const job = {
        $set: {
          bannerImgUrl: updatedJob.bannerImgUrl,
          logoUrl: updatedJob.logoUrl,
          employerName: updatedJob.employerName,
          jobTitle: updatedJob.jobTitle,
          category: updatedJob.category,
          salarymin: updatedJob.salarymin,
          salarymax: updatedJob.salarymax,
          deadline: updatedJob.deadline,
          shortDes: updatedJob.shortDes,
        },
      };
      const result = await jobCollection.updateOne(filter, job, options);
      res.send(result);
    });

    app.delete("/alljobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    });

    // Apply related API
    app.get("/allapplied", verifyToken, async (req, res) => {
      console.log(req.query.applicantEmail);
      let query = {};
      if (req.query?.applicantEmail) {
        query = { applicantEmail: req.query.applicantEmail };
      }
      const cursor = applyCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/appliedjobs", async (req, res) => {
      const newapply = req.body;
      const result = await applyCollection.insertOne(newapply);
      const jobId = newapply.jobId;

      const filter = { _id: new ObjectId(jobId) };
      const update = {
        $inc: {
          totalApplicant: 1,
        },
      };
      const updateResult = await jobCollection.updateOne(filter, update);
      res.send({ result, updateResult });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
