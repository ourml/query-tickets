'use strict'
const request = require('request')
const cheerio = require('cheerio')
const async = require('async')
const mongoose = require('mongoose')
const fs = require('fs')
const url = require('url')

let StationName = require('../models/station-name.model')
let Code = require('../models/code.model')
let Location = require('../models/locate.model')
let Province = require('../models/province.model')
let ProvinceDetail = require('../models/province-detail.model')

function getCodeDetail(dburl, originURL) {
  console.log('>>> app started...')

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

  async.waterfall([
    getCodeUrl,
    getCodeDetail
  ], (err, result) => {
    err && console.error(err)
    console.log(result)
    console.log('<<< jobs finished...')
  })

  function getCodeUrl(callback) {
    async.mapLimit(originURL, 1, (ourl, callback) => {
      request.get(ourl, (err, response, body) => {
        err && callback(null, err)

        let $ = cheerio.load(body)
        let flag = $('.sk_list', '#shike').text()
        let codes = []
        let codeArr = []
        let newProvinceDetail = new ProvinceDetail()
        let station = ourl.slice(27, -1)

        if (flag) {
          $('.sk_list', '.info').each((index, element) => {

            let $element = $(element)

            // 车次代码
            let code = $element.children().eq(0).children().eq(0).text().trim()

            // 车次链接
            let codeUrl = $element.children().eq(0).children().eq(0).children().eq(0).attr('href').trim()

            codes.push({
              code: code,
              codeurl: codeUrl
            })

            codeArr.push(code)
          })

          let query = StationName.where({ aliasname: station })
          query.findOne((err, sname) => {
            err && console.error(err)

            let queryP = ProvinceDetail.where({ station: sname.name })
            queryP.findOne((err, result) => {
              err && console.error(err)
              if (!result) {
                newProvinceDetail.station = sname.name
                newProvinceDetail.code = codeArr

                newProvinceDetail.save((err, result) => {
                  err && console.error(err)
                  console.log(`saved ${sname.name}`)
                })
              }
              else {
                console.log(`${sname.name} exists`)
              }
            })
          })
          callback(null, codes)
        }
        else {
          let query = StationName.where({ aliasname: station })
          query.findOne((err, sname) => {
            err && console.error(err)

            let queryP = ProvinceDetail.where({ station: sname.name })
            queryP.findOne((err, result) => {
              err && console.error(err)
              if (!result) {
                newProvinceDetail.station = sname.name
                newProvinceDetail.status = 0

                newProvinceDetail.save((err, result) => {
                  err && console.error(err)
                  console.log(`saved ${sname.name}`)
                })
              }
              else {
                console.log(`${sname.name} exists`)
              }
            })
          })
          console.log(`无法获取 ${ourl}`)
          callback(null, [])
        }
      })
    }, (err, result) => {
      err && console.error(err)
      let tmpCodes = []
      let codes = []

      // 去重
      if (Array.isArray(result)) {
        result.forEach((element) => {
          element.forEach((el) => {
            if (!tmpCodes.includes(el.code)) {
              tmpCodes.push(el.code)
              codes.push(el)
            }
          })
        })
      }

      let startTime = Date.now()
      // 异步函数 爬取所有的车次
      async.waterfall([
        // 爬取所有车次的索引
        fetchOriginCode,

        // 爬取所有页面的车次链接
        fetchCodeUrls,

        // 爬取所有的车次
        fetchCode
      ], (err, result) => {
        if (err) {
          return console.error(err)
        }
        let endTime = Date.now()

        // 爬取所有车次的详细信息
        console.log('抓取完成')
        console.log('总共花费时间: ' + (endTime - startTime) + 　' 毫秒')
        result.forEach((element) => {
          if (!tmpCodes.includes(element)) {
            codes.push({
              code: element,
              codeurl: 'http://checi.114piaowu.com/' + element
            })
          }
        })

        callback(null, codes)
      })

      function fetchOriginCode(callback) {
        let originURL = 'http://checi.114piaowu.com/'
        /*
        获取入口页面的所有车次的索引
        结果为所有车次的索引
        */
        console.log('开始抓取所有车次索引...')
        let startTime = Date.now()
        request.get(originURL, (error, response, body) => {
          error && callback(null, error)

          let $ = cheerio.load(body)
          let codeURL = []
          let sindex = $('.shaixuan').children()

          sindex.filter('a').each((index, element) => {
            let $element = $(element)
            let resolveUrl = url.resolve(originURL, $element.attr('href'))
            codeURL.push(resolveUrl)
          })
          console.log('车次索引抓取完成， 花费时间: ' + (Date.now() - startTime) + 　' 毫秒')
          callback(null, codeURL)
        })
      }

      /*
        爬取所有索引车次的链接
        返回的是所有索引的车次链接
      */
      function fetchCodeUrls(codeurl, callback) {
        console.log('开始抓取所有车次的超链接...')
        let startTime = Date.now()
        async.mapLimit(codeurl, 3, (item, callback) => {
          request.get(item, (error, response, body) => {
            if (error) {
              callback(null, error)
            }

            let $ = cheerio.load(body)
            let destinationUrls = []
            let $page = $('.page')

            if ($page.children().length > 0) {
              let pagesStr = $page.children().eq(-1).attr('href').toString()
              let pages = parseInt(pagesStr.match(/\d+/gi))
              // 获取每个车次索引的所有网页链接
              for (let i = 1; i <= pages; i++) {
                let destinationUrl = '/' + pagesStr.slice(0, 2) + i + '.html'
                destinationUrls.push(url.resolve(item, destinationUrl))
              }
            }
            else {
              destinationUrls.push(item)
            }
            callback(null, destinationUrls)
          })
        }, (err, result) => {
          if (err) {
            callback(null, err)
          }
          console.log('车次链接抓取完成， 耗时: ' + (Date.now() - startTime) + 　' 毫秒')
          // 处理所有车次链接结果
          let finalUrl = []
          result.forEach((item) => {
            item.forEach((single) => {
              finalUrl.push(single)
            })
          })
          callback(null, finalUrl)
        })
      }

      /* 爬取所有的车次信息
        返回全部的车次信息
      */
      function fetchCode(finalUrl, callback) {
        let codeHref = 'http://checi.114piaowu.com/'
        let delay = parseInt((Math.random() * 10000000) % 2000, 10)
        console.log('开始抓取车次代码...')
        let startTime = Date.now()
        async.mapLimit(finalUrl, 1, (furl, callback) => {
          request.get(furl, (error, response, body) => {
            if (error) {
              callback(null, error)
            }

            let $ = cheerio.load(body)
            let content = $('.checicx')
            let chexi_ul = content.children().eq(2)
            let li = chexi_ul.children()
            let code = []
            li.each((index, element) => {
              let tmpcode = $(element).text().trim()
              code.push(tmpcode)
            })
            callback(null, code)
          })
        }, (error, codeResult) => {
          if (error) {
            callback(null, error)
          }
          console.log('所有车次代码抓取完成， 耗时: ' + (Date.now() - startTime) + 　' 毫秒')

          // 暂存所有的车次
          let tmp = []

          codeResult.forEach((item) => {
            item.forEach((single) => {
              // 字符串替换，把所有的 '/' 替换为 '-'
              let re = new RegExp(/\W/, 'g')
              let replaceCode = single.replace(re, '-')
              // 过滤重复车次
              if (!tmp.includes(replaceCode)) {
                tmp.push(replaceCode)
              }
            })
          })
          console.log('所有车次数目: ' + tmp.length)
          callback(null, tmp)
        })
      }
    })
  }
  // 爬取所有车次详细信息, 并存入数据库
  function getCodeDetail(codes, callback) {
    async.mapLimit(codes, 1, (code, callback) => {
      request.get(code.codeurl, (err, response, body) => {
        err && callback(null, err)

        let $ = cheerio.load(body)
        let trainType = ['高铁', '动车', '城际']
        let flag = $('.main').text()
        let trainCode = code.code

        if (flag) {
          let ctype = $('dt', '.checimessage').children().eq(1).text().trim()

          let beginStation = $('ul', '.line').children().eq(0).find('a').text().trim()

          let destinateStation = $('ul', '.line').children().eq(1).find('a').text().trim()

          $('ul', '.line').children().eq(2).find('span').remove()
          let leaveTime = $('ul', '.line').children().eq(2).text().trim()

          $('ul', '.line').children().eq(3).find('span').remove()
          let re = new RegExp(/\s*/, 'g')

          let arriveTime = $('ul', '.line').children().eq(3).text().trim().replace(re, '')
          $('ul', '.line').children().eq(4).find('span').remove()

          let distance = $('ul', '.line').children().eq(4).text().trim()
          $('ul', '.line').children().eq(5).find('span').remove()

          let costTime = $('ul', '.line').children().eq(5).text().trim()

          let price = []

          if (trainType.includes(ctype)) {
            let dd = $('.line').next()
            $('li', dd).each((index, element) => {
              let $element = $(element)
              let re = new RegExp(/\：/, 'g')
              let priceType = $element.find('span').text().trim().replace(re, '')
              $element.find('span').remove()
              let priceCount = $element.text().trim()
              price.push({
                ptype: priceType,
                price: priceCount
              })
            })
          }
          else {
            let dd = $('.line').next()
            let re = new RegExp(/\：/, 'g')
            let count = $('ul', dd).children().length
            for (let index = 0; index < count; index++) {
              let child = $('ul', dd).children().eq(index)
              let priceType = child.find('span').text() ?
                child.find('span').text().trim().replace(re, '') :
                '--'
              let priceCount = []
              if (child.find('span').text()) {
                child.find('span').remove()
                let emNum = child.children().length
                let re = new RegExp(/\s*/, 'g')
                if (emNum > 0) {
                  for (let index = 0; index < emNum; index++) {
                    let em = child.children().eq(index)
                    let emPrice = em.text().trim().replace(re, '')
                    priceCount.push(emPrice)
                  }
                  price.push({
                    ptype: priceType,
                    price: priceCount
                  })
                }
                else {
                  let yzPrice = child.text().trim().replace(re, '')
                  price.push({
                    ptype: priceType,
                    price: yzPrice
                  })
                }
              }
              else {
                console.log('无相关票价 ' + trainCode)
              }
            }
          }

          let codedetail = []
          $('tr', '.list').eq(0).remove()
          $('tr', '.list').eq(-1).remove()
          $('tr', '.list').each((index, element) => {
            let $element = $(element)

            // 车次顺序索引
            let i = $element.children().eq(0).text().trim()

            // 车站名
            let station = $element.children().eq(1).find('a').text().trim()

            // 到达时间
            let arrivetime = $element.children().eq(2).text().trim()

            // 发车时间
            let leavetime = $element.children().eq(3).text().trim()

            // 里程
            let distance = $element.children().eq(4).text().trim()

            codedetail.push({
              i: i,
              station: station,
              atime: arrivetime,
              ltime: leavetime,
              dist: distance
            })
          })

          let query = Code.where({
            code: trainCode
          })
          query.findOne((err, code) => {
            err && console.error(err)
            if (!code) {
              let newCode = new Code()

              newCode.code = trainCode
              newCode.codeheader.ctype = ctype
              newCode.codeheader.bstation = beginStation
              newCode.codeheader.dstation = destinateStation
              newCode.codeheader.ltime = leaveTime
              newCode.codeheader.atime = arriveTime
              newCode.codeheader.dist = distance
              newCode.codeheader.ctime = costTime
              newCode.codeheader.price = price
              newCode.station = codedetail

              newCode.save((err, codes) => {
                err && callback(null, err)
                console.log(`saved ${trainCode}`)
                callback(null, 'saved ' + trainCode)
              })
            }
            else {
              //             find one and update
              console.log(`${trainCode} exists`)
              callback(null, `${trainCode} exists`)
            }
          })
        }
        else {

          let query = Code.where({
            code: trainCode
          })
          query.findOne((err, code) => {
            err && console.error(err)
            if (!code) {
              let newCode = new Code()
              newCode.status = 0
              newCode.save((err, codes) => {
                err && callback(null, err)
                callback(null, 'saved piece of data ' + trainCode)
              })
            }
            else {
              //             find one and update
              callback(null, 'update piece of data ' + trainCode)
            }
          })
          console.log(`error on saving ${trainCode}`)
        }
      })
    }, (err, result) => {
      err && callback(null, err)
      callback(null, result)
    })
  }
}

