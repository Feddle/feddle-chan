//WISH I WAS USING MONGOOSE
"use strict";

var expect = require("chai").expect;

const MongoClient = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const DB_URL = process.env.DB; 

module.exports = function (app) {
  
  app.route("/api/threads/:board")    
    .post((req, res) => {
      if(!req.body.text) {res.status(400); res.send("Text cannot be empty"); return;}

      MongoClient.connect(DB_URL, function(err, client) {
        let today = new Date();
        let pswd = req.body.delete_password ? req.body.delete_password : "";
        client.db("glitch").collection("feddle-chan").insertOne({
          board: req.params.board,
          text: req.body.text,
          created_on: today, 
          bumped_on: today, 
          reported: false, 
          delete_password: pswd,
          replies: []
        }, 
        (err, result) => {                    
          if(err) res.send(err);
          if(result.ops.length === 0) res.send("Error occured"); //Keep this for now
          else res.send(result.ops[0]);
        });
      });
    })
    .get((req, res) => {
      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").aggregate([
          {$match: {board: req.params.board}},                                                  
          {$sort: {bumped_on: -1}},
          {$limit: 10},
          {$project: {reported: 0, delete_password: 0}}        
        ])
          .toArray((err, result) => {                        
            if(err) res.send(err);
            if(result.length === 0) {res.send("No threads on board"); return;}

            result.forEach((el) => {
              el.replies.sort((a, b) => b.created_on - a.created_on);
              el.replies.splice(3);
            });                        
            res.send(result);
          });
      }); 
    })
    .put((req, res) => {
      let thread_id;
      try {thread_id = ObjectId(req.body.thread_id);}
      catch(e) {res.status(400); res.send("Incorrect id"); return;}
      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").updateOne({_id: thread_id}, {reported: true}, (err, result) => {
          if(err) res.send(err);                   
          if(!result.matchedCount) {res.status(400); res.send("Error occured");}
          else res.send("Success");
        });
      });
    })
    .delete((req, res) => {
      let thread_id;
      let dl_pswd;
      try {
        thread_id = ObjectId(req.body.thread_id);
        dl_pswd = req.body.delete_password;
        if(!thread_id || !dl_pswd) {res.status(400); res.send("Incorrect id or password"); return;}
      }
      catch(e) {res.status(400); res.send("Incorrect id or password"); return;}
      
      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").deleteOne({_id: thread_id, delete_password: dl_pswd}, {reported: true}, (err, result) => {
          if(err) res.send(err);               
          if(!result.deletedCount) {res.status(400); res.send("Incorrect id or password");}
          else res.send("Success");
        });
      });
    });
    
  app.route("/api/replies/:board")
    .get((req, res) => {

    })
    .post((req, res) => {
    
    })
    .put((req, res) => {
    
    })
    .delete((req, res) => {
    
    });

};
