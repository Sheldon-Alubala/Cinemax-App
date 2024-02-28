const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message)
    console.log('Uncaught exeptional error has occured shutting down...')
   
        process.exit(1)
})

const app = require('./app');

//console.log(app.get('env'));
//console.log(process.env);

mongoose.connect(process.env.LOCAL_CONN_STR, {
    useNewUrlParser: true
}).then((conn) => {
    //console.log(conn);
    console.log('DB Connection Successful')
})



//CREATE A SERVER
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log('server has started...');
})

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('Unhandled rejection has occured shutting down...')

    server.close(() => {
        process.exit(1)
    })
})


