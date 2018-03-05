var express = require('express');
var router = express.Router();
const request = require('request');
const async = require('async')

let StationName = require('../models/station-name.model')

// https://train.qunar.com/dict/open/s2s.do?callback=jQuery17208363141274333181_1514044478877&dptStation=%E5%8C%97%E4%BA%AC&arrStation=%E5%B9%BF%E5%B7%9E&date=2017-12-25&type=normal&user=neibu&source=site&start=1&num=500&sort=3&_=1514044479207
// https://train.qunar.com/dict/open/s2s.do?callback=json&dptStation=%E5%8C%97%E4%BA%AC&arrStation=%E5%B9%BF%E5%B7%9E&date=2017-12-25&type=normal&user=neibu&source=site&start=1&num=500&sort=3&_=1514044479207

/* GET query listing. */
router.get('/', function(req, res, next) {
  res.render('query', {
    title: '火车票查询信息',
    from: '',
    to: '',
    date: '',
    ticketStatus: '',
    dataType: 'other',
    data: ''
  });
});

router.get('/:code/:date/:from/:to', (req, res, next) => {
  const date = req.params.date
  const code = req.params.code
  const from = req.params.from
  const to = req.params.to

  // console.log(`code: ${code}`)
  // console.log(`date: ${date}`)
  // console.log(`from: ${from}`)
  // console.log(`to: ${to}`)

  const apiURL = 'https://train.qunar.com/dict/open/s2s.do?callback=json'
  const fromStation = '&dptStation=' + from
  const toStation = '&arrStation=' + to
  const qdate = '&date=' + date
  const restMsg = '&type=normal&user=neibu&source=site&start=1&num=500&sort=3&_=1514044479207'
  const originURL = apiURL + fromStation + toStation + qdate + restMsg
  const encodeurl = encodeURI(originURL)

  request.get(encodeurl, (err, response, body) => {
    err && console.log(err)
    try {
      const result = JSON.parse(body.slice(9, -2))
      if (result.ret && result.errmsg === '请求成功' && result.errcode === 0) {
        const data = result.data
        let postData = []
        if (data.flag && data.errorCode === 0) {
          const s2sBeanList = data.s2sBeanList
          s2sBeanList.forEach(element => {
            const trainNo = element.trainNo
            const seats = element.seats
            const sStation = element.startStationName
            const eStation = element.endStationName
            const dptTime = element.dptTime
            const arrTime = element.arrTime

            const extraBeanMap = element.extraBeanMap
            const arrDate = extraBeanMap.arrDate
            const intervalMiles = extraBeanMap.intervalMiles
            const interval = extraBeanMap.interval
            const trainType = extraBeanMap.trainType
            if (trainNo === code) {
              // console.log(`aaa`)
              postData.push({
                seats: seats,
                sstation: sStation,
                estation: eStation,
                dpttime: dptTime,
                arrtime: arrTime,
                arrdate: arrDate,
                intervalmiles: intervalMiles,
                interval: interval,
                traintype: trainType
              })
            }
            // console.log(arrDate)
            // console.log(intervalMiles)
            // console.log(interval)
            // console.log(trainType)
          })
          // res.send(postData)
          res.render('query', {
            title: '车次车票详情',
            from: from,
            to: to,
            date: date,
            code: code,
            dataType: 'detail',
            data: postData
          })
          // console.log(postData)
        }
        else {
          console.log(`error. 5`)
          res.send(`error has occurred. 5`)
        }
        // console.log(result)
      }
      else {
        console.log(`获取出错. 4`)
        res.send(`error has occurred. 4`)
      }
    }
    catch (e) {
      console.log(e)
      res.send('error has occurred. 6')
    }

    // console.log(result1.slice(9, -2))
  })

  // console.log(encodeurl)
  // console.log(fromStation)
  // console.log(toStation)
  // console.log(qdate)

})

