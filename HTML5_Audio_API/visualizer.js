/**
 * Created by Administrator on 2016/12/22 0022.
 */
window.onload = function(){
    new visualizer().init();
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
            this.infoUpdateId("啊哦，您的浏览器不支持 Web Audio API 哦！", false);
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
                that.file = audioInput.files[0];
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
        dropContainer.addEventListener('dragenter', function () {
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Drop it on the page', true);
        }, false);
        dropContainer.addEventListener('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTranfer.dropEffect = 'copy';
        }, false);
        dropContainer.addEventListener('dragleave', function () {
            document.getElementById('fileWrapper').style.opacity = 0.2;
            that._updateInfo(that.info, false);
        },false);
        dropContainer.addEventListener('drop', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if(that.audioContext === null){
                return 0;
            }
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Uploading', true);
            that.file = e.dataTransfer.files[0];
            if(that.status === 1){
                document.getElementById('fielWrapper').style.opacity = 1;
                that.forceStop = true;
            }
            that.fileName = that.file.name;
            that._start();
        }, false);
    },
    _start : function () {
        var that = this,
            file = this.file,
            fr = new FileReader();
        fr.onload = function (e) { // 文件读取完调用此函数
            var fileResult = e.target.result,
                audioContext = that.audioContext;
            if(audioContext === null){
                return 0;
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
        };
        this._updateInfo('Playing ' + this.fileName, false);
        this.info = 'Playing ' + this.fileName;
        document.getElementById('fileWrapper').style.opacity = 0.2;
        this._drawSpectrum(analyser);
    },
    _drawSpectrum : function(analyser){
        var that = this,
            canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10,
            gap = 2,
            capHeight = 2,
            capStyle = '#fff',
            meterNum = 800 / (10 + 2),
            capYPositionArray = [];
        ctx = canvas.getContext('2d');
        gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(1, '#0f0');
        gradient.addColorStop(0.5, '#ff0');
        gradient.addColorStop(0, '#f00');
        var drawMeter = function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            if(that.status === 0){
                for(var i = array.length - 1; i >= 0; i--){
                    array[i] = 0;
                }
                allCapsReachBottom = true;
                for(var i = capYPositionArray.length - 1; i >= 0; i--){
                    allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
                }
                if(allCapsReachBottom){
                    cancelAnimationFrame(that.animationId);
                    return false;
                }
            }
            var step = Math.round(array.length / meterNum);
            ctx.clearRect(0, 0, cwidth, cheight);
            for(var i = 0; i < meterNum; i++){
                var value = array[i * step];
                if(capYPositionArray.length < Math.round(meterNum)){
                    capYPositionArray.push(value);
                }
                ctx.fillStyle = capStyle;
                if(value < capYPositionArray[i]){
                    ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
                }else {
                    ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
                    capYPositionArray[i] = value;
                }
                ctx.fillStyle = gradient;
                ctx.fillRect(i * 12, cheight - value + capHeight, meterWidth, cheight);
            }
            that.animatedId = requestAnimationFrame(drawMeter);
        };
        this.animationId = requestAnimationFrame(drawMeter);
    },
    _updateInfo : function (text, processing) {
        var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
        infoBar.innerHTML = text + dots.substring(0, i++);
        if(this.infoUpdateId !== null){
            clearTimeout(this.infoUpdateId);
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
    },
    _audioEnd : function (instance) {
        if(this.forceStop){
            this.forceStop = false;
            this.status = 1;
            return false;
        }
        this.status = 0;
        var text = 'HTML5 Audio API showcase | An Audio Visualizer';
        document.getElementById('fileWrapper').style.opacity = 1;
        document.getElementById('info').innerHTML = text;
        instance.info = text;
        document.getElementById('uploadedFile').value = '';
    }
};