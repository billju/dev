import '../css/bootstrap.css'
import '../css/index.css'
import '../css/navbar.css'
import pumpingConcentricCircle from './pumpingCircle.js'
import {Chart, Matrix, Dataset} from './chart.js'
import {Wave} from './wave.js'
import {HiddenText, TypingText, HoppingText, FlipText} from './textFx.js'
import {Node, Maze, Astar, defaultMazeInteraction} from './maze.js'
import {FractalTree, defaultFractalTreeInteraction} from './fractalTree.js'
import {skr, smoothScroll} from './skr.js'
// pumping animation
pumpingConcentricCircle(document.getElementById('loading'))

// chart
const dataset = new Dataset().random(50)
const chart = new Chart(document.getElementById('chart'),{
    data: dataset.xy,
    beginAtZero: true
})
function draw(){
    chart.clear()    
    chart.animateTo(dataset.xy)
    chart.drawGrid()
    chart.drawDots()
    // chart.drawLine(Array.from(Array(window.innerWidth).keys(),x=>([x,wave.f(x+i)*30+100])))
    window.requestAnimationFrame(draw)
}
draw()
setInterval(()=>{dataset.random(50)},2000)

// text fx
HiddenText(document.getElementById('chuboy'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'top')
HiddenText(document.getElementById('web-dev'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'left')
HiddenText(document.getElementById('data-analyst'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'right')
TypingText(document.getElementById('typing-text'),[
    'Hi, my name is chuboy.',
    'I am a developer and data analyst.',
    "Let's scroll down and explore what I created."
],50)
HoppingText(document.getElementById('my-skills'))
FlipText(document.getElementById('how-i-apply'),[
    '我的生活記錄',
    '構想的啟發',
    '讓繁瑣工作變得有趣',
],100)

// svg wave
let waveTop = new Wave(document.getElementById('wave-top'))
waveTop.init = ()=>{
    waveTop.clear()
    waveTop.add('pulse',{
        fill: '#343a40',
    },0,0.5,10)
    waveTop.add('pulse',{
        fill: '#343a40',
        opacity: 0.7,
    },0,0.7,10)
    waveTop.add('pulse',{
        fill: '#343a40',
        opacity: 0.5,
    },0,1,10)
}
waveTop.init()
waveTop.svg.onclick = e=>{waveTop.init()}

let waveBottom = new Wave(document.getElementById('wave-bottom'))
waveBottom.init = ()=>{
    waveBottom.clear()
    waveBottom.add('wave',{
        fill: '#007bff',
    },1,0,10)
    waveBottom.add('wave',{
        fill: '#007bff',
        opacity: 0.7,
    },1,0.7,10)
    waveBottom.add('wave',{
        fill: '#007bff',
        opacity: 0.5,
    },1,0.5,10)
}
waveBottom.init()
waveBottom.svg.onclick = e=>{waveBottom.init()}

let pulseBottom = new Wave(document.getElementById('pulse'))
pulseBottom.init = ()=>{
    pulseBottom.clear()
    pulseBottom.add('triangle',{
        fill: 'yellowgreen',
    },1,0,10)
    pulseBottom.add('triangle',{
        fill: 'yellowgreen',
        opacity: 0.7,
    },1,0.7,10)
    pulseBottom.add('triangle',{
        fill: 'dodgerblue',
        opacity: 0.5,
    },1,0.5,10)
}
pulseBottom.init()
pulseBottom.svg.onclick = e=>{pulseBottom.init()}

// maze
defaultMazeInteraction(document.getElementById('maze'))

// fullscreen cards
const shakers = [
    {
        src:'assets/pomodoro.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/agMBRX',
        title: '',
        description: ''
    },
    {
        src:'assets/tetris.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/YoVNoW',
        title: '',
        description: ''
    },
    {
        src:'assets/agario.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/dzNxQO',
        title: '',
        description: ''
    },
    {
        src:'assets/draggabletetris.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/RXxdVd',
        title: 'Draggable Tetris',
        description: ''
    },
    {
        src:'assets/freecell.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/NZQwLR',
        title: '',
        description: ''
    },
    {
        src:'assets/greenband.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/mQvxPV',
        title: '',
        description: ''
    },
]
document.querySelectorAll('.shaker').forEach((el,i)=>{
    el.onclick = e=>{
        let rect = el.getBoundingClientRect()
        let fs = document.getElementById('fullscreen')
        Object.assign(fs.style,{
            display: 'block',
            transformOrigin: `${rect.left+rect.width/2}px ${rect.top+rect.height/2}px`,
            transform: 'scale(0) translateY(0%)',
            opacity: 0,
            transition: '0s',
        })
        setTimeout(()=>{
            Object.assign(fs.style,{
                transform: 'scale(1) translateY(0%)',
                opacity: 1,
                transition: '0.5s',
            })
            document.querySelector('#fullscreen a').href = shakers[i].href
            document.querySelector('#fullscreen img').src = shakers[i].src
            document.querySelector('#fullscreen h1').textContent = shakers[i].title
            document.querySelector('#fullscreen p').textContent = shakers[i].description
        },100)
    }
})
const fullscreen = document.getElementById('fullscreen')
fullscreen.onclick = e=>{
    Object.assign(fullscreen.style,{
        transform: 'scale(1) translateY(100%)',
        opacity: 0,
    })
}

// fractal tree
defaultFractalTreeInteraction(document.getElementById('fractal-tree'))

// scroll fx
skr()
smoothScroll(document.querySelector('.smooth-scroll-container'))