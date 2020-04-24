class Visualizer{
    constructor(player){
        this.player = player
        this.analyser = player.aCtx.createAnalyser()
        player.source.connect(this.analyser)
        this.analyser.connect(player.gain)
    }
    getFormatTime(time, format="hh:mm:ss"){
        const cT = time||this.player.audio.currentTime
        const ss = ('0'+~~(cT%60)).substr(-2)
        const mm = ('0'+~~(cT/60%60)).substr(-2)
        const hh = ('0'+~~(cT/3600%24)).substr(-2)
        return format.replace('hh',hh).replace('mm',mm).replace('ss',ss)
    }
    createController(container,barElement,textElement){
        const audio = this.player.audio
        this.player.audio.addEventListener('timeupdate', ()=>{
            if(!barElement.active){
                barElement.style.width = container.clientWidth*audio.currentTime/audio.duration+'px'
                if(textElement) textElement.textContent = this.getFormatTime()
            }
        })
        container.onmousedown = e=>{
            barElement.active = true
        }
        window.addEventListener('mousemove', e=>{
            if(barElement.active){
                let pct = (e.clientX-container.offsetLeft)/container.clientWidth
                pct = pct>1?1:pct<0?0:pct
                barElement.style.width = pct*container.clientWidth+'px'
                if(textElement) textElement.textContent = this.getFormatTime(pct*audio.duration)
            }
        })
        function handleEnd(e){
            if(barElement.active){
                let pct = (e.clientX-container.offsetLeft)/container.clientWidth
                audio.currentTime = pct*audio.duration
                barElement.active = false
            }
        }
        window.addEventListener('mouseup', handleEnd)
        window.addEventListener('mouseleave', handleEnd)
    }
    getPeaks(width, data){
        let step = Math.floor(data.length/width)
        let peaks = []
        for(let i=0;i<width;i++){
            let batch = data.slice(i*step,(i+1)*step)
            let max = Math.max(...batch)
            let min = Math.min(...batch)
            peaks.push([max, min])
        }
        return peaks
    }
    dynamicWaveform(canvas){
        const ctx = canvas.getContext('2d')
        window.addEventListener('resize',e=>{
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight    
        })
        canvas.style.userSelect = 'none'
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        const analyser = this.analyser
        const data = new Uint8Array(this.analyser.frequencyBinCount)
        const audio = this.player.audio
        const getPeaks = this.getPeaks
        const peaks = [], peakWidth = 4, peakFPS = 20
        var peakScrollRate = 10
        const mouseEvent = {active:false,x:0,paused:false}
        canvas.onmousedown = e=>{
            mouseEvent.active = true
            mouseEvent.x = e.clientX
            if(!audio.paused){
                audio.pause()
                mouseEvent.paused = true
            }
        }
        window.addEventListener('mousemove', e=>{
            if(mouseEvent.active){
                let dx = e.clientX-mouseEvent.x
                mouseEvent.x = e.clientX
                audio.currentTime = audio.currentTime-dx/peakScrollRate/peakFPS
            }
        })
        const handleEnd = e=>{
            mouseEvent.active=false
            if(mouseEvent.paused){
                audio.play()
                mouseEvent.paused=false
            }
        }
        window.addEventListener('mouseup', handleEnd)
        window.addEventListener('mouseleave', handleEnd)
        canvas.onwheel = e=>{
            peakScrollRate-= Math.sign(e.deltaY)
            peakScrollRate = peakScrollRate>20?20:peakScrollRate<1?1:peakScrollRate
        }
        loop()
        function loop(){
            window.requestAnimationFrame(loop)
            analyser.getByteTimeDomainData(data)
            let timeIndex = Math.floor(audio.currentTime*peakFPS)*peakWidth
            if(!mouseEvent.active){
                getPeaks(Math.ceil(peakWidth*audio.playbackRate), data).map((peak,i)=>{
                    if(peaks[timeIndex+i]==undefined) peaks[timeIndex+i] = peak
                })
            }
            ctx.clearRect(0,0,canvas.width,canvas.height)
            ctx.beginPath()
            let moved = false
            for(let x=0;x<=canvas.width;x++){
                let i = timeIndex+Math.floor((x-canvas.width+1)*peakWidth/peakScrollRate)
                if(peaks[i]){
                    let y0 = canvas.height*peaks[i][0]/256
                    let y1 = canvas.height*peaks[i][1]/256
                    if(moved){
                        ctx.lineTo(x,y0)
                    }else{
                        ctx.moveTo(x,y0)
                        moved = true
                    }
                    ctx.lineTo(x,y1)
                }else{
                    moved = false
                }
            }
            ctx.stroke()
            ctx.closePath()
        }
    }
    staticWaveform(canvas, peaks, offset=0, color='black'){
        const ctx = canvas.getContext('2d')
        const cy = canvas.height/2
        const max = Math.max(...peaks.map(peak=>Math.max(peak[0],-peak[1])))
        ctx.beginPath()
        ctx.moveTo(offset,cy)
        peaks.map((peak,i)=>{
            ctx.lineTo(offset+i,peak[0]*cy+cy)
            ctx.lineTo(offset+i,peak[1]*cy+cy)
        })
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.closePath()
    }
    waveformEditor(canvas, channelData){
        const ctx = canvas.getContext('2d')
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        const cy = canvas.height/2
        const peaks = this.getPeaks(canvas.width, channelData)
        this.staticWaveform(canvas, peaks)
        const bound = {active:false,left:0,right:0,start:0}
        function drawBound(x,type, color='grey'){
            ctx.beginPath()
            ctx.moveTo(x,0)
            ctx.lineTo(x,canvas.height)
            ctx.fillStyle = color
            ctx.strokeStyle = color
            ctx.stroke()
            ctx.fill()
            ctx.closePath()
            ctx.fillRect(type=='left'?x-10:x,cy-15,10,30)
        }
        canvas.addEventListener('contextmenu',e=>{
            e.preventDefault()
        })
        canvas.addEventListener('mousedown',e=>{
            var LEFT=1,MID=2,RIGHT=3
            if(e.which==RIGHT){
                bound.active = true
                bound.start = bound.left = bound.right = Math.floor(e.clientX-canvas.offsetLeft)
                ctx.clearRect(0,0,canvas.width,canvas.height)
                this.staticWaveform(canvas, peaks)
            }
        })
        canvas.addEventListener('mousemove',e=>{
            if(bound.active){
                const left = Math.floor(e.clientX-canvas.offsetLeft)
                ctx.clearRect(0,0,canvas.width,canvas.height)
                this.staticWaveform(canvas, peaks)
                if(left>bound.start){
                    bound.left = bound.start
                    bound.right = left
                }else{
                    bound.left = left
                    bound.right = bound.start
                }
                drawBound(bound.left,'left')
                drawBound(bound.right,'right')
                this.staticWaveform(canvas, peaks.slice(bound.left, bound.right), bound.left, 'dodgerblue')
            }
        })
        canvas.addEventListener('mouseup',e=>{
            bound.active = false
        })
        canvas.addEventListener('mouseleave',e=>{
            bound.active = false
        })
    }
    oscilloscope(canvas){
        const ctx = canvas.getContext('2d')
        this.analyser.fftSize = 2048
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        loop()
        function loop(){
            window.requestAnimationFrame(loop);
            this.analyser.getByteTimeDomainData(data)
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2
            ctx.strokeStyle = 'white'
            ctx.beginPath()
            for(var i=0;i<this.analyser.frequencyBinCount;i++){
                var x = i / this.analyser.frequencyBinCount * canvas.width
                var y = data[i] / 256 * canvas.height
                if(i==0){
                    ctx.moveTo(x,y)
                }else{
                    ctx.lineTo(x,y)
                }
            }
            ctx.lineTo(canvas.width,canvas.height/2)
            ctx.stroke()
            ctx.closePath()
        }
    }
    spectrogram(canvas) { // by Jake Albaugh
        const ctx = canvas.getContext('2d')
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        const h = canvas.height / data.length;
        const x = canvas.width - 1;
        ctx.fillStyle = 'hsl(280, 100%, 10%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        loop();
        function loop() {
            window.requestAnimationFrame(loop);
            let imgData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imgData, 0, 0);
            this.analyser.getByteFrequencyData(data);
            for (let i = 0; i < data.length; i++) {
                let rat = data[i] / 255;
                let hue = Math.round((rat * 120) + 280 % 360);
                let sat = '100%';
                let lit = 10 + (70 * rat) + '%';
                ctx.beginPath();
                ctx.strokeStyle = `hsl(${hue}, ${sat}, ${lit})`;
                ctx.moveTo(x, canvas.height - (i * h));
                ctx.lineTo(x, canvas.height - (i * h + h));
                ctx.stroke();
            }
        }
    }
}
class AudioPlayer{
    constructor(){
        this.audio = new Audio()
        this.aCtx = new (window.AudioContext || window.webkitAudioContext)()
        this.source = this.aCtx.createMediaElementSource(this.audio)
        this.audioBuffer = null
        this.gain = this.aCtx.createGain()
        this.gain.connect(this.aCtx.destination)
    }
    play(){this.audio.play()}
    pause(){this.audio.pause()}
    get paused(){return this.audio.paused}
    set playbackRate(v){this.audio.playbackRate=v}
    get playbackRate(){return this.audio.playbackRate}
    set currentTime(v){this.audio.currentTime=v}
    get currentTime(){return this.audio.currentTime}
    rewind(offset){
        var t = this.audio.currentTime+offset
        var duration = this.audio.duration
        this.audio.currentTime = t<0?0:t>duration?duration:t
    }
    readAsAudioElementSrc(file){
        this.audio.src = URL.createObjectURL(file)
        return new Promise((resolve,reject)=>{
            this.audio.onloadeddata = resolve
        })
    }
    readAsArrayBuffer(file){
        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
        this.audio.src = URL.createObjectURL(file)
        return new Promise((resolve,reject)=>{
            reader.onload = ()=>{
                this.aCtx.decodeAudioData(reader.result).then(audioBuffer=>{
                    this.audioBuffer = audioBuffer
                    resolve(this.audioBuffer)
                })
            }
        })
    }
}
var player
function playPause(){
    if(player.paused){
        player.play()
        document.getElementById('playPause').className = 'fa fa-pause'
    }else{
        player.pause()
        document.getElementById('playPause').className = 'fa fa-play'
    }
}

