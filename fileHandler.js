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