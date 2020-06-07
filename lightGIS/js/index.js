import makeElementMovable from './makeElementMovable.js'
import GisMap from './GisMap.js'
import ImageShape from './ImageShape.js'
import Interaction from './interaction.js'
import {readFileAsText,downloadCanvas,downloadText} from './fileHandler.js'
import '../css/lightGIS.css'
import '../css/bootstrap.css'
makeElementMovable(document.getElementById('styles'))
window.onload = ()=>{
    window.canvas = document.getElementById('canvas')
    window.gm = new GisMap(canvas)
    window.interaction = new Interaction(gm)
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
    let ext = file.name.match(/\.\w+$/i)[0]
    if(file.type.includes('image')){
        let img = new Image()
        img.src = URL.createObjectURL(file)
        img.onload = ()=>{
            let imageShape = new ImageShape(img,canvas.width/2,canvas.height/2,gm)
            interaction.imageShapes.unshift(imageShape)
        }
    }
    if(ext=='.geojson'){
        let text = await readFileAsText(file)
        let geojson = JSON.parse(text)
        let layer = file.name.split('.')[0]
        geojson.features.map(f=>{f.properties['圖層']=layer})
        gm.geojson(geojson)
        interaction.fitExtent(geojson.features)
    }else if(ext=='.kml'){
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
    }else if(ext=='.wkt'){
        gm.WKT(await readFileAsText(file))
    }else if(ext=='.json'){
        const dir = {0:'去程',1:'返程',2:'迴圈',255:'未知'}
        JSON.parse(await readFileAsText(file)).map(row=>{
            gm.WKT(row.Geometry,{'路線':row.RouteName.Zh_tw,'方向':dir[row.Direction]})
        })
    }
}
window.exportFile = function(){
    let filename = document.getElementById('file-export').value||'lightGIS'
    let extension = document.getElementById('file-extension').value
    if(extension=='.geojson'){
        const unproject = gm.toLnglat
        let features = gm.selectEvent.features.map(feature=>{
            let f = {...feature}, coords = feature.geometry.coordinates
            switch(f.geometry.type){
                case 'Point':
                    f.geometry.coordinates = unproject(coords);break;
                case 'MultiPoint':
                    f.geometry.coordinates = coords.map(coord=>unproject(coord));break;
                case 'LineString':
                    console.log(unproject)
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
    }
}