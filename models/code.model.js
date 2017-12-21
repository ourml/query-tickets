'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// 存储每个车次的详细信息

let CodeSchema = new Schema({
	code: String,
	status: {
		type: Boolean,
		default: 1
	},
	codeheader: {
		ctype: String,
		bstation: String,
		dstation: String,
		ltime: String,
		atime: String,
		dist: String,
		ctime: String,
		price: Array
	},
	station: Array
})

let Code = module.exports = mongoose.model('Code', CodeSchema)