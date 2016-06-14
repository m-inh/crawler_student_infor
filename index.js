/**
 * Created by TooNies1810 on 6/14/16.
 */
var request = require('request');
var cheerio = require('cheerio');

var url = 'http://vnexpress.net/tin-tuc/khoa-hoc/tri-nho-con-nguoi-giam-vi-dien-thoai-thong-minh-3243543.html';

var news = {};

request(url, function (err, response, body) {
    if (!err && response.statusCode == 200) {
        // console.log(body);
        var $ = cheerio.load(body);

        news.title = $('.block_col_480 h1').text();

        news.description = $('.block_col_480 .short_intro').text();

        var main = '';

        $('.block_col_480 .Normal').each(function(){
            main += $(this).text() + '\n';
        });

        news.main = main;

        console.log(news);
    }
    else console.log('Error');
});