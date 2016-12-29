/**
 * Created by Administrator on 2016/12/22 0022.
 */
window.onload = function(){
    visualizer.init();
};

var visualizer = function () {
    this.file = null; // 当前文件
    this.fileName = null; // 当前文件名
    this.audioContext = null;
    this.source = null;
    this.info = document.getElementById('info').innerHTML;
    this.infoUpdateId = null; // 用于存储定时器
    this.animationId = null;
    this.status = 0; // 音乐播放（1）或停止（0）的标志
    this.forceStop = false;
    this.allCapsReachBottom = false;
};
visualizer.prototype = {
    init : function () {
        this._prepareAPI();
        this._addEventListner();
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
        var that = this,
            audioInput = document.getElementById('uploadFile'),
            dropContainer = document.getElementById('canvas');
        audioInput.onchange = function () { // 监听是否有文件被选中
            if(that.audioContext === null){
                return false;
            }
            if(audioInput.files.length !== 0){ // 判断用户是否真的选择了文件，若取消了则文件长度为0
                that.file = audioInput.file[0];
                that.fileName = that.file.name;
                if(that.status === 1){
                    that.forceStop = true;
                }
            }
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Uploading', true);
            that._start();
        };
        // 监听拖拽与释放事件
    },
    _start : function () {
        var that = this,
            file = this.file,
            fr = new FileReader();
        fr.onload = function () { // 文件读取完调用此函数
            var fileResult = e.target.result,
                audioContext = that.audioContext;
            if(audioContext === null){
                return false;
            }
            that._updateInfo('Decoding the audio', true);
            audioContext.decodeAudioData(fileResult, function (buffer) {
                that._updateInfo('Decode successfully, start the visualizer', true);
                that._visualize(audioContext, buffer);
            }, function (e) {
                that._updateInfo('Fail to decode the file.', false);
                console.error(e);
            });
        };
        fr.onerror = function (e) {
            that._updateInfo('Fail to read the file.', false);
            console.error(e);
        };
        this._updateInfo('starting read the file', true);
        fr.readAsArrayBuffer(file);
    },
    _visualize : function (audioContext, buffer) {
        var audioBufferSourceNode = audioContext.createBufferSource(),
            analyser = audioContext.createAnalyser(),
            that = this;
        audioBufferSourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        audioBufferSourceNode.buffer = buffer;
        if(!audioBufferSourceNode.start){ // 保证兼容
            audioBufferSourceNode.start = audioBufferSourceNode.noteOn;
            audioBufferSourceNode.stop  = audioBufferSourceNode.noteOff;
        }
        if(this.animationId !== null){
            cancelAnimationFrame(this.animationId);
        }
        if(this.source !== null){
            this.source.stop(0);
        }
        audioBufferSourceNode.start(0);
        this.status = 1;
        this.source = audioBufferSourceNode;
        audioBufferSourceNode.onended = function () {
            that._audioEnd(that);
        }
        this._updateInfo('Playing ' + this.fileName, false);
        this.info = 'Playing ' + this.fileName;
        document.getElementById('fileWrapper').style.opacity = 0.2;
    },
    _updateInfo : function (text, processing) {
        var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
        infoBar.innerHTML = text + dots.substring(0, i++);
        if(that.infoUpdateId !== null){
            clearTimeout(that.infoUpdateId);
        }
        if(processing){
            var animateDot = function () {
                if(i > 3){
                    i = 0;
                }
                infoBar.innerHTML = text + dots.substring(0, i++);
                that.infoUpdateId = setTimeout(animateDot, 250);
            };
            this.infoUpdateId = setTimeout(animateDot, 250);
        }
    }
};