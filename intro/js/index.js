import '../css/bootstrap.css'
import '../css/index.css'
import '../css/animate.css'
import pumpingConcentricCircle from './pumpingCircle.js'
import {Chart, Matrix, Dataset} from './chart.js'
import {Wave} from './wave.js'
import {HiddenText, TypingText, HoppingText, FlipText} from './textFx.js'
import {Node, Maze, Astar, defaultMazeInteraction} from './maze.js'
import {FractalTree, defaultFractalTreeInteraction} from './fractalTree.js'
import {skr, smoothScroll} from './skr.js'
// pumping animation
pumpingConcentricCircle(document.getElementById('pumping-circle'))

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
TypingText(document.getElementById('typing-text'),[
    'Hi, my name is chuboy.',
    'I am a developer as well as a data analyst.',
    "Let's scroll down and explore what I created."
],50)
HoppingText(document.getElementById('my-skills'))
FlipText(document.getElementById('how-i-apply'),[
    'My little story about discovery.',
    'All about how I make trivial work more intersting.',
    'Even during the military service, I created linebot.',
],32)

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
const handleMazeClick = defaultMazeInteraction(document.getElementById('maze'))
document.getElementById('maze-description').onclick = e=>{handleMazeClick()}
// fullscreen cards
const shakers = [
    {
        src:'assets/pomodoro.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/agMBRX',
        title: 'Pomodoro番茄鐘',
        description: '所謂番茄鐘工作法，每25分全神貫注後休息5分，可有效保持效率平衡，藉由小程式可以編排代辦事項、管控時間，(P.S.這個版面是RWD的)。'
    },
    {
        src:'assets/tetris.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/YoVNoW',
        title: 'Tetris',
        description: '經典復刻板，採用Vue框架渲染，具有combo計分機制，齁住方塊。'
    },
    {
        src:'assets/agario.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/dzNxQO',
        title: 'Agar.io',
        description: '經典多人遊戲單機板，以90秒限時挑戰模式計分，但要小心全世界都來吃你。'
    },
    {
        src:'assets/draggabletetris.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/RXxdVd',
        title: 'Draggable Tetris',
        description: '經典新玩法，給老弟畢專一個參考。'
    },
    {
        src:'assets/freecell.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/NZQwLR',
        title: 'Freecell新接龍',
        description: '前端精神屋作品，rewind倒轉，hint提示，auto自動遊玩(不保證通關)，雙擊自動擺牌，rule規則說明。'
    },
    {
        src:'assets/greenband.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/mQvxPV',
        title: '綠燈帶最佳化',
        description: `每當我們開車時總希望綠燈一直亮，號誌的調整其實也是門學問，這段可連續通過路口的時間稱作綠燈帶，專業解釋是一個號誌周期內能夠連續通過路口的時長。
        傳統作法是以手繪線條進行逐步迭代求解，作法頗為曠日費時，藉由簡單的計算機程式可輸入周期、速率、路口長度、時差、綠燈時長參數，讓初學者可體驗連續綠口的號誌控制，
        瞭解雙向的時間取捨要兩全其美並不容易。`
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
if(!navigator.userAgent.includes('MSIE')&&!navigator.userAgent.includes('Edge')){
    skr()
    smoothScroll(document.getElementById('smooth-scroll-container'))
}
    
window.onload = ()=>{
    const lp = document.getElementById('loading-page')
    lp.style.opacity = 0
    // window.dispatchEvent(new Event('resize'))
    HiddenText(document.getElementById('chuboy'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'top',0)
    HiddenText(document.getElementById('web-dev'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'left',1000)
    HiddenText(document.getElementById('data-analyst'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'right',2000)
    setTimeout(()=>{
        lp.style.display = 'none'
    },1000)
}