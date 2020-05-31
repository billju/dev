export default class MediaPlayer{
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
    addEventListener(eventType,callback){
        this.media.addEventListener(eventType,e=>{
            callback(e)
        })
    }
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