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
function xml_string_to_json(xmlstr) {
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
function handleRequest(){
    let url = document.getElementById('request-url').value
    // fetch(url,{}).then(res=>res.json()).then(text=>{})
    const xhr = new XMLHttpRequest()
    xhr.open('GET',url)
    xhr.setRequestHeader('user-agent','Mozilla/5.0 (Windows NT 6.1; Win64; x64)')
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