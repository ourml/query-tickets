'use strict'
const express = require('express');
const mongoose = require('mongoose')
const async = require("async")
const request = require("request")
const url = require("url")
const bodyParser = require("body-parser")

const fetch = require('../libs/fetch')
const fetch2 = require('../libs/fetch2')

let router = express.Router()

let Code = require('../models/code.model')
let Province = require('../models/province.model')
let StationName = require('../models/station-name.model')
let Location = require('../models/locate.model')
let ProvinceDetail = require('../models/province-detail.model')

// let dburl = 'mongodb://localhost/test'
let dburl = 'mongodb://qticket:DpW6SxU5ZUhB3bOD@ds135926.mlab.com:35926/query'

mongoose.connect(dburl, {
  useMongoClient: true
})
mongoose.Promise = global.Promise

let db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  // we're connected!
  console.log("MongoDB connected")
})

/* GET spider page. */
router.get('/', (req, res, next) => {
  res.render('spider', { title: 'Nodejs 爬虫' });
})


// 显示所有车次信息
router.get('/code', (req, res, next) => {
  let code = []
  Code
    .find()
    .exec((err, codes) => {
      err && res.send('error')
      codes.forEach(element => {
        element.code && code.push(element.code)
      })
      res.render('spider_code', {
        title: '车次详情',
        codes: code
      })
    })
  // res.send('code')
})

router.get('/code/:id', (req, res, next) => {
  let query = Code.where({ code: req.params.id })
  query.findOne((err, result) => {
    err && res.send('error')
    res.render('spider_detail', {
      title: req.params.id + ' 车次详情',
      dataType: 'code',
      data: result
    })
  })
})

router.get('/station', (req, res, next) => {
  Province
    .find({})
    .exec((err, provinces) => {
      err && res.render('error', {
        message: '数据库查询出错',
        error: {
          status: 0,
          stack: 'hello world'
        }
      })
      res.render('spider_province', {
        title: '省车站详情',
        provinces: provinces
      })
    })
})

router.get('/station/:id', (req, res, next) => {
  let query = ProvinceDetail.where({ station: req.params.id })
  query.findOne((err, result) => {
    err && res.send('error has occurred')
    if (result) {
      async.map(result.code, (item, callback) => {
        Code
          .findOne({ code: item })
          .exec((err, result) => {
            err && console.error(err)
            let provinces = []
            if (result) {
              if (result.status) {
                provinces.push({
                  code: item,
                  ltime: result.codeheader.ltime,
                  atime: result.codeheader.atime
                })
                callback(null, provinces)
              }
              else {
                console.log(`有车次无详情 ${item}`)
                provinces.push({
                  code: item,
                  ltime: '--',
                  atime: '--'
                })
                callback(null, provinces)
              }
            }
            else {
              console.log(`没有此车次详情 ${item}`)
              provinces.push({
                code: item,
                ltime: '--',
                atime: '--'
              })
              callback(null, provinces)
            }
          })
      }, (err, provinces) => {
        err && console.error(err)
        res.render('spider_detail', {
          title: req.params.id + ' 站详情',
          dataType: 'station',
          station: req.params.id,
          data: provinces
        })
      })
    }
    else {
      console.log(`没有此车站详情 ${req.params.id}`)
      res.render('spider_detail', {
        title: req.params.id + ' 站详情',
        dataType: 'station',
        station: req.params.id,
        data: []
      })
    }
  })
})

router.get('/location', (req, res, next) => {
  Location
    .find({})
    .exec((err, result) => {
      err && res.send('error has occurred')
      res.json(result)
    })
})

router.get('/getcode', (req, res, next) => {

  let originURL = 'http://shike.114piaowu.com/'
  let urls = []
  let a = ['http://shike.114piaowu.com/beiliu/']

  StationName
    .find({})
    .exec((err, result) => {
      err && console.error(err)
      result.forEach((el) => {
        urls.push(originURL + el.aliasname + '/')
      })
      fetch.getCodeDetail(dburl, urls)
    })

  res.send('getcode')
})

router.get('/getstation', (req, res, next) => {
  fetch.getStationName(dburl)
  res.send('gettrain')
})

router.get('/getlocate', (req, res, next) => {
  StationName
    .find({})
    .exec((err, names) => {
      err && res.send('error has occurred.')
      let stations = []
      names.forEach((element) => {
        stations.push(element.name)
      })
      fetch.getLocation(dburl, stations)
    })
  res.send('haha')
})

router.get('/getprovince', (req, res, next) => {
  fetch.getProvince(dburl)
  res.send('getprovince')
})

router.get('/cleanc', (req, res, next) => {
  Code.deleteMany({}, (err, result) => {
    err && console.error(err)
    console.log(result)
  })
  res.send('cleanc')
})

router.get('/cleans', (req, res, next) => {
  StationName.deleteMany({}, (err, result) => {
    err && console.error(err)
    console.log(result)
  })
  res.send('cleans')
})

router.get('/cleanl', (req, res, next) => {
  Location.deleteMany({}, (err, result) => {
    err && console.error(err)
    console.log(result)
  })
  res.send('cleans')
})

router.get('/cleanp', (req, res, next) => {
  Province.deleteMany({}, (err, result) => {
    err && console.error(err)
    console.log(result)
  })
  res.send('cleans')
})

router.get('/cleanpd', (req, res, next) => {
  ProvinceDetail.deleteMany({}, (err, result) => {
    err && console.error(err)
    console.log(result)
  })
  res.send('cleans')
})


// router.get('/p', (req, res, next) => {
//   ProvinceDetail
//     .find({})
//     .exec((err, result) => {
//       err && res.send('error has occurred')
//       res.json(result)
//     })
// })

// router.get('/pr', (req, res, next) => {
//   Province
//     .find({})
//     .exec((err, result) => {
//       err && res.send('error has occurred')
//       res.json(result)
//     })
// })

// router.get('/sn', (req, res, next) => {
//   StationName
//     .find({})
//     .exec((err, result) => {
//       err && res.send('error has occurred')
//       res.json(result)
//     })
// })

// router.get('/aa', (req, res, next) => {
//   fetch2.getExtraMsg(dburl)
//   res.send('aa')
// })

module.exports = router;
