**FreeCodeCamp**- Information Security and Quality Assurance
------

Project Anon Message Board

1) SET NODE_ENV to `test` without quotes when ready to write tests and DB to your databases connection string (in .env)
2) Recomended to create controllers/handlers and handle routing in routes/api.js
3) You will add any security features to `server.js`
4) You will create all of the functional/unit tests in `tests/2_functional-tests.js` and `tests/1_unit-tests.js` but only functional will be tested

**NOTE:** I found the project specs and example app lacking so I made a few design decisions of my own.

1. I made no attention to the front-end. Meaning the front-end might not work like it should or at all. Only the back-end is as it should. I decided it was better to not try fix the FCC boilerplate.
2. All the requests now return a single response. No redirecting. It's easier to test this way and can be migrated to another front-end.
3. I added a "board" property to the threads.

Please disregard the front-end.


