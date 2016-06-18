'use strict';

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
        return this.request.post(this.host).encoding('utf-8')
            .type('json').send(data);
    }
};

class dataK {
    static hasScore(className, code, link, members) {
        return {
            type: 'newgrade',
            course_name: className,
            course_code: code,
            grade_link: link,
            members: members
        }
    }
}