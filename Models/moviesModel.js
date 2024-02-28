const mongoose = require('mongoose');
const fs = require('fs')
const validator = require ('validator')
//CREATING A SCHEMA & MODEL
const movieSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Name is a required field"],
        unique:true,
        maxlength:[100, 'movie name must not have more than 100 characters'],
        trim:true
    },
    description:{
        type:String,
        required:[true, "Name is a required field"],
        trim:true
    },
    duration:{
        type:Number,
        required:[true, "Duration is a required field"]
    },
    releaseYear:{
        type:Number,
        required:[true, "Release year is a required field"],
        trim:true
    },
    ratings:{
        type:Number,
        // max: [10, 'Rating must be 10.0 0r below'],
        // min: [1, 'Rating must be 10.0 or below'],
        validate: {
            validator: function(value) {
                return value >= 1 && value <= 10;
            } ,
            message: 'Rating ({value}) should be above 1 and below 10'
        } 
    },
    totalRatings:{
        type:Number
    },
    releaseDate:{
        type:Date,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        select:false
    },
    genres:{
        type:[String],
        required:[true, "Genre is a required field"],
        // enum: {
            // values: ['Action', 'Sci-fi', 'Fiction', 'Romantic', 'Investigative', 'Comedy', 'Drama', 'Adventure', 'Thriller', 'Crime', 'Biography', 'Horror'],
            // message: 'This genre not found'
        // }
    },
    directors:{
        type:[String],
        required:[true, "Genre is a required field"]
    },
    coverImage:{
        type:String,
       // required:[true, "Cover image is a required field"]
    },
    actors:{
        type:[String],
        required:[true, "Actors is a required field"]
    },
    price:{
        type:Number,
        required:[true, "Price is a required field"]
    },
    createdBy: String
    
},{
    toJSON:{virtual: true},
    toObject:{virtuals: true}
})

movieSchema.virtual('durationInHours').get(function(){
    return this.duration / 60
})

//EXECUTE MIDDLEWEARBEFORE DOCUMENT IS SAVED IN THE DATA BASE
//save happen when we call this methods save(), create()
//insertMany() and findByIdAndUpdate() dont trigger save event
movieSchema.pre('save', function(next){
    this.createdBy = 'Genie'
    next()
})

movieSchema.post('save', function(doc, next){
    const content = `a movie document named ${doc.name} has been created by ${doc.createdBy}\n`
    fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, (err)=>{
        console.log(err.message);

    })
    next()
})

//QUERY MIDDLEWEAR
movieSchema.pre(/'find'/, function(next){
    this.find({releaseDate:{$lte: Date.now()}})
    this.startTime = Date.now()
    next()
})

movieSchema.post(/'find'/, function(docs, next){
    this.find({releaseDate:{$lte: Date.now()}})
    this.endTime = Date.now()

    const content = `Query took ${this.endTime - this.startTime} to fetch the documents\n`
    fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, (err)=>{
        console.log(err.message);

    })

    next()
})
movieSchema.pre('aggregate', function(next) {
    console.log(this.pipeline().unshift({$match: {releaseYear:{$lte:new Date()}}},))
    next()
})

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie