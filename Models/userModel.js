const mongoose = require ('mongoose');
const validator = require ('validator')
const bcrypt = require ('bcryptjs')
const crypto = require ('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name']
    },
    email: {
        type: String,
        required: [true, 'Enter your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'admin', 'genie'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Enter your password'],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'Confirm your password'],
        validate: {
            //only for save and create
            validator: function (val) {
                return val == this.password
            },
            message: 'Password and confirm password does not match'
        }
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date
})

userSchema.methods.comparePasswordInDb = async function(paswd, paswdDB) {
    return await bcrypt.compare(paswd, paswdDB)
}

userSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
    if(this.passwordChangedAt) {
        const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        console.log(passwordChangedTimestamp, JWTTimestamp);

        return JWTTimestamp < passwordChangedTimestamp
    }
    return false
}

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();
    //encrypt the password before saving
    this.password = await bcrypt.hash(this.password, 12)

    this.confirmPassword = undefined

    next()
})

userSchema.pre(/^find/, function(next) {
    //this keyword in the function will point to the current querry
    this.find({active: {$ne : false}})

    next()
})

userSchema.methods.createReasetPasswordToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetTokenExpires = Date.now() + 60 * 60 * 1000

    return resetToken
}

const User = mongoose.model('User', userSchema )

module.exports = User;