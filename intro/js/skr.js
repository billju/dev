export function skr(node=document.body){
    let keyPoints = []
    let animation = undefined
    const animations = {
        'fade-up':{from:{transform:'translateY(50%)',opacity:0},to:{transform:'translateY(0)',opacity:1}},
        'fade-down':{from:{transform:'translateY(-50%)',opacity:0},to:{transform:'translateY(0)',opacity:1}},
        'fade-left':{from:{transform:'translateX(50%)',opacity:0},to:{transform:'translateX(0)',opacity:1}},
        'fade-right':{from:{transform:'translateX(-50%)',opacity:0},to:{transform:'translateX(0)',opacity:1}},
    }
    let center = window.innerHeight/2
    function findKeyPoints(){
        keyPoints = []
        for(let key in node.dataset){
            let y = undefined
            switch(key){
                case 'top':
                    y = node.offsetTop;break;
                case 'bottom':
                    y = node.offsetTop+node.clientHeight;break;
                case 'once':                    
                    animation = {
                        y: node.offsetTop-window.innerHeight+(node.clientHeight>center?center:node.clientHeight),
                        fromStyle: animations[node.dataset[key]].from,
                        toStyle: animations[node.dataset[key]].to,
                        active: true,
                        transitionDuration: node.dataset['once-duration']||1000,
                        transitionDelay: node.dataset['once-delay']||0,
                        transitionTimingFunction: node.dataset['once-timing-function']||'ease'
                    }
                default: break;
            }   
            if(key.match(/top(\d+)/))
                y = node.offsetTop+parseInt(key.match(/top(\d+)/)[1])   
            let numeric = key.match(/^(\d+)$/g)
            if(numeric)
                y = parseInt(numeric[1])
            // warp up if matched
            if(y!=undefined)
                keyPoints.push({y, cssText:node.dataset[key]})
        }
    }
    findKeyPoints()
    if(animation){
        node.style.transitionDuration = animation.transitionDuration+'ms'
        node.style.transitionDelay = animation.transitionDelay
        node.style.transitionTimingFunction = animation.transitionTimingFunction
        function handleScroll(){
            if(window.scrollY>animation.y!=animation.active){
                Object.keys(animation.fromStyle).map(key=>{
                    node.style[key] = animation.active?animation.fromStyle[key]:animation.toStyle[key]
                })
                animation.active = !animation.active
            }
        }
        window.addEventListener('scroll',handleScroll)
        window.addEventListener('resize',findKeyPoints)
        handleScroll()
    }else if(keyPoints.length){
        let initStyle = node.getAttribute('style')?node.getAttribute('style'):''
        keyPoints.sort((a,b)=>a.y-b.y)
        function handleScroll(){
            let cssText = keyPoints[keyPoints.length-1].cssText
            for(let i=1;i<keyPoints.length;i++){
                if(keyPoints[i].y>window.scrollY){
                    let prev = keyPoints[i-1]
                    let next = keyPoints[i]
                    let ratio = (window.scrollY-prev.y)/(next.y-prev.y)
                    ratio = ratio<0?0:ratio>1?1:ratio
                    cssText = cssText.replace(/[-\d]+/g, '{}')
                    let prevs = prev.cssText.match(/([-\d]+)/gi)
                    let nexts = next.cssText.match(/([-\d]+)/g)
                    prevs.map((a,i)=>{
                        a = parseInt(a)
                        let b = parseInt(nexts[i])
                        let value = Math.round( a*(1-ratio)+b*ratio )
                        cssText = cssText.replace('{}',value)
                    })
                    break
                }
            }
            node.style.cssText = cssText+';'+initStyle
        }
        window.addEventListener('scroll',handleScroll)
        window.addEventListener('resize',findKeyPoints)
        handleScroll()
    }
    for(let child of node.children){
        skr(child)   
    }
}

export function smoothScroll(container,timingFunction='cubic-bezier(0.23, 1, 0.32, 1)'){
    document.addEventListener('DOMContentLoaded', () => { 
        container.style.overflow = 'hidden'
        container.style.position = 'fixed'
        container.style.height = '100vh'
        container.style.width = '100vw'
        const duration = 1000
        const translator = container.firstElementChild
        translator.style.transform = `translateY(${-window.scrollY}px)`
        translator.style.transition = `transform ${duration}ms ${timingFunction}`
        const hitbox = container.nextElementSibling
        hitbox.style.height = translator.offsetHeight+'px'
        setTimeout(()=>{
            hitbox.style.height = translator.offsetHeight+'px'
        },1000)
        window.addEventListener('scroll',()=>{
            translator.style.transform = `translateY(${-window.scrollY}px)`
        })
        window.addEventListener('resize',()=>{
            hitbox.style.height = translator.clientHeight+'px'
        })
        window.dispatchEvent(new Event('resize'))
    })
}