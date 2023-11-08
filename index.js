require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const database = client.db("jobFinderSylDB");
    const jobCollection = database.collection("jobCollection");
    const applyCollection = database.collection("applyCollection");

    app.get("/jobdetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.get("/alljobs", async (req, res) => {
      console.log(req.query.employerEmail);
      let query = {};
      if (req.query?.employerEmail) {
        query = { employerEmail: req.query.employerEmail };
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // app.get("/alljobs", async (req, res) => {
    //   const cursor = jobCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

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
