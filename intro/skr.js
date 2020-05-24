function skr(node=document.body){
    let datas = Object.entries(node.dataset)
    let rect = node.getBoundingClientRect()
    let keyPoints = []
    function findKeyPoints(){
        keyPoints = []
        for(let data of datas){
            let key = data[0]
            let y = undefined
            if(key=='center')
                y = Math.round((rect.bottom-rect.top)/2)
            if(key=='top')
                y = node.offsetTop-window.innerHeight
            if(key=='bottom')
            y = node.offsetTop+node.clientHeight
            let numeric = key.match(/^(\d+)$/)
            if(numeric)
                y = parseInt(numeric[1])
            if(y!=undefined)
                keyPoints.push({y, cssText:node.dataset[key]})
        }
    }
    findKeyPoints()
    if(datas.length){
        keyPoints.sort((a,b)=>a.y-b.y)
        function getMatchArray(string,regexp){
            return Array.from(string.matchAll(regexp),x=>x[0])
        }
        function handleScroll(){
            let cssText = keyPoints[keyPoints.length-1].cssText
            for(let i=1;i<keyPoints.length;i++){
                if(keyPoints[i].y>window.scrollY){
                    let prev = keyPoints[i-1]
                    let next = keyPoints[i]
                    let ratio = (window.scrollY-prev.y)/(next.y-prev.y)
                    cssText = cssText.replace(/[-\d]+/g, '{}')
                    let prevs = getMatchArray(prev.cssText, /([-\d]+)/g)
                    let nexts = getMatchArray(next.cssText, /([-\d]+)/g)
                    prevs.map((a,i)=>{
                        a = parseInt(a)
                        let b = parseInt(nexts[i])
                        let value = Math.round( a*(1-ratio)+b*ratio )
                        cssText = cssText.replace('{}',value)
                    })
                    break
                }
            }
            node.style.cssText = cssText
        }
        window.addEventListener('scroll',handleScroll)
        window.addEventListener('resize',findKeyPoints)
        handleScroll()
    }
    for(let child of node.children){
        skr(child)   
    }
}

function smoothScroll(){
    const main = document.getElementById('main');
    var dy=0, sy=0
    // Bind a scroll function
    window.addEventListener('scroll', e=>{
        console.log(e)
        dy = window.pageYOffset-sy
        sy = window.pageYOffset;
    });

    function render(){
    //   dy*= 0.99
    //   dy = Math.floor(dy * 100) / 100;
    main.style.transform = `translate3d(0, ${-dy}px, 0)`;
    window.requestAnimationFrame(render);
    }
    render()

    function interpolate(a, b, n) {
        return (1 - n) * a + n * b;
    }
}
