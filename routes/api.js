//WISH I WAS USING MONGOOSE
"use strict";

var expect = require("chai").expect;

const MongoClient = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const DB_URL = process.env.DB; 

module.exports = function (app) {
  
  app.route("/api/threads/:board")    
    .post((req, res, next) => {
      if(!req.body.text) {let err = new Error("Text cannot be empty"); err.statuscode = 400; throw err;}

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
          if(result.ops.length === 0) {let err = new Error("Error occured"); err.statuscode = 400; next(err);} //Keep this for now
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
    .put((req, res, next) => {
      let thread_id;
      let err = new Error();
      try {thread_id = ObjectId(req.body.thread_id);}
      catch(e) {err.message = "Incorrect id"; err.statuscode = 400; next(err); return;}
      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").updateOne({_id: thread_id}, {$set: {reported: true}}, (err, result) => {
          if(err) res.send(err);                   
          if(!result.matchedCount) {let err = new Error("Error occured"); err.statuscode = 400; next(err);} //Keep this for now
          else res.send("Success");
        });
      });
    })
    .delete((req, res, next) => {
      let thread_id;
      let dl_pswd;
      let err = new Error();
      try {
        thread_id = ObjectId(req.body.thread_id);
        dl_pswd = req.body.delete_password;
        if(!thread_id || !dl_pswd) {err.message = "Incorrect id or password"; err.statuscode = 400; throw err;}
      }
      catch(e) {err.message = "Incorrect id or password"; err.statuscode = 400; next(err); return;}
      
      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").deleteOne({_id: thread_id, delete_password: dl_pswd}, {reported: true}, (err, result) => {
          if(err) res.send(err);               
          if(!result.deletedCount) {let err = new Error("Incorrect id or password"); err.statuscode = 400; next(err);}
          else res.send("Success");
        });
      });
    });
    
  app.route("/api/replies/:board")
    .post((req, res, next) => {
      let err = new Error();
      if(!req.body.text) {err.message = "Text cannot be empty"; err.statuscode = 400; throw err;}      
      if(!req.body.thread_id) {err.message = "Incorrect id"; err.statuscode = 400; throw err;}

      let thread_id;      
      try {thread_id = ObjectId(req.body.thread_id);} 
      catch(e) {err.message = "Incorrect id"; err.statuscode = 400; next(err); return;}
      let _id = new ObjectId();
      let created_on = new Date();
      let delete_password = req.body.delete_password ? req.body.delete_password : "";
      let text = req.body.text;
      let reported = false;

      MongoClient.connect(DB_URL, function(err, client) {                
        let reply = {_id, text, created_on, delete_password, reported};
        client.db("glitch").collection("feddle-chan").updateOne({_id: thread_id}, {$set: {bumped_on: created_on}, $push: {replies: reply}},
          (err, result) => {                    
            if(err) res.send(err);
            if(!result.matchedCount) {let err = new Error("Error occured"); err.statuscode = 400; next(err);} //Keep this for now
            else res.send(reply);
          });
      });
    })  
    .get((req, res, next) => {
      let thread_id;            
      try {
        if(!req.query.thread_id) throw new Error();
        thread_id = ObjectId(req.query.thread_id);
      } catch(err) {err.message = "Incorrect id"; err.statuscode = 400; next(err); return;}

      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").findOne({_id: thread_id}, {fields: {reported: 0, delete_password: 0}}, (err, result) => {                        
          if(err) res.send(err);
          if(!result) {let err = new Error("Thread not found"); err.statuscode = 400; next(err);}                             
          else res.send(result);
        });
      }); 
    })    
    .put((req, res, next) => {
      let thread_id;
      let reply_id;
      try {
        if(!req.body.thread_id) throw new Error();
        thread_id = ObjectId(req.body.thread_id);
        reply_id = ObjectId(req.body.reply_id);
      } catch(err) {err.message = "Incorrect id"; err.statuscode = 400; next(err); return;}

      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").updateOne({_id: thread_id, "replies._id": reply_id}, {$set: {"replies.$.reported": true}}, (err, result) => {
          if(err) res.send(err);                   
          if(!result.matchedCount) {let err = new Error("Incorrect id"); err.statuscode = 400; next(err);}
          else res.send("Success");
        });
      });
    })
    .delete((req, res, next) => {
      let thread_id;
      let reply_id;
      let dl_pswd;
      try {
        thread_id = ObjectId(req.body.thread_id);
        reply_id = ObjectId(req.body.reply_id);
        dl_pswd = req.body.delete_password;        
        if(!thread_id || !dl_pswd || !reply_id) throw new Error();
      }
      catch(err) {err.message = "Incorrect id or password"; err.statuscode = 400; next(err); return;}
      
      MongoClient.connect(DB_URL, function(err, client) {
        client.db("glitch").collection("feddle-chan").updateOne(
          {_id: thread_id, "replies._id": reply_id, "replies.delete_password": dl_pswd}, 
          {$set: {"replies.$.text": "[deleted]"}},
          (err, result) => {
            if(err) res.send(err);  //This should propably be something else          
            if(!result.matchedCount) {let err = new Error("Incorrect id or password"); err.statuscode = 400; next(err);}
            else res.send("Success");
          });
      });
    });

};
