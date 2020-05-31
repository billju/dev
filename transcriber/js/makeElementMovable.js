export default function makeElementMovable(element){
    // do not assign top,left,right,bottom in css class
    element.addEventListener('mousedown', e=>{
        element.dataset.dragging = true
        element.dataset.x = e.clientX
        element.dataset.y = e.clientY
    })
    window.addEventListener('mousemove', e=>{
        if(element.dataset.dragging=='true'){
            let left = element.offsetLeft+e.clientX-element.dataset.x
            let top = element.offsetTop+e.clientY-element.dataset.y
            if(left+element.clientWidth/2>window.innerWidth/2){
                let right = window.innerWidth-left-element.clientWidth
                element.style.left = ''
                element.style.right = right+'px'
            }else{
                element.style.right = ''
                element.style.left = left+'px'
            }
            if(top+element.clientHeight/2>window.innerHeight/2){
                let bottom = window.innerHeight-top-element.clientHeight
                element.style.top = ''
                element.style.bottom = bottom+'px'
            }else{
                element.style.bottom = ''
                element.style.top = top+'px'
            }
            element.dataset.x = e.clientX
            element.dataset.y = e.clientY
        }
    })
    window.addEventListener('mouseup', e=>{
        element.dataset.dragging = false
    })
    window.addEventListener('mouseleave', e=>{
        element.dataset.dragging = false
    })
}