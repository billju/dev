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
    // .string {
    //     color: orange;
    // }
    // .number {
    //     color: lightgreen;
    // }
    // .boolean {
    //     color: blue;
    // }
    // .null {
    //     color: deeppink;
    // }
    // .key {
    //     color: lightblue;
    // }
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
function downloadLink(href,filename){
    let a = document.createElement('a')
    a.href = href
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}
export function downloadText(text,filename='downlaod.txt'){
    let href = "data:text/plain;charset=UTF-8," + encodeURIComponent(text)
    downloadLink(href,filename)
}
export function downloadCanvas(canvas,filename='downlaod.png'){
    let ext = filename.split('.')[1]
    let href = canvas.toDataURL(`image/${ext}`).replace('image/png','image/octet-stream')
    downloadLink(href,filename)
}
// window.addEventListener('paste',e=>{
//     let blob = e.clipboardData.items[0].getAsFile()
// })
export function svgAnimation(
        container,url,callback,
        style={
            strokeDasharray:2500,
            strokeDashoffset:2500,
            transition: 'stroke-dashoffset 5000ms',
            width:'100%',
            height:'100%',
        }){
    const xhr = new XMLHttpRequest();
    xhr.open("GET",url,false);
    xhr.overrideMimeType("image/svg+xml");
    xhr.onload = function() {
        let svg = xhr.responseXML.documentElement
        Object.assign(svg.style,style)
        container.appendChild(svg);
        setTimeout(()=>{
            svg.style.strokeDashoffset = 0
            setTimeout(()=>{
                callback()
            },2000)
        },100)
    }
    xhr.send();
}