export class FractalTree{
    constructor(canvas){
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')
        this.resize()
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
    resize(){
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
    }
}
export function defaultFractalTreeInteraction(ftreeContainer){
    var ftree = new FractalTree(ftreeContainer)
    var me = {x:0,y:0,animationFrame:null}
    ftree.canvas.addEventListener('mousemove',e=>{
        let rect = ftree.canvas.getBoundingClientRect()
        me.x = e.clientX-rect.left
        me.y = e.clientY-rect.top
        ftree.update({
            skew: (50*me.x/ftree.canvas.clientWidth-25)*Math.PI/180,
            trim: 12+10*me.y/ftree.canvas.clientHeight,
            vector: {x:0,y:-75-25*(1-me.y/ftree.canvas.clientHeight)}
        })
    })
    ftree.canvas.addEventListener('mouseenter',e=>{
        ftDraw()
    })
    ftree.canvas.addEventListener('mouseleave',e=>{
        cancelAnimationFrame(me.animationFrame)
    })
    function ftDraw(){
        let ctx = ftree.canvas.getContext('2d')
        let r1 = 20
        let r2 = Math.max(ftree.canvas.width,ftree.canvas.height)
        let pct = me.y/ftree.canvas.height
        pct = pct>1?1:pct<0?0:pct
        let gd = ctx.createRadialGradient(me.x,me.y,r1,me.x,me.y,r2)
        gd.addColorStop(0,'yellow')
        gd.addColorStop(1-pct,'dodgerblue')
        gd.addColorStop(1,'grey')
        ctx.fillStyle = gd
        ctx.fillRect(0,0,ftree.canvas.width,ftree.canvas.height)
        ftree.draw()
        ctx.fillStyle = 'black'
        me.animationFrame = requestAnimationFrame(ftDraw)
    }
    window.addEventListener('resize',()=>{ftree.resize()})
}