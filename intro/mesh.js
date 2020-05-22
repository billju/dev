class Particle{
    constructor(bbox){
        this.x = Math.random()*(bbox[2]-bbox[0])
        this.y = Math.random()*(bbox[3]-bbox[1])
        this.vx = (Math.random()-0.5)*3
        this.vy = (Math.random()-0.5)*3
    }
    moveIn(bbox){
        this.x+= this.vx
        this.y+= this.vy
        if(this.x<bbox[0]){
            this.vx*= -1
            this.x = bbox[0]*2-this.x
        }else if(this.x>bbox[2]){
            this.vx*= -1
            this.x = bbox[2]*2-this.x
        }
        if(this.y<bbox[1]){
            this.vy*= -1
            this.y = bbox[1]*2-this.y
        }else if(this.y>bbox[3]){
            this.vy*= -1
            this.y = bbox[3]*2-this.y
        }
    }
    distanceTo(p){
        return Math.sqrt(Math.pow(this.x-p.x,2)+Math.pow(this.y-p.y,2))
    }
}
class Mesh{
    constructor(canvas){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.resize()
    }
    resize(){
        this.canvas.width  = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        this.bbox = [0,0,this.canvas.width,this.canvas.height]
    }
    draw(particles){
        const ctx = this.ctx
        ctx.fillStyle = 'rgba(100,100,100,0.2)'
        ctx.fillRect(...this.bbox)
        ctx.fillStyle = 'white'
        for(let i=0;i<particles.length;i++){
            let pi = particles[i]
            for(let j=i+1;j<particles.length;j++){
                let pj = particles[j]
                let d = pi.distanceTo(pj)
                let threshold = 100
                if(d<threshold){
                    ctx.beginPath()
                    ctx.moveTo(pi.x,pi.y)
                    ctx.lineTo(pj.x,pj.y)
                    ctx.strokeStyle = `rgba(255,255,255,${(threshold-d)/threshold})`
                    ctx.stroke()
                    ctx.closePath()
                }
            }
            ctx.beginPath()
            ctx.moveTo(pi.x,pi.y)
            ctx.arc(pi.x,pi.y,5,0,Math.PI*2,false)
            ctx.fill()
            ctx.closePath()
            pi.moveIn(bbox)
        }
    }
}
let particles = Array.from(Array(10),()=>new Particle(bbox))
let mesh = new Mesh(document.getElementById('mesh'))

function loop(){
    mesh.draw(particles)
}
loop()
window.addEventListener('resize',()=>{mesh.resize()})