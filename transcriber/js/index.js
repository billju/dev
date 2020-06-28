import '../css/bootstrap.css'
import '../css/transcriber.css'
import 'font-awesome/css/font-awesome.css'
import Visualizer from './visualizer.js'
import MediaPlayer from './mediaplayer.js'
import makeElementMovable from './makeElementMovable.js'
import Editor from './editor.js'

// new classes
const player = new MediaPlayer()
const visualizer = new Visualizer()
const textEditor = document.getElementById('text-editor')
const lineNumbers = document.getElementById('line-numbers')
const editor = new Editor(textEditor,lineNumbers)

function handleDrop(e){
    e.preventDefault()
    const files = [...e.dataTransfer.items].filter(item=>item.kind=='file').map(item=>item.getAsFile())
    handleFile(files[0])
}
async function handleFile(file){
    if(file.type.includes('video')||file.type.includes('audio')){
        let videoContainer = document.getElementById('video-container')
        let subtitle = document.getElementById('video-subtitle')
        if(file.type.includes('video')){
            let video = document.getElementById('video')
            player.setMediaElement(video)
            makeElementMovable(videoContainer)
            videoContainer.style.display = 'block'
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
        editor.oncue = e=>{
            player.currentTime = e.time
        }
        visualizer.subtitles = editor.getSubtitles()
        editor.textEditor.addEventListener('keydown',e=>{
            visualizer.subtitles = editor.getSubtitles()
        })
        player.addEventListener('timeupdate',()=>{
            editor.currentTime = player.currentTime
            subtitle.textContent = editor.getTextAtTime(player.currentTime)
        })
    }
}
// editor.loadFromLocalStorage()
setInterval(()=>{editor.save()},3000)

const shortcuts = document.getElementById('shortcuts')
makeElementMovable(shortcuts)
textEditor.addEventListener('keydown',e=>{
    for(let i=1;i<6;i++){
        if(e.ctrlKey&&e.code==`Digit${i}`){
            e.preventDefault()
            let text = shortcuts.children[i].textContent
            let textNode = document.createTextNode(text)
            editor.insertContent(textNode)
        }
    }
})

// set global variables
window.player = player
window.editor = editor
window.visualizer = visualizer
window.setPlaybackRate = setPlaybackRate
window.handleDrop = handleDrop
window.handleFile = handleFile

// add global key events
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
