//const { param}  = require('../Route/moviesroute')
const Movie = require('./../Models/moviesModel')
const ApiFeatures = require('./../Utils/apiFeatures')
const asyncErrorHandler = require('./../Utils/asyncErrorHandler')



//ALIASING ROUTE FUNC
exports.getHighestRated = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratings'

    next()
}


//ROUTE HANDLER FUCTIONS
exports.getAllMovies = asyncErrorHandler(async (req, res, next) => {
    
        const features = new ApiFeatures(Movie.find(), req.query)
                                .filter()
                                .sort()
                                .limitFields()
                                .paginate()
       let movies = await features.query
        //console.log(req.query)
        /*
        const excludeFields = ["sort","page","limit", "fields"]

        const queryObj = {...req.query}

        excludeFields.forEach((el)=>{
            delete queryObj[el]
        }) */
        //console.log(req.query);
        // FILTER LOGIC
        //find({ duration:{$gte:300}, ratings:{$lte:10}})
       

        //SORTING LOGIC
        // if(req.query.sort){
            // const sortBy = req.query.sort.split(',').join(' ')
            // query = query.sort(sortBy)
        // }else{
            // query = query.sort('+createdAt')
        // }

        //LIMITING FIELDS
        //if(req.query.fields){
        //    const fields = req.query.fields.split(',').join(' ')
        //    console.log(fields)
        //    query = query.select(fields)
        //}else{
        //    query = query.select('-__v')
        //}
        //PAGINATION
        //const page = req.query.page*1 || 1
        //const limit = req.query.limit*1 || 10
        //const skip = (page - 1) * limit
        //query = query.skip(skip).limit(limit)

        //if(req.query.page){
        //    const movieCount = await Movie.countDocuments()
        //    if(movieCount>=skip){
        //        throw new Error('page not found')
        //    }
        //}

       // const movies = await query;

        //using mongoose special functions
        //                .where("duration")
        //                .gte(queryObj.duration)
        //                .where("releaseYear")
        //                .gte(queryObj.releaseYear)

        res.status(200).json({
            status:"success",
            length:movies.length,
            data:{
                movies
            }
        })
})

exports.getMovie = asyncErrorHandler(async(req, res, next) => {
    
        //const movie = await Movie.find({_id:req.params.id});
        const movie = await Movie.findById(req.params.id)
       
        res.status(200).json({
            status:"success",
            data:{
                movie
            }
        })
})

exports.createMovie = asyncErrorHandler(async(req, res, next) => {

        const movie = await Movie.create(req.body)
 })

 exports.updateMovie = asyncErrorHandler(async(req, res, next) => {

        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})
        res.status(200).json({
            status:"success",
            data:{
                movie
            }
        })
})

exports.deleteMovie = asyncErrorHandler(async (req, res, next) => {

        const movie = await Movie.findByIdAndDelete(req.params.id)

        res.status(204).json({
            status:"success",
            data:null

        })
})

exports.getMovieStats = asyncErrorHandler((async (req, res, next) => {

        const stats = await Movie.aggregate([
            // {$match: {releaseYear:{$lte:new Date()}}},
            {$match:{ratings:{$gte:4.5}}},
            {$group:{
                _id:releseYear,
                avgRatings:{$avg:'$ratings'},
                avgPrice:{$avg:'$price'},
                minPrice:{$min:'$price'},
                maxPrice:{$max:'$price'},
                totalPrice:{$sum:'$price'},
                movieCount:{$sum:1}
                }
            },
            {$sort:{minPrice:1}}
        ])

        res.status(200).json({
            status:'success',
            count:movies.length,
            data:{
                stats
            }
        })
}))

exports.getMovieByGenre = asyncErrorHandler(async (req, res, next) => {

        const genre = req.params.genre
        const movies = await Movie.aggregate([
            // {$match: {releaseYear:{$lte:new Date()}}},
            {$unwind: '$genres'},
            {$group:{
                _id:'$genres',
                movieCount: {$sum:1},
                movies:{$push:'$name'},
            }},
            {$addFields:{genre:'$_id'}},
            {$project:{_id:0}},
            {$sort:{movieCount:-1}},
            // {$limit:6},
            {$match:{genre:genre}}
        ])

        res.status(200).json({
            status:'success',
            count:movies.length,
            data:{
                movies
            }
        })
})