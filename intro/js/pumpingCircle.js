export default function pumpingConcentricCircle(el){
    let div, bpm = 128, duration = Math.round(60/bpm*1000)
    let eList = []
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
            borderRadius: '50%',
            transition: `padding ${duration}ms ease-out`
        })
        el.appendChild(div)
        if(i==1){
            eList.push({i:0,el:div,keyframes:[
                {padding:'50px'},
                {padding:'30px'}
            ]})
        }else{
            let keyframes = Array.from(Array(16).keys(),j=>{
                j = Math.floor(j/2)+1
                let mul = j>i?i:j
                return { padding: `${50+20*mul+5*i}px` }
            })
            keyframes.push({padding: `${50+5*i}px`})
            eList.push({i:0,el:div,keyframes})
        }
    }
    setInterval(()=>{
        for(let e of eList){
            for(let key in e.keyframes[e.i]){
                e.el.style[key] = e.keyframes[e.i][key]
            }
            e.i = e.i>=e.keyframes.length-1?0:e.i+1
        }
    },duration/2)
    return div
}