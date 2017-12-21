'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// 存储每个车站的别名

let StationSchema = new Schema({
	name: String,
	aliascode: String,
	aliasname: String
})

let StationName = module.exports = mongoose.model('StationName', StationSchema)