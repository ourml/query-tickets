var express = require('express');
var router = express.Router();

/* GET query listing. */
router.get('/', function (req, res, next) {
  res.render('query', { title: '火车票查询信息' });
});

module.exports = router;
