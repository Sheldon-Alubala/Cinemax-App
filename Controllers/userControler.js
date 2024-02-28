const asyncErrorHandler = require('../Utils/asyncErrorHandler')
const CustomError = require('../Utils/customError')
 const User = require('./../Models/userModel')
 const jwt = require('jsonwebtoken')
 const util = require('util')
 const sendEmail = require ('./../Utils/email')
 const crypto = require ('crypto')
const authController = require('./authControllers')


const filterReqObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(prop => {
        if(allowedFields.includes(prop)) 
            newObj[prop] = obj[prop]
    })
    return newObj
}

exports.getAllUsers = asyncErrorHandler(async(req, res, next) => {
    const users = await User.find()

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    })
})

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    //get current user data from database
    const user = await User.findById(req.user._id).select('+password')

    //check if the supplied user data is correct
    if(!(user.comparePasswordInDb('req.body.currentPassword', 'user.password'))) {
    return next(new CustomError('The current Password provided is wrong', 404))
    }

    //if supplied password is correct, update user password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword

    await user.save()

    //login the user
    authController.createSendResponse(user, 200, res)
 })

 exports.updateMe = asyncErrorHandler(async (req, res, next) => {
    //check if request body contain password
    if(req.body.password || req.body.confirmPassword) {
        return next(new CustomError('You can not update your Password using this end Point', 401))
    }
    //update user detail
    const filterObj = filterReqObj(req.body, 'name', 'email')
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {runValidators: true, new: true})

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
 })

 exports.deleteMe = asyncErrorHandler(async(req, res, next) => {
    await User.findById(req.body.id, {active: false})

    res.status(204).json({
        status: 'success',
        data:null
    })
 })