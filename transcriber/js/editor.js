export default class Editor{
    constructor(textEditor, lineNumbers){
        this.textEditor = textEditor
        this.lineNumbers = lineNumbers
        this.observer = new MutationObserver(()=>{this.update()})
        this.lineIndex = -1
        this.observer.observe(this.textEditor,{
            attributes: false,
            childList: true,
            subtree: false
        })
        this.oncue = ()=>{}
        this.currentTime = 0
        this.update()
        this.textEditor.addEventListener('keydown',e=>{
            this.keydown(e)
        })
        window.addEventListener('resize',()=>{
            this.resize()
        })
    }
    getFormatTime(seconds, format="hh:mm:ss"){
        const ss = ('0'+~~(seconds%60)).substr(-2)
        const mm = ('0'+~~(seconds/60%60)).substr(-2)
        const hh = ('0'+~~(seconds/3600%24)).substr(-2)
        const mis = (seconds%1).toFixed(3).substr(2)
        return format.replace('hh',hh).replace('mm',mm).replace('ss',ss).replace('mis',mis)
    }
    parseTime(str, format='hh:mm:ss,mis'){
        let matches = str.match(/(\d+):(\d+):(\d+),(\d+)/)
        let seconds = matches[1]*3600+matches[2]*60+matches[3]*1+matches[4]*0.001
        return parseFloat(seconds)
    }
    getSubtitles(){
        let subtitles = []
        for(let i=0;i<this.textEditor.childNodes.length;i++){
            let text = this.textEditor.childNodes[i].textContent
            let time = this.textEditor.childNodes[i].dataset.time*1
            subtitles.push({time,text})
        }
        return subtitles.sort((a,b)=>a.time-b.time)
    }
    getTextAtTime(time){
        let subtitles = this.getSubtitles()
        let lastText = subtitles[0].text
        for(let subtitle of subtitles){
            if(subtitle.time>=time){
                return lastText
            }
            lastText = subtitle.text
        }
        return lastText
    }
    sort(){
        this.getSubtitles().map((subtitle,i)=>{
            this.textEditor.childNodes[i].dataset.time = subtitle.time
            if(subtitle.text)
                this.textEditor.childNodes[i].textContent = subtitle.text
            else
            this.textEditor.childNodes[i].innerHTML = '<br>'
        })
        this.updateLineNumbers()
    }
    updateLineNumbers(){
        this.lineNumbers.innerHTML = ''
        for(let childNode of this.textEditor.childNodes){
            let div = document.createElement('div')
            div.innerText = this.getFormatTime(childNode.dataset.time)
            div.style.height = childNode.clientHeight+'px'
            div.onclick = ()=>{
                this.oncue({time})
            }
            this.lineNumbers.appendChild(div)
        }
    }
    update(){
        for(let i=0;i<this.textEditor.childNodes.length;i++){
            let time = parseFloat(this.textEditor.childNodes[i].dataset.time)
            if(i==0){
                time = 0
            }else if(i==this.lineIndex){
                time = this.currentTime
            }
            this.textEditor.childNodes[i].dataset.time = time
        }
        this.updateLineNumbers()
    }
    resize(){
        for(let i=0;i<this.textEditor.childNodes.length&&this.lineNumbers.childNodes.length;i++){
            let div = this.lineNumbers.childNodes[i]
            div.style.height = this.textEditor.childNodes[i].clientHeight+'px'
        }
    }
    keydown(e){
        if(e.ctrlKey&&e.code=='keyB'){
            document.execCommand('bold')
        }
        if(e.ctrlKey&&e.code=='keyU'){
            document.execCommand('underline')
        }
        if(e.ctrlKey&&e.code=='keyI'){
            document.execCommand('italic')
        }
        if(e.code=='Enter'){
            let {row,col} = this.getCursor(this.textEditor)
            this.lineIndex = row+1
        }
        if(e.code=='Backspace'){
            if(this.textEditor.childNodes.length<=1&&this.textEditor.firstChild.textContent==''){
                e.preventDefault()
            }
        }
    }
    getCursor(parentNode){
        let sel = document.getSelection()
        let anchorNode = sel.anchorNode.parentNode==parentNode?
            sel.anchorNode:sel.anchorNode.parentNode
        let row = 0
        while((anchorNode=anchorNode.previousSibling)!=null){row++}
        let col = sel.focusOffset
        return {row,col}
    }
    setCursor(element, focusOffset){
        let range = document.createRange();
        let sel = window.getSelection();
        range.setStart(element, focusOffset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    insertContent(element){
        let sel = document.getSelection()
        let anchorNode = sel.anchorNode
        if(anchorNode==editor){
            anchorNode.appendChild(element)
        }else if(anchorNode.innerHTML=='<br>'){
            anchorNode.firstChild.remove()
            anchorNode.appendChild(element)
            this.setCursor(element,element.textContent.length)
        }else{
            let prevText = anchorNode.textContent.slice(0,sel.focusOffset)
            anchorNode.textContent = anchorNode.textContent.slice(sel.focusOffset)
            let textNode = document.createTextNode(prevText)
            anchorNode.parentNode.insertBefore(element,anchorNode)
            anchorNode.parentNode.insertBefore(textNode,element)
        }
    }
    loadFromLocalStorage(){
        const lastFile = localStorage.getItem('vizTranscriber')
        if(lastFile)
            this.textEditor.innerHTML = lastFile
    }
    save(){
        localStorage.setItem('vizTranscriber',this.textEditor.innerHTML)
    }
    importSrt(){
        const parseSrt = (srt)=>{
            let fromSec = 0
            srt.split('\n').map((line,i)=>{
                if(i%4==1){
                    fromSec = this.parseTime(line.split(' --> ')[0],'hh:mm:ss,mis')
                }
                if(i%4==2){
                    let div = document.createElement('div')
                    div.dataset.time = fromSec
                    div.textContent = line
                    this.textEditor.appendChild(div)
                }
            })
        }
        let fileInput = document.createElement('input')
        fileInput.setAttribute('type','file')
        fileInput.setAttribute('accept','.srt')
        fileInput.style.display = 'none'
        document.body.appendChild(fileInput)
        fileInput.onchange = e=>{
            const file = e.target.files[0]
            if(file){
                const reader = new FileReader()
                reader.onload = ()=>{
                    parseSrt(reader.result)
                    document.body.removeChild(fileInput)
                }
                reader.readAsText(file)
            }
        }
        fileInput.click()
    }
    exportSrt(){
        let lines = [...this.textEditor.children].map(el=>{
            return {time: this.getFormatTime(el.dataset.time,'hh:mm:ss,mis'), text:el.textContent}
        }).sort((a,b)=>a.time-b.time)
        let srt = ''
        for(let i=0;i<lines.length-1;i++){
            srt+=`${i+1}\n${lines[i].time} --> ${lines[i+1].time}\n${lines[i].text}\n\n`
        }
        let duration = this.getFormatTime(player.duration)
        srt+=`${lines.length}\n${lines[lines.length-1].time} --> ${duration}\n${lines[lines.length-1].text}`
        let a = document.createElement('a')
        a.href = "data:text/plain;charset=UTF-8," + encodeURIComponent(srt)
        a.download = 'vizTranscriber.srt'
        a.click()
        return srt
    }
}