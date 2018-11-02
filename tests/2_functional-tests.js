/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

/* eslint-disable */

//PUT tests should propably be before DELETE..
//-Feddle

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");
const MongoClient = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const DB_URL = process.env.DB; 

chai.use(chaiHttp);

let testThread;

suite("Functional Tests", function() {

  suite("API ROUTING FOR /api/threads/:board", function() {
    
    suite("POST", function() {

      test("new thread with both fields", function(done) {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            text: "POST TEST 1",
            delete_password: "1234"
          })
          .end(function(err, res){
            assert.equal(res.status, 200);                    
            assert.property(res.body, "_id", "thread should contain _id");
            assert.equal(res.body.board, "test", "Board should be correct");
            assert.equal(res.body.text, "POST TEST 1", "Text should be correct");
            assert.isOk(res.body.created_on, "created_on should be ok");
            assert.isOk(res.body.bumped_on, "bumped_on should be ok");
            assert.equal(res.body.reported, false, "Reported should be false");
            assert.equal(res.body.delete_password, "1234", "delete_password should be correct");
            assert.isArray(res.body.replies, "Replies should be an array");
            testThread = res.body._id;
            done();
          });
      });

      test("new thread with only text field", function(done) {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            text: "POST TEST 2"            
          })
          .end(function(err, res){
            assert.equal(res.status, 200);                    
            assert.property(res.body, "_id", "thread should contain _id");
            assert.equal(res.body.board, "test", "Board should be correct");
            assert.equal(res.body.text, "POST TEST 2", "Text should be correct");
            assert.isOk(res.body.created_on, "created_on should be ok");
            assert.isOk(res.body.bumped_on, "bumped_on should be ok");
            assert.equal(res.body.reported, false, "Reported should be false");
            assert.equal(res.body.delete_password, "", "delete_password should be correct");
            assert.isArray(res.body.replies, "Replies should be an array");
            done();
          });
      });

      test("new thread with no text field", function(done) {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            delete_password: "1234"          
          })
          .end(function(err, res){
            assert.equal(res.status, 400);                    
            assert.equal(res.text, "Text cannot be empty", "Should return an error");
            done();
          });
      });


    });
    
    suite("GET", function() {

      test("list recent threads",  function(done){
        chai.request(server)
          .get("/api/threads/test")
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body, "response should be an array");
            assert.isAtMost(res.body.length, 10);
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "board");
            assert.property(res.body[0], "_id");
            assert.isOk(res.body[0].created_on, "created_on should be ok");
            assert.isOk(res.body[0].bumped_on, "bumped_on should be ok");
            assert.notProperty(res.body[0], "reported", "reported should not be be sent");
            assert.notProperty(res.body[0], "delete_password", "delete_password should not be be sent");
            assert.isArray(res.body[0].replies, "Replies should be an array");
            assert.isAtMost(res.body[0].replies.length, 3);
            done();
          });
      }); 

      test("no threads",  function(done){
        chai.request(server)
          .get("/api/threads/test1")
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "No threads on board");
            done();
          });
      }); 

    });
    
    suite("DELETE", function() {      
      let ids = ["5bd99119fb6fc074abb38e48", "5bd99152fb6fc074abb38e66"];
      let today = new Date();
      let items = [
        {_id: ObjectId(ids[0]), board: "test", delete_password: "1234"},
        {_id: ObjectId(ids[1]), board: "test", delete_password: "1234", reported: false, replies: [], created_on: today, bumped_on: today, text: "TEST THREAD"}
      ];
      
      suiteSetup(function(done) {
        MongoClient.connect(DB_URL, function(err, client) {
          client.db("glitch").collection("feddle-chan").insertMany(items, (err, result) => {
            if(err) console.log(err);
            client.close();
            done();
          });
        });
      });

      test("send correct fields",  function(done){
        chai.request(server)
          .delete("/api/threads/test")
          .send({thread_id: ids[0], delete_password: "1234"})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "Success");
            done();
          });
      }); 

      test("send incorrect field",  function(done){
        chai.request(server)
          .delete("/api/threads/test")
          .send({thread_id: ids[1], delete_password: "123"})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.text, "Incorrect id or password");
            done();
          });
      });

    });
    
    suite("PUT", function() {
      let id = "5bd99152fb6fc074abb38e66";

      test("send correct id",  function(done){
        chai.request(server)
          .put("/api/threads/test")
          .send({thread_id: id})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "Success");
            done();
          });
      });

      test("send incorrect id",  function(done){
        chai.request(server)
          .put("/api/threads/test")
          .send({thread_id: "gibberwack"})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.text, "Incorrect id");
            done();
          });
      });

    });        

  });

  
  suite("API ROUTING FOR /api/replies/:board", function() {
    let id = "5bd99152fb6fc074abb38e66";

    suite("POST", function() {

      test("new reply all fields", function(done) {
        chai.request(server)
          .post("/api/replies/test")
          .send({
            thread_id: id,
            text: "POST REPLY TEST 1",
            delete_password: "1234"
          })
          .end(function(err, res){
            assert.equal(res.status, 200);                    
            assert.property(res.body, "_id", "reply should contain _id");            
            assert.equal(res.body.text, "POST REPLY TEST 1", "Text should be correct");
            assert.isOk(res.body.created_on, "created_on should be ok");            
            assert.equal(res.body.reported, false, "Reported should be false");
            assert.equal(res.body.delete_password, "1234", "delete_password should be correct");            
            done();
          });
      });

      test("new reply with only text field", function(done) {
        chai.request(server)
          .post("/api/replies/test")
          .send({
            thread_id: id,
            text: "POST REPLY TEST 2"            
          })
          .end(function(err, res){
            assert.equal(res.status, 200);                    
            assert.property(res.body, "_id", "thread should contain _id");            
            assert.equal(res.body.text, "POST REPLY TEST 2", "Text should be correct");
            assert.isOk(res.body.created_on, "created_on should be ok");            
            assert.equal(res.body.reported, false, "Reported should be false");
            assert.equal(res.body.delete_password, "", "delete_password should be correct");            
            done();
          });
      });

      test("new reply with no text field", function(done) {
        chai.request(server)
          .post("/api/replies/test")
          .send({
            thread_id: id,
            delete_password: "1234"          
          })
          .end(function(err, res){
            assert.equal(res.status, 400);                    
            assert.equal(res.text, "Text cannot be empty", "Should return an error");
            done();
          });
      });

      test("new reply with no id field", function(done) {
        chai.request(server)
          .post("/api/replies/test")
          .send({  
            text: "POST REPLY TEST 4",
            delete_password: "1234"          
          })
          .end(function(err, res){
            assert.equal(res.status, 400);                    
            assert.equal(res.text, "Incorrect id", "Should return an error");
            done();
          });
      });

      test("new reply with incorrect id field", function(done) {
        chai.request(server)
          .post("/api/replies/test")
          .send({  
            text: "POST REPLY TEST 5",
            thread_id: "gibblewack"
          })
          .end(function(err, res){
            assert.equal(res.status, 400);                    
            assert.equal(res.text, "Incorrect id", "Should return an error");
            done();
          });
      });


    });
    
    suite("GET", function() {

      test("send correct id",  function(done){
        chai.request(server)
          .get("/api/replies/test")
          .query({thread_id: testThread})
          .end(function(err, res){
            assert.equal(res.status, 200);            
            assert.property(res.body, "text");
            assert.property(res.body, "board");
            assert.property(res.body, "_id");
            assert.isOk(res.body.created_on, "created_on should be ok");
            assert.isOk(res.body.bumped_on, "bumped_on should be ok");
            assert.notProperty(res.body, "reported", "reported should not be be sent");
            assert.notProperty(res.body, "delete_password", "delete_password should not be be sent");
            assert.isArray(res.body.replies, "Replies should be an array");            
            done();
          });
      }); 

      test("send incorrect id",  function(done){
        chai.request(server)
          .get("/api/replies/test")
          .query({thread_id: "gibblewack"})
          .end(function(err, res){
            assert.equal(res.status, 400);            
            assert.equal(res.text, "Incorrect id");      
            done();
          });
      }); 

      test("send id that doesn't exist",  function(done){
        chai.request(server)
          .get("/api/replies/test")
          .query({thread_id: new ObjectId().toHexString()})
          .end(function(err, res){
            assert.equal(res.status, 400);            
            assert.equal(res.text, "Thread not found");      
            done();
          });
      }); 

    });

    
    suite.skip("DELETE", function() {      
      let ids = ["5bd9a07ffb6fc074abb398da", "5bd9a08cfb6fc074abb398e7"];
      let items = [{_id: ObjectId(ids[0]), delete_password: "1234"}, {_id: ObjectId(ids[1]), delete_password: "1234"}];
      
      suiteSetup(function(done) {
        MongoClient.connect(DB_URL, function(err, client) {
          client.db("glitch").collection("feddle-chan").updateOne({_id: ObjectId(testThread)}, {$push: {replies: {$each: items}}}, (err, result) => {
            if(err) console.log(err);
            client.close();
            done();
          });
        });
      });

      test("send correct fields",  function(done){
        chai.request(server)
          .delete("/api/replies/test")
          .send({thread_id: testThread, reply_id: ids[0], delete_password: "1234"})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "Success");
            done();
          });
      }); 

      test("send incorrect field",  function(done){
        chai.request(server)
          .delete("/api/replies/test")
          .send({thread_id: testThread, reply_id: ids[1], delete_password: "123"})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.text, "Incorrect id or password");
            done();
          });
      });

    });
    
    suite.skip("PUT", function() {
      let id = "5bd9a08cfb6fc074abb398e7";

      test("send correct id",  function(done){
        chai.request(server)
          .put("/api/replies/test")
          .send({thread_id: testThread, reply_id: id})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "Success");
            done();
          });
      });

      test("send incorrect id",  function(done){
        chai.request(server)
          .put("/api/replies/test")
          .send({thread_id: "gibberwack", reply_id: id})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.text, "Incorrect id");
            done();
          });
      });

    });

    suiteTeardown(function(done) {
      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").deleteMany({board: "test"}, (err, result) => {
          if(err) console.log(err);
          client.close();
          done();
        });
      });        
    });
    
  });
});
