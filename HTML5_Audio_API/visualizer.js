/**
 * Created by Administrator on 2016/12/22 0022.
 */
window.onload = function(){
    visualizer.init();
};


var visualizer = function () {
    this.file = null;
    this.fileName = null;
    this.audioContext = null;
    this.source = null;
};
visualizer.prototype = {
    init : function () {
        this._prepareAPI();
    },
    _prepareAPI : function () {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        window.cancelAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        try {
            this.audioContext = new AudioContext();
        } catch(e) {
            alert("啊哦，您的浏览器不支持 Web Audio API 哦！");
            console.log(e);
        }
    },
    _addEventListner : function() {
        
    }
};