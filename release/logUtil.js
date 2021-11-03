// 用于打印日志，便于统一管理好发送邮件什么的
var Log = {
    /**
     * 
     * @param {String} text 
     */
    d: function (text) {
        console.log(text);
    },
    /**
     * 错误信息, 与其他信息编组60分钟发出一次
     * @param {String} text 
     */
    e: function (text) {
        console.log(text);
        Game.notify(text, 60);
    }
}

module.exports = Log;