function astar(maze, start, end){
    let startNode = new Node(null, start)
    let endNode = new Node(null, end)
    let unvisited = [startNode]
    let visited = []
    const distanceFunction = {
        Manhattan: (p1,p2)=>Math.abs(p1[0]-p2[0])+Math.abs(p1[1]-p2[1]),
        Euclidean: (p1,p2)=>Math.pow(p1[0]-p2[0],2)+Math.pow(p1[1]-p2[1],2),
        Octile: ()=>{},
        Chebyshev: ()=>Math.max(Math.abs(p1[0]-p2[0]),Math.abs(p1[1]-p2[1]))
    }
    const isEqual = (p1,p2)=>p1.point[0]==p2.point[0]&&p1.point[1]==p2.point[1]
    while(unvisited.length){
        // extract the node which has the smallest f in unvisited
        unvisited.sort((a,b)=>a.f-b.f)
        let curNode = unvisited.shift()
        visited.push(curNode)
        // if shortest path is found!
        if(isEqual(curNode, endNode)){
            let path = []
            let node = curNode
            while(node){
                path.push(node)
                node = node.parent
            }
            return path.reverse()
        }
        // test moving conditions
        let children = []
        for(let dir of [[0,1],[0,-1],[1,0],[-1,0]]){
            let nodePos = [curNode.point[0]+dir[0],curNode.point[1]+dir[1]]
            if(nodePos[0]>maze.length-1 || nodePos[0]<0)
                continue
            if(nodePos[1]>maze[0].length-1 || nodePos[1]<0)
                continue
            if(maze[nodePos[0]][nodePos[1]]!=0)
                continue
            children.push(new Node(curNode, nodePos))    
        }
        // update node f value
        for(let child of children){
            for(let node of visited){
                if(isEqual(child,node))
                    continue
            }
            child.g = curNode.g + 1
            child.h = distanceFunction.Euclidean(child.point,endNode.point)
            child.f = child.g + child.h
            for(let node of unvisited){
                if(isEqual(child,node)&&child.g>node.g)
                    continue
            }
            unvisited.push(child)
        }
    }
}
let astar = new Astar(svgMaze.nodes,[0,0],[1,1])
var maze = [[0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
console.log(AStar(maze, [0,0], [7,6]))