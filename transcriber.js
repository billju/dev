class Visualizer{
    constructor(){
        
    }
    connect(player){
        this.player = player
        this.analyser = player.aCtx.createAnalyser()
        player.source.connect(this.analyser)
        this.analyser.connect(player.gain)
    }
    getFormatTime(seconds, format="hh:mm:ss"){
        const ss = ('0'+~~(seconds%60)).substr(-2)
        const mm = ('0'+~~(seconds/60%60)).substr(-2)
        const hh = ('0'+~~(seconds/3600%24)).substr(-2)
        const mis = (seconds%1).toFixed(3).substr(2)
        return format.replace('hh',hh).replace('mm',mm).replace('ss',ss).replace('mis',mis)
    }
    createController(container,barElement,textElement){
        const media = this.player.media
        media.addEventListener('timeupdate', ()=>{
            if(!barElement.active){
                barElement.style.width = container.clientWidth*media.currentTime/media.duration+'px'
                if(textElement) textElement.textContent = this.getFormatTime(this.player.currentTime)
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
                if(textElement) textElement.textContent = this.getFormatTime(pct*media.duration)
            }
        })
        function handleEnd(e){
            if(barElement.active){
                let pct = (e.clientX-container.offsetLeft)/container.clientWidth
                media.currentTime = pct*media.duration
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
        const media = this.player.media
        const getPeaks = this.getPeaks
        const getFormatTime = this.getFormatTime
        const peaks = [], peakWidth = 10, peakFPS = 20
        var peakScrollRate = 1
        const mouseEvent = {active:false,x:0,paused:false}
        canvas.onmousedown = e=>{
            mouseEvent.active = true
            mouseEvent.x = e.clientX
            if(!media.paused){
                media.pause()
                mouseEvent.paused = true
            }
        }
        window.addEventListener('mousemove', e=>{
            if(mouseEvent.active){
                let dx = e.clientX-mouseEvent.x
                mouseEvent.x = e.clientX
                media.currentTime = media.currentTime-dx/peakScrollRate/peakFPS
            }
        })
        const handleEnd = e=>{
            mouseEvent.active=false
            if(mouseEvent.paused){
                media.play()
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
            let timeIndex = Math.floor(media.currentTime*peakFPS)*peakWidth
            if(!mouseEvent.active){
                getPeaks(Math.ceil(peakWidth*media.playbackRate), data).map((peak,i)=>{
                    if(peaks[timeIndex+i]==undefined) peaks[timeIndex+i] = peak
                })
            }
            ctx.fillStyle = '#607d8b'
            ctx.fillRect(0,0,canvas.width,canvas.height)
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
            ctx.strokeStyle = 'white'
            ctx.stroke()
            ctx.closePath()
            ctx.beginPath()
            ctx.font = "12px arial"
            let timestamps = [], interval = Math.max(Math.ceil(5/peakScrollRate),1)
            for(let x=-20;x<=canvas.width+20;x++){
                let i = timeIndex+Math.floor((x-canvas.width+1)*peakWidth/peakScrollRate)
                let seconds = i/peakWidth/peakFPS
                if(seconds%interval==0&&i>=0){
                    timestamps.push({seconds,x})
                }
            }
            ctx.fillStyle = 'white'
            for(let ts of timestamps){
                let format = ts.seconds<3600?'mm:ss':'hh:mm:ss'
                let text = getFormatTime(ts.seconds,format)
                let textWidth = ctx.measureText(text).width
                ctx.fillText(text,ts.x-textWidth/2,canvas.height-5)
                ctx.moveTo(ts.x,0)
                ctx.lineTo(ts.x,5)
                ctx.moveTo(ts.x,canvas.height-5)
                ctx.lineTo(ts.x,canvas.height)
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
}
class MediaPlayer{
    constructor(){
        this.media = new Audio()
    }
    setMediaElement(element){
        this.media = element
    }
    createAudioContext(){
        this.aCtx = new (window.AudioContext || window.webkitAudioContext)()
        this.source = this.aCtx.createMediaElementSource(this.media)
        this.audioBuffer = null
        this.gain = this.aCtx.createGain()
        this.gain.connect(this.aCtx.destination)
    }
    play(){this.media.play()}
    pause(){this.media.pause()}
    get duration(){return this.media.duration}
    get paused(){return this.media.paused}
    set playbackRate(v){this.media.playbackRate=v}
    get playbackRate(){return this.media.playbackRate}
    set currentTime(v){this.media.currentTime=v}
    get currentTime(){return this.media.currentTime}
    togglePlay(){
        if(player.paused){
            player.play()
            document.getElementById('toggle-play').className = 'fa fa-pause'
        }else{
            player.pause()
            document.getElementById('toggle-play').className = 'fa fa-play'
        }
    }
    rewind(offset){
        var t = this.media.currentTime+offset
        var duration = this.media.duration
        this.media.currentTime = t<0?0:t>duration?duration:t
    }
    readAsMediaElementSrc(file){
        this.media.src = URL.createObjectURL(file)
        return new Promise((resolve,reject)=>{
            this.media.onloadeddata = resolve
        })
    }
    readAsArrayBuffer(file){
        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
        this.media.src = URL.createObjectURL(file)
        return new Promise((resolve,reject)=>{
            reader.onload = ()=>{
                this.aCtx.decodeAudioData(reader.result).then(audioBuffer=>{
                    this.audioBuffer = audioBuffer
                    resolve(this.audioBuffer)
                })
            }
        })
    }
    createCompressor(){
        this.compressor = this.aCtx.createDynamicsCompressor()
        this.compressor.threshold.setValueAtTime(-50, this.aCtx.currentTime)
        this.compressor.knee.setValueAtTime(-50, this.aCtx.currentTime)
        this.compressor.ratio.setValueAtTime(-50, this.aCtx.currentTime)
        this.compressor.attach.setValueAtTime(-50, this.aCtx.currentTime)
        this.compressor.release.setValueAtTime(-50, this.aCtx.currentTime)
        this.source.disconnect(this.gain)
        this.source.connect(this.compressor)
        this.compressor.connect(this.gain)
    }
    createBiquadFilter(){
        this.filter = this.aCtx.createBiquadFilter()
        this.aCtx.createWaveShaper()
        this.aCtx.createConvolver()
    }
}
const player = new MediaPlayer()
const visualizer = new Visualizer()
function handleDrop(e){
    e.preventDefault()
    const files = [...e.dataTransfer.items].filter(item=>item.kind=='file').map(item=>item.getAsFile())
    handleFile(files[0])
}
function makeElementMovable(element){
    element.addEventListener('mousedown', e=>{
        element.dataset.dragging = true
        element.dataset.x = e.clientX
        element.dataset.y = e.clientY
    })
    window.addEventListener('mousemove', e=>{
        if(element.dataset.dragging=='true'){
            let left = element.offsetLeft+e.clientX-element.dataset.x
            let top = element.offsetTop+e.clientY-element.dataset.y
            if(left+element.clientWidth/2>window.innerWidth/2){
                let right = window.innerWidth-left-element.clientWidth
                element.style.left = ''
                element.style.right = right+'px'
            }else{
                element.style.right = ''
                element.style.left = left+'px'
            }
            if(top+element.clientHeight/2>window.innerHeight/2){
                let bottom = window.innerHeight-top-element.clientHeight
                element.style.top = ''
                element.style.bottom = bottom+'px'
            }else{
                element.style.bottom = ''
                element.style.top = top+'px'
            }
            element.dataset.x = e.clientX
            element.dataset.y = e.clientY
        }
    })
    window.addEventListener('mouseup', e=>{
        element.dataset.dragging = false
    })
    window.addEventListener('mouseleave', e=>{
        element.dataset.dragging = false
    })
}
async function handleFile(file){
    if(file.type.includes('video')||file.type.includes('audio')){
        if(file.type.includes('video')){
            let video = document.getElementById('video')
            video.style.display = 'block'
            makeElementMovable(video)
            player.setMediaElement(video)
        }
        player.createAudioContext()
        visualizer.connect(player)
        document.getElementById('panel').style.opacity = 1
        document.getElementById('waveform').style.display = 'block'
        document.getElementById('drop-field').style.display = 'none'
        // var audioBuffer = await player.readAsArrayBuffer(file)
        // var channelData = audioBuffer.getChannelData(0)   
        // visualizer.waveformEditor(document.getElementById('canvas'), channelData)
        await player.readAsMediaElementSrc(file)
        visualizer.dynamicWaveform(document.getElementById('waveform'))
        visualizer.createController(
            document.getElementById('audio-control-container'),
            document.getElementById('audio-control-bar'),
            document.getElementById('audio-control-text')
        )
    }
}
const rewindEvent = {active:false, second:0, interval:0}
const playbackRateBtns = document.getElementById('playback-btns')
const playbackRateList = [0.25,0.5,0.75,1,1.25,1.5,1.75,2]
function setPlaybackRate(idx){
    for(let child of playbackRateBtns.children)
        child.classList.remove('active')
    idx = idx<0?0:idx>playbackRateList.length-1?playbackRateList.length-1:idx
    player.playbackRate = playbackRateList[idx]
    playbackRateBtns.children[idx].classList.add('active')
}

window.addEventListener('keydown',e=>{
    if((e.code=='AltLeft'||e.code=='AltRight')&&rewindEvent.active==false&&!e.ctrlKey){
        e.preventDefault()
        rewindEvent.active = true
        rewindEvent.second = e.code=='AltLeft'?-0.5:0.5
        window.clearInterval(rewindEvent.interval)
        rewindEvent.interval = window.setInterval(()=>{
            player.rewind(rewindEvent.second)
        },50)
    }
    if(e.code=='F3'){
        e.preventDefault()
        let idx = playbackRateList.indexOf(player.playbackRate)
        setPlaybackRate(idx-1)
    }
    if(e.code=='F4'){
        e.preventDefault()
        let idx = playbackRateList.indexOf(player.playbackRate)
        setPlaybackRate(idx+1)
    }
    if(e.code=="Escape"){
        player.togglePlay()
    }
})
window.addEventListener('keyup',e=>{
    if(e.code=='AltLeft'||e.code=='AltRight'){
        e.preventDefault()
        rewindEvent.active = false
        window.clearInterval(rewindEvent.interval)
    }
})
var newTimeIndex = -1, newTimeValue = 0
const editor = document.getElementById('text-editor')
const lineNumbers = document.getElementById('line-numbers')
const observer = new MutationObserver(updateEditor)
observer.observe(editor,{
    attributes: false,
    childList: true,
    subtree: false
})
window.addEventListener('resize',()=>{
    resizeLineNumbers()
})
function resizeLineNumbers(){
    for(let i=0;i<editor.childNodes.length;i++){
        let div = lineNumbers.children[i]
        div.style.height = editor.childNodes[i].clientHeight+'px'
    }
}
function updateEditor(){
    lineNumbers.innerHTML = ''
    for(let i=0;i<editor.childNodes.length;i++){
        let div = document.createElement('div')
        let time = editor.childNodes[i].dataset.time
        if(i==0){
            time = 0
            editor.childNodes[i].dataset.time = 0
        }else if(i==newTimeIndex){
            time = newTimeValue
            editor.childNodes[i].dataset.time = newTimeValue
        }
        div.innerText = visualizer.getFormatTime(time)
        div.style.height = editor.childNodes[i].clientHeight+'px'
        div.onclick = ()=>{
            player.currentTime = time
        }
        lineNumbers.appendChild(div)
    }
}
const shortcuts = document.getElementById('shortcuts')
makeElementMovable(shortcuts)
editor.addEventListener('keydown',e=>{
    if(e.ctrlKey&&e.code=='KeyJ'){        
        e.preventDefault()
        let span = document.createElement('a')
        span.textContent = 'bang'
        span.setAttribute('contenteditable',false)
        span.style.color = 'pink'
        span.onclick = ()=>alert('bang')
    }
    if(e.ctrlKey&&e.code=='keyB'){
        document.execCommand('bold')
    }
    if(e.ctrlKey&&e.code=='keyU'){
        document.execCommand('underline')
    }
    if(e.ctrlKey&&e.code=='keyI'){
        document.execCommand('italic')
    }
    if(e.code=='Enter'){
        let {row,col} = getCursor(editor)
        let timestamp = player.currentTime
        newTimeIndex = row+1
        newTimeValue = timestamp
    }
    if(e.code=='Backspace'){
        if(editor.childNodes.length<=1&&editor.firstChild.textContent==''){
            e.preventDefault()
        }
    }
    for(let i=1;i<6;i++){
        if(e.ctrlKey&&e.code==`Digit${i}`){
            e.preventDefault()
            let text = shortcuts.children[i].textContent
            let textNode = document.createTextNode(text)
            insertContent(textNode)
        }
    }
    
    // console.log(e)
})
function getCursor(parentNode){
    let sel = document.getSelection()
    let anchorNode = sel.anchorNode.parentNode==parentNode?
        sel.anchorNode:sel.anchorNode.parentNode
    let row = 0
    while((anchorNode=anchorNode.previousSibling)!=null){row++}
    let col = sel.focusOffset
    return {row,col}
}
function setCursor(element, focusOffset){
    let range = document.createRange();
    let sel = window.getSelection();
    range.setStart(element, focusOffset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}
function insertContent(element){
    let sel = document.getSelection()
    let anchorNode = sel.anchorNode
    if(anchorNode==editor){
        anchorNode.appendChild(element)
    }else if(anchorNode.innerHTML=='<br>'){
        anchorNode.firstChild.remove()
        anchorNode.appendChild(element)
        setCursor(element,element.textContent.length)
    }else{
        let prevText = anchorNode.textContent.slice(0,sel.focusOffset)
        anchorNode.textContent = anchorNode.textContent.slice(sel.focusOffset)
        let textNode = document.createTextNode(prevText)
        anchorNode.parentNode.insertBefore(element,anchorNode)
        anchorNode.parentNode.insertBefore(textNode,element)
    }
}
function autoSave(){
    const lastFile = localStorage.getItem('vizTranscriber')
    if(lastFile){
        editor.innerHTML = lastFile
    }
    setInterval(()=>{
        localStorage.setItem('vizTranscriber',editor.innerHTML)
    },3000)   
}
autoSave()
function importSrt(){
    function parseSrt(srt){
        let fromSec = 0
        srt.split('\n').map((line,i)=>{
            if(i%4==1){
                fromSec = line.split(' --> ')[0].replace(',','')
                fromSec = parseFloat(fromSec)
            }
            if(i%4==2){
                let div = document.createElement('div')
                div.dataset.time = fromSec
                div.textContent = line
                editor.appendChild(div)
            }
        })
    }
    let fileInput = document.getElementById('file')
    fileInput.setAttribute('accept','.srt')
    fileInput.onchange = e=>{
        const file = e.target.files[0]
        if(file){
            const reader = new FileReader()
            reader.onload = ()=>{
                parseSrt(reader.result)
            }
            reader.readAsText(file)
        }
    }
    fileInput.click()
}
function exportSrt(){
    function getFormatTime(floatStr,format='hh:mm:ss,mis'){
        let seconds = parseFloat(floatStr)
        const ss = ('0'+~~(seconds%60)).substr(-2)
        const mm = ('0'+~~(seconds/60%60)).substr(-2)
        const hh = ('0'+~~(seconds/3600%24)).substr(-2)
        const mis = (seconds%1).toFixed(3).substr(2)
        return format.replace('hh',hh).replace('mm',mm).replace('ss',ss).replace('mis',mis)
    }
    let lines = [...editor.children].map(el=>{
        return {time: getFormatTime(el.dataset.time), text:el.textContent}
    }).sort((a,b)=>a.time-b.time)
    let srt = ''
    for(let i=0;i<lines.length-1;i++){
        srt+=`${i+1}\n${lines[i].time} --> ${lines[i+1].time}\n${lines[i].text}\n\n`
    }
    let duration = getFormatTime(player.duration)
    srt+=`${lines.length}\n${lines[lines.length-1].time} --> ${duration}\n${lines[lines.length-1].text}`
    let a = document.createElement('a')
    a.href = "data:text/plain;charset=UTF-8," + encodeURIComponent(srt)
    a.download = 'vizTranscriber.srt'
    a.click()
    return srt
}
// var editor = CodeMirror.fromTextArea(document.querySelector('textarea'),{
//     lineNumbers: true,
//     lineWrapping: true,
// })
// editor.options.onKeyEvent = (cm,e)=>{
//     if(e.code=='Enter'){
//         cm.newline()
//     }
// }
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.css" integrity="sha384-zB1R0rpPzHqg7Kpt0Aljp8JPLqbXI3bhnPWROx27a9N0Ll6ZP/+DiW/UqRcLbRjq" crossorigin="anonymous">
// <script src="js/marked.js"></script>
// <script src="js/katex.js"></script>
// <script src="js/marked-katex.js"></script>
// var markdown = document.getElementById('markdown')
// editor.on('change',e=>{
//     markdown.innerHTML = marked(e.getDoc().getValue())
// })
