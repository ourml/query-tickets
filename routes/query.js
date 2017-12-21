var express = require('express');
var router = express.Router();
const request = require('request');

let StationName = require('../models/station-name.model')

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
  let code = req.params.code
  res.render('query', {
    title: '火车票查询信息',
    from: '',
    to: '',
    date: '',
    ticketStatus: '',
    dataType: 'detail',
    data: ''
  });
  console.log(code)
})

router.post('/', function(req, res, next) {
  let fromStation = req.body.fromStation
  let toStation = req.body.toStation
  let date = req.body.date
  let outDate = req.body.outDate
  let inDate = req.body.inDate
  let ticketType = req.body.ticketType
  let trainType = req.body.trainType

  ticketType === 'adult' ? ticketType = 'ADULT' : ticketType = 'ADULT'

  function query(date, fromStation, toStation, ticketType, callback) {
    let query = '?leftTicketDTO.train_date=' + date
    if (fromStation) {
      StationName
        .findOne({ name: fromStation })
        .exec((err, result) => {
          err && console.log(err)
          query += '&leftTicketDTO.from_station=' + result.aliascode
        })
    }
    if (toStation) {
      StationName
        .findOne({ name: toStation })
        .exec((err, result) => {
          err && callback(null, err)
          query += '&leftTicketDTO.to_station=' + result.aliascode + '&purpose_codes=' + ticketType
          callback(null, query)
        })
    }
  }
  query(date, fromStation, toStation, ticketType, (err, query) => {
    err && console.log(err)
    let apiURL = 'https://kyfw.12306.cn/otn/leftTicket/query'
    let originURL = apiURL + query

    request.get(originURL, (err, response, body) => {
      err && console.log(err)

      let fresult = JSON.parse(body)
      let status = fresult.status
      let httpstatus = fresult.httpstatus
      let messages = fresult.messages
      // let validateMessages = fresult.validateMessages
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
            date: date ? date : outDate,
            ticketStatus: ticketStatus,
            dataType: 'ticket',
            data: gotData
          })
        }
        else {
          res.send('error has occurred.')
          console.log(`暂无此信息`)
        }
      }
      else {
        res.send('error has occurred.')
        console.log(messages)
      }
    })
  })
  if (!fromStation) {
    res.redirect('/')
  }
})

module.exports = router;
