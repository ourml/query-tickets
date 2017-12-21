'use strict'
const request = require('request')
const cheerio = require('cheerio')
const async = require('async')
const mongoose = require('mongoose')
const url = require('url')

let StationName = require('../models/station-name.model')
let Code = require('../models/code.model')
let Location = require('../models/locate.model')
let Province = require('../models/province.model')
let ProvinceDetail = require('../models/province-detail.model')

function getExtraMsg(dburl) {
  console.log(dburl)
  let originURL = 'http://shike.114piaowu.com/'
  async.waterfall([
    getProvince,
    getCities,
    getCityCodes,
    // getCodes
  ], (err, result) => {
    err && console.error(err)
    console.log(`<<< finished...`)
    // console.log(result)
  })

  function getProvince(callback) {
    request.get(originURL, (err, response, body) => {
      err && callback(null, err)

      let $ = cheerio.load(body)
      let notNeed = ['台湾', '澳门', '香港']
      let provinces = []

      $('a', 'td').each((index, element) => {
        let $element = $(element)
        let pname = $element.text().trim()
        let purl = $element.attr('href') ? $element.attr('href').trim() : ''

        if (!notNeed.includes(pname)) {
          console.log(`fetch ${pname}`)
          provinces.push({
            name: pname,
            purl: purl
          })
        }
      })
      callback(null, provinces)
    })
  }

  function getCities(provinces, callback) {
    async.mapLimit(provinces, 1, (province, callback) => {
      request.get(province.purl, (err, response, body) => {
        err && callback(null, err)

        let $ = cheerio.load(body)
        let cities = []
        let cityArr = []
        let re = new RegExp(/\w/, 'g')

        $('li > a', '.train_list').each((index, element) => {

          let $element = $(element)
          let name = $element.text().trim()
          let cityurl = $element.attr('href').trim()

          if (name.search(re)) {

            let re = new RegExp(/\s*/, 'g')
            let reName = name.replace(re, '')

            if (!cityArr.includes(reName)) {
              cities.push({
                name: reName,
                url: cityurl
              })
              cityArr.push(reName)
            }
          }
        })

        Province
          .findOne({ name: province.name })
          .exec((err, result) => {
            err && console.error(err)
            // 不存在此省份信息则插入
            if (!result) {
              let newProvince = new Province()

              newProvince.name = province.name
              newProvince.station = cityArr

              newProvince.save((err, result) => {
                err && console.error(err)
                console.log(`saved ${province.name}`)
              })
            }
            else {
              // 存在则更新
              let conditions = {
                name: province.name
              }
              if (cityArr.length >= result.station.length) {
                let clength = cityArr.length
                result.station.forEach((element) => {
                  if (!cityArr.includes(element)) {
                    cityArr.push(element)
                  }
                })
                if (clength !== cityArr.length) {
                  let update = {
                    station: cityArr
                  }

                  Province
                    .findOneAndUpdate(conditions, update)
                    .exec((err, result) => {
                      err && console.error(err)
                      // console.log(result)
                      console.log(`数据已更新(源数据<=新数据)`)
                    })
                }
                else {
                  console.log(`数据已存在, 并且相同 1`)
                }
              }
              else {
                let clength = result.station.length
                let tmpStation = result.station
                cityArr.forEach((element) => {
                  if (!tmpStation.includes(element)) {
                    tmpStation.push(element)
                  }
                })
                if (clength !== tmpStation.length) {
                  let update = {
                    station: tmpStation
                  }

                  Province
                    .findOneAndUpdate(conditions, update)
                    .exec((err, result) => {
                      err && console.error(err)
                      // console.log(result)
                      console.log(`数据已更新(源数据>新数据)`)
                    })
                }
                else {
                  console.log(`数据已存在, 并且相同 2`)
                }
              }
            }
          })
        callback(null, cities)
      })
    }, (err, result) => {
      if (err) {
        callback(null, err)
      }
      else {
        let cities = []
        let cityName = []
        if (Array.isArray(result)) {
          result.forEach((item) => {
            item.forEach((i) => {
              if (!cityName.includes(i.name)) {
                cityName.push(i.name)
                cities.push(i)
              }
            })
          })
        }
        // console.log(cityName)
        // console.log(cities)
        callback(null, cities)
      }
    })
  }

  function getCityCodes(cities, callback) {
    async.mapLimit(cities, 1, (city, callback) => {
      request.get(city.url, (err, response, body) => {
        err && console.error(err)

        let $ = cheerio.load(body)
        let stations = []
        let stationCodes = []
        let station = city.name
        let flag = $('.sk_list', '#shike').text()
        let newProvinceDetail = new ProvinceDetail

        if (flag) {
          $('.sk_list', '.info').each((index, element) => {
            let $element = $(element)

            // 车次代码
            let code = $element.children().eq(0).children().eq(0).text().trim()
            let codeurl = $element.children().eq(0).children().eq(0).find('a').attr('href').trim()
            stationCodes.push(code)
          })
          ProvinceDetail
            .findOne({ station: station })
            .exec((err, result) => {
              err && console.error(err)
              if (!result) {

                newProvinceDetail.station = station
                newProvinceDetail.code = stationCodes
                newProvinceDetail.save((err, result) => {
                  err && console.log(err)
                  console.log(`saved ${station}`)
                })
              }
              else {
                let conditions = {
                  station: station
                }

                if (stationCodes.length >= result.code.length) {
                  let nlength = stationCodes.length
                  result.code.forEach((element) => {
                    if (!stationCodes.includes(element)) {
                      stationCodes.push(element)
                    }
                  })
                  if (nlength !== stationCodes.length) {
                    let update = {
                      code: stationCodes
                    }
                    ProvinceDetail
                      .findOneAndUpdate(conditions, update)
                      .exec((err, result) => {
                        err && console.log(err)
                        console.log(`updated ${station} 1`)
                      })
                  }
                  else {
                    console.log(`${station} 已存在，并且数据相同 1`)
                  }
                }
                else {
                  let tmpCode = result.code
                  let olength = result.code.length
                  stationCodes.forEach((element) => {
                    if (!tmpCode.includes(element)) {
                      tmpCode.push(element)
                    }
                  })
                  if (olength !== tmpCode.length) {
                    let update = {
                      code: tmpCode
                    }
                    ProvinceDetail
                      .findOneAndUpdate(conditions, update)
                      .exec((err, result) => {
                        err && console.log(err)
                        console.log(`updated ${station} 2`)
                      })
                  }
                  else {
                    console.log(`${station} 已存在，并且数据相同 2`)
                  }
                }
              }
            })
          callback(null, stationCodes)
        }
        else {
          let status = 0
          ProvinceDetail
            .findOne({ station: station })
            .exec((err, result) => {
              err && console.log(err)
              if (!result) {
                newProvinceDetail.station = station
                newProvinceDetail.status = status
                newProvinceDetail.code = []
                newProvinceDetail.save((err, result) => {
                  err && console.log(err)
                  console.log(`无法获取车站 ${station}`)
                })
              }
              else {
                console.log(`无法获取车站 ${station}, 已存在不完整数据`)
              }
            })
          callback(null, [])
        }
      })
    }, (err, result) => {
      err && callback(null, err)

      let code = []
      if (Array.isArray(result)) {
        result.forEach((item) => {
          item.forEach((i) => {
            !code.includes(i) && code.push(i)
          })
        })
      }
      console.log(code)
      callback(null, code)
    })
  }

  function getCodes(codes, callback) {
    let originURL = 'http://checi.114piaowu.com/'
    async.mapLimit(codes, 1, (code, callback) => {
      let codeurl = originURL + code
      request.get(codeurl, (err, response, body) => {
        err && callback(null, err)

        let $ = cheerio.load(body)
        let trainType = ['高铁', '动车', '城际']
        let flag = $('.main').text()
        let trainCode = code

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
                console.log(`saved pieces of data ${trainCode}`)
                callback(null, 'saved piece of data ' + trainCode)
              })
            }
            else {
              //             find one and update
              callback(null, 'update pieces of data ' + trainCode)
              console.log(`error on saving ${trainCode}`)
            }
          })
        }
      })
    }, (err, result) => {
      err && callback(null, err)
      callback(null, result)
    })
  }
}

module.exports.getExtraMsg = getExtraMsg
