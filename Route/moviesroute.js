const express = require('express')
const moviesController = require('../Controllers/moviescontrollers.js')
const authController = require('./../Controllers/authControllers.js')

const Router = express.Router();

//Router.param('id', moviesController.checkId)

Router.route('/movie-genre')
    .get(moviesController.getMovieByGenre)

Router.route('/highest-rated')
    .get(moviesController.getHighestRated, moviesController.getAllMovies)

Router.route('/movie-stats')
    .get(moviesController.getMovieStats)

Router.route('/')
    .get(authController.protect, moviesController.getAllMovies)
    .post(moviesController.createMovie)
    
Router.route('/:id')
    .get(authController.protect, moviesController.getMovie)
    .patch(moviesController.updateMovie)
    .delete(authController.protect, authController.restrict, moviesController.deleteMovie)  //restrict('admin)

module.exports = Router