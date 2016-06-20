/**
 * Created by TooNies1810 on 6/14/16.
 */
require('dotenv').config();
var request = require('request');
var cheerio = require('cheerio');
var express = require('express');
var mysql = require('mysql');
var schedule = require('node-schedule');
var BotK = require('./connect-bot');
var bot = new BotK();

var app = express();

// var bodyParser = require('body-parser');

var api_key_sendgrid = "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";
var url_host = "http://www.coltech.vnu.edu.vn";
var url_test = "http://www.coltech.vnu.edu.vn/news4st/test.php";

var form_post = {
    "lstClass": "820"
};

var param_post = {
    url: url_test,
    form: form_post
};

function crawler() {
    console.log('Crawler');
    request.post(param_post, function (err, response, body) {
        // console.log(body);

        if (err) {
            // res.end("Loi roi em ei");
            return;
        }

        if (response.statusCode === 200) {
            var $ = cheerio.load(body);

            var urlArr = [];
            urlArr = $('a');
            var nameArr = $('b');

            // console.log(nameArr);

            for (var i = 0; i < urlArr.length; i++) {
                var url_temp = url_host + urlArr[i].attribs.href.toString().trim().substring(2);
                var nameClass = $(nameArr[i]).text().trim();
                // console.log(url_temp);

                var nameTemp = nameClass.split('(');
                var nameTemp2 = "";
                if (nameTemp.length > 1) {
                    nameTemp2 = nameTemp[0].split('-')[0].trim();
                } else {
                    nameTemp2 = nameTemp.split('-')[0].trim();
                }

                var idClass = removeUndeline(getIdClass(url_temp));
                if (idClass.length > 0) {
                    // console.log(idClass);

                    var tempClass = {
                        id: '',
                        idclass: idClass,
                        name: nameTemp2,
                        ishasscore: true,
                        link: url_temp
                    };
                    connection.query("INSERT INTO class SET ?", tempClass, function (err, results) {

                    });

                    var query = connection.query(
                        'UPDATE class SET ishasscore = ?, link = ? WHERE idclass = ?',
                        [true, url_temp, idClass],
                        function (err, results) {
                            // console.log("update ok");
                        });

                    // console.log(query.sql);
                }
            }
        }
    });
}

function removeUndeline(string) {
    string = string.toString().trim();
    return string.split('_').join('');
}

function getIdClass(url) {
    var urlString = url.toString();
    var url1 = urlString.split('-');
    // console.log(url1.toString());

    if (url1.length == 2) {
        return url1[1].substring(0, url1[1].length - 4);
    }

    if (url1.length > 2) {
        var tempUrl = url1[url1.length - 1];
        return tempUrl.substring(0, tempUrl.length - 4);
    }

    if (url1.length == 0) {
        url1 = urlString.split('/');
        var nameTemp = url1[url1.length - 1];
        return nameTemp.substring(0, nameTemp.length - 4);
    }

    return "";
}

// get post
app.get('/', function (req, res) {
    run();
    res.send('OK!');
});

function run() {
    console.log("refresh");
    crawler();
    checkToSendMail();
}

function run2() {
    console.log("refresh");
    checkToSendMail();
}

// schedule.scheduleJob('*/2 * * * *', function () {
//     run();
// });


setInterval(function () {
    run();
}, 10000);


///////
function checkToSendMail() {
    console.log('checkToSendMail');
    // query lay emai, link -> gui mail thong bao
    var query_string = "SELECT u.email, u.name, u.mssv, c.name AS className, c.link, uc.idclass FROM user_class uc " +
        " JOIN user u ON u.email = uc.email" +
        " JOIN class c ON c.idclass = uc.idclass" +
        " WHERE uc.issendmail = false && c.ishasscore = true && u.isactive = true";

    connection.query(query_string, function (err, results) {
        if (err) {
            console.log("loi cmnr");
            return;
        }

        console.log('Hello baby!');

        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            console.log(result);

            sendNotiEmail(result, function (err, result) {
                var email = result.email;
                var className = result.className;
                var idclass = result.idclass;

                if (!err) {
                    console.log("Send mail: " + email + " class: " + className);
                    // -> gui mail thanh cong -> update issend = true
                    var query = connection.query(
                        'UPDATE user_class SET issendmail = ? WHERE idclass = ?',
                        [true, idclass],
                        function (err, results) {
                            // console.log("update ok");
                        });
                }
            });

            /**
             * Send to bot messenger
             */
            bot.hasScore(result.className, result.idclass, result.link, [result.mssv]).end(function (response) {
                // console.log(response.body);
            });
        }


        // if (results.length == 0) {
        //     console.log("het cmnr");
        //     return;
        // }
        // var result = results[0];
        //
        // var email = result.email;
        // var link = result.link;
        // var idclass = result.idclass;
        // var name = result.name;
        // var className = result.className;
        //
        // // console.log(email + " " + link);
        //
        // sendNotiEmail(name, "fries.uet@gmail.com", email, className, link, function (err) {
        //     if (!err) {
        //         console.log("Send mail: " + email + " class: " + className);
        //         // -> gui mail thanh cong -> update issend = true
        //         var query = connection.query(
        //             'UPDATE user_class SET issendmail = ? WHERE idclass = ?',
        //             [true, idclass],
        //             function (err, results) {
        //                 console.log("update ok " + email);
        //             });
        //     }
        // });

    });

}

//// send mail
function sendNotiEmail(result, callback) {
    var links = result.link;
    var to = result.email;
    var nameClass = result.className;
    var name = result.name;

    var from = 'fries.uet@gmail.com';
    var helper = require('sendgrid').mail;
    var from_email = new helper.Email(from);
    var to_email = new helper.Email(to);
    var subject = "Thông báo có điểm " + nameClass;

    var link_html = '<a href="' + links + '" target="_blank">' + links + '</a>' + '<br>';

    var content_html = "Xin chào " + name + "<br>" + "<br>" +
        "Đã có điểm của môn " + nameClass + " :" + "<br>" +
        "Link: " + link_html +
        "Chúc bạn một ngày vui vẻ :d" + "<br>" +
        "Fries Team.";

    var content = new helper.Content("text/html", content_html);
    var mail = new helper.Mail(from_email, subject, to_email, content);

    var sg = require('sendgrid').SendGrid(process.env.SG_KEY);
    var requestBody = mail.toJSON();
    var request = sg.emptyRequest();
    request.method = 'POST';
    request.path = '/v3/mail/send';
    request.body = requestBody;
    sg.API(request, function (response) {
        // console.log(response.statusCode);
        // console.log(response.body);
        // console.log(response.headers);
        var err = true;
        if (response.statusCode == 202) {
            err = false;
            callback(err, result);
        } else {
            err = true;
            callback(err, result);
        }
    });
}


// connection

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to mysql!");

    app.listen(3456, function () {
        console.log("listening on 3456");
        // id 1
    });
});