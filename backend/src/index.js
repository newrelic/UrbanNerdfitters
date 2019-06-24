require('newrelic');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// express middleware for cookies
server.express.use(cookieParser());

//decode JWT for userId and add to req
server.express.use((req, res, next) => {
    const {token} = req.cookies;
    if(token){
        const {userId} = jwt.verify(token, process.env.APP_SECRET);
        req.userId = userId;
    }
    next();
})

// Middle that adds the user to each request if they are logged in
server.express.use(async (req, res, next) => {
    // If not logged in
    if(!req.userId) return next();

    // Query the user
    const user = await db.query.user(
        {where: {id: req.userId}},
        '{id, permissions, email, name}'
    );
    req.user = user;
    next();
})


server.start({
        cors: {
            credentials: true,
            origin: process.env.FRONTEND_URL
        }
    }, deets => {
    console.log(`Server is now running on port http://${deets.port}`)
});