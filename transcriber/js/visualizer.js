export default class Visualizer{
    constructor(){
        this.player = undefined
        this.analyser = undefined
        this.subtitles = [
            // {text:'lorem ipsum',time:0},   
        ]
        this.colors = [
            '#b71c1c','#880e4f','#4a148c','#311b92','#1a237e','#0d47a1','#01579b','#006064','#004d40','#1b5e20',
            '#33691e','#827717','#f57f17','#ff6f00','#e65100','#bf360c','#3e2723','#212121','#263238',
        ]
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
        const handleEnd = (e)=>{
            if(barElement.active){
                let pct = (e.clientX-container.offsetLeft)/container.clientWidth
                media.currentTime = pct*media.duration
                barElement.active = false
            }
        }
        window.addEventListener('mouseup', handleEnd)
        window.addEventListener('mouseleave', handleEnd)
        window.addEventListener('resize',()=>{
            barElement.style.width = container.clientWidth*media.currentTime/media.duration+'px'
        })
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
        const loop = ()=>{
            window.requestAnimationFrame(loop)
            analyser.getByteTimeDomainData(data)
            let timeIndex = Math.floor(media.currentTime*peakFPS)*peakWidth
            let endIndex = timeIndex+Math.floor(canvas.width*peakWidth/peakScrollRate)
            if(!mouseEvent.active){
                this.getPeaks(Math.ceil(peakWidth*media.playbackRate), data).map((peak,i)=>{
                    if(peaks[timeIndex+i]==undefined){
                        peaks[timeIndex+i] = peak
                    }
                })
            }
            // background
            ctx.fillStyle = '#607d8b'
            ctx.fillRect(0,0,canvas.width,canvas.height)
            // waveform
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
            // timestamps
            let timestamps = [], interval = Math.max(Math.ceil(5/peakScrollRate),1)
            for(let x=-20;x<=canvas.width+20;x++){
                let i = timeIndex+Math.floor((x-canvas.width+1)*peakWidth/peakScrollRate)
                let seconds = i/peakWidth/peakFPS
                if(seconds%interval==0&&i>=0){
                    timestamps.push({seconds,x})
                }
            }
            ctx.beginPath()
            ctx.font = "12px 微軟正黑體"
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
            // subtitles
            this.subtitles.map((subtitle,i,arr)=>{
                let startX = (subtitle.time-media.currentTime)*peakFPS*peakScrollRate+canvas.width
                let endX = i==arr.length-1?
                    (media.duration-media.currentTime)*peakFPS*peakScrollRate+canvas.width:
                    (arr[i+1].time-media.currentTime)*peakFPS*peakScrollRate+canvas.width
                return {startX,endX,text:subtitle.text}
            }).map((sub,i)=>{
                if(sub.text){
                    ctx.fillStyle = this.colors[i%this.colors.length]
                    ctx.fillRect(sub.startX,0,sub.endX-sub.startX,14)
                    ctx.strokeStyle = 'white'
                    ctx.strokeRect(sub.startX,0,sub.endX-sub.startX,14)
                    ctx.fillStyle = 'white'
                    ctx.fillText(sub.text,sub.startX+4,10)
                }
            })
            
        }
        loop()
    }
}