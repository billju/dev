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
hiddenText(document.getElementById('metro'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'left')
typingText(document.getElementById('description'),100)
hoppingText(document.getElementById('my-skills'))
rotateText(document.getElementById('how-i-apply'),[
    'How I apply IT to life',
    'Make and solve',
    'Make life better',
],100)
// window.addEventListener('scroll',e=>{
//     chart.canvas.style.top = window.scrollY+'px'
// })
skr()

class Wave{
    constructor(){

    }    
    set(len){
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
    getPathD(bins,width,height){
        let w = width/bins
        let points = Array.from(Array(bins).keys(),i=>{
            let x = Math.round(i*w)
            let y = Math.round(Math.random()*height)
            return {x,y}
        })
        return this.getSmoothSvgPath(points,0.2)
    }
    getPath(bins,width,height){
        let path = document.createElementNS('http://www.w3.org/2000/svg','path')
        path.setAttribute('d',this.getPathD(bins,width,height))
        return path
    }
    getSmoothSvgPath(points,smooth){
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
                    return acc+`C${arr[i-1].x+cp[i-2].x} ${arr[i-1].y+cp[i-2].y},${cur.x} ${cur.y},${cur.x} ${cur.y}`+`L${cur.x} 0`
                default: 
                    return acc+`C${arr[i-1].x+cp[i-2].x} ${arr[i-1].y+cp[i-2].y},${cur.x-cp[i-1].x} ${cur.y-cp[i-1].y},${cur.x} ${cur.y}`
            }
        },'M0 0')
    }
}
let wave = new Wave()

document.querySelectorAll('.shaker').forEach(el=>{
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
                transition: '1s',
            })
            document.querySelector('#fullscreen img').src = '../static/image/greenband.gif'
            document.querySelector('#fullscreen h1').textContent = 'bang'
            document.querySelector('#fullscreen p').textContent
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