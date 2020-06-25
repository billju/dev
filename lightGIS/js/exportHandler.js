export default {
    methods: {
        downloadLink(href,filename){
            let a = document.createElement('a')
            a.href = href
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        },
        downloadText(text,filename='downlaod.txt'){
            let href = "data:text/plain;charset=UTF-8," + encodeURIComponent(text)
            this.downloadLink(href,filename)
        },
        downloadCanvas(canvas,filename='downlaod.png'){
            let ext = filename.split('.')[1]
            let href = canvas.toDataURL(`image/${ext}`).replace('image/png','image/octet-stream')
            this.downloadLink(href,filename)
        },
        exportFile(features=this.gismap.selectEvent.features.length?this.gismap.selectEvent.features:this.gismap.vector){
            let filename = document.getElementById('file-export').value||'lightGIS'
            let extension = document.getElementById('file-extension').value
            if(extension=='.geojson'){
                const unproject = this.gismap.toLnglat
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
                this.downloadText(JSON.stringify(geojson),filename+extension)
            }else if(extension=='.png'){
                this.downloadCanvas(canvas,filename+extension)
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
                    let style = canvasStyle2svgStyle(this.gismap.getDefaultStyle(feature))
                    if(feature.geometry.type=='Point'){
                        let client = this.gismap.coord2client(feature.geometry.coordinates).map(c=>parseInt(c))
                        paths+= `<circle cx="${client[0]}" cy="${client[1]}" ${style}/>`
                    }else if(feature.geometry.type=='LineString'){
                        let clients = feature.geometry.coordinates.map(coord=>this.gismap.coord2client(coord).map(c=>parseInt(c)))
                        let d = clients.reduce((acc,cur,i)=>{
                            if(i==0) return acc+`M${cur[0]} ${cur[1]}`
                            else return acc+`L${cur[0]} ${cur[1]}`
                        },'')
                        paths+= `<path d="${d}" ${style}/>`
                    }else if(feature.geometry.type=='Polygon'){
                        let clients = feature.geometry.coordinates[0].map(coord=>this.gismap.coord2client(coord).map(c=>parseInt(c)))
                        let d = clients.reduce((acc,cur,i)=>{
                            if(i==0) return acc+`M${cur[0]} ${cur[1]}`
                            else return acc+`L${cur[0]} ${cur[1]}`
                        },'')
                        paths+= `<path d="${d}" ${style}/>`
                    }
                }
                let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.gismap.view.w} ${this.gismap.view.h}">${paths}</svg>`
                this.downloadText(svg,filename+extension)
            }
        }
    }
}