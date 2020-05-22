class Chart{
    constructor(canvas,args){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.resize()
        this.data = args.data||[]
        this.padding = args.padding||[30,30,30,30]//[N,E,S,W]
        this.beginAtZero = args.beginAtZero
        this.bbox = args.bbox?args.bbox:args.data?this.getBbox(args.data,args.beginAtZero):[0,0,canvas.width,canvas.height]
        this.imgData = []
        this.xLabel = args.xLabel||'x axis'
        this.yLabel = args.yLabel||'y axis'
        this.smoothRate = args.smoothRate||0
        this.source = this.data
        this.target = this.data
        this.sourceBbox = this.bbox
        this.targetBbox = this.bbox
        this.num = 0
        this.den = 60
    }
    animateTo(target){
        if(this.num>0){
            this.data = this.interpolate(this.source,target,this.num/this.den)
            this.bbox = this.interpolate(this.sourceBbox,this.targetBbox,this.num/this.den)
            this.num ++
            if(this.num>this.den)
                this.num = 0
        }
        if(this.target!=target){
            this.target = target
            this.source = this.data
            this.targetBbox = this.getBbox(target,this.beginAtZero)
            this.sourceBbox = this.bbox
            this.num = 1
        }
    }
    interpolate(source,target,t){
        const EasingFunctions = {
            linear: t => t,                
            easeIn: t => t*t,
            easeOut: t => t*(2-t),
            easeInOut: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
        }
        const pct = EasingFunctions['easeInOut'](t)
        const isOneDimension = !Array.isArray(source[0])
        if(isOneDimension){
            return source.map((s,i)=>s+(target[i]-s)*pct)
        }else{
            const maxLen = Math.max(source.length,target.length)
            return Array.from(Array(target.length), (_,i)=>{
                let s = source[i]
                let t = target[i]
                let x, y
                if(s==undefined){
                    x=t[0]; y=t[1]
                }else if(t==undefined){
                    x=s[0]; y=s[1]
                }else{
                    x = s[0]+(t[0]-s[0])*pct
                    y = s[1]+(t[1]-s[1])*pct
                }
                return [x,y]
            })
        }
    }
    getBins(range,maxBins){
        let den = Math.pow(10,Math.ceil(Math.log10(range)))
        let bins = range/den
        let terms = [2,5]
        let termIndex = 0
        while(range>0){
            let tmp = range/den
            if(tmp>maxBins)
                break
            bins = tmp
            den /= terms[termIndex]
            termIndex = termIndex==terms.length-1?0:termIndex+1
        }
        return {
            bins: bins,
            step: range/bins
        }
    }
    getCoords(data=this.data){
        let W = this.canvas.width-this.padding[1]-this.padding[3]
        let H = this.canvas.height-this.padding[0]-this.padding[2]
        return data.map(d=>{
            let x = (d[0]-this.bbox[0])/(this.bbox[2]-this.bbox[0])*W+this.padding[3]
            let y = this.canvas.height-(d[1]-this.bbox[1])/(this.bbox[3]-this.bbox[1])*H-this.padding[2]
            return [x,y]
        })
    }
    getValueAtCoord(coord){
        let W = this.canvas.width-this.padding[1]-this.padding[3]
        let H = this.canvas.height-this.padding[0]-this.padding[2]
        let valueX = (coord[0]-this.padding[3])*(this.bbox[2]-this.bbox[0])/W+this.bbox[0]
        let valueY = (this.canvas.height-coord[1]-this.padding[2])*(this.bbox[3]-this.bbox[1])/H+this.bbox[1]
        return [valueX,valueY]
    }
    drawDots(data=this.data){
        let coords = this.getCoords(data)
        for(let c of coords){
            this.ctx.beginPath()
            this.ctx.arc(c[0],c[1],2,0,Math.PI*2,false)
            this.ctx.fill()
            this.ctx.closePath()
        }
    }
    drawLine(data=this.data, styles={}){
        let coords = this.getCoords(data)
        let checkInBound = this.checkInBound
        const rate = styles.smoothRate||0
        this.ctx.beginPath()
        this.ctx.strokeStyle = styles.stroke||'red'
        this.ctx.lineWidth = styles.strokeWith||2
        if(rate||data.length<3){
            coords.filter(c=>checkInBound(c)).map((c,i)=>{
                if(i==0)
                    this.ctx.moveTo(c[0],c[1])
                else
                    this.ctx.lineTo(c[0],c[1])
            })
        }else{
            const ctx = this.ctx
            const add = (p1,p2)=>( [p1[0]+p2[0], p1[1]+p2[1]] )
            const subtract = (p1,p2)=>( [p1[0]-p2[0], p1[1]-p2[1]] )
            const curveTo = (p1,p2,p3)=>{ctx.bezierCurveTo(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1])}
            let cp = [] //control point
            for(let i=0;i<coords.length-2;i++){
                let p = subtract(coords[i+2],coords[i])
                cp.push([Math.round(p[0]*rate), Math.round(p[1]*rate)])
            }
            coords.map((p,i,ps)=>{
                switch(i){
                    case 0:
                        ctx.moveTo(p[0],p[1]); break;
                    case 1:
                        curveTo(ps[0], subtract(p,cp[i-1]), p); break;
                    case ps.length-1:
                        curveTo(add(ps[i-1],cp[i-2]), p, p); break;
                    default:
                        curveTo(add(ps[i-1],cp[i-2]), subtract(p,cp[i-1]), p); break;
                }
            })
        }
        this.ctx.stroke()
        this.ctx.closePath()
    }
    legend(texts,styles={}){
        let height = 5
        this.ctx.fillStyle = styles.fill||'black'
        this.ctx.font = styles.font||'sans-serif 20px'
        for(let text of texts){
            let {textWidth, lineHeight} = this.measureText(text)
            let x = this.canvas.width-5-textWidth
            height+= lineHeight+5
            this.ctx.fillText(text,x,height)
        }
    }
    getImageData(){
        this.imgData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height)
        return this.imgData
    }
    putImageData(imgData=this.imgData){
        this.ctx.putImageData(imgData,0,0)
    }
    drawGrid(styles={}){
        let xStart = this.padding[3]
        let xEnd = this.canvas.width-this.padding[1]
        let yStart = this.canvas.height-this.padding[2]
        let yEnd = this.padding[0]
        let W = this.canvas.width-this.padding[1]-this.padding[3]
        let H = this.canvas.height-this.padding[0]-this.padding[2]
        // origin
        // this.ctx.setLineDash([])
        this.ctx.strokeStyle = 'white'
        this.ctx.lineWidth = 1
        this.ctx.beginPath()
        this.ctx.moveTo(xStart,yStart)
        this.ctx.lineTo(xEnd,yStart)
        this.ctx.moveTo(xStart,yStart)
        this.ctx.lineTo(xStart,yEnd)
        this.ctx.stroke()
        this.ctx.closePath()
        // style
        let dashArray = styles.strokeDashArray||[5,15]
        // this.ctx.setLineDash(dashArray)
        this.ctx.strokeStyle = styles.stroke||'grey'
        this.ctx.lineWidth = styles.strokeWidth||0.5
        this.ctx.fillStyle = styles.fill||'black'
        this.ctx.font = styles.font||'10px sans-serif'
        // x axis
        // let sizeY = 50
        // let stepY = Math.ceil((this.bbox[3]-this.bbox[1])/H*sizeY)
        this.ctx.fillStyle = 'white'
        let binsY = this.getBins(this.bbox[3]-this.bbox[1],H/20)
        let stepY = binsY.step
        let sizeY = H/binsY.bins
        let offsetY = sizeY*(1-this.bbox[1]%stepY/stepY)
        this.ctx.beginPath()
        for(let i=0;i<(H-offsetY)/sizeY;i++){                
            let y = yStart-offsetY-i*sizeY
            this.ctx.moveTo(xStart,y)
            this.ctx.lineTo(xEnd,y)
            let value = Math.round(stepY*(offsetY/sizeY+i))
            let {textWidth, lineHeight} = this.measureText(value)
            this.ctx.fillText(value,xStart-textWidth-5,y+lineHeight/2)
        }
        this.ctx.stroke()
        this.ctx.closePath()
        // y axis
        let binsX = this.getBins(this.bbox[2]-this.bbox[0],W/50)
        let stepX = binsX.step
        let sizeX = W/binsX.bins
        let offsetX = sizeX*(1-this.bbox[0]%stepX/stepX)
        this.ctx.beginPath()
        for(let i=0;i<(W-offsetX)/sizeX;i++){
            let x = xStart+offsetX+i*sizeX
            this.ctx.moveTo(x,yStart)
            this.ctx.lineTo(x,yEnd)
            let value = Math.round(stepX*(offsetX/sizeX+i))
            let {textWidth, lineHeight} = this.measureText(value)
            this.ctx.fillText(value,x-textWidth/2,yStart+lineHeight+5)
        }
        this.ctx.stroke()
        this.ctx.closePath()
    }
    checkInBound(coord){
        if(coord[0]<this.bbox[0]||coord[0]>this.bbox[2])
            return false
        if(coord[1]<this.bbox[1]||coord[1]>this.bbox[3])
            return false
        return true
    }
    measureText(text){
        let metrics = this.ctx.measureText(text)
        return {
            textWidth: metrics.width,
            lineHeight: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        }
    }
    getBbox(data=this.data,beginAtZero){
        let bbox = [
            Math.min(...data.map(d=>d[0])),
            Math.min(...data.map(d=>d[1])),
            Math.max(...data.map(d=>d[0])),
            Math.max(...data.map(d=>d[1]))
        ]
        if(beginAtZero){
            bbox[2] = bbox[2]+bbox[0]
            bbox[3] = bbox[3]+bbox[1]
            bbox[0] = 0
            bbox[1] = 0
        }
        return bbox
    }
    resize(){
        this.canvas.height = this.canvas.clientHeight
        this.canvas.width = this.canvas.clientWidth
    }
    clear(){
        this.ctx.fillStyle = '#333'
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
    }
    update(args){
        Object.assign(this,args)
    }
}