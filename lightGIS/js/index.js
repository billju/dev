import makeElementMovable from './makeElementMovable.js'
import GisMap from './GisMap.js'
import ImageShape from './ImageShape.js'
import Interaction from './interaction.js'
import PTX from './ptx.js'
import {readFileAsText,downloadCanvas,downloadText,svgAnimation} from './fileHandler.js'
import '../css/lightGIS.css'
import '../css/bootstrap.css'
// makeElementMovable(document.getElementById('styles'))
window.onload = ()=>{
    window.canvas = document.getElementById('canvas')
    window.gm = new GisMap(canvas)
    window.interaction = new Interaction(gm)
    window.PTX = new PTX(gm,interaction)
}
window.handleDrop = function(e){
    e.preventDefault()
    const files = [...e.dataTransfer.items].filter(item=>item.kind=='file').map(item=>item.getAsFile())
    handleFiles(files)
}
window.handleFiles = function(files){
    for(let file of files){
        handleFile(file)
    }
    document.getElementById('file').value = null
}
async function handleFile(file){
    let filename = file.name.split('.')[0]
    let extension = file.name.match(/\.\w+$/i)[0]
    if(file.type.includes('image')){
        let img = new Image()
        img.src = URL.createObjectURL(file)
        img.onload = ()=>{
            let imageShape = new ImageShape(img,canvas.width/2,canvas.height/2,gm)
            interaction.imageShapes.unshift(imageShape)
        }
    }
    if(extension=='.geojson'){
        let text = await readFileAsText(file)
        let geojson = JSON.parse(text)
        geojson.features.map(f=>{f.properties['群組']=f.properties['群組']??filename})
        let groups = [...new Set(geojson.features.map(f=>f.properties['群組']))].filter(g=>g)
        if(groups.length)
            groups.map(group=>{interaction.addGroup(group)})
        else
            interaction.addGroup(group)
        gm.geojson(geojson)
        interaction.fitExtent(geojson.features)
    }else if(extension=='.kml'){
        let xjson = xml_string_to_json(await readFileAsText(file))
        let placemarks = []
        function findPlacemark(obj){
            if(typeof obj=='object'){
                for(let key in obj){
                    if(key=='Placemark')
                        placemarks.push(obj[key])
                    else
                        findPlacemark(obj[key])
                }
            }
        }
        findPlacemark(xjson)
        console.log(placemarks)
    }else if(extension=='.wkt'){
        gm.WKT(await readFileAsText(file))
    }else if(extension=='.json'){
        const dir = {0:'去程',1:'返程',2:'迴圈',255:'未知'}
        JSON.parse(await readFileAsText(file)).map(row=>{
            gm.WKT(row.Geometry,{'路線':row.RouteName.Zh_tw,'方向':dir[row.Direction]})
        })
    }
    interaction.renderGroupTable()
}
window.exportFile = function(){
    let filename = document.getElementById('file-export').value||'lightGIS'
    let extension = document.getElementById('file-extension').value
    let features = gm.selectEvent.features.length?gm.selectEvent.features:gm.vector
    if(extension=='.geojson'){
        const unproject = gm.toLnglat
        features = features.map(feature=>{
            let f = JSON.parse(JSON.stringify(feature))
            let coords = f.geometry.coordinates
            switch(f.geometry.type){
                case 'Point':
                    f.geometry.coordinates = unproject(coords);break;
                case 'MultiPoint':
                    f.geometry.coordinates = coords.map(coord=>unproject(coord));break;
                case 'LineString':
                    f.geometry.coordinates = coords.map(coord=>unproject(coord));break;
                case 'MultiLineString':
                    f.geometry.coordinates = coords.map(arr=>arr.map(coord=>unproject(coord)));break;
                case 'Polygon':
                    f.geometry.coordinates = coords.map(arr=>arr.map(coord=>unproject(coord)));break;
                case 'MultiPolygon':
                    f.geometry.coordinates = coords.map(arr2d=>arr2d.map(arr=>arr.map(coord=>unproject(coord))));break;
            }
            return f
        })
        let geojson = {type:'FeatureCollection',features}
        downloadText(JSON.stringify(geojson),filename+extension)
    }else if(extension=='.png'){
        downloadCanvas(canvas,filename+extension)
    }else if(extension=='.svg'){
        let paths = ''
        const canvasStyle2svgStyle = (style)=>{
            let mapper = {
                'r': style.radius,
                'fill': style.fill||'none',
                'stroke': style.stroke,
                'stroke-width': style.lineWidth,
                'fill-opacity': style.opacity,
            }
            return Object.keys(mapper).reduce((acc,cur)=>acc+` ${cur}="${mapper[cur]}"`,'').slice(1)
        }
        for(let feature of features){
            let style = canvasStyle2svgStyle(gm.getDefaultStyle(feature))
            if(feature.geometry.type=='Point'){
                let client = gm.coord2client(feature.geometry.coordinates).map(c=>parseInt(c))
                paths+= `<circle cx="${client[0]}" cy="${client[1]}" ${style}/>`
            }else if(feature.geometry.type=='LineString'){
                let clients = feature.geometry.coordinates.map(coord=>gm.coord2client(coord).map(c=>parseInt(c)))
                let d = clients.reduce((acc,cur,i)=>{
                    if(i==0) return acc+`M${cur[0]} ${cur[1]}`
                    else return acc+`L${cur[0]} ${cur[1]}`
                },'')
                paths+= `<path d="${d}" ${style}/>`
            }else if(feature.geometry.type=='Polygon'){
                let clients = feature.geometry.coordinates[0].map(coord=>gm.coord2client(coord).map(c=>parseInt(c)))
                let d = clients.reduce((acc,cur,i)=>{
                    if(i==0) return acc+`M${cur[0]} ${cur[1]}`
                    else return acc+`L${cur[0]} ${cur[1]}`
                },'')
                paths+= `<path d="${d}" ${style}/>`
            }
        }
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gm.view.w} ${gm.view.h}">${paths}</svg>`
        downloadText(svg,filename+extension)
    }
}
const loadingPage = document.getElementById('loading-page')
svgAnimation(loadingPage,'assets/light.svg',()=>{
    setTimeout(()=>{
        loadingPage.style.transition = 'opacity 1s'
        loadingPage.style.opacity = 0
    },100)
    setTimeout(()=>{
        document.body.removeChild(loadingPage)    
    },1000)
})