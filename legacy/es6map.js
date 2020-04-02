class LatLng{
    constructor(lat, lng){
        this.lat = lat*1
        this.lng = lng*1
    }
    distanceTo(point){
        var rad = Math.PI / 180,
            R = 6371000,
            lat1 = this.lat * rad,
            lat2 = point.lat * rad,
            sinDLat = Math.sin((point.lat - this.lat) * rad / 2),
            sinDLon = Math.sin((point.lng - this.lng) * rad / 2),
            a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
class Point {
    constructor(x, y, round){
        this.x = round ? Math.round(x) : x
        this.y = round ? Math.round(y) : y
    }
    add(point){return new Point(this.x+point.x,this.y+point.y)}
    sub(point){return new Point(this.x-point.x,this.y-point.y)}
    mul(num){return new Point(this.x*num,this.y*num)}
    mulPoint(point){return new Point(this.x*point.x,this.y*point.y)}
    div(num){return new Point(this.x/num,this.y/num)}
    divPoint(point){return new Point(this.x/point.x,this.y/point.y)}
    toRound(){return new Point(Math.round(this.x),Math.round(this.y))}
}
class Bounds{
    constructor(minPoint, maxPoint){
        this.min = new Point(minPoint.x,minPoint.y)
        this.max = new Point(maxPoint.x,maxPoint.y)
    }
    getCenter(){
        return new Point((this.min.x+this.max.x)/2, (this.min.y+this.max.y)/2)
    }
    overlaps(bounds){
        let x = (bounds.max.x > this.min.x) && (bounds.min.x < this.max.x)
        let y = (bounds.max.y > this.min.y) && (bounds.min.y < this.max.y)
        return x&&y
    }
    contains(point){
        let x = (point.x > this.min.x) && (point.x < this.max.x)
        let y = (point.y > this.min.y) && (point.y < this.max.y)
        return x&&y
    }
    getSize(){
        return new Point(this.max.x-this.min.x, this.max.y-this.min.y)
    }
}
class LatLngBounds{
    constructor(min, max){
        this.min = new LatLng(min.lat,min.lng)
        this.max = new LatLng(max.lat,max.lng)
    }
    overlaps(bounds){
        let lat = (bounds.max.lat > this.min.lat) && (bounds.min.lat < this.max.lat)
        let lng = (bounds.max.lng > this.min.lng) && (bounds.min.lng < this.max.lng)
        return lat&&lng
    }
    contains(latlng){
        let lat = (latlng.lat > this.min.lat) && (latlng.lat < this.max.lat)
        let lng = (latlng.lng > this.min.lng) && (latlng.lng < this.max.lng)
        return lat&&lng
    }
}

var SphericalMercator = {
    R: 6378137, //earthRadius
    bounds: new Bounds({x:-6378137*Math.PI,y:-6378137*Math.PI},{x:6378137*Math.PI,y:6378137*Math.PI}),
    MAX_LATITUDE: 85.0511287798,
    project: function (latlng) {
        var d = Math.PI / 180,
            max = this.MAX_LATITUDE,
            lat = Math.max(Math.min(max, latlng.lat), -max),
            sin = Math.sin(lat * d);

        return new Point(
            this.R * latlng.lng * d,
            this.R * Math.log((1 + sin) / (1 - sin)) / 2);
    },
    unproject: function (point) {
        var d = 180 / Math.PI;

        return new LatLng(
            (2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
            point.x * d / this.R);
    },
};
class Es6Map{
    constructor(element,options){
        // init variables
        this.event = null
        this.gesture = null
        this.moved = true
        this.scale = new Point(0,0)
        this.Point = new Point(0,0)
        this.Bounds = new Bounds({x:0,y:0},{x:0,y:0})
        this.LatLng = new LatLng(0,0)
        this.LatLngBounds = new LatLngBounds({lat:0,lng:0},{lat:0,lng:0})
        this.layer = {}
        this.zoom = 2
        // assign options
        this.options = Object.assign({
            minZoom: 0,
            maxZoom: 20,
            projection: SphericalMercator,
            svgPadding: window.navigator.userAgent.match(/MSIE|Edge|Firefox/)?0:0.1
        }, options)
        // container
        this.container = element
        this.container.classList.add('ezmap')
        this.container.style.position = 'relative'
        this.container.style.overflow = 'hidden'
        this.projection = this.options.projection
        // tile layer
        this.tile = document.createElement('div')
        this.tiles = {}
        this.tile.className = 'tile-pane'
        this.tile.style.position = 'absolute'
        this.tile.offset = new Point(0,0)
        this.smoothFinished = true
        this.container.appendChild(this.tile)
        // svg layer
        this.svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
        this.svg.style.position = 'absolute'
        this.resetSvgSize()
        this.container.appendChild(this.svg)
        // div layer (popup, marker)
        this.popup = document.createElement('div')
        this.popup.className = 'popup-pane'
        this.popup.offset = new Point(0,0)
        this.container.appendChild(this.popup)
        // zoom event
        this.container.addEventListener('wheel',e=>{
            e.preventDefault()
            if(this.smoothFinished){
                this.handleZoom(e.clientX,e.clientY,this.zoom+(e.deltaY>0?-1:1))
            }
        })
        this.container.addEventListener('gesturestart',e=>{
            this.gesture = {x:this.event.x,y:this.event.y,scale:1}
            if(this.smoothFinished){
                this.handleEventEnd()
            }
        })
        this.container.addEventListener('gesturechange',e=>{
            if(this.smoothFinished){
                let pct = e.scale/this.gesture.scale
                if(pct>1.2||pct<0.8){
                    this.handleZoom(this.gesture.x,this.gesture.y,this.zoom+(pct>1?1:-1))
                    this.gesture.scale = e.scale
                }
            }
        })
        // move event
        this.container.addEventListener('touchstart',e=>{
            this.handleEventStart(e.targetTouches[0].pageX,e.targetTouches[0].pageY)
        })
        this.container.addEventListener('touchmove',e=>{
            e.preventDefault()
            if(e.touches.length==1 && this.smoothFinished){
                this.handleEventMove(e.targetTouches[0].pageX,e.targetTouches[0].pageY)
            }
        })
        this.container.addEventListener('touchend',e=>{this.handleEventEnd()})
        this.container.addEventListener('mouseenter',e=>{this.handleResize()})
        this.container.addEventListener('mousedown',e=>{this.handleEventStart(e.clientX,e.clientY)})
        this.container.addEventListener('mouseup',e=>{this.handleEventEnd()})
        this.container.addEventListener('mouseleave',e=>{this.handleEventEnd()})
        this.container.addEventListener('mousemove',e=>{this.handleEventMove(e.clientX,e.clientY)})
        // resize event
        window.addEventListener('resize',()=>{this.handleResize()})
        // initiate position
        this.setCenter(this.LatLng).setZoom(this.zoom)
    }
    handleResize(){
        if(this.smoothFinished){
            let mpb = this.projection.bounds,
            offset = this.getPointOfScreen(new Point(mpb.min.x,mpb.max.y))
            this.tile.offset = offset
            this.updateOffset(new Point(0,0))
            this.zoomTo(this.zoom)
            this.resetSvgSize()
            this.redraw()
            this.render()
        }
    }
    handleZoom(x,y,zoom){
        // initiate macro position
        zoom = this.limitZoom(zoom)
        let point = this.getPointOfMap(x,y)
        point = zoom>this.zoom?this.Point.add(point).div(2):
            zoom<this.zoom?this.Point.mul(2).sub(point):this.Point
        this.smoothTo(point,zoom)
    }
    smoothTo(point,zoom){
        this.smoothFinished = false
        // initiate macro position
        let originPoint = new Point(this.Point.x,this.Point.y),
            power = Math.pow(2,zoom-this.zoom)
        this.tile.scale = `scale(${power})`
        this.pointTo(point)
        this.zoomTo(zoom)
        // convert point of map to offset of element
        let offset = originPoint.sub(this.Point).mulPoint(this.scale)
        offset.y*= -1
        this.svg.offset = offset.add(this.svg.offset)
        let mpb = this.projection.bounds
        this.tile.offset = this.getPointOfScreen(new Point(mpb.min.x,mpb.max.y))
        // remove the old tile
        while(this.tile.childNodes.length>1){this.tile.removeChild(this.tile.firstChild);this.tiles={}}
        // create a new tile but not show at first
        let newTile = document.createElement('div')
        newTile.className = 'tile-pane'
        this.tile.appendChild(newTile)
        this.tile.lastChild.style.opacity = 0
        this.setTransition('0.5s')
        // set offset instead of updating it
        this.tile.firstChild.style.transform = `translate(${this.tile.offset.x}px,${this.tile.offset.y}px)`+' '+this.tile.scale
        this.tile.lastChild.style.transform = `translate(${this.tile.offset.x}px,${this.tile.offset.y}px)`
        this.svg.style.transform = `translate(${this.svg.offset.x}px,${this.svg.offset.y}px)`+' '+this.tile.scale
        clearTimeout(this.timeout)
        this.timeout = setTimeout(()=>{
            this.tile.lastChild.style.opacity = 1
            this.setTransition('0s')
            this.resetSvgSize()
            this.redraw()
            window.dispatchEvent(new Event('zoomend'))
            this.smoothFinished = true
        },500)
        this.render()
    }
    handleEventStart(x,y){
        let point = this.getPointOfMap(x,y)
        this.event = {point,x,y}
        this.moved = false
    }
    handleEventEnd(){
        if(this.event&&this.smoothFinished){
            let offset = this.getPointOfMap(this.event.x,this.event.y).sub(this.event.point)
            this.pointTo(this.Point.sub(offset))
            this.resetSvgSize()
            this.redraw()
            this.render()
        }
        this.event = null
    }
    handleEventMove(x,y){
        if(this.event){
            let offset = new Point(x-this.event.x,y-this.event.y)
            this.updateOffset(offset)
            this.event.x = x
            this.event.y = y
        }
        this.moved = true
    }
    limitZoom(zoom){
        return Math.max(this.options.minZoom,Math.min(this.options.maxZoom,zoom))
    }
    getPointOfScreen(point){
        let anchor = new Point(point.x-this.Bounds.min.x,this.Bounds.max.y-point.y)
        return anchor.mulPoint(this.scale).toRound()
    }
    getPointOfMap(x,y){
        let rect = this.container.getBoundingClientRect(),
            point = new Point(x-rect.x,y-rect.y).divPoint(this.scale)
        return new Point(point.x+this.Bounds.min.x,this.Bounds.max.y-point.y)
    }
    setCenter(latlng){
        this.LatLng = Array.isArray(latlng)?new LatLng(latlng[0],latlng[1]):latlng
        this.smoothTo(this.project(this.LatLng),this.zoom)
        return this
    }
    setZoom(zoom){
        this.zoomTo(zoom)
        // this.handleResize()
        return this
    }
    zoomTo(zoom){
        this.zoom = this.limitZoom(zoom)
        let halfSize = this.getContainerSize().mulPoint(this.projection.bounds.getSize().div(256)).div(Math.pow(2,this.zoom)).div(2)
        this.Bounds = new Bounds(this.Point.sub(halfSize),this.Point.add(halfSize))
        this.scale = this.getContainerSize().divPoint(this.Bounds.getSize())
    }
    pointTo(point){
        let offset = point.sub(this.Point)
        this.Bounds = new Bounds(this.Bounds.min.add(offset),this.Bounds.max.add(offset))
        this.Point = point
        this.LatLng = this.unproject(this.Point)
        this.LatLngBounds = new LatLngBounds(this.unproject(this.Bounds.min),this.unproject(this.Bounds.max))
    }
    updateOffset(point){
        this.svg.offset = this.svg.offset.add(point)
        this.svg.style.transform = `translate(${this.svg.offset.x}px,${this.svg.offset.y}px)`
        this.tile.offset = this.tile.offset.add(point)
        if(this.tile.firstChild){
            this.tile.firstChild.style.transform = `translate(${this.tile.offset.x}px,${this.tile.offset.y}px)`+' '+this.tile.scale
            this.tile.lastChild.style.transform = `translate(${this.tile.offset.x}px,${this.tile.offset.y}px)`
        }
        this.popup.offset = this.popup.offset.add(point)
        this.popup.style.transform = `translate(${this.popup.offset.x}px,${this.popup.offset.y}px)`
    }
    setTransition(transition){
        if(this.tile.firstChild){
            this.tile.firstChild.style.transition = transition
            this.tile.lastChild.style.transition = transition
        }
        this.svg.style.transition = transition
        for(let childNode of this.popup.childNodes){
            childNode.style.transition = transition
        }
    }
    resetSvgSize(){
        let padding = this.options.svgPadding,
            size = this.getContainerSize(),
            offsetX = -Math.round(size.x*padding),
            offsetY = -Math.round(size.y*padding),
            width = Math.round(size.x*(1+padding*2)),
            height = Math.round(size.y*(1+padding*2)),
            viewBox = offsetX+' '+offsetY+' '+width+' '+height,
            boundsSize = this.Bounds.getSize().mul(padding),
            boundsMax = this.Bounds.max.add(boundsSize),
            boundsMin = this.Bounds.min.sub(boundsSize)
        this.svg.offset = new Point(offsetX,offsetY)
        this.svg.Bounds = new Bounds(boundsMin, boundsMax)
        this.svg.setAttribute('viewBox',viewBox)
        this.svg.style.width = width
        this.svg.style.height = height
        this.svg.style.transform = `translate(${offsetX}px,${offsetY}px)`
    }
    fitBounds(bounds,padding){
        padding = padding||0
        var boundsSize = bounds.getSize(),
            mapSize = this.Bounds.getSize(),
            scaleX = (mapSize.x+padding) / boundsSize.x,
            scaleY = (mapSize.y+padding) / boundsSize.y,
            scale = Math.min(scaleX,scaleY),
            zoom = this.zoom+Math.log2(scale)
        this.smoothTo(bounds.getCenter(),Math.floor(zoom))
    }
    addLayer(layer){
        let id = Math.max(...Object.keys(this.layer),0)+1
        this.layer[id] = layer
        layer.addTo(this)
        return id
    }
    removeLayer(id){
        this.layer[id].removeFrom(this)
        delete this.layer[id]
    }
    getContainerSize(){return new Point(this.container.clientWidth||0,this.container.clientHeight||0)}
    project(latlng){return this.projection.project(latlng)}
    unproject(point){return this.projection.unproject(point)}
    redraw(){
        Object.values(this.layer).map(layer=>layer.redraw(this))
    }
    render(){
        Object.values(this.layer).map(layer=>layer.render(this))
        this.popup.offset = new Point(0,0)
        this.popup.style.transform = `translate(${this.popup.offset.x}px,${this.popup.offset.y}px)`
    }
    on(eventType, callback){
        switch(eventType){
            case 'click':
                this.container.addEventListener('click',e=>{
                    if(!this.moved){
                        e.latlng = this.unproject(this.getPointOfMap(e.clientX,e.clientY))
                        callback(e)
                    }
                })
                break;
            case 'zoomend':
                window.addEventListener('zoomend',e=>{
                    e.zoom = this.zoom
                    callback(e)
                })
                break;
            default: break;
        }
    }
}

class Layer{
    constructor(points,options){
        this.points = points.map(point=>Array.isArray(point)?new LatLng(point[0],point[1]):point)
        this.options = options!=undefined?options:{}
        this.map = null
        this.popup = {open:false}
        this.projected = false
    }
    getBounds(){
        let xArr = this.points.map(point=>point.x),
            yArr = this.points.map(point=>point.y),
            minPoint = new Point(Math.min(...xArr),Math.min(...yArr)),
            maxPoint = new Point(Math.max(...xArr),Math.max(...yArr))
        return new Bounds(minPoint,maxPoint)
    }
    setOptions(defaultOptions){
        this.options = Object.assign(defaultOptions,this.options)
        Object.keys(this.options).map(key=>{this.element.setAttribute(key,this.options[key])})
    }
    project(){
        if(!this.projected){
            this.points = this.points.map(point=>this.map.project(point))
            this.projected = true
        }
    }
    renderPopup(){
        if(this.popup.open){
            if(!this.popup.added){
                this.map.popup.appendChild(this.popup)
                this.popup.added = true
            }
            let point = this.map.getPointOfScreen(this.points[0])
            if(point.y<this.popup.clientHeight){this.popup.classList.add('popup-lower')}
            else{this.popup.classList.remove('popup-lower')}
            this.popup.style.top = point.y+'px'
            this.popup.style.left = point.x+'px'
        }
    }
    bindPopup(html){
        this.popup = document.createElement('div')
        this.popup.classList.add('popup')
        this.popup.open = false
        let close = document.createElement('div')
        close.className = 'close'
        close.onclick = ()=>{
            this.popup.style.display = 'none'
            this.popup.open = false
        }
        this.popup.appendChild(close)
        let content = document.createElement('div')
        content.innerHTML = html
        this.popup.appendChild(content)
        this.popup.style.display = 'none'
        this.element.onclick = ()=>{this.openPopup()}
        return this
    }
    openPopup(){
        this.popup.open = true
        this.popup.style.display = 'block'
        this.renderPopup(this.map)
    }
}

class TileLayer{
    constructor(url,options){
        this.map = null
        this.url = url
        this.options = options
    }
    addTo(map){
        this.map = map
        let newTile = document.createElement('div')
        newTile.style.position = 'absolute'
        map.tile.appendChild(newTile)
        map.tiles = {}
        Object.assign(map.options, this.options)
        this.render()
    }
    removeFrom(map){
        map.tiles = {}
        map.tile.innerHTML = ''
    }
    limitRange(val,min,max){return val<min?min:val>max?max:val}
    redraw(){

    }
    render(){
        let grids = Math.pow(2,this.map.zoom),
            mpb = this.map.projection.bounds,
            size = mpb.getSize().div(grids),
            min = this.map.Bounds.min.sub(mpb.min).divPoint(size),
            max = this.map.Bounds.max.sub(mpb.min).divPoint(size),
            minX = Math.floor(this.limitRange(min.x,0,grids-1)),
            minY = Math.floor(this.limitRange(grids-1-max.y,0,grids-1)),
            maxX = Math.ceil(this.limitRange(max.x,0,grids-1)),
            maxY = Math.ceil(this.limitRange(grids-1-min.y,0,grids-1))
        for(let x=minX;x<=maxX;x++){
            for(let y=minY;y<=maxY;y++){
                let id = x+'-'+y+'-'+this.map.zoom
                if(!(id in this.map.tiles)){
                    let tile = this.createTile(x,y,this.map.zoom)
                    tile.style.top = y*256+'px'
                    tile.style.left = x*256+'px'
                    this.map.tiles[id] = tile
                    this.map.tile.lastChild.appendChild(tile)
                }
            }
        }
        // this.showHint(minX,maxX,minY,maxY,map)
    }
    showHint(minX,maxX,minY,maxY,map){
        let hint = document.getElementById('hint'),
            ranger = document.getElementById('ranger'),
            info = document.getElementById('info'),
            hw = hint.clientWidth,
            hh = hint.clientHeight,
            mz = map.Bounds.getSize(),
            mpb = map.projection.bounds,
            mpz = mpb.getSize(),
            latlng = map.unproject(map.Point)
        ranger.style.bottom = hh*(map.Bounds.min.y-mpb.min.y)/mpz.y+'px'
        ranger.style.left = hw*(map.Bounds.min.x-mpb.min.x)/mpz.x+'px'
        ranger.style.width = hw*mz.x/mpz.x+'px'
        ranger.style.height = hh*mz.y/mpz.y+'px'
        ranger.innerText = latlng.lat.toFixed(0)+','+latlng.lng.toFixed(0)
        info.innerText = 'X'+minX+'-'+maxX+' Y'+minY+'-'+maxY+' Z'+map.zoom
    }
    createTile(x,y,z){
        let tile = document.createElement('img')
        tile.src = this.url.replace(/{x}/,x).replace(/{y}/,y).replace(/{z}/,z)
        tile.alt = ' '
        tile.style.position = 'absolute'
        tile.setAttribute('draggable',false)
        return tile
    }
}
class Polyline extends Layer{
    constructor(points,options){
        super(points, options)
        this.element = document.createElementNS('http://www.w3.org/2000/svg','path')
        this.setOptions({
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke': 'black',
            'stroke-width': 2,
            'fill': 'none',
            'smooth': 0
        })
    }
    addTo(map){
        this.map = map
        this.project()
        this.Bounds = this.getBounds()
        this.redraw()
        this.map.svg.appendChild(this.element)
    }
    removeFrom(map){
        map.svg.removeChild(this.element)
    }
    redraw(){    
        let points = this.Bounds.overlaps(this.map.svg.Bounds)?
            this.points.map(point=>this.map.getPointOfScreen(point)):
            []
        let pathStr = this.smooth?
            pathStr = this.getSmoothPath(points, 0.1):
            points.reduce((acc,cur,i)=>acc+(i?'L':'M')+cur.x+' '+cur.y,'')
        pathStr = pathStr?pathStr:'M0 0'
        this.element.setAttribute('d',pathStr)
    }
    render(){

    }
    getSmoothPath(points,smooth){
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
                    return acc+`M${cur.x} ${cur.y}`
                case 1:
                    return acc+`C${arr[0].x} ${arr[0].y},${cur.x-cp[i-1].x} ${cur.y-cp[i-1].y},${cur.x} ${cur.y}`
                case arr.length-1:
                    return acc+`C${arr[i-1].x+cp[i-2].x} ${arr[i-1].y+cp[i-2].y},${cur.x} ${cur.y},${cur.x} ${cur.y}`
                default: 
                    return acc+`C${arr[i-1].x+cp[i-2].x} ${arr[i-1].y+cp[i-2].y},${cur.x-cp[i-1].x} ${cur.y-cp[i-1].y},${cur.x} ${cur.y}`
            }
        },'')
    }
}
class Polygon extends Layer{
    constructor(points,options){
        super(points, options)
        this.element = document.createElementNS('http://www.w3.org/2000/svg','path')
        this.setOptions({
            'stroke': 'white',
            'fill': 'grey'
        })
    }
    addTo(map){
        this.map = map
        this.project()
        this.Bounds = this.getBounds()
        this.redraw()
        this.map.svg.appendChild(this.element)
    }
    removeFrom(map){
        map.svg.removeChild(this.element)
    }
    redraw(){    
        let points = this.Bounds.overlaps(this.map.svg.Bounds)?
            this.points.map(point=>this.map.getPointOfScreen(point)):
            []
        let pathStr = points.reduce((acc,cur,i)=>acc+(i?'L':'M')+cur.x+' '+cur.y,'')
        pathStr+= pathStr?'Z':'M0 0'
        this.element.setAttribute('d',pathStr)
    }
    render(){

    }
}
class Geojson{
    constructor(geojson, options){
        this.layers = []
        switch(geojson.type){
            case 'FeatureCollection':
                for(let feature of geojson.features){
                    switch(feature.geometry.type){
                        case 'MultiPolygon':
                            for(let polygon of feature.geometry.coordinates){
                                for(let coords of polygon){
                                    let layer = new Polygon(coords.map(coord=>([coord[1],coord[0]])), options)
                                    this.layers.push(layer)
                                }
                            }
                            break;
                        case 'Polygon':
                            for(let coords of feature.geometry.coordinates){
                                let layer = new Polygon(coords.map(coord=>([coord[1],coord[0]])), options)
                                this.layers.push(layer)
                            }
                            break;
                        default: break;
                    }
                }
                break
            case 'GeometryCollection':
                for(let geometry of geojson.geometries){
                    switch(geometry.type){
                        case 'Linestring':
                            for(let coords of geometry.coordinates){
                                let layer = new Polyline(coords.map(coord=>([coord[1],coord[0]])), options)
                                this.layers.push(layer)
                            }
                            break;
                        default: break;
                    }
                }
                break
            default: break
        }
    }
    addTo(map){
        this.layers.map(layer=>{layer.addTo(map)})
    }
    removeFrom(map){
        this.layers.map(layer=>{layer.removeFrom(map)})
    }
    redraw(){
        this.layers.map(layer=>{layer.redraw()})
    }
    render(){
        this.layers.map(layer=>{layer.render()})
    }
}
class Marker extends Layer{
    constructor(point,options){
        super([point],options)
        this.element = document.createElement('img')
        this.element.style.position = 'absolute'
        this.element.style.cursor = 'pointer'
        this.setOptions({
            'src': '',
            'alt': '',
            'top': -30,
            'left': -30
        })
    }
    addTo(map){
        this.project(map)
        this.render()
        map.popup.appendChild(this.element)
        if(this.popup){map.popup.appendChild(this.popup)}
    }
    removeFrom(map){
        map.popup.removeChild(this.element)
    }
    redraw(map){

    }
    render(map){
        let point = map.getPointOfScreen(this.points[0])
        if(this.popup){
            if(point.y<this.popup.clientHeight){this.popup.classList.add('popup-lower')}
            else{this.popup.classList.remove('popup-lower')}
            this.popup.style.top = point.y+'px'
            this.popup.style.left = point.x+'px'
        }
        this.element.style.top = point.y+this.options.top+'px'
        this.element.style.left = point.x+this.options.left+'px'
    }
    bindPopup(html){
        this.popup = document.createElement('div')
        this.popup.classList.add('popup')
        this.popup.innerHTML = html
        return this
    }
}
class Circle extends Layer{
    constructor(point,options){
        super([point],options)
        this.element = document.createElementNS('http://www.w3.org/2000/svg','circle')
        this.popup = {open:false}
        this.setOptions({
            'stroke': 'blue',
            'fill': 'dodgerblue',
            'r': 500,
            'stroke-width': 2,
        })
    }
    addTo(map){
        this.map = map
        this.project(map)
        this.redraw()
        this.render()
        map.svg.appendChild(this.element)
    }
    removeFrom(map){
        map.svg.removeChild(this.element)
        if(this.popup.tagName){this.popup.remove()}
    }
    redraw(){
        let point = this.map.getPointOfScreen(this.points[0])
        this.element.setAttribute('r',this.options.r*Math.pow(2,this.map.zoom-16))
        this.element.setAttribute('cx',point.x)
        this.element.setAttribute('cy',point.y)
    }
    render(){
        this.renderPopup()
    }
}
// export {LatLng,LatLngBounds,Point,Bounds,EzMap,TileLayer,Polyline,Polygon,Geojson,Marker,Circle}