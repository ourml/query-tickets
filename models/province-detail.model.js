'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

let ProvinceDetailSchema = new Schema({
  station: String,
  status: {
    type: Boolean,
    default: 1
  },
  code: Array
})

let ProvinceDetail = module.exports = mongoose.model('ProvinceDetail', ProvinceDetailSchema)