/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

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
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "board");
            assert.property(res.body[0], "_id");
            assert.isOk(res.body[0].created_on, "created_on should be ok");
            assert.isOk(res.body[0].bumped_on, "bumped_on should be ok");
            assert.notProperty(res.body[0].reported, "reported should not be be sent");
            assert.notProperty(res.body[0].delete_password, "delete_password should not be be sent");
            assert.isArray(res.body[0].replies, "Replies should be an array");
            done();
          });
      }); 
    });
    
    suite("DELETE", function() {
      
    });
    
    suite("PUT", function() {
      
    });
    

  });
  
  suite("API ROUTING FOR /api/replies/:board", function() {
    
    suite("POST", function() {
      
    });
    
    suite("GET", function() {
      
    });
    
    suite("PUT", function() {
      
    });
    
    suite("DELETE", function() {
      
    });
    
  });

});
