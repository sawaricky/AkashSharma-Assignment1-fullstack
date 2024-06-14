const express = require("express");
require('dotenv').config();
const path = require("path"); //needed when setting uo statuc/file paths
const { MongoClient, ObjectId } = require("mongodb");


// create a new MongoClient
// const dbUrl = "mongodb://127.0.0.1:27017/";
const dbUrl = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPWD}@${process.env.DBHOST}/?retryWrites=true&w=majority&appName=Cluster0`
const client = new MongoClient(dbUrl); //create  the MongoClient

//set up the express app
const app = express();
const port = process.env.PORT || "8888";

//set up application template engine
app.set("views", path.join(__dirname, "views")); // the first  "views" is the setting name
// the second value above is that path:__dirname/views
app.set("view engine", "pug");




//set up folder for static files
app.use(express.static(path.join(__dirname, "public")));

//convert query string formats in form data to JSON format
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// monogoDB Functions
async function connection() {
    db = client.db("toronto_tours");
    return db; //return the database
  }

//set up server listening
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });

  // home
app.get("/", async (request, response) => {
// response.status(200).send("Test")
response.render("index", { title: "Home" });
});
// contanct
app.get("/contact", async (request, response) => {
  // response.status(200).send("Test")
  response.render("contact", { title: "Contact us" });
  });
  
  
  async function addPlace(newPlace) {
    db = await connection();
    let status = await db.collection("visit_in_toronto").insertOne(newPlace);
    //do soemthing with the status to check is ok
    console.log("Place added");
  }
  
  app.get("/admin/menu/add", async (request, response) => {
    let places = await getPlaces();
    response.render("menu-add", { title: "Add New Place", menu: places });
  });


  app.post("/admin/menu/add/submit", async (request, response) => {
    //query string format: name=0&path=... contact&name=...
    //make data accessible as if it awsa a JSON object Via lines 23-24
    // Post form data is passed via the body (request.body)
    let eventName = request.body.eName;
    // is the name of the name field in the form
    let eventVenue = request.body.eVenue; // venue field data
    let eventDate = request.body.eDate; //  date  firld

  
    let newPlace = {
        // the ones on left are the names in the databasa
        eName: eventName,
        eVenue: eventVenue,
        eDate: eventDate
    };
    await addPlace(newPlace);
    response.redirect("/admin/menu");
  });

  // Get all places from the  collection
async function getPlaces() {
    db = await connection();
    let results = db.collection("visit_in_toronto").find({});
    return await results.toArray(); // convert results to an array
  }

  // admin page routes
  app.get("/admin/menu", async (request, response) => {
    let places = await getPlaces();
    response.render("menu-list", { title: "Events within Toronto", menu: places  });
  });

  // Get all places from the  collection
async function getPlaces() {
  db = await connection();
  let results = db.collection("visit_in_toronto").find({});
  return await results.toArray(); // convert results to an array
}

//path for processing the deelte form
app.get("/admin/menu/delete", async (request, response) => {
  // get place id
  //  for a GET Fform, the data is passed in the query string of the UTL  (request.query)
  let id = request.query.placeId;

  // execute the fucntion to delete by _id
  deletePlace(id);
  // redirect ack to main menu admin page this is reloding the page after ythe delete happens
  response.redirect("/admin/menu");
});

// delete one document by id
async function deletePlace(id) {
  db = await connection();
  const deleteIdFilter = { _id: new ObjectId(id) };
  let result = await db.collection("visit_in_toronto").deleteOne(deleteIdFilter);
  if (result.deleteCount == 1) console.log("delete successful");
}


app.post("/admin/menu/edit/submit", async (request, response) => {
  //get the _id and set it as a JSON object to be used for the filter
  // request.body.placeId is from the menu-edit.pug name=placeId
  let idFilter = { _id: new ObjectId(request.body.placeId) };

    let eventName = request.body.eName;
    // is the name of the name field in the form
    let eventVenue = request.body.eVenue; // url venue data
    let eventDate = request.body.eDate; //  date text firld

    let place = {
        // the ones on left are the names in the databasa
        eName: eventName,
        eVenue: eventVenue,
        eDate: eventDate
    };
  await editPlace(idFilter, place);
  response.redirect("/admin/menu");
});

async function editPlace(filter, place) {
  db = await connection();
  //create the update set { $set: <JSON document> }
  //execute an updateOne() to update the place as selected via the filter
//   if docuemts do not match the filter
  // const options = { upsert: false };
//   for particular fields
  const updateDoc = { 
            $set: {
              eName: place.eName,
              eVenue: place.eVenue,
              eDate: place.eDate               
            }};
  // const options = { upsert: false };
  //this is the db name after the collection
  const result = await db.collection("visit_in_toronto").updateOne(filter,updateDoc)
  return result;
}

//editing 
app.get("/admin/menu/edit", async (request, response) => {
  if (request.query.placeId) {
    let placeToEdit = await getSinglePlace(request.query.placeId);
    let places = await getPlaces();
    response.render("menu-edit", {
      title: "Edit Places",
      menu: places,
      editPlace: placeToEdit
    });
  } else {
    response.redirect("/admin/menu");
  }
});

// getting single place
async function getSinglePlace(id) {
  db = await connection();
//   _id is used to search in the database objectId(id) is what we declared in the form
  const editId = { _id: new ObjectId(id) };
//   this is like querying from a database using the nosql method
  const result = await db.collection("visit_in_toronto").findOne(editId);
  return result;
}

  // Get all places from the visit_in_toronto collection
  async function getVisitPlaces() {
    db = await connection();
    let results = db.collection("visit_in_toronto").find({});
    return await results.toArray(); // convert results to an array
  }

  // visit page routes
  app.get("/visit", async (request, response) => {
    let places = await getVisitPlaces();
    response.render("visit", { title: "Events within Toronto", menu: places  });
  });
