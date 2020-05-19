function radialDistFilter(points, epsilon){
    var epsilon_squ = epsilon*epsilon
    return points.filter((point,i)=>{
        if(i==0) return true
        var dx = point[i][0]-point[i-1][0]
        var dy = point[i][1]-point[i-1][1]
        return dx*dx+dy*dy > epsilon_squ
    })
}
function PerpendicularDistance(p,p1,p2){
    var x = p1[0],
        y = p1[1],
        dx = p2[0]-p1[0],
        dy = p2[1]-p1[1]
    if(dx!==0||dy!==0){
        var t = ((p[0]-x)*dx+(p[1]-y)*dy)/(dx*dx+dy*dy) //scale of projection
        if(t>1){
            x = p2[0]
            y = p2[1]
        }else if(t>0){
            x+= dx*t
            y+= dy*t
        }
    }
    dx = p[0]-x
    dy = p[1]-y
    return Math.sqrt(dx*dx + dy*dy)
}
function DouglasPeucker(points, epsilon){
    if(epsilon==0) return points
    var dmax=0, index=-1, firstPoint = points[0], lastPoint = points[points.length-1]
    for(var i=1;i<points.length;i++){
        var d = PerpendicularDistance(points[i], firstPoint, lastPoint)
        if(d>dmax){
            dmax = d
            index = i
        }
    }
    if(dmax>=epsilon){
        return [
            ...DouglasPeucker(points.slice(0,index+1), epsilon).slice(0,-1),
            ...DouglasPeucker(points.slice(index), epsilon)
        ]
    }else{
        return [points[0], points[points.length-1]]
    }
}

