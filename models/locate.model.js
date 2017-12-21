'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// 存储每个车站的位置信息

let LocateSchema = new Schema({
  name: String,
  location: String,
  pname: String,
  cityname: String,
  adname: String
})

let Location = module.exports = mongoose.model('Location', LocateSchema)