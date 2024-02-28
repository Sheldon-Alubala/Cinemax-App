//IMPORT PACKAGE
const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const sanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const authRouter = require('./Route/authroute');
const moviesRouter = require('./Route/moviesroute')
const CustomError = require('./Utils/customError')
const globalErrorController = require('./Controllers/errorControllers');
const userRouter = require('./Route/userroute')

let app = express();

app.use(helmet())

let limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'We have received too many request from this ip please try after  1 hour '
})

app.use('/api', limiter)



//CUSTOM MIDDLEWEAR
//const logger = function(req, res, next){
//    console.log('custom middlewear called')
//    next()
//}

app.use(express.json({limit: '10kb'}));

app.use(sanitize())

app.use(xss())

app.use(hpp({whitelist: [
    'duration',
    'ratings', 
    'releaseYear', 
    'genres',
    'directors',
    'releaseDate',
    'price',
    'actors'
]}))

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

app.use(express.static('./Public1'))

//app.use(logger);
//app.use((req, res) => {
//    req.requestedAt = new Date().toISOString();
//    next();
//})



//USING ROUTES
app.use('/api/v1/movies', moviesRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/user', userRouter)

app.all('*', (req, res, next) => {
    // res.status(404).json({
        // status: 'fail',
        // message: `cant find ${req.originalUrl}`
    // })
    //#using global error handler
    //const err = new Error(`cant find ${req.originalUrl}`)
    // err.status = 'fail'
    // err.statusCode = 404

    const err = new CustomError(`cant find ${req.originalUrl}`, 404)
    next(err)
})

app.use(globalErrorController)

module.exports = app; 