function handleDrop(e){
    e.preventDefault()
    const files = [...e.dataTransfer.items].filter(item=>item.kind=='file').map(item=>item.getAsFile())
    handleFile(files[0])
}
async function handleFile(file){
    if(file.type.includes('audio')){
        player = new AudioPlayer()
        // var audioBuffer = await player.readAsArrayBuffer(file)
        // var channelData = audioBuffer.getChannelData(0)
        var visualizer = new Visualizer(player)
        // visualizer.waveformEditor(document.getElementById('canvas'), channelData)
        await player.readAsAudioElementSrc(file)
        visualizer.dynamicWaveform(document.getElementById('waveform'))
        visualizer.createController(
            document.getElementById('audio-control-container'),
            document.getElementById('audio-control-bar'),
            document.getElementById('audio-control-text')
        )
    }
}
window.addEventListener('keyup',e=>{
    if(e.code=='AltLeft'){
        e.preventDefault()
        player.rewind(-5)
    }else if(e.code=='AltRight'){
        e.preventDefault()
        player.rewind(5)
    }
})

var editor = CodeMirror.fromTextArea(document.getElementById('text-editor'),{
    lineNumbers: true
})
{/* <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.css" integrity="sha384-zB1R0rpPzHqg7Kpt0Aljp8JPLqbXI3bhnPWROx27a9N0Ll6ZP/+DiW/UqRcLbRjq" crossorigin="anonymous">
<script src="js/marked.js"></script>
<script src="js/katex.js"></script>
<script src="js/marked-katex.js"></script>
var markdown = document.getElementById('markdown')
editor.on('change',e=>{
    markdown.innerHTML = marked(e.getDoc().getValue())
})  */}
