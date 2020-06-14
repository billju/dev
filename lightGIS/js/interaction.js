export default class Interaction{
    constructor(gismap){
        this.gismap = gismap
        this.imageShapes = []
        this.recycle = []
        this.propsTable = document.getElementById('properties')
        this.styleTable = document.getElementById('styles')
        this.copied = {features:[],center:[0,0]}
        this.groupTable = document.getElementById('group-table')
        this.gismap.raster = this.getDefaultRaster()
        this.renderRasterTable(document.getElementById('v-for'))
        this.tabs = ['raster','groups','styles','settings']
        this.groupIndex = 0
        this.groups = []
        this.addGroup('手繪')
        this.renderGroupTable()
        this.setActive('raster')
        this.isKeyup = true
        // custom events
        this.gismap.canvas.addEventListener('select',e=>{
            this.handleSelectFeatures(e.detail.features)
        })
        this.gismap.canvas.addEventListener('drawend',e=>{
            e.detail.feature.properties['群組'] = this.groups[this.groupIndex].name
            this.renderGroupTable()
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
            this.gismap.selectEvent.ctrlKey = e.ctrlKey
            if(this.isKeyup){
                const deleteSelected = ()=>{
                    if(this.gismap.selectEvent.features.length){
                        this.gismap.vector = this.gismap.vector.filter(feature=>!this.gismap.selectEvent.features.includes(feature))
                        this.recycle.push(this.gismap.selectEvent.features)
                        this.gismap.selectEvent.features = []
                        this.gismap.modifyEvent.feature = null
                        this.renderGroupTable()
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
                    this.renderGroupTable()
                }
                if(e.code&&!e.code.includes('Control'))
                    this.isKeyup = false
            }
            for(let imageShape of this.imageShapes)
                imageShape.handleKeydown(e)
        })
        window.addEventListener('keyup',e=>{
            this.gismap.selectEvent.ctrlKey = e.ctrlKey
            this.isKeyup = true
            for(let imageShape of this.imageShapes)
                imageShape.handleKeyup(e)
        })
        this.gismap.canvas.addEventListener('wheel',e=>{
            this.gismap.handleWheel(e)
        })
        window.addEventListener('resize',()=>{
            this.gismap.handleResize()
        })
    }
    setActive(tab){
        for(let tab of this.tabs){
            document.getElementById(tab).style.display = 'none'
        }
        document.getElementById(tab).style.display = 'block'
    }
    handleSelectFeatures(features){
        this.gismap.selectEvent.styling = false
        if(features.length==1){
            this.renderFeatureProps(features[0])
            this.renderPropsTable(features[0].properties)
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
        }else{
            this.renderPropsTable({})
        }
        this.renderGroupTable()
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
    addGroup(name=document.getElementById('new-group').value,theme='success'){
        if(name&&this.groups.findIndex(g=>g.name==name)==-1){
            this.groups.push({name,theme,start:0,active:true,opacity:1})
            this.renderGroupTable()
        }
    }
    moveGroup(){
        this.gismap.selectEvent.features.map(f=>{
            f.properties['群組'] = this.groups[this.groupIndex].name
        })
        this.renderGroupTable()
    }
    setGroupProps(groupIndex,key,value){
        let group = this.groups[groupIndex]
        group[key] = value
        this.gismap.vector.filter(f=>f.properties['群組']==group.name).map(f=>{f.properties[key]=value})
    }
    removeGroup(groupIndex){
        if(this.groups.length==1){
            alert('至少要留一個群組！')
        }else if(confirm('確定要移除群組？移除後資料將無法復原')){
            this.gismap.vector = this.gismap.vector.filter(f=>f.properties['群組']!=this.groups[groupIndex].name)
            this.groups.splice(groupIndex,1)            
            this.renderGroupTable()
        }
    }
    renderGroupTable(){
        this.allVector = []
        this.groupTable.innerHTML = ''
        this.groups.map((group,i)=>{
            let features = this.gismap.vector.filter(f=>f.properties['群組']==group.name)
            let tr = this.groupTable.insertRow()
            tr.className = this.groupIndex==i?`bg-${group.theme} text-light`:''
            let tdName = tr.insertCell()
            tdName.style.width = '100px'
            tdName.textContent = group.name
            tdName.onclick = ()=>{
                if(this.groupIndex==i){
                    this.gismap.selectEvent.features = features
                    this.handleSelectFeatures(features)
                }else{
                    this.groupIndex = i
                }
                this.renderGroupTable()
            }
            tdName.ondblclick = ()=>{
                this.fitExtent(this.gismap.vector.filter(f=>f.properties['群組']==group.name))
            }
            let widgets = tr.insertCell()
            widgets.className = 'custom-control d-flex align-items-center'
            widgets.innerHTML+= `<input type="checkbox" checked="${group.active}" onchange="interaction.groups[${i}].active=event.target.value"/>`
            widgets.innerHTML+= `<input type="range" class="custom-range ml-2" min="0" max="1" step="0.1" value="${group.opacity}" style="direction:rtl" oninput="interaction.setGroupProps(${i},'opacity',event.target.value)"/>`
            widgets.innerHTML+= `<button class="close ml-2" style="margin-top:-4px" onclick="interaction.removeGroup(${i})"><span>&times;</span></button>`
            if(this.groupIndex==i){
                let trFeature = this.groupTable.insertRow()
                let tdCount = trFeature.insertCell()
                let tdFeature = trFeature.insertCell()
                tdFeature.className = 'bg-light'
                const renderList = ()=>{
                    let end = group.start+20>features.length?features.length:group.start+20    
                    tdCount.textContent = `${group.start}~${end} / ${features.length}`
                    tdFeature.innerHTML = ''
                    features.slice(group.start,end).map((feature,i)=>{                    
                        let li = document.createElement('div')
                        li.style.cursor = 'pointer'
                        li.textContent = `${feature.geometry.type} ${group.start+i}`
                        li.className = this.gismap.selectEvent.features.includes(feature)?'text-danger':''
                        li.onclick = ()=>{
                            this.gismap.selectEvent.features = [feature]
                            this.handleSelectFeatures([feature])
                        }
                        li.ondblclick = ()=>{
                            this.fitExtent([feature])
                        }
                        tdFeature.appendChild(li)
                    })
                }
                renderList()
                tdFeature.onwheel = e=>{
                    e.preventDefault()
                    let sign = Math.sign(e.deltaY)*20
                    group.start = group.start+sign<0?0:group.start+sign>=features.length?group.start:group.start+sign
                    renderList()
                }
            }
        })
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