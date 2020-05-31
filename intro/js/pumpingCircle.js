export default function pumpingConcentricCircle(el){
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