'use strict';

var utf8 = require('utf8');

module.exports = class BotK {

    constructor() {
        this.host = 'http://128.199.223.91:8080/uetbot/api?apiKey=roseisred_violetisblue_uet14020577';
        this.request = require('unirest');
    }

    hasScore(className, code, link, members) {
        var data = dataK.hasScore(className, code, link, members);

        return this.createRequest(data)
    }

    createRequest(data) {
        console.log(JSON.stringify(data));
        return this.request.post(this.host).encoding('utf-8')
            .type('json').send(JSON.stringify(data));
    }
};

class dataK {
    static hasScore(className, code, link, members) {
        return {
            type: 'newgrade',
            course_name: utf8.encode(className),
            course_code: code,
            grade_link: link,
            members: members
        }
    }
}