function getStationName(dburl) {

  mongoose.connect(dburl, { useMongoClient: true })
  mongoose.Promise = global.Promise

  let db = mongoose.connection
  db.on('error', console.error.bind(console, 'connection error:'))
  db.once('open', function() {
    // we're connected!
    console.log("MongoDB connected")
  })

  fs.readFile(__dirname + '/station-names.js', 'utf8', (err, names) => {
    err && console.error(err)

    let re = new RegExp(/\d*@/, 'g')
    let stationArr = names.split(re)
    stationArr.forEach((element) => {

      let singleArr = element.split('|')
      let name = singleArr[1].trim()
      let aliasCode = singleArr[2].trim()
      let aliasName = singleArr[3].trim()

      let query = StationName.where({
        name: name
      })

      query.findOne((err, station) => {
        err && console.error(err)
        if (!station) {

          let newStationName = new StationName()

          newStationName.name = name
          newStationName.aliascode = aliasCode
          newStationName.aliasname = aliasName

          newStationName.save((err, result) => {
            err && console.error(err)
            console.log(`saved  ${name}`)
          })
        }
        else {
          //             find one and update
          console.log(`${name} exists`)
        }
      })
    })
  })
}

function getLocation(dburl, stations) {
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

  async.mapLimit(stations, 1, (station, callback) => {
    let keyword = station + '站'
    let originURL = 'http://restapi.amap.com/v3/place/text?key=8325164e247e15eea68b59e89200988b&types=150200&city=&children=1&offset=1&page=1&extensions=base&keywords=' + keyword
    let encodeurl = encodeURI(originURL)
    request.get(encodeurl, (err, response, body) => {
      err && callback(null, err)

      let content = JSON.parse(body)
      let status = content.status
      let info = content.info

      if (status === '1' && info === 'OK') {
        content.pois.forEach((element) => {
          if (element.typecode === '150200' && element.name === keyword) {

            let location = element.location
            let pname = element.pname
            let cityname = element.cityname
            let adname = element.adname
            let newLocation = new Location()

            let query = Location.where({
              name: station
            })

            query.findOne((err, name) => {
              err && console.error(err)
              if (!name) {
                let newLocation = new Location()

                newLocation.name = station
                newLocation.location = location
                newLocation.pname = pname
                newLocation.cityname = cityname
                newLocation.adname = adname

                newLocation.save((err, result) => {
                  err && console.log(err)
                  console.log(`saved ${keyword}`)
                })
              }
              else {
                //             find one and update
                console.log(`${keyword} exists`)
              }
            })
          }
          else {
            console.log(`${keyword} 不是客运站或未投入使用`)
          }
        })
        callback(null, keyword)
      }
      else {
        console.log(`获取错误 ${keyword}`)
        callback(null, [])
      }
    }, (err, result) => {
      err && console.error(err)
      console.log(result)
    })
  })
}

function getProvince(dburl) {
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
  let originURL = 'http://shike.114piaowu.com/'

  request.get(originURL, (err, response, body) => {
    err && console.error(err)

    let $ = cheerio.load(body)
    $('a', 'td').each((index, element) => {
      let $element = $(element)
      let provinceName = $element.text().trim()
      let filterProvince = ['台湾', '澳门', '香港']
      let re = new RegExp(`${provinceName}`, 'g')
      if (!filterProvince.includes(provinceName)) {
        let stations = []
        let query = Location.where({ pname: re })
        query.find((err, result) => {
          err && console.error(err)
          result.forEach((element) => {
            stations.push(element.name)
          })

          let query = Province.where({ name: provinceName })
          query.findOne((err, result) => {
            err && console.error(err)
            if (!result) {
              let newProvince = new Province()
              newProvince.name = provinceName
              newProvince.station = stations

              newProvince.save((err, result) => {
                err && console.error(err)
                console.log(`saved ${provinceName}`)
              })
            }
            else {
              console.log(`${provinceName} exists`)
            }
          })
        })
      }
    })
  })
}

module.exports.getCodeDetail = getCodeDetail
module.exports.getStationName = getStationName
module.exports.getLocation = getLocation
module.exports.getProvince = getProvince
