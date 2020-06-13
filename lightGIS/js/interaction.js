export default class Interaction{
    constructor(gismap){
        this.gismap = gismap
        this.imageShapes = []
        this.recycle = []
        this.propsTable = document.getElementById('properties')
        this.styleTable = document.getElementById('styles')
        this.currentLayer = '手繪'
        this.copied = {features:[],center:[0,0]}
        this.layerTable = document.getElementById('layers')
        this.gismap.raster = this.getDefaultRaster()
        this.renderRasterTable(document.getElementById('raster'))
        // custom events
        this.gismap.canvas.addEventListener('select',e=>{
            this.handleSelectFeatures(e.detail.features)
        })
        this.gismap.canvas.addEventListener('drawend',e=>{
            e.detail.feature.properties['圖層'] = this.currentLayer
            this.renderLayerTable()
        })
        this.gismap.canvas.addEventListener('render',()=>{
            for(let imageShape of this.imageShapes.slice().reverse()){
                imageShape.updateGisClient()
                imageShape.draw(this.gismap.ctx)
            }
        })
        // native events
        this.gismap.canvas.oncontextmenu = e=>{e.preventDefault()}
        this.gismap.canvas.addEventListener('dblclick',e=>{
            this.gismap.handleDblclick(e)
        })
        this.gismap.canvas.addEventListener('mousedown',e=>{
            let noImageShapeSelected = true
            for(let imageShape of this.imageShapes){
                if(noImageShapeSelected&&imageShape.handleMousedown(e)){
                    imageShape.editing = true
                    noImageShapeSelected = false
                    continue
                }
                imageShape.editing = false
            }
            if(noImageShapeSelected)
                this.gismap.handleMousedown(e)
        })
        this.gismap.canvas.addEventListener('mousemove',e=>{
            for(let imageShape of this.imageShapes){
                if(imageShape.editing){
                    imageShape.handleMousemove(e)
                }
            }
            this.gismap.handleMousemove(e)
        })   
        this.gismap.canvas.addEventListener('mouseup',e=>{
            for(let imageShape of this.imageShapes)
                imageShape.handleMouseup(e)
            this.gismap.handleMouseup(e)
        })
        this.gismap.canvas.addEventListener('mouseleave',e=>{
            for(let imageShape of this.imageShapes)
                imageShape.handleMouseup(e)
            this.gismap.handleMouseleave(e)
        })
        window.addEventListener('keydown',e=>{
            for(let imageShape of this.imageShapes)
                imageShape.handleKeydown(e)
            this.gismap.selectEvent.ctrlKey = e.ctrlKey
        })
        window.addEventListener('keyup',e=>{
            for(let imageShape of this.imageShapes)
                imageShape.handleKeyup(e)
            const deleteSelected = ()=>{
                if(this.gismap.selectEvent.features.length){
                    this.gismap.vector = this.gismap.vector.filter(feature=>!this.gismap.selectEvent.features.includes(feature))
                    this.recycle.push(this.gismap.selectEvent.features)
                    this.gismap.selectEvent.features = []
                    this.gismap.modifyEvent.feature = null
                }
            }
            const copySelected = ()=>{
                const flatten = (cs)=>typeof cs[0]=='number'?[cs]:typeof cs[0][0]=='number'?cs:cs[0]
                if(this.gismap.selectEvent.features.length){
                    this.copied.features = this.gismap.selectEvent.features
                    this.copied.center = this.gismap.getCoordsCenter(this.copied.features.flatMap(f=>flatten(f.geometry.coordinates)))
                }
            }
            if(e.code=='Delete'){
                this.imageShapes = this.imageShapes.filter(x=>!x.editing)
                deleteSelected()
            }
            else if(e.ctrlKey&&e.code=='KeyZ'){
                let features = this.recycle.pop()
                if(features)
                    features.map(feature=>{this.gismap.vector.push(feature)})
            }
            else if(e.ctrlKey&&e.code=='KeyX'){
                copySelected()
                deleteSelected()
            }
            else if(e.ctrlKey&&e.code=='KeyC'){
                copySelected()
            }
            else if(e.ctrlKey&&e.code=='KeyV'){
                const flatten = (cs)=>typeof cs[0]=='number'?[cs]:typeof cs[0][0]=='number'?cs:cs[0]
                let from = this.copied.center
                let to = this.gismap.moveEvent.currentCoord
                let offset = [to[0]-from[0],to[1]-from[1]]
                for(let feature of this.copied.features.slice().reverse()){
                    let f = JSON.parse(JSON.stringify(feature))
                    flatten(f.geometry.coordinates).map(c=>{c[0]+=offset[0];c[1]+=offset[1]})
                    this.gismap.addVector(f.geometry.type,f.geometry.coordinates,f.properties,true)
                }
            }
            this.gismap.selectEvent.ctrlKey = e.ctrlKey
        })
        this.gismap.canvas.addEventListener('wheel',e=>{
            this.gismap.handleWheel(e)
        })
        window.addEventListener('resize',()=>{
            this.gismap.handleResize()
        })
    }
    handleSelectFeatures(features){
        this.gismap.selectEvent.styling = false
        if(features.length==1){
            this.renderFeatureProps(features[0])
            this.renderPropsTable(features[0].properties)
            this.styleTable.style.display = 'block'
        }else if(features.length>1){
            this.renderFeatureProps(features[0])
            let area = features.reduce((acc,cur)=>{
                return acc+this.gismap.getFeatureArea(cur)
            },0)
            let properties = {
                '數量':features.length,
                '面積合計':area.toFixed(0)+'平方公尺'
            }
            this.renderPropsTable(properties)
            this.styleTable.style.display = 'block'
        }else{
            this.renderPropsTable({})
            this.styleTable.style.display = 'none'
        }
        this.renderLayerTable()
    }
    setFeatureProps(key,value){
        this.gismap.selectEvent.styling = true
        for(let feature of this.gismap.selectEvent.features){
            feature.properties[key] = value
        }
    }
    renderFeatureProps(feature){
        let style = this.gismap.getDefaultStyle(feature)
        for(let key in style){
            document.getElementById(key).value = style[key]||''
        }
    }
    renderPropsTable(properties){
        this.propsTable.innerHTML = ''
        Object.entries(properties).map(([key,val])=>{
            if(val&&val!='null'){
                let tr = this.propsTable.insertRow()
                tr.insertCell().textContent = key
                let td = tr.insertCell()
                td.contentEditable = true
                td.textContent = val
                td.oninput = e=>{properties[key] = e.target.textContent}
            }
        })
    }
    renderLayerTable(){
        this.layerTable.innerHTML = ''
        let layers = [...new Set(this.gismap.vector.map(v=>v.properties['圖層']).filter(v=>v))]
        for(let layer of layers){
            let tr = this.layerTable.insertRow()
            tr.insertCell().textContent = layer
            tr.style.color = layer==this.currentLayer?'red':'black'
            tr.style.cursor = 'pointer'
            tr.onclick = ()=>{
                tr.style.color = layer==this.currentLayer?'red':'black'
                this.currentLayer = layer
                let features = this.gismap.vector.filter(f=>f.properties['圖層']==layer)
                this.gismap.selectEvent.features = features
                this.handleSelectFeatures(features)
            }
        }
    }
    getDefaultRaster(){
        const token = "qn5cMMfaz2E84GbcNlqB2deRwJpO0NfuIorLEzgqLiaQv3lB8mfoVF7VU0u0rJCMbkMjDCBz2xD1JH-8fYMuBg.."
        return [
            {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/URBAN3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'臺中都市計畫',opacity:0.8,active:false},
            {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/Land3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'地段及地籍圖',opacity:0.8,active:false},
            {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA163857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告現值',opacity:0.8,active:false},
            {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA173857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告地價',opacity:0.8,active:false},
            {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_policy/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'特殊管制',opacity:0.8,active:false},
            {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_water/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'水源水質',opacity:0.8,active:false},
            {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_geo/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'地質敏感',opacity:0.8,active:false},
            {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_environment/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'環保與汙染',opacity:0.8,active:false},
            {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/SlopeTW3857_fix/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'坡度示意圖',opacity:0.8,active:false},
            {url:'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',name:'OSM',opacity:0.8,active:false,max:18},
            {url:'https://wmts.nlsc.gov.tw/wmts/EMAP5/default/EPSG:3857/{z}/{y}/{x}',name:'通用',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/EMAP01/default/EPSG:3857/{z}/{y}/{x}',name:'灰階',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/EPSG:3857/{z}/{y}/{x}',name:'航照',opacity:0.8,active:false},
            {url:'https://mts1.google.com/vt/lyrs=s@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile',name:'Google衛星',opacity:0.8,active:false},
            {url:'https://mts1.google.com/vt/lyrs=p@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile',name:'Google地形',opacity:0.8,active:false},
            {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',name:'ESRI衛星',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/EMAPX99/default/EPSG:3857/{z}/{y}/{x}',name:'交通路網',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/LUIMAP/default/EPSG:3857/{z}/{y}/{x}',name:'國土利用',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/LAND_OPENDATA/default/EPSG:3857/{z}/{y}/{x}',name:'公有土地',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/SCHOOL/default/EPSG:3857/{z}/{y}/{x}',name:'學校',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/Village/default/EPSG:3857/{z}/{y}/{x}',name:'村里界',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/TOWN/default/EPSG:3857/{z}/{y}/{x}',name:'鄉市鎮界',opacity:0.8,active:false},
            {url:'https://wmts.nlsc.gov.tw/wmts/CITY/default/EPSG:3857/{z}/{y}/{x}',name:'縣市界',opacity:0.8,active:false},
        ].map(raster=>{
            raster.url = raster.url.replace('{token}',token)
            return raster
        })
    }
    renderRasterTable(rasterTemplate){
        var dragged
        const handleDrop = (e,element)=>{
            e.preventDefault()
            let srcIdx = [...element.parentNode.children].findIndex(x=>x==dragged)
            let src = this.gismap.raster[srcIdx]
            this.gismap.raster.splice(srcIdx,1)
            let tarIdx = [...element.parentNode.children].findIndex(x=>x==element)
            this.gismap.raster.splice(tarIdx,0,src)
            if(srcIdx>tarIdx){
                element.parentNode.insertBefore(dragged,element)
            }else{
                element.parentNode.insertBefore(dragged,element.nextSibling)
            }
        }
        for(let raster of this.gismap.raster){
            let rtNode = rasterTemplate.cloneNode(true)
            rtNode.ondragstart = e=>{dragged=e.target}
            rtNode.ondrop = e=>{handleDrop(e,rtNode)}
            rtNode.ondragover = e=>e.preventDefault()
            let checkbox = rtNode.querySelector('input[type="checkbox"]')
            checkbox.id = raster.name
            checkbox.onchange = e=>{
                let idx = this.gismap.raster.findIndex(x=>x.name==raster.name)
                this.gismap.raster[idx].active = e.target.checked
            }
            rtNode.querySelector('label').setAttribute('for',raster.name)
            let range = rtNode.querySelector('input[type="range"')
            range.oninput = e=>{
                let idx = this.gismap.raster.findIndex(x=>x.name==raster.name)
                this.gismap.raster[idx].opacity = e.target.value*1.0
            }
            rtNode.querySelector('span').textContent = raster.name
            rasterTemplate.parentNode.appendChild(rtNode)
        }
        rasterTemplate.remove()
    }
    // misc
    fitExtent(features=this.gismap.selectEvent.features){
        let bound = 6378137*Math.PI
        if(features.length){
            let coords = []
            for(let feature of features){
                let bbox = feature.geometry.bbox
                if(bbox.some(x=>x<-bound||x>bound)) continue
                coords.push([bbox[0],bbox[1]])
                coords.push([bbox[2],bbox[3]])
            }
            this.gismap.fitBound(this.gismap.getBbox(coords))
        }
    }
    moveLayerTo(position='top'){
        let features = this.gismap.selectEvent.features
        this.gismap.vector = this.gismap.vector.filter(f=>!features.includes(f))
        if(position=='top')
            this.gismap.vector.unshift(...features)
        else if(position=='bottom')
            this.gismap.vector.push(...features)
    }
    // simplify(){
    //     let percentage = parseInt(document.getElementById('percentage').value)/100
    //     for(let feature of this.gismap.selectEvent.features){
    //         let coords = feature.geometry.coordinates
    //         if(feature.geometry.type=='Polygon'){
    //             feature.geometry.coordinates = coords.map(c=>simplifyVisvalingam(c,Math.round(c.length*percentage)))
    //         }else if(feature.geometry.type=='MultiPolygon'){
    //             feature.geometry.coordinates = coords.map(cs=>cs.map(c=>simplifyVisvalingam(c,Math.round(c.length*percentage))))
    //         }
    //     }
    // }
}