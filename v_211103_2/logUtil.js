// 用于打印日志，便于统一管理好发送邮件什么的
var Log = {
    /**
     * 线上会关闭
     * 
     * @param {String} text 
     */
    d: function (text) {
        // console.log('Debug: ' + text);
    },
    /**
     * 错误信息, 与其他信息编组60分钟发出一次
     * @param {String} text 
     */
    e: function (text) {
        console.log('Error: ' + text);
        Game.notify(text, 60);
    },
    i: function (text) {
        console.log('Info: ' + text);
    }
}

module.exports = Log;