'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// 存储每个省份的车站名

let ProvinceSchema = new Schema({
  name: String,
  station: Array
})

let Province = module.exports = mongoose.model('Province', ProvinceSchema)