function getLength(coords){
    return coords.reduce((acc,cur,i,arr)=>{
        if(i==0) return acc
        return acc+haversine(arr[i-1],arr[i])
    },0)
    function haversine(c1,c2){
        var r = 6371008.8,
            lat1 = c1[1],
            lat2 = c2[1],
            dlat = (lat2-lat1)*Math.PI/180,
            dlon = (c2[0]-c1[0])*Math.PI/180,
            a = Math.sin(dlat)*Math.sin(dlat)/4 + 
                Math.cos(lat1)*Math.cos(lat2)*
                Math.sin(dlon)*Math.sin(dlon)/4
        return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
    }
}
function getArea(coords){
    var r = 6371008.8
    return coords.reduce((acc,cur,i)=>{
        if(i==0) return acc
        let dx = cur[0]-coords[i-1][0]
        let y2 = cur[1]
        let y1 = coords[i-1][1]
        return acc+Math.sin(dx*Math.PI/180)*(2+Math.sin(y1*Math.PI/180))+Math.sin(y2*Math.PI/180)
    },0)
}
function circleDefinedBy3Points(x1,y1,x2,y2,x3,y3){
    let A = x1*(y2-y3)-y1*(x2-x3)+x2*y3-x3*y2
    let B = (x1*x1+y1*y1)*(y3-y2)+(x2*x2+y2*y2)*(y1-y3)+(x3*x3+y3*y3)*(y2-y1)
    let C = (x1*x1+y1*y1)*(x2-x3)+(x2*x2+y2*y2)*(x3-x1)+(x3*x3+y3*y3)*(x1-x2)
    let D = (x1*x1+y1*y1)*(x3*y2-x2*y3)+(x2*x2+y2*y2)*(x1*y3-x3*y1)+(x3*x3+y3*y3)*(x2*y1-x1*y2)
    let x = -B/(2*A)
    let y = -C/(2*A)
    let r = Math.sqrt((B*B+C*C-4*A*D)/(4*A*A))
    return {x,y,r}
}
function drawSmoothPath(ctx, points, rate=0.2){
    const add = (p1,p2)=>( [p1[0]+p2[0], p1[1]+p2[1]] )
    const subtract = (p1,p2)=>( [p1[0]-p2[0], p1[1]-p2[1]] )
    const curveTo = (p1,p2,p3)=>{ctx.bezierCurveTo(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1])}
    let cp = [] //control point
    for(let i=0;i<points.length-2;i++){
        let p = subtract(points[i+2],points[i])
        cp.push([Math.round(p[0]*rate), Math.round(p[1]*rate)])
    }
    points.map((p,i,ps)=>{
        switch(i){
            case 0:
                ctx.lineTo(p[0],p[1]); break;
            case 1:
                curveTo(ps[0], subtract(p,cp[i-1]), p); break;
            case ps.length-1:
                curveTo(add(ps[i-1],cp[i-2]), p, p); break;
            default:
                curveTo(add(ps[i-1],cp[i-2]), subtract(p,cp[i-1]), p); break;
        }
    })
}
var EasingFunctions = {
    // no easing, no acceleration
    linear: t => t,
    // accelerating from zero velocity
    easeInQuad: t => t*t,
    // decelerating to zero velocity
    easeOutQuad: t => t*(2-t),
    // acceleration until halfway, then deceleration
    easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
    // accelerating from zero velocity 
    easeInCubic: t => t*t*t,
    // decelerating to zero velocity 
    easeOutCubic: t => (--t)*t*t+1,
    // acceleration until halfway, then deceleration 
    easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
    // accelerating from zero velocity 
    easeInQuart: t => t*t*t*t,
    // decelerating to zero velocity 
    easeOutQuart: t => 1-(--t)*t*t*t,
    // acceleration until halfway, then deceleration
    easeInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
    // accelerating from zero velocity
    easeInQuint: t => t*t*t*t*t,
    // decelerating to zero velocity
    easeOutQuint: t => 1+(--t)*t*t*t*t,
    // acceleration until halfway, then deceleration 
    easeInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
}
class GisMap{
    constructor(element){
        this.canvas = element
        this.tilePixel = {w:256,h:256}
        // world center must to be x:0, y:0
        // bbox [westLon, minLat, eastLon, maxLat]
        this.world = {
            bbox: [-6378137*Math.PI,-6378137*Math.PI,6378137*Math.PI,6378137*Math.PI],
            w: 2*6378137*Math.PI,
            h: 2*6378137*Math.PI,
        }
        var rect = canvas.getBoundingClientRect()
        this.view = {
            bbox: [],
            center: {x: 13437548.485305637, y: 2772337.9239074644},
            latlng: {lat: 24.15525395533066, lng: 120.7115518544718},
            w: rect.width,
            h: rect.height,
            zoom: 9,
            minZoom: 0,
            maxZoom: 20,
        }   
        this.updateView()
        this.vector = []
        this.raster = []
        this.overlay = []
        this.tiles = {}
        this.canvas.height = rect.height
        this.canvas.width = rect.width
        this.ctx = canvas.getContext('2d')
        this.zoomEvent = {x:0,y:0,before:this.view.zoom,after:this.view.zoom,t:0,frames:25,delta:0.5,zStep:1}
        this.moveEvent = {x:0,y:0,active:false,moved:false}
        this.drawEvent = {path:[],active:false}
        this.momentum = {x:0,y:0,t:0}
        this.animationFrame = null
        this.selectedFeature = null
        this.render = ()=>{
            this.animationFrame = window.requestAnimationFrame(this.render)
            // update parameters
            if(this.momentum.t>0){
                var fricion = 0.1
                var x = this.momentum.x*(1-fricion)
                var y = this.momentum.y*(1-fricion)
                var t = this.momentum.t-1
                this.momentum = {x,y,t}
                if(this.moveEvent.active==false){
                    this.setView({x,y})
                }
            }
            if(this.zoomEvent.t>0){
                var t = (this.zoomEvent.frames-this.zoomEvent.t)/this.zoomEvent.frames
                // ease function = { easeOutQuad: t => t*(2-t) }
                var dt = (2-2*t)/this.zoomEvent.frames
                this.zoomEvent.t--
                var dz = (this.zoomEvent.after-this.zoomEvent.before)*dt
                var coord = this.client2coord([this.zoomEvent.x, this.zoomEvent.y])
                var scale = Math.pow(2,dz)
                var view = this.view
                view.center.x+= (coord[0]-view.center.x)*(1-1/scale)
                view.center.y+= (coord[1]-view.center.y)*(1-1/scale)
                view.zoom+= dz
                if(this.zoomEvent.t==0){this.zoomEvent.before = this.zoomEvent.after}
                this.updateView()
            }
            // draw tiles
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
            // this.renderGrids()
            for(let raster of this.raster.slice().reverse()){
                if(!raster.active) continue
                this.ctx.globalAlpha = raster.opacity
                this.renderTiles(raster.url)
            }
            for(let feature of this.vector){
                this.renderVector(feature)
            }
            this.renderDraw()
            this.canvas.dispatchEvent(new CustomEvent('render',{}))
        }
        this.render()
    }
    renderDraw(){
        // draw polygon
        let path = this.drawEvent.path.map(coord=>this.coord2client(coord))
        this.ctx.beginPath()
        this.ctx.lineCap = 'round'
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = 'dodgerblue'
        path.map((client,i)=>{
            if(i>0){
                this.ctx.lineTo(client[0],client[1])
            }else{
                this.ctx.moveTo(client[0],client[1])
            }
        })
        this.ctx.stroke()
        this.ctx.closePath()
        // draw dots
        path.map((client,i)=>{    
            this.ctx.beginPath()
            this.ctx.lineWidth = 2
            this.ctx.strokeStyle = 'white'
            this.ctx.fillStyle = 'dodgerblue'
            this.ctx.arc(client[0],client[1],10,0,2*Math.PI,false)
            this.ctx.stroke()
            this.ctx.fill()
            this.ctx.closePath()
        })
    }
    handleMousedown(e){
        this.moveEvent.x = e.clientX
        this.moveEvent.y = e.clientY
        this.moveEvent.active = true
        e.target.style.cursor = 'grabbing'
    }
    handleMousemove(e){
        if(this.moveEvent.active){
            var x = - e.clientX + this.moveEvent.x
            var y = e.clientY - this.moveEvent.y
            if(!this.zoomEvent.moved){
                var tolerance = Math.sqrt(x*x+y*y)
                if(tolerance>2){
                    this.setView({x,y})
                    this.moveEvent.moved = true
                }
            }
            this.moveEvent.x = e.clientX
            this.moveEvent.y = e.clientY
            this.momentum = {x,y,t:90}
        }
        var lineStringLength = this.drawEvent.path.reduce((acc,cur,i,arr)=>{
            if(i==0) return acc
            var dx = arr[i].x-arr[i-1].x
            var dy = arr[i].y-arr[i-1].y
            return acc+Math.sqrt(dx*dx+dy*dy)
        },0)
    }
    handleMouseup(e){
        if(this.drawEvent.active&&!this.moveEvent.moved){
            this.drawEvent.path.push(this.client2coord([e.clientX,e.clientY])) 
            // let path = this.drawEvent.path
            // if(path.length>2){
            //     let i = path.length-1
            //     let c = circleDefinedBy3Points(path[i-2].x,path[i-2].y,path[i-1].x,path[i-1].y,path[i].x,path[i].y)
            //     console.log(c)
            // }
        }
        this.moveEvent.active = false
        this.moveEvent.moved = false
        e.target.style.cursor = 'grab'
    }
    handleDblclick(e){
        this.drawEvent.path.pop()
        this.drawEvent.active = false
    }
    handleMouseleave(e){
        this.moveEvent.active = false
        e.target.style.cursor = 'grab'
    }
    handleWheel(e){
        e.preventDefault()
        var view = this.view
        var delta = this.zoomEvent.delta
        var frames = this.zoomEvent.frames
        var newZoom = this.zoomEvent.after - Math.sign(e.deltaY)*delta
        newZoom = this.minmax(newZoom,view.minZoom,view.maxZoom)
        this.zoomEvent = {
            x: e.clientX,
            y: e.clientY,
            before: view.zoom,
            after: newZoom,
            t: frames,
            frames, 
            delta,
            zStep: newZoom<view.zoom?-1:1,
        }
    }
    handleResize(){
        var rect = this.canvas.getBoundingClientRect()
        this.canvas.height = rect.height
        this.canvas.width = rect.width
        this.view.w = rect.width
        this.view.h = rect.height
        this.updateView()
    }
    updateView(){
        var world = this.world,
            view = this.view,
            squ = Math.pow(2,view.zoom),
            tp = this.tilePixel,
            W = world.w*view.w/(tp.w*squ),
            H = world.h*view.h/(tp.h*squ)
        this.view.bbox[0] = view.center.x - W/2
        this.view.bbox[1] = view.center.y - H/2
        this.view.bbox[2] = view.center.x + W/2
        this.view.bbox[3] = view.center.y + H/2
    }
    setView(offset){
        var view = this.view,
            tp = this.tilePixel,
            squ = Math.pow(2,view.zoom)
        view.center.x += offset.x*this.world.w/tp.w/squ
        view.center.y += offset.y*this.world.h/tp.h/squ
        this.updateView()
    }
    client2coord(client){
        var view = this.view,
            W = view.bbox[2]-view.bbox[0],
            H = view.bbox[1]-view.bbox[3]
        return [
            view.bbox[0]+client[0]*W/view.w,
            view.bbox[3]+client[1]*H/view.h
        ]
    }
    coord2client(coord){
        var view = this.view,
            W = view.bbox[2]-view.bbox[0],
            H = view.bbox[1]-view.bbox[3]
        return [
            (coord[0]-view.bbox[0])/W*view.w,
            (coord[1]-view.bbox[3])/H*view.h
        ]
    }
    minmax(input,min,max){
        return input<min?min:input>max?max:input
    }
    renderGrids(dz){
        const tp = this.tilePixel, world = this.world, view = this.view
        const origin = {
            x: (world.bbox[0]-view.bbox[0])/world.w*tp.w*Math.pow(2,view.zoom),
            y: -(world.bbox[3]-view.bbox[3])/world.h*tp.h*Math.pow(2,view.zoom)
        }
        this.getXYZ(view.zoom+dz).tiles.map(tile=>{
            let scale = Math.pow(2,view.zoom-tile.z)
            let W = tp.w*scale
            let H = tp.h*scale
            let X = origin.x+tile.x*W
            let Y = origin.y+tile.y*H
            this.ctx.lineWidth = 1
            this.ctx.strokeRect(X,Y,W,H)
            this.ctx.stroke()
        })
    }
    renderTiles(url='https://wmts.nlsc.gov.tw/wmts/EMAP5/default/EPSG:3857/{z}/{y}/{x}'){
        const tp = this.tilePixel, world = this.world, view = this.view
        const origin = {
            x: (world.bbox[0]-view.bbox[0])/world.w*tp.w*Math.pow(2,view.zoom),
            y: -(world.bbox[3]-view.bbox[3])/world.h*tp.h*Math.pow(2,view.zoom)
        }
        var z = Math.floor(view.zoom)
        var {tiles, minX, minY, maxX, maxY} = this.getXYZ(z)
        // load images
        if(!(url in this.tiles)){
            this.tiles[url] = {}
        }
        tiles.map(tile=>{
            let xyz = [tile.x,tile.y,tile.z]
            let src = url.replace('{x}',tile.x).replace('{y}',tile.y).replace('{z}',tile.z)
            if(!(xyz in this.tiles[url])){
                var img = new Image()
                img.src = src
                this.tiles[url][xyz] = img
            }
        })
        // find loaded images
        var tilesNotLoaded = tiles
        var tilesLoaded = []
        var zStep = this.zoomEvent.zStep
        while(tilesNotLoaded.length&&z>=view.minZoom&&z<=view.maxZoom){
            let unique = {}
            for(let tile of tilesNotLoaded){
                let xyz = [tile.x,tile.y,tile.z]
                let loaded = this.tiles[url][xyz]?this.tiles[url][xyz].complete:false
                if(loaded){
                    tilesLoaded.unshift(tile)
                }else if(zStep==1){
                    tile.x = Math.floor(tile.x/2)
                    tile.y = Math.floor(tile.y/2)
                    tile.z-= 1
                    unique[[tile.x,tile.y,tile.z]] = tile
                }else if(zStep==-1){
                    for(let i=0;i<4;i++){
                        let newTile = Object.assign({},tile)
                        newTile.x = newTile.x*2+i%2
                        newTile.y = newTile.y*2+Math.floor(i/2)
                        newTile.z+= 1 
                        unique[[newTile.x,newTile.y,newTile.z]] = newTile
                    }
                }
            }
            tilesNotLoaded = Object.values(unique)
            z-= zStep
            if(z-view.zoom>=2) break //prevent from exponential explotion
        }
        tilesLoaded.map(tile=>{
            var scale = Math.pow(2,view.zoom-tile.z)
            let W = tp.w*scale
            let H = tp.h*scale
            let X = origin.x+tile.x*W
            let Y = origin.y+tile.y*H
            let xyz = [tile.x,tile.y,tile.z]
            let img = this.tiles[url][xyz]
            try{
                this.ctx.drawImage(img,X,Y,W,H)
            }catch{}
        })
        this.ctx.fillStyle = 'black'
        // tilesLoaded.map((t,i)=>{
        //     let text = t.x+'-'+t.y+'-'+t.z
        //     this.ctx.fillText(text,10,10*i)
        // })
    }
    getXYZ(z){
        z = Math.floor(z||this.view.zoom)
        var view = this.view,
            squ = Math.pow(2,z),
            world = this.world,
            minX = Math.floor( (view.bbox[0]-world.bbox[0])*squ/world.w ),
            minY = Math.floor( -(view.bbox[3]-world.bbox[3])*squ/world.h ),
            maxX = Math.ceil( (view.bbox[2]-world.bbox[0])*squ/world.w ),
            maxY = Math.ceil( -(view.bbox[1]-world.bbox[3])*squ/world.h ),
            tiles = []
        minX = this.minmax(minX,0,squ-1)
        maxX = this.minmax(maxX,0,squ-1)
        minY = this.minmax(minY,0,squ-1)
        maxY = this.minmax(maxY,0,squ-1)
        for(var x=minX;x<=maxX;x++){
            for(var y=minY;y<=maxY;y++){
                tiles.push({x,y,z})
            }
        }
        return {tiles, minX, minY, maxX, maxY}
    }
    toCoord(lnglat) {
        var d = Math.PI / 180,
            max = 85.0511287798,
            lat = Math.max(Math.min(max, lnglat[1]), -max),
            sin = Math.sin(lat * d);
        return [
            6378137 * lnglat[0] * d,
            6378137 * Math.log((1 + sin) / (1 - sin)) / 2 
        ]
    }
    toLnglat(point) {
        var d = 180 / Math.PI
        return [
            point[0] * d / 6378137,
            (2 * Math.atan(Math.exp(point[1] / 6378137)) - (Math.PI / 2)) * d
        ]
    }
    isInPolygon(p, polygon) {
        let isInside = false
        for(let i=0, j=polygon.length-1; i<polygon.length; j=i++) {
            let p1 = polygon[j], p2 = polygon[i]
            let c1 = (p2[1] > p[1]) != (p1[1] > p[1])
            let c2 = (p[0] < (p1[0] - p2[0]) * (p[1] - p2[1]) / (p1[1] - p2[1]) + p2[0])
            if(c1&&c2){ isInside = !isInside }
        }
        return isInside;
    }
    geojson(geojson){
        geojson.features.map(feature=>{
            let geom = feature.geometry
            geom.bbox = [Infinity,Infinity,-Infinity,-Infinity]
            const project = lnglat=>{
                let [x,y] = this.toCoord(lnglat)
                geom.bbox[0] = Math.min(geom.bbox[0],x)
                geom.bbox[1] = Math.min(geom.bbox[1],y)
                geom.bbox[2] = Math.max(geom.bbox[2],x)
                geom.bbox[3] = Math.max(geom.bbox[3],y)
                lnglat[0] = x
                lnglat[1] = y
            }
            switch(geom.type.toUpperCase()){
                case 'POINT':
                    project(geom.coordinates);break;
                case 'MULTIPOINT':
                    geom.coordinates.map(lnglat=>project(lnglat));break;
                case 'LINESTRING':
                    geom.coordinates.map(lnglat=>project(lnglat));break;
                case 'MULTILINESTRING':
                    geom.coordinates.map(arr=>arr.map(lnglat=>project(lnglat)));break;
                case 'POLYGON':
                    geom.coordinates.map(arr=>arr.map(lnglat=>project(lnglat)));break;
                case 'MULTIPOLYGON':
                    geom.coordinates.map(arr2d=>arr2d.map(arr=>arr.map(lnglat=>project(lnglat))));break;
            }
            this.vector.push(feature)
        })   
    }
    detectClient(e){
        const Euclidean = (p1,p2)=>Math.sqrt(Math.pow(p1[0]-p2[0],2)+Math.pow(p1[1]-p2[1],2))
        const isOverlaped = (bbox1,bbox2)=>bbox1[0]<=bbox2[2]&&bbox1[2]>=bbox2[0]&&bbox1[1]<=bbox2[3]&&bbox1[3]>=bbox2[1]
        const isInBbox = (p,bbox)=>p[0]>=bbox[0]&&p[0]<=bbox[2]&&p[1]>=bbox[1]&&p[1]<=bbox[3]
        let point = this.client2coord([e.clientX,e.clientY])
        let features = this.vector.filter(feature=>isOverlaped(feature.geometry.bbox,this.view.bbox)).filter(feature=>feature.geometry.type.includes('Point')?true:isInBbox(point,feature.geometry.bbox))
        for(let feature of features){
            let geom = feature.geometry
            let isInGeometry = false
            switch(geom.type.toUpperCase()){
                case 'POINT':
                    isInGeometry = Euclidean([e.clientX,e.clientY],this.coord2client(geom.coordinates)) < (feature.properties.radius||5);break;
                case 'MULTIPOINT':
                    isInGeometry = geom.coordinates.some(coord=>Euclidean([e.clientX,e.clientY],this.coord2client(coord)) < 5);break;
                case 'LINESTRING':
                    isInGeometry = geom.coordinates.map(c=>this.coord2client(c)).some((coord,i,coords)=>i==0?false:PerpendicularDistance([e.clientX,e.clientY],coords[i-1],coord)<5);break;
                case 'MULTILINESTRING':
                    isInGeometry = geom.coordinates.some(arr=>arr.map(c=>this.coord2client(c)).some((coord,i,coords)=>i==0?false:PerpendicularDistance([e.clientX,e.clientY],coords[i-1],coord)<5));break;
                case 'POLYGON':
                    isInGeometry = geom.coordinates.every((arr,i)=>i==0?this.isInPolygon(point,arr):!this.isInPolygon(point,arr));break;
                case 'MULTIPOLYGON':
                    isInGeometry = geom.coordinates.some(arr2d=>arr2d.every((arr,i)=>i==0?this.isInPolygon(point,arr):!this.isInPolygon(point,arr)));break;
            }
            if(isInGeometry){
                this.selectedFeature = feature
                return feature
            }
        }
        return false
    }
    renderVector(feature,style={}){
        let tolerance = Math.pow(2,18-this.view.zoom)
        tolerance = tolerance<1?0:tolerance
        if(feature==this.selectedFeature){
            Object.assign(style,{
                stroke: 'red',
                fill: 'rgba(255,0,0,0.3)'
            })
        }
        let fillMap = {
            '公': 'rgba(254,255,191,1)',
            '私': 'rgba(188,233,252,1)',
            '公私共有': 'rgba(202,214,159,1)',
            '公法人': 'rgba(215,177,158,1)',
            '糖': 'rgba(239,177,208,1)'
        }
        let owner = feature.properties['權屬']
        let fill = fillMap[owner]?fillMap[owner]:'rgba(204,204,204,1)'
        let radius = feature.properties.radius||5
        switch(feature.geometry.type.toUpperCase()){
            case 'POINT':
                let c = this.coord2client(feature.geometry.coordinates)
                this.ctx.beginPath()
                this.ctx.moveTo(c[0]+radius,c[1])
                this.ctx.arc(c[0],c[1],radius,0,Math.PI*2,false)
                this.ctx.strokeStyle = style.stroke||'darkorange'
                this.ctx.fillStyle = style.fill||'orange'
                this.ctx.stroke()
                this.ctx.fill()
                this.ctx.closePath()
                break
            case 'MULTIPOINT':
                this.ctx.beginPath()
                feature.geometry.coordinates.map((coord,i)=>{
                    let c = this.coord2client(coord)
                    this.ctx.moveTo(c[0],c[1])
                    this.ctx.arc(c[0],c[1],radius,0,Math.PI*2,false)
                })
                this.ctx.strokeStyle = style.stroke
                this.ctx.stroke()
                this.ctx.closePath()
                break
            case 'LINESTRING':
                this.ctx.beginPath()
                feature.geometry.coordinates.map((coord,i)=>{
                    let c = this.coord2client(coord)
                    if(i==0)
                        this.ctx.moveTo(c[0],c[1])
                    else
                        this.ctx.lineTo(c[0],c[1])
                })
                this.ctx.strokeStyle = style.stroke
                this.ctx.stroke()
                this.ctx.closePath()
                break
            case 'MULTILINESTRING':
                for(let coords of feature.geometry.coordinates){
                    this.ctx.beginPath()
                    DouglasPeucker(coords,tolerance).map((coord,i)=>{
                        let c = this.coord2client(coord)
                        if(i==0)
                            this.ctx.moveTo(c[0],c[1])
                        else
                            this.ctx.lineTo(c[0],c[1])
                    })
                    this.ctx.globalAlpha = 1
                    this.ctx.strokeStyle = style.stroke||'orange'
                    this.ctx.stroke()
                    this.ctx.closePath()
                }
                break
            case 'POLYGON':
                this.ctx.beginPath()
                for(let coords of feature.geometry.coordinates){
                    coords.map((c,i)=>{
                        if(i==0)
                            this.ctx.moveTo(c[0],c[1])
                        else
                            this.ctx.lineTo(c[0],c[1])
                    })    
                }
                this.ctx.fill()
                this.ctx.closePath()
                break
            case 'MULTIPOLYGON':
                for(let coordinates of feature.geometry.coordinates){
                    this.ctx.beginPath()
                    for(let coords of coordinates){     
                        DouglasPeucker(coords,tolerance).map((coord,i)=>{
                            let c = this.coord2client(coord)
                            if(i==0)
                                this.ctx.moveTo(c[0],c[1])
                            else
                                this.ctx.lineTo(c[0],c[1])
                        })
                        
                    }
                    this.ctx.globalAlpha = 1
                    this.ctx.strokeStyle = style.stroke||'dodgerblue'
                    this.ctx.fillStyle = style.fill||fill
                    this.ctx.stroke()
                    this.ctx.fill()
                    this.ctx.closePath()
                }
                break
        }
    }
    addVector(geomType, coords, properties={}){
        let geojson = {features:[{
            geometry: {
                type: geomType,
                coordinates: coords
            },
            properties: properties
        }]}
        this.geojson(geojson)
    }
    WKT(wkt,properties){
        let type = wkt.match(/\w+/)[0]
        let jsonString = wkt.slice(type.length).replace(/[\d.]+\s[\d.]+/g,'[$&]').replace(/\s/g,',').replace(/\(/g,'[').replace(/\)/g,']')
        let coordinates = JSON.parse(jsonString)
        this.addVector(type,coordinates,properties)
    }
}