router.post('/', function(req, res, next) {

  // let fromStation = req.body.fromStation
  // let toStation = req.body.toStation
  // let date = req.body.date
  // let outDate = req.body.outDate
  // let backDate = req.body.backDate
  // let ticketType = req.body.ticketType
  // let trainType = req.body.trainType

  // ticketType === 'ADULT' ? ticketType = 'ADULT' : ticketType = 'ADULT'

  // function query(date, fromStation, toStation, ticketType, callback) {
  //   let query = '?leftTicketDTO.train_date=' + date
  //   if (fromStation) {
  //     StationName
  //       .findOne({ name: fromStation })
  //       .exec((err, result) => {
  //         err && console.log(err)
  //         query += '&leftTicketDTO.from_station=' + result.aliascode
  //       })
  //   }
  //   if (toStation) {
  //     StationName
  //       .findOne({ name: toStation })
  //       .exec((err, result) => {
  //         err && callback(null, err)
  //         query += '&leftTicketDTO.to_station=' + result.aliascode + '&purpose_codes=' + ticketType
  //         callback(null, query)
  //       })
  //   }
  // }
  // query(date, fromStation, toStation, ticketType, (err, query) => {
  //   err && console.log(err)
  //   let apiURL = 'https://kyfw.12306.cn/otn/leftTicket/query'
  //   let originURL = apiURL + query

  //   request.get(originURL, (err, response, body) => {
  //     err && console.log(err)

  //     let fresult = JSON.parse(body)
  //     let status = fresult.status
  //     let httpstatus = fresult.httpstatus
  //     let messages = fresult.messages
  //     // let validateMessages = fresult.validateMessages
  //     let data = fresult.data

  //     if (status && httpstatus === 200 && data) {
  //       let result = data.result
  //       let flag = data.flag
  //       let map = data.map
  //       let msg = []
  //       let gotData = []
  //       let ticketStatus = 0

  //       if (result) {
  //         result.forEach(element => {
  //           let msg = element.split('|')
  //           let tmpTime = []
  //           msg.forEach(item => {
  //             if (item.includes(':')) {
  //               tmpTime.push(item)
  //             }
  //           })
  //           if (msg.includes('有')) {
  //             ticketStatus = 1
  //           }
  //           gotData.push({
  //             code: msg[3],
  //             times: tmpTime
  //           })
  //         })
  //         res.render('query', {
  //           title: '车票详情',
  //           from: req.body.fromStation,
  //           to: req.body.toStation,
  //           date: date ? date : outDate,
  //           ticketStatus: ticketStatus,
  //           dataType: 'ticket',
  //           data: gotData
  //         })
  //       }
  //       else {
  //         res.send('error has occurred.')
  //         console.log(`暂无此信息`)
  //       }
  //     }
  //     else {
  //       res.send('error has occurred.')
  //       console.log(messages)
  //     }
  //   })
  // })
  // if (!fromStation) {
  //   res.redirect('/')
  // }

  let fromStation = req.body.fromStation
  let toStation = req.body.toStation
  let date = req.body.date
  let backDate = req.body.backDate

  // let ticketType = req.body.ticketType
  // ticketType === 'ADULT' ? ticketType = 'ADULT' : ticketType = 'ADULT'
  // ticketType === 'STU' ? ticketType = 'ADULT' : ticketType = 'ADULT'

  let ticketType = 'ADULT'
  let trainType = req.body.trainType


  if (backDate) {
    console.log(`往返票`)
    console.log(`fromStation: ${fromStation}`)
    console.log(`toStation: ${toStation}`)
    console.log(`date: ${date}`)
    console.log(`backDate: ${backDate}`)
    console.log(`ticketType: ${ticketType}`)
    console.log(`trainType: ${trainType}`)

    const query = (fromStation, toStation, callback) => {
      let queryArr = []
      StationName
        .findOne({ name: fromStation })
        .exec((err, result) => {
          err && callback(null, err)
          if (result) {
            queryArr.push(result.aliascode)
          }
          else {
            console.log(`无法获取相关数据`)
          }
        })
      StationName
        .findOne({ name: toStation })
        .exec((err, result) => {
          err && callback(null, err)
          if (result) {
            queryArr.push(result.aliascode)
            callback(null, queryArr)
          }
          else {
            callback(null, err)
            console.log(`无法获取相关数据`)
          }
        })
    }

    query(fromStation, toStation, (err, result) => {
      err && console.log(err)
      console.log(result)
      let queryArr = []
      const query1 = '?leftTicketDTO.train_date=' +
        date +
        '&leftTicketDTO.from_station=' +
        result[0] +
        '&leftTicketDTO.to_station=' +
        result[1] +
        '&purpose_codes=' +
        ticketType
      const query2 = '?leftTicketDTO.train_date=' +
        backDate +
        '&leftTicketDTO.from_station=' +
        result[1] +
        '&leftTicketDTO.to_station=' +
        result[0] +
        '&purpose_codes=' +
        ticketType
      queryArr.push(query1)
      queryArr.push(query2)
      async.mapLimit(queryArr, 1, (query, callback) => {

        const apiURL = 'https://kyfw.12306.cn/otn/leftTicket/queryZ'
        // const apiURL = 'https://www.baidu.com'
        const originURL = apiURL + query
        console.log(originURL)
        request.get(originURL, (err, response, body) => {
          err && console.log(err)
          try {
            let fresult = JSON.parse(body)
            // let ttt = '{"validateMessagesShowId":"_validatorMessage","status":true,"httpstatus":200,"data":{"result":["null|23:00-06:00系统维护时间|630000K8270J|K830|GZQ|CDW|YLZ|YSZ|01:56|07:32|05:36|IS_TIME_NOT_BUY|kAuTOa9voM1dgeVeuCE%2BgTGhGBS1ajOaV2pzerPZJExDnkfAaLUs0VLgiM8%3D|20171224|3|QZ|08|11|0|0||||13|||无||11|有|||||10401030|1413|1","null|23:00-06:00系统维护时间|71000055380K|5538|ZJZ|JJZ|YLZ|YSZ|15:32|21:01|05:29|IS_TIME_NOT_BUY|BjjNApm%2BJMMeuJDPdzFQPb8CQVljnnn1|20171225|3|Z1|06|11|0|0|||||||有|||有|||||1010|11|1","null|23:00-06:00系统维护时间|710000K8720E|K872|ZJZ|CQW|YLZ|YSZ|18:57|00:42|05:45|IS_TIME_NOT_BUY|p3Cl%2F51sIj8bE8VQy4lp7i6LfmLyTJGYBNaIVbC7UTihrr2WL0jDXTAHINE%3D|20171225|3|Z1|07|11|0|0||||有|||无||有|有|||||10401030|1413|1"],"flag":"1","map":{"YLZ":"玉林","YSZ":"宜州"}},"messages":[],"validateMessages":{}}'
            // let fresult = JSON.parse(ttt)
            let status = fresult.status
            let httpstatus = fresult.httpstatus
            let messages = fresult.messages
            let data = fresult.data

            if (status && httpstatus === 200 && data) {
              let result = data.result
              let flag = data.flag
              let map = data.map
              let msg = []
              let gotData = []
              let ticketStatus = 0

              if (result) {
                result.forEach(element => {
                  let msg = element.split('|')
                  let tmpTime = []
                  msg.forEach(item => {
                    if (item.includes(':')) {
                      tmpTime.push(item)
                    }
                  })
                  if (msg.includes('有')) {
                    ticketStatus = 1
                  }
                  gotData.push({
                    code: msg[3],
                    times: tmpTime
                  })
                })
                callback(null, gotData)
              }
              else {
                // res.send('error has occurred.1')
                callback(null, `err 2`)
                console.log(`暂无此信息`)
              }
            }
            else {
              // res.send('error has occurred.2')
              callback(null, `err 1`)
              console.log(messages)
            }
          }
          catch (e) {
            // res.send('errors has occurred. 3')
            callback(null, e)
            // console.log(e)
          }

        })
      }, (err, result) => {
        // err && console.log(err)
        if (err) {
          res.send('error 11')
          console.log(err)
        }
        else {
          console.log(result)
          res.render('query', {
            title: '车票详情',
            from: req.body.fromStation,
            to: req.body.toStation,
            date: date,
            backdate: backDate,
            ticketStatus: '1',
            dataType: 'double',
            data: result
          })
          // res.send('ok')
        }
        // res.send('aaa')
      })

    })
  }
  else {
    // console.log(`单程票`)
    // console.log(`fromStation: ${fromStation}`)
    // console.log(`toStation: ${toStation}`)
    // console.log(`date: ${date}`)
    // console.log(`ticketType: ${ticketType}`)
    // console.log(`trainType: ${trainType}`)

    const query = (date, fromStation, toStation, ticketType, callback) => {
      let query = '?leftTicketDTO.train_date=' + date
      StationName
        .findOne({ name: fromStation })
        .exec((err, result) => {
          err && callback(null, err)
          if (result) {
            query += '&leftTicketDTO.from_station=' + result.aliascode
          }
          else {
            console.log(`无法获取相关数据`)
          }
        })
      StationName
        .findOne({ name: toStation })
        .exec((err, result) => {
          err && callback(null, err)
          if (result) {
            query += '&leftTicketDTO.to_station=' + result.aliascode + '&purpose_codes=' + ticketType
            callback(null, query)
          }
          else {
            callback(null, err)
            console.log(`无法获取相关数据`)
          }
        })
    }

    query(date, fromStation, toStation, ticketType, (err, result) => {
      err && console.log(err)
      // console.log(result)

      const apiURL = 'https://kyfw.12306.cn/otn/leftTicket/queryZ'
      // const apiURL = 'https://www.baidu.com'
      const originURL = apiURL + result

      request.get(originURL, (err, response, body) => {
        err && console.log(err)
        try {
          let fresult = JSON.parse(body)
          let status = fresult.status
          let httpstatus = fresult.httpstatus
          let messages = fresult.messages
          let data = fresult.data

          if (status && httpstatus === 200 && data) {
            let result = data.result
            let flag = data.flag
            let map = data.map
            let msg = []
            let gotData = []
            let ticketStatus = 0

            if (result) {
              result.forEach(element => {
                let msg = element.split('|')
                let tmpTime = []
                msg.forEach(item => {
                  if (item.includes(':')) {
                    tmpTime.push(item)
                  }
                })
                if (msg.includes('有')) {
                  ticketStatus = 1
                }
                gotData.push({
                  code: msg[3],
                  times: tmpTime
                })
              })
              res.render('query', {
                title: '车票详情',
                from: req.body.fromStation,
                to: req.body.toStation,
                date: date,
                ticketStatus: ticketStatus,
                dataType: 'ticket',
                data: gotData
              })
            }
            else {
              res.send('error has occurred.1')
              console.log(`暂无此信息`)
            }
          }
          else {
            res.send('error has occurred.2')
            console.log(messages)
          }
        }
        catch (e) {
          res.send('errors has occurred. 3')
          console.log(e)
        }

      })
    })
  }
})

module.exports = router;

// if (JSON.parse(body)) {
//   let fresult = JSON.parse(body)
//   let status = fresult.status
//   let httpstatus = fresult.httpstatus
//   let messages = fresult.messages
//   let data = fresult.data

//   if (status && httpstatus === 200 && data) {
//     let result = data.result
//     let flag = data.flag
//     let map = data.map
//     let msg = []
//     let gotData = []
//     let ticketStatus = 0

//     if (result) {
//       result.forEach(element => {
//         let msg = element.split('|')
//         let tmpTime = []
//         msg.forEach(item => {
//           if (item.includes(':')) {
//             tmpTime.push(item)
//           }
//         })
//         if (msg.includes('有')) {
//           ticketStatus = 1
//         }
//         gotData.push({
//           code: msg[3],
//           times: tmpTime
//         })
//       })
//       res.render('query', {
//         title: '车票详情',
//         from: req.body.fromStation,
//         to: req.body.toStation,
//         date: date,
//         ticketStatus: ticketStatus,
//         dataType: 'ticket',
//         data: gotData
//       })
//     }
//     else {
//       res.send('error has occurred.1')
//       console.log(`暂无此信息`)
//     }
//   }
//   else {
//     res.send('error has occurred.2')
//     console.log(messages)
//   }
// }
// else {
//   console.log(`资源获取出错`)
//   res.send(`资源获取出错`)
// }
