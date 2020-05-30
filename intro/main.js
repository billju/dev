function pumpingConcentricCircle(el){
    let div, bpm = 128, duration = Math.round(60/bpm*1000)
    for(let i=8;i>0;i--){
        div = document.createElement('div')
        Object.assign(div.style,{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            padding: `${50+5*i}px`,
            transition: '0.5s',
            background: `rgba(${240-i*30},100,100,1)`,
            borderRadius: '50%'
        })
        el.appendChild(div)
        let keyframes = []
        if(i==1){
            div.animate([
                {padding: `${50}px`},
                {padding: `${30}px`},
                {padding: `${50}px`},
            ],{
                duration: duration,
                iterations: Infinity,
                easing: 'ease'
            })
        }else{
            for(let j=0;j<8;j++){
                let mul = j>i?i:j
                keyframes.push({padding: `${50+20*mul+5*i}px`,easing:'ease-out'})
            }
            keyframes.push({padding: `${50+5*i}px`,easing:'ease-out'})
            div.animate(keyframes,{
                duration: duration*9,
                iterations: Infinity,
            })
        }
    }
    return div
}
pumpingConcentricCircle(document.getElementById('loading'))
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
hiddenText(document.getElementById('chuboy'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'top')
hiddenText(document.getElementById('web-dev'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'left')
hiddenText(document.getElementById('data-analyst'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'right')
typingText(document.getElementById('typing-text'),[
    'Hi, my name is chuboy.',
    'I am a developer and data analyst.',
    "Let's scroll down and explore what I created."
],50)
hoppingText(document.getElementById('my-skills'))
rotateText(document.getElementById('how-i-apply'),[
    '我的生活記錄',
    '構想的啟發',
    '讓繁瑣工作變得有趣',
],100)
skr()

class Pulse{
    constructor(){

    }
    lcm(len){
        this.coefs = Array.from(Array(len),()=>Math.random())
        // 公倍數
        this.mul = 1
        const gcd = (a,b)=>!b?a:gcd(b,a%b)
        const lcm = (a,b)=>(a*b)/gcd(a,b)
        for(let i=1;i<=len;i++){
            this.mul = lcm(this.mul,i)
        }
        let peak = this.coefs.reduce((acc,cur)=>acc+cur,0)
        this.coefs = this.coefs.map(x=>x/peak)
    }
    f(x){
        return this.coefs.reduce((acc,cur,i)=>acc+cur*Math.sin(x/(i+1)),0)
    }
}
class Wave{
    constructor(svg){
        this.svg = svg
        this.resize()
    }
    clear(){
        while(this.svg.lastChild)
            this.svg.removeChild(this.svg.lastChild)
    }
    resize(){
        this.W = this.svg.clientWidth
        this.H = this.svg.clientHeight
        this.svg.setAttribute('viewBox',`0 0 ${this.W} ${this.H}`)
    }
    add(shape='wave',styles={},from=1,to=0,bins=10){
        shape = ['wave','pulse','triangle'].includes(shape)?shape:'wave'
        let child = this.getPath(shape,from,to,bins)
        for(let key in styles){
            child.setAttribute(key,styles[key])
        }
        this.svg.appendChild(child)
    }
    getPath(shape,from,to,bins){
        let path = document.createElementNS('http://www.w3.org/2000/svg','path')
        let w = Math.floor(this.W/bins)
        let h = this.H*Math.abs(from-to)
        let points = Array.from(Array(bins+1).keys(),i=>{
            let x = Math.round(i*w)
            let y = Math.round(Math.random()*h)
            return {x,y}
        })
        let d, startY = this.H*from
        switch(shape){
            case 'wave': 
                d = this.getSmoothSvgPath(points,startY)
                break;
            case 'pulse':
                d = this.getPulse(points,startY)
                break;
            case 'triangle': 
                d = this.getTriangle(points,startY)
                break;
            default: break;
        }
        path.setAttribute('d',d);
        return path
    }
    getPulse(points,startY=0){
        return points.reduce((acc,cur,i,arr)=>{
            switch(i){
                case 0:
                    return acc+`L${cur.x} ${cur.y}`
                case arr.length-1:
                    return acc+`L${cur.x} ${arr[i-1].y},${cur.x} ${startY}`
                default: 
                    return acc+`L${cur.x} ${arr[i-1].y},${cur.x} ${cur.y}`
            }
        },`M0 ${startY}`)
    }
    getTriangle(points,startY=0){
        return points.reduce((acc,cur,i,arr)=>{
            switch(i){
                case 0:
                    return acc
                case arr.length-1:
                    return acc+`L${cur.x} ${cur.y},${cur.x} ${startY}`
                default: 
                    return acc+`L${cur.x} ${cur.y}`
            }
        },`M0 ${startY}`)
    }
    getSmoothSvgPath(points,startY=0,smooth=0.2){
        let cp = [] //control point
        for(let i=0;i<points.length-2;i++){
            cp.push({
                x: Math.round((points[i+2].x-points[i].x)*smooth),
                y: Math.round((points[i+2].y-points[i].y)*smooth)
            })
        }
        return points.reduce((acc,cur,i,arr)=>{
            switch(i){
                case 0:
                    return acc+`L${cur.x} ${cur.y}`
                case 1:
                    return acc+`C${arr[0].x} ${arr[0].y},${cur.x-cp[i-1].x} ${cur.y-cp[i-1].y},${cur.x} ${cur.y}`
                case arr.length-1:
                    return acc+`C${arr[i-1].x+cp[i-2].x} ${arr[i-1].y+cp[i-2].y},${cur.x} ${cur.y},${cur.x} ${cur.y}`+`L${cur.x} ${startY}`
                default: 
                    return acc+`C${arr[i-1].x+cp[i-2].x} ${arr[i-1].y+cp[i-2].y},${cur.x-cp[i-1].x} ${cur.y-cp[i-1].y},${cur.x} ${cur.y}`
            }
        },`M0 ${startY}`)
    }
}
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
const shakers = [
    {
        src:'../static/image/pomodoro.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/agMBRX',
        title: '',
        description: ''
    },
    {
        src:'../static/image/tetris.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/YoVNoW',
        title: '',
        description: ''
    },
    {
        src:'../static/image/agario.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/dzNxQO',
        title: '',
        description: ''
    },
    {
        src:'../static/image/draggabletetris.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/RXxdVd',
        title: 'Draggable Tetris',
        description: ''
    },
    {
        src:'../static/image/freecell.gif',
        href: 'https://codepen.io/HandsomeChuBoy/full/NZQwLR',
        title: '',
        description: ''
    },
    {
        src:'../static/image/greenband.gif',
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
function closeFS(){
    let fs = document.getElementById('fullscreen')
    Object.assign(fs.style,{
        transform: 'scale(1) translateY(100%)',
        opacity: 0,
    })
    // document.getElementById('fullscreen').classList.remove('active')
}
smoothScroll(document.querySelector('.smooth-scroll-container'))