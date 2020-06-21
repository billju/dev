function handleCSV(text){
    // copied from https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
    var pattern = new RegExp(
        // Delimiters.
        "(\\" + this.delimiter + "|\\r?\\n|\\r|^)" +
        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        // Standard fields.
        "([^\"\\" + this.delimiter + "\\r\\n]*))"
    ,"gi")
    var aoa = [[]], matches
    while(matches = pattern.exec(text)){
        if(matches[1].length&&matches[1]!=this.delimiter){
            aoa.push([])
        }
        var matched = matches[2]?matches[2].replace(new RegExp('\"\"','g'),'\"'):matches[3]
        aoa[aoa.length-1].push(matched)
    }
}
export function readFileAsText(file){
    let reader = new FileReader()
    return new Promise((resolve,reject)=>{
        reader.onload = ()=>{
            resolve(reader.result)
        }
        reader.readAsText(file)
    })
}
export function xml_string_to_json(xmlstr) {
    let parser = new DOMParser();
    let srcDOM = parser.parseFromString(xmlstr, "application/xml");
    function xml2json(srcDOM) {
        let children = [...srcDOM.children];
        if (!children.length) { return srcDOM.innerHTML } 
        let jsonResult = {};
        for (let child of children) {
            let childIsArray = children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1;
            if (childIsArray) {
                if (jsonResult[child.nodeName] === undefined) {
                    jsonResult[child.nodeName] = [xml2json(child)];
                } else {
                    jsonResult[child.nodeName].push(xml2json(child));
                }
            } else {
                jsonResult[child.nodeName] = xml2json(child);
            }
        }
        return jsonResult;
    }
    return xml2json(srcDOM)
};
function beautifiedJsonHtml(){
    let json = JSON.stringify(this.rows,null,2)
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match=>{
        var cls = 'number'
        if (/^"/.test(match)) {
            cls = /:$/.test(match)?'key':'string'
        } else if (/true|false/.test(match)) {
            cls = 'boolean'
        } else if (/null/.test(match)) {
            cls = 'null'
        }
        return '<span class="' + cls + '">' + match + '</span>'
    });
    // .string {color: orange;}
    // .number {color: lightgreen;}
    // .boolean {color: blue;}
    // .null {color: deeppink;}
    // .key {color: lightblue;}
}
function handleUpload(){
    let url = document.getElementById('request-url').value
    // fetch(url,{}).then(res=>res.json()).then(text=>{})
    const xhr = new XMLHttpRequest()
    xhr.open('GET',url)
    // xhr.setRequestHeader('user-agent','Mozilla/5.0 (Windows NT 6.1; Win64; x64)')
    xhr.send()
    xhr.onload = ()=>{
        xhr.responseText
    }
    // const formData = new FormData()
    // formData.append('filename',file)
    // xhr.open('POST','upload').send(formData)
    // xhr.upload.onprogress = e=>{
    //     if(e.lengthComputable){
    //         e.loaded / e.total
    //     }
    // }
}
// window.addEventListener('paste',e=>{
//     let blob = e.clipboardData.items[0].getAsFile()
// })

function handleDrop(e){
    e.preventDefault()
    const files = [...e.dataTransfer.items].filter(item=>item.kind=='file').map(item=>item.getAsFile())
    handleFiles(files)
}
function handleFiles(files){
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