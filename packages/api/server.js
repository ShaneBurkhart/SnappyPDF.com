var express = require("express");
var app = express();
var http = require('http').createServer(app);

const setupApplication = require("./bouncer/setupApplication");

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:postgres@pg:5432/mydb');

const redis = require('redis');
const session = require('express-session');

const RedisStore = require('connect-redis')(session);
const redisClient = redis.createClient(6379, "redis");
const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: 'a9e3247f-1566-4e83-bc3e-0edff518fe1a',
  resave: false,
  saveUninitialized: true,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware);

// app.use(m.addUserToRequest);

setupApplication(app)

app.get("/api/ping", function (req, res) {
  res.send("Ping");
});

async function _testPostgresConnection () {
  try {
    await sequelize.authenticate();
    console.log('Postgres connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

const port = process.env["PORT"];

if (require.main === module) {
  http.listen(port, function(){
    _testPostgresConnection().then(function () {
      console.log('listening on *:' + port);
    });
  });
}

module.exports = app;
