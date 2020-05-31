export class Wave{
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

class EletroPulse{
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