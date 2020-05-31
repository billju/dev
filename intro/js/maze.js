class Node{
    constructor(point=[0,0]){
        this.point = point
        this.neighbors = []
        this.from = null
        this.isWall = false
        this.g = 0
        this.h = 0
        this.f = 0
        //styles
        this.fill = 'white'
    }
    isEqual(node){
        return this.point[0]==node.point[0]&&this.point[1]==node.point[1]
    }
    Manhattan(node){
        return Math.abs(this.point[0]-node.point[0])+Math.abs(this.point[1]-node.point[1])
    }
    Euclidean(node){
        return Math.pow(this.point[0]-node.point[0],2)+Math.pow(this.point[1]-node.point[1],2)
    }
    Chebyshev(node){
        return Math.max(Math.abs(this.point[0]-node.point[0]),Math.abs(this.point[1]-node.point[1]))
    }
    findNeighbors(dirs=[[0,1],[0,-1],[1,0],[-1,0]],nodes=Maze.nodes){
        this.neighbors = []
        for(let dir of dirs){
            let x = this.point[0]+dir[0]
            let y = this.point[1]+dir[1]
            if(x<0||x>=nodes.length)
                continue
            if(y<0||y>=nodes[0].length)
                continue
            if(nodes[x][y].isWall)
                continue
            this.neighbors.push(nodes[x][y])
        }
        return this.neighbors
    }
}
class Maze{
    constructor(container){
        this.container = container
        this.type = container.tagName
        if(this.type=='CANVAS')
            this.ctx = this.container.getContext('2d')
        this.size = 30
        this.event = {active: false, fill: undefined, index: -1}
        this.nodes = []
        this.init()
        this.container.addEventListener('mousedown',e=>{
            this.event.active = true            
            this.render(e)
        })
        this.container.addEventListener('mousemove',e=>{
            this.render(e)
        })
        this.container.addEventListener('mouseup',e=>{
            this.event = {active: false, fill: undefined, index: -1}
        })
        this.container.addEventListener('mouseleave',e=>{
            this.event = {active: false, fill: undefined, index: -1}
        })
    }
    init(){
        this.container.innerHTML = ''
        this.nodes = []
        this.resize()
        this.createNodes()
        this.createRects()
    }
    resize(){
        const W = this.container.clientWidth
        const H = this.container.clientHeight
        this.rows = Math.ceil(H/this.size)
        this.columns = Math.ceil(W/this.size)
        if(this.type=='svg'){
            this.container.setAttribute('viewBox',`0 0 ${W} ${H}`)
        }else if(this.type=='CANVAS'){
            this.container.width = W
            this.container.height = H
        }
    }
    createNodes(){
        let dirs = [[0,1],[0,-1],[1,0],[-1,0]]
        for(let i=0;i<this.columns;i++){
            let row = []
            for(let j=0;j<this.rows;j++){
                row.push(new Node([i,j]))
            }
            this.nodes.push(row)
        }
    }
    createRects(){
        this.container.innerHTML = ''
        if(this.type=='CANVAS')
            this.ctx.clearRect(0,0,this.container.width,this.container.height)
        for(let i=0;i<this.columns;i++){
            for(let j=0;j<this.rows;j++){
                if(this.type=='svg'){
                    let rect = document.createElementNS('http://www.w3.org/2000/svg','rect')
                    rect.dataset.fill = 'white'
                    rect.setAttribute('x',i*this.size)
                    rect.setAttribute('y',j*this.size)
                    rect.setAttribute('width',this.size)
                    rect.setAttribute('height',this.size)
                    rect.setAttribute('stroke','black')
                    rect.setAttribute('fill','white')
                    rect.style.transition = 'transform 0.2s'
                    this.container.appendChild(rect)
                }else if(this.type=='CANVAS'){
                    this.strokeStyle = 'black'
                    this.ctx.strokeRect(i*this.size,j*this.size,this.size,this.size)
                }
            }
        }
    }
    setNodeFill(node,fill){
        if(this.type=='svg'){
            this.getElementOfNode(node).style.fill = fill
        }else if(this.type=='CANVAS'){
            let size = this.size
            this.ctx.fillStyle = fill
            this.ctx.fillRect(node.point[0]*size,node.point[1]*size,size,size)
            this.ctx.strokeRect(node.point[0]*size,node.point[1]*size,size,size)
            if(node.text)
                this.setNodeText(node,node.text)
        }
    }
    setNodeText(node,textContent){
        if(this.type=='svg'){
            if(node.text){
                node.text.textContent = textContent
            }else{
                let text = document.createElementNS('http://www.w3.org/2000/svg','text')
                text.setAttribute('x',node.point[0]*this.size+this.size/2)
                text.setAttribute('y',node.point[1]*this.size+this.size/2)
                text.setAttribute('text-anchor','middle')
                text.setAttribute('dominant-baseline','middle')
                text.textContent = textContent
                this.container.appendChild(text)
                node.text = text
            }
        }else if(this.type=='CANVAS'){
            node.text = textContent
            this.ctx.font = '12px Sans-Serif'
            let metric = this.ctx.measureText(textContent)
            let x = node.point[0]*this.size+this.size/2-metric.width/2
            let y = node.point[1]*this.size+this.size/2+6
            this.ctx.fillStyle = 'black'
            this.ctx.fillText(textContent,x,y)
        }
    }
    getElementOfNode(node){
        let idx = node.point[0]*this.rows+node.point[1]
        return this.container.children[idx]
    }
    getRandomNode(exceptions=[]){
        let node = this.nodes[Math.floor(Math.random()*this.columns)][Math.floor(Math.random()*this.rows)]
        let maxIter = 100, i = 0
        while(i++<maxIter&&exceptions.some(ex=>ex.isEqual(node)))
            node = this.nodes[Math.floor(Math.random()*this.columns)][Math.floor(Math.random()*this.rows)]
        return node
    }
    randomWall(exceptions=[],threshold=0.7){
        this.nodes.flatMap(n=>n).map(node=>{
            node.isWall = exceptions.some(ex=>node.isEqual(ex))?false:Math.random()>threshold
            if(node.isWall)
                this.setNodeFill(node,color.grey)
        })
    }
    render(e){
        let rect = this.container.getBoundingClientRect()
        if(this.event.active){
            let dx = Math.floor((e.clientX-rect.left)/this.size)
            let dy = Math.floor((e.clientY-rect.top)/this.size)
            let idx = dx*this.rows+dy
            if(this.event.index!=idx){
                let scale = 1.1, coef = this.size*(scale-1), pad = 5
                let children = this.container.children
                if(this.event.fill===undefined)
                    this.event.fill = this.nodes[dx][dy].fill=='white'?color.grey:'white'
                this.nodes[dx][dy].isWall = this.event.fill==color.grey
                this.nodes[dx][dy].fill = this.event.fill
                // render
                if(this.type=='svg'){
                    children[idx].style.fill = this.event.fill
                    children[idx].style.transform = `matrix(${scale},0,0,${scale},${-dx*coef-pad},${-dy*coef-pad})`
                    setTimeout(()=>{
                        children[idx].style.transform = 'matrix(1,0,0,1,0,0)'
                    },200)
                }else if(this.type=='CANVAS'){
                    this.setNodeFill(this.nodes[dx][dy],this.event.fill)
                }
                this.event.index = idx
            }
        }
    }
}
class Astar{
    constructor(nodes=[],start=Node,end=Node){
        this.nodes = nodes
        this.curNode = start
        this.endNode = end
        this.unvisited = [this.curNode]
        this.visited = []
    }
    getPath(){
        let path = []
        let node = this.curNode
        while(node){
            path.push(node)
            node = node.from
        }
        return path.reverse()
    }
    nextStep(){
        if(this.unvisited.length==0) return 'infeasible'
        if(this.curNode.isEqual(this.endNode)) return 'finished'
        // extract the node which has the smallest f in unvisited
        this.unvisited.sort((a,b)=>a.f-b.f)
        this.curNode = this.unvisited.shift()
        this.visited.push(this.curNode)
        // update f value
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]]//,[1,1],[-1,1],[1,-1],[-1,-1]]
        const neighbors = this.curNode.findNeighbors(dirs,this.nodes)
        for(let neighbor of neighbors){
            // if neighbor is visited
            if(neighbor.from) continue
            if(this.visited.some(node=>neighbor.isEqual(node))) continue
            neighbor.g = this.curNode.g + 1
            neighbor.h = neighbor.Euclidean(this.endNode)
            neighbor.f = neighbor.g + neighbor.h
            neighbor.from = this.curNode
            // if g value is not smaller
            if(this.unvisited.some(node=>neighbor.isEqual(node)&&neighbor.g>node.g)) continue
            this.unvisited.push(neighbor)
        }
        return 'not yet'
    }
    findSolution(){
        let msg = this.nextStep()
        while(msg=='not yet'){
            msg = this.nextStep()
        }
        return msg
    }
}
const color = {
    blue: '#5DC3E2',
    green: '#D5F5E3',
    darkgreen: '#58D68D',
    red: '#F5B7B1',
    grey: '#5D6D7E',
    lime: '#5DE2BF'
}
const maze = new Maze(document.getElementById('maze'))
maze.waiting = false
var startNode, endNode, timeout, astar
resetMaze()
maze.container.onclick = e=>{
    if(maze.waiting){
        resetMaze()
        maze.waiting = false
    }else{
        nextStep()
    }
}
function nextStep(){
    let msg = astar.nextStep()
    astar.unvisited.map(node=>{
        maze.setNodeFill(node,color.green)
        maze.setNodeText(node,node.f)
    })
    astar.visited.map(node=>{
        maze.setNodeFill(node,color.darkgreen)
    })
    maze.setNodeFill(startNode,color.blue)
    maze.setNodeFill(endNode,color.red)
    maze.setNodeFill(astar.curNode,color.blue)
    if(msg=='not yet'){
        timeout = setTimeout(()=>{
            nextStep()
        }, 50)
    }else if(msg=='finished'){
        astar.getPath().map(node=>{
            maze.setNodeFill(node,color.lime)
        })
        maze.setNodeFill(startNode,color.blue)
        maze.setNodeFill(endNode,color.red)
        maze.waiting = true
    }else{
        maze.waiting = true
        // alert('no feasible path')
    }
}
function resetMaze(){
    clearTimeout(timeout)
    astar = new Astar(maze.nodes,startNode,endNode)
    maze.init()
    startNode = maze.getRandomNode()
    endNode = maze.getRandomNode([startNode])
    astar = new Astar(maze.nodes,startNode,endNode)
    maze.randomWall([startNode,endNode],0.7)
    maze.setNodeFill(startNode,color.blue)
    maze.setNodeFill(endNode,color.red)
}
window.addEventListener('resize',()=>{
    resetMaze()
})