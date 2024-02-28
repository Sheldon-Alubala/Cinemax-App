 const asyncErrorHandler = require('../Utils/asyncErrorHandler')
const CustomError = require('../Utils/customError')
 const User = require('./../Models/userModel')
 const jwt = require('jsonwebtoken')
 const util = require('util')
 const sendEmail = require ('./../Utils/email')
 const crypto = require ('crypto')

 const signToken = id => {
    return jwt.sign({id}, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
     })
 }

 const createSendResponse = (user, statusCode, res) => {
    const token = signToken(user._id)

    const options = {
        maxAge: process.env.LOGIN_EXPIRES,
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production')
        options.secure = true

    res.cookie('jwt', token, options )

    user.password = undefined

    res.status(statusCode).json({
        status: 'succes',
        token,
        data: {
            user
        }
    })
 }


 exports.signup = asyncErrorHandler(async (req,  res, next) => {
     const newUser = await User.create(req.body)

     createSendResponse(newUser, 201, res)

    
 })

 exports.login = asyncErrorHandler(async (req, res, next) => {
    const email =  req.body.email
    const password = req.body.password
    //const {email, password} = req.body
    //check if email & password is present in the request body
    if(!email || !password) {
        const error = new CustomError('Please provide email and Password for login in!', 400)
        return next(error)
    }
    //check if user exists with a given email
    const user = await User.findOne({ email }).select('+password')

    //const isMatch = await user.comparePasswordInDb(password, user.password)
    //check if the user exist and password is correct
    if(!user || !(await user.comparePasswordInDb(password, user.password))) {
        const error = new CustomError('Incorrect email or Password', 400)
        return next(error)
    }

    createSendResponse(user, 201, res)
 })

 exports.protect = asyncErrorHandler(async (req, res, next) => {
    //1.read the token & check if it exist
    const testToken = req.headers.authorization
    let token;
    if(testToken && testToken.startsWith('Bearer')) {
        token = testToken.split(' ')[1]
    }
    if(!token) {
        next(new CustomError('You are not logged in', 401))
    }

    //2.validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR)

    //3.if the user exist
    const user = await User.findById(decodedToken.id)

    if(!user) {
        const error = new CustomError('User does not exist, Signup', 401)
        next(error)
    }
    //if the user changed password after the token was issued
    const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat)  //.iat
    if(isPasswordChanged){
        const error = new CustomError('Password has been changed. Please Login', 401)
        return next(error)
    }

    //4.allow user to access route
    req.user = user;
    next()
 })

 exports.restrict = (role) => {
    (req, res, next) => {
        if(req.user.role !== role) {
            const error = new CustomError('You do not have permission to this action', 403)
            next(error)
        }
        next()
    
    }
 }
/*
 exports.restrict = (...role) => {
    (req, res, next) => {
        if(!role.includes(req.user.role)) {
            const error = new CustomError('You do not have permission to this action', 403)
            next(error)
        }
        next()
    }
 }
 */

 exports.forgotPassword = asyncErrorHandler(async(req, res, next) => {
    //1. get user based on posted email
    const user = await User.findOne({email: req.body.email})

    if(!user) {
        const error = new CustomError('User does not exist', 404)
        next(error)
    }

    //2.generate a random reset token
    const resetToken = user.createResetPassswordToken()

    await user.save({validateBeforeSave: false})

    //3.send the token back to the user
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `please use the link in your email to reset your password\n\n${resetUrl}\n\nThis reset password link will be valid for 1 hour`
 
    try{   await sendEmail({
        email: user.email,
        subject: 'Password change request received',
        message
    })
    res.status(200).json({
        status: 'success',
        message: 'Password reset link send to the user email'
    })

}catch(err){
        user.passwordResetToken = undefined,
        user.passwordResetTokenExpires = undefined
        user.save({validateBeforeSave: false})

        return next(new CustomError('There was an error sending password reset email, please try again later', 500))
    }

 })

 exports.resetPassword = asyncErrorHandler(async(req, res, next) => {
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({passwordResetToken: token, passwordResetTokenExpires: {$gt:Date.now()}})
    if(!user) {
        const error = new CustomError('Token is invalid or has expired', 400)
        next(error)
    }

    //RESETING THE USER PASSWORD
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now()

    user.save()

    //LOGIN THE USER
    createSendResponse(user, 200, res)
 })

