var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var gm = new GisMap(canvas)
var imageShapes = []
const propsTable = document.getElementById('properties')
canvas.addEventListener('render',e=>{
    for(let imageShape of imageShapes){
        imageShape.updateGisClient()
        imageShape.draw(ctx)
    }
})
canvas.addEventListener('dblclick',e=>{
    gm.handleDblclick(e)
})
canvas.oncontextmenu = e=>e.preventDefault()
canvas.addEventListener('mousedown',e=>{
    let noImageShapeSelected = true
    for(let imageShape of imageShapes){
        if(imageShape.handleMousedown(e)){
            imageShape.editing = true
            noImageShapeSelected = false
        }else{
            imageShape.editing = false
        }
    }
    if(noImageShapeSelected)
        gm.handleMousedown(e)
})
canvas.addEventListener('mousemove',e=>{
    for(let imageShape of imageShapes){
        if(imageShape.editing){
            imageShape.handleMousemove(e)
        }
    }
    gm.handleMousemove(e)
})
canvas.addEventListener('select',e=>{
    if(e.detail.features.length==1){
        propsTable.innerHTML = ''
        Object.entries(e.detail.features[0].properties).map(([key,val])=>{
            if(val&&val!='null'){
                let tr = propsTable.insertRow()
                tr.insertCell().textContent = key
                tr.insertCell().textContent = val
            }
        })
    }else{
        propsTable.innerHTML = ''
    }
})
canvas.addEventListener('mouseup',e=>{
    for(let imageShape of imageShapes)
        imageShape.handleMouseup(e)
    gm.handleMouseup(e)
})
canvas.addEventListener('mouseleave',e=>{
    for(let imageShape of imageShapes)
        imageShape.handleMouseup(e)
    gm.handleMouseleave(e)
})
window.addEventListener('keydown',e=>{
    for(let imageShape of imageShapes)
        imageShape.handleKeydown(e)
    gm.selectEvent.ctrlKey = e.ctrlKey
})
var recycle = []
window.addEventListener('keyup',e=>{
    for(let imageShape of imageShapes)
        imageShape.handleKeyup(e)
    if(e.code=='Delete'){
        imageShapes = imageShapes.filter(x=>!x.editing)
        if(gm.modifyEvent.feature&&gm.modifyEvent.anchor!=-1){
            gm.modifyEvent.coords.splice(gm.modifyEvent.anchor,1)
            gm.modifyEvent.anchor = -1
        }else if(gm.selectEvent.features.length){
            gm.vector = gm.vector.filter(feature=>!gm.selectEvent.features.includes(feature))
            recycle.push(gm.selectEvent.features)
            gm.selectEvent.features = []
        }
    }
    if(e.ctrlKey&&e.code=='KeyZ'){
        recycle.pop().map(feature=>{gm.vector.push(feature)})
    }
    if(e.code=='KeyM'){
        if(gm.selectEvent.features.length==1){
            gm.modifyEvent.feature = gm.selectEvent.features[0]
        }else{
            gm.modifyEvent.feature = null
        }
    }
    gm.selectEvent.ctrlKey = e.ctrlKey
})
canvas.addEventListener('wheel',e=>{
    gm.handleWheel(e)
})
window.addEventListener('resize',()=>{
    gm.handleResize()
})
let rasterElement = document.getElementById('raster')
let rasters = [
    {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/URBAN3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'臺中都市計畫',opacity:0.8,active:false},
    {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/Land3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'地段及地籍圖',opacity:0.8,active:false},
    {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA163857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告現值',opacity:0.8,active:false},
    {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA173857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告地價',opacity:0.8,active:false},
    {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_policy/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'特殊管制',opacity:0.8,active:false},
    {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_water/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'水源水質',opacity:0.8,active:false},
    {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_geo/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'地質敏感',opacity:0.8,active:false},
    {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_environment/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'環保與汙染',opacity:0.8,active:false},
    {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/SlopeTW3857_fix/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'坡度示意圖',opacity:0.8,active:false},
    {url:'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',name:'OSM',opacity:0.8,active:false},
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
]
const token = "qn5cMMfaz2E84GbcNlqB2deRwJpO0NfuIorLEzgqLiaQv3lB8mfoVF7VU0u0rJCMbkMjDCBz2xD1JH-8fYMuBg.."
for(let i=0;i<4;i++){
    rasters[i].url = rasters[i].url.replace('{token}',token)
}
gm.raster = rasters
for(let raster of rasters){
    let rE = rasterElement.cloneNode(true)
    let checkbox = rE.querySelector('input[type="checkbox"]')
    checkbox.id = raster.name
    checkbox.onchange = e=>{
        let idx = gm.raster.findIndex(x=>x.name==raster.name)
        gm.raster[idx].active = e.target.checked
    }
    rE.querySelector('label').setAttribute('for',raster.name)
    let range = rE.querySelector('input[type="range"')
    range.oninput = e=>{
        let idx = gm.raster.findIndex(x=>x.name==raster.name)
        gm.raster[idx].opacity = e.target.value*1.0
    }
    rE.querySelector('span').textContent = raster.name
    rasterElement.parentNode.appendChild(rE)
}
rasterElement.remove()