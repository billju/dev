export function Bike_Station(city='Taichung'){
    fetch(`https://ptx.transportdata.tw/MOTC/v2/Bike/Station/${city}?$select=StationName%2CStationPosition%2CBikesCapacity&$format=JSON`)
        .then(res=>res.json()).then(json=>{
        for(let row of json){
            gm.addVector('Point',[row.StationPosition.PositionLon,row.StationPosition.PositionLat],{
                "車站": row.StationName.Zh_tw,
                "容量": row.BikesCapacity,
                "經度": row.StationPosition.PositionLon,
                "緯度": row.StationPosition.PositionLat,
                radius: row.BikesCapacity/10,
            })
        }
    })
}
function Bus_EstimatedTimeOfArrival(route=9){
    `
    <div class="row">
        <ul id="go" class="list-group col-6">
            <li id="template" class="list-group-item d-flex justify-content-between align-items-center">
                <span class="badge badge-primary badge-pill text-center" style="font-size: 16px;width:60px">{{time}}</span>
                <span class="px-2" style="flex:1">{{stop}}</span>
                <span class="badge badge-primary">{{plate}}</span>
            </li>
        </ul>
        <ul id="back" class="list-group col-6">
        </ul>
    </div>
    `
    let url = `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taichung/${route}?$select=PlateNumb,StopName,EstimateTime&$filter=NextBusTime ne null and RouteID eq '${route}'&$orderby=Direction,StopSequence&$format=JSON`
    let template = document.getElementById('template')
    fetch(url,{}).then(res=>res.json()).then(json=>{
        let go = document.getElementById('go')
        let back = document.getElementById('back')
        console.log(json)
        json.map(row=>{
            let li = template.cloneNode(true)
            let date = new Date(row.NextBusTime)
            let formateTime = ('0'+date.getHours()).substr(-2)+':'+('0'+date.getMinutes()).substr(-2)
            let formateEst = row.EstimateTime>60?Math.floor(row.EstimateTime/60):row.EstimateTime
            let state = {
                time: row.EstimateTime?formateEst+'分':formateTime,
                stop: row.StopName.Zh_tw,
                plate: row.PlateNumb
            }
            for(let child of li.children){
                for(let key in state){
                    child.textContent = child.textContent.replace(`{{${key}}}`,state[key])
                }
            }
            if(row.Direction==0){
                go.appendChild(li)
            }else{
                back.appendChild(li)
            }
        })
        template.remove()
    })
}