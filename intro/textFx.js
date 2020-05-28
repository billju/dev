function hiddenText(element,textStyle={},maskStyle={},dir='top'){
    let axis = dir=='top'||dir=='bottom'?'Y':'X'
    let sign = dir=='top'||dir=='left'?1:-1
    let textDiv = document.createElement('div')
    let maskDiv = document.createElement('div')
    textDiv.textContent = element.textContent
    element.textContent = ''
    element.appendChild(textDiv)
    element.appendChild(maskDiv)
    Object.assign(element.style,{
        position: 'relative',
        textAlign: 'center',
        overflow: 'hidden'
    })
    Object.assign(textDiv.style,{
        ...textStyle,
        width: '100%',
        height: '100%',
        transform: `translate${axis}(${sign*100}%)`,
        transition: `transform ${1}s`
    })
    Object.assign(maskDiv.style,{
        ...maskStyle,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '100%',
        transform: `translate${axis}(${sign*100}%)`,
        transition: `transform ${0.5}s`
    })
    setTimeout(()=>{
        textDiv.style.transform = `translate${axis}(0%)`
    },1500)
    setTimeout(()=>{
        maskDiv.style.transform = `translate${axis}(${sign*-100}%)`
    },1000)
    setTimeout(()=>{
        maskDiv.style.transform = `translate${axis}(0%)`
    },100)
}
function hoppingText(element){
    let chars = element.textContent
    element.textContent = ''
    Object.assign(element.style,{
        position: 'relative',
        overflow: 'hidden',
    })
    for(let i=0;i<chars.length;i++){
        let div = document.createElement('div')
        div.textContent = chars[i]
        element.appendChild(div)
        Object.assign(div.style,{
            display: 'inline-block',
            transform: 'translateY(100%)',
            opacity: 1
        })
        div.animate([
            {transform: 'translateY(100%)',opacity: 1,easing:'ease-out'},
            {transform: 'translateY(0%)',opacity: 1,offset:0.1},
            {transform: 'translateY(0%)',opacity: 0,offset:0.9,easing:'ease-out'},
            {transform: 'translateY(100%)',opacity: 0},
        ],{
            duration: 6000,
            delay: i*100,
            iterations: Infinity,
        })
    }
}
function typingText(element,texts=[''],delay=200){
    let cursor = document.createElement('span')
    let span = document.createElement('span')
    element.textContent = ''
    Object.assign(cursor.style,{
        margin: '2px',
        border: '1px solid black'
    })
    cursor.animate([
        {opacity: 0},
        {opacity: 1},
        {opacity: 0},
    ],{
        duration: 1000,
        iterations: Infinity,
        easing: 'steps(2,end)',
    })
    element.appendChild(span)
    element.appendChild(cursor)
    let curIdx = 0, txtIdx = 0
    function randomDelay(){
        let DELAY = Math.random()*delay+delay
        if(curIdx<=texts[txtIdx].length){
            span.textContent = texts[txtIdx].slice(0,curIdx)
            curIdx++
        }else{
            curIdx = 0
            txtIdx = txtIdx<texts.length-1?txtIdx+1:0
            DELAY = 1500
        }
        setTimeout(()=>{   
            randomDelay()
        },DELAY)
    }
    randomDelay()
}
function rotateText(element,texts,height=30){
    if(texts.length<3){texts=[...texts,...texts,...texts]}
    Object.assign(element.style,{
        position: 'relative',
        overflow: 'hidden',
        height: height+'px'
    })
    function createSpan(text){
        let span = document.createElement('span')
        span.textContent = text
        Object.assign(span.style,{
            position: 'absolute',
            top: 0,
            fontSize: height+'px',
            lineHeight: height+'px',
            transition: '1s',
            transform: `translateY(${height/2}px) rotate3d(1,0,0,-90deg)`,
            opacity: 0
        })
        element.appendChild(span)
        return span
    }
    let idx = 2, top = undefined
    let mid = createSpan(texts[0]), bottom = createSpan(texts[1])
    mid.style.transform = `translateY(0px) rotate3d(1,0,0,0deg)`
    mid.style.opacity = 1
    setInterval(()=>{
        if(top){top.remove()}
        top = mid
        top.style.transform = `translateY(${-height/2}px) rotate3d(1,0,0,90deg)`
        top.style.opacity = 0
        mid = bottom
        mid.style.transform = `translateY(0) rotate3d(1,0,0,0deg)`
        mid.style.opacity = 1
        bottom = createSpan(texts[idx])
        idx = idx==texts.length-1?0:idx+1
    },2000)
}
class CountingText{
    constructor(el){
        this.el = el
        this.denominator = 30
        this.paused = true
    }
    countTo(num,step=30,interval=40){
        if(this.paused){
            this.denominator=step
            this.paused = false
        }
        const EasingFunctions = {
            linear: t => t,
            easeIn: t => t*t,
            easeOut: t => t*(2-t),
            easeInOut: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
        }
        let t = (this.denominator-step)/this.denominator
        this.el.innerText = parseInt(num*EasingFunctions['easeOut'](t))
        if(step==0){
            this.paused=true
        }else{    
            setTimeout(()=>{this.countTo(num,step-1,interval)},interval)
        }
    }
}
function svgAnimation(container,style={}){
    xhr = new XMLHttpRequest();
    xhr.open("GET","logo.svg",false);
    xhr.overrideMimeType("image/svg+xml");
    xhr.onload = function(e) {
        let svg = xhr.responseXML.documentElement
        Object.assign(svg.style,{
            strokeDasharray: 500,
            strokeDashoffset: 0,
            ...style
        })
        container.appendChild(svg);
        svg.animate([
            {strokeDashoffset: 500},
            {strokeDashoffset: 0}
        ],{
            duration: 5000
        })
    }
    xhr.send();
}