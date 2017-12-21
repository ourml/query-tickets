// const mongoose = require('mongoose')
// const fs = require('fs')

// let StationName = require('../models/station-name.model')

// let dburl = 'mongodb://localhost/test1'
// let dburl = 'mongodb://eih67562:thDzvPn1JlSScmds@cluster0-shard-00-00-x2pus.mongodb.net:27017,cluster0-shard-00-01-x2pus.mongodb.net:27017,cluster0-shard-00-02-x2pus.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin'

// mongoose.connect(dburl, { useMongoClient: true })
// mongoose.Promise = global.Promise

// let db = mongoose.connection
// db.on('error', console.error.bind(console, 'connection error:'))
// db.once('open', function() {
//   // we're connected!
//   console.log("MongoDB connected")
// });

// function getStationName(dburl) {
//   mongoose.connect(dburl, { useMongoClient: true })
//   mongoose.Promise = global.Promise

//   let db = mongoose.connection
//   db.on('error', console.error.bind(console, 'connection error:'))
//   db.once('open', function() {
//     // we're connected!
//     console.log("MongoDB connected")
//   })

//   fs.readFile(__dirname + '/station-names.js', 'utf8', (err, names) => {
//     err && console.error(err)

//     let re = new RegExp(/\d*@/, 'g')
//     let stationArr = names.split(re)
//     stationArr.forEach((element) => {
//       let newStationName = new StationName()
//       let singleArr = element.split('|')
//       let name = singleArr[1].trim()
//       let aliasCode = singleArr[2].trim()
//       let aliasName = singleArr[3].trim()

//       newStationName.name = name
//       newStationName.aliascode = aliasCode
//       newStationName.aliasname = aliasName

//       newStationName.save((err, result) => {
//         err && console.error(err)
//         console.log('saved ' + name)
//       })
//     })
//   })
// }



// let re = new RegExp(/\d*@/, 'g')
// let stationArr = station_names.split(re)
// stationArr.forEach((element) => {
//   let newStationName = new StationName()
//   let singleArr = element.split('|')
//   let name = singleArr[1].trim()
//   let aliasCode = singleArr[2].trim()
//   let aliasName = singleArr[3].trim()

//   newStationName.name = name
//   newStationName.aliascode = aliasCode
//   newStationName.aliasname = aliasName

//   newStationName.save((err, result) => {
//     err && console.error(err)
//     console.log('saved ' + name)
//   })
// })

// StationName.deleteMany({}, (err, result) => {
//   err && console.error(err)
//   console.log(result)
// })
// module.exports.getStationName = getStationName
