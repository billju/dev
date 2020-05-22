class FractalTree{
    constructor(canvas){
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')
        this.args = {
            radian: 20*Math.PI/180,
            skew: 5*Math.PI/180,
            trim: 20,
            point: {x:this.canvas.width/2,y:this.canvas.height},
            vector: {x:0,y:-100}
        }
        this.paths = []
        this.branch(this.args.point,this.args.vector)
        this.draw()
    }
    rotate(vector,radian){
        return {
            x: vector.x*Math.cos(radian)-vector.y*Math.sin(radian),
            y: vector.x*Math.sin(radian)+vector.y*Math.cos(radian)
        }
    }
    scale(vector,pct){
        return {x: vector.x*pct, y: vector.y*pct}
    }
    trim(vector,trim){
        let len = this.getLength(vector)
        let pct = (len-trim)/len
        pct = pct>0?pct:0
        return this.scale(vector, pct)
    }
    getLength(vector){
        return Math.sqrt(Math.pow(vector.x,2)+Math.pow(vector.y,2))
    }
    branch(point,vector){            
        let newVector = this.trim(vector,this.args.trim)
        // let newVector = this.scale(vector,0.6)
        let newPoint = {x:point.x+vector.x, y:point.y+vector.y}
        this.paths.push([point.x,point.y,newPoint.x,newPoint.y,this.getLength(vector)])
        if(this.getLength(newVector)>=1){
            this.branch(newPoint,this.rotate(newVector,this.args.radian+this.args.skew))
            this.branch(newPoint,this.rotate(newVector,-this.args.radian+this.args.skew))
        }
    }
    draw(){
        this.ctx.lineCap = 'round'
        for(let path of this.paths){
            this.ctx.beginPath()
            this.ctx.moveTo(path[0],path[1])
            this.ctx.lineTo(path[2],path[3])
            this.ctx.lineWidth = path[4]/10
            this.ctx.stroke()
            this.ctx.closePath()
        }
    }
    update(args){
        this.paths = []
        Object.assign(this.args, args)
        this.branch(this.args.point,this.args.vector)
    }
}
const canvas = document.getElementById('fractal-tree')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
var ft = new FractalTree(canvas)
var me = {x:0,y:0}
window.addEventListener('mousemove',e=>{
    me.x = e.clientX
    me.y = e.clientY
    ft.update({
        skew: (20*e.clientX/window.innerWidth-10)*Math.PI/180,
        trim: 10+20*e.clientY/window.innerHeight,
        vector: {x:0,y:-50-50*(1-e.clientY/window.innerHeight)}
    })
})
function draw(){
    let ctx = canvas.getContext('2d')
    let r1 = 20
    let r2 = Math.max(canvas.width,canvas.height)
    let pct = me.y/canvas.height
    pct = pct>1?1:pct
    let gd = ctx.createRadialGradient(me.x,me.y,r1,me.x,me.y,r2)
    gd.addColorStop(0,'yellow')
    gd.addColorStop(1-pct,'darkorange')
    gd.addColorStop(1,'black')
    ctx.fillStyle = gd
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ft.draw()
    requestAnimationFrame(draw)
}
draw()