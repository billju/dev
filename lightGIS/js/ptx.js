const Cities = [
    {en:'Taipei',zh_tw:'臺北市'},
    {en:'NewTaipei',zh_tw:'新北市'},
    {en:'Taoyuan',zh_tw:'桃園市'},
    {en:'Taichung',zh_tw:'臺中市'},
    {en:'Tainan',zh_tw:'臺南市'},
    {en:'Kaohsiung',zh_tw:'高雄市'},
    {en:'Keelung',zh_tw:'基隆市'},
    {en:'Hsinchu',zh_tw:'新竹市'},
    {en:'HsinchuCounty',zh_tw:'新竹縣'},
    {en:'MiaoliCounty',zh_tw:'苗栗縣'},
    {en:'ChanghuaCounty',zh_tw:'彰化縣'},
    {en:'NantouCounty',zh_tw:'南投縣'},
    {en:'YunlinCounty',zh_tw:'雲林縣'},
    {en:'ChiayiCounty',zh_tw:'嘉義縣'},
    {en:'Chiayi',zh_tw:'嘉義市'},
    {en:'PingtungCounty',zh_tw:'屏東縣'},
    {en:'YilanCounty',zh_tw:'宜蘭縣'},
    {en:'HualienCounty',zh_tw:'花蓮縣'},
    {en:'TaitungCounty',zh_tw:'臺東縣'},
    {en:'KinmenCounty',zh_tw:'金門縣'},
    {en:'PenghuCounty',zh_tw:'澎湖縣'},
    {en:'LienchiangCounty',zh_tw:'連江縣'},
]
export function Station(type,city='Taichung'){
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
function AllRoute(city='Taichung'){
    let url = `https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/${city}$select=RouteName%2CDepartureStopNameZh%2CDestinationStopNameZh&$format=JSON`
}
function Route(city='Taichung',route=9){
    let Stops = `https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/${city}/${route}?$select=Direction%2CStops&$format=JSON`
    let Shape = `https://ptx.transportdata.tw/MOTC/v2/Bus/Shape/City/${city}/${route}?$select=Geometry&$format=JSON`
    let Schedule = `https://ptx.transportdata.tw/MOTC/v2/Bus/Schedule/City/${city}/${route}?$select=Direction%2CFrequencys&$format=JSON`
    // Stops.StopName.Zh_tw
    // Stops.StopPosition.PositionLat
    // Stops.StopPosition.PositionLon
}
function Tour(){
    let types = []
}
function ETA(city='Taichung',route=9,go,back){    
    let url = `
        https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${city}/${route}
        ?$select=PlateNumb,StopName,EstimateTime&$filter=NextBusTime ne null and RouteID eq '${route}'&$orderby=Direction,StopSequence&$format=JSON
    `
    fetch(url,{}).then(res=>res.json()).then(json=>{
        json.map(row=>{
            let date = new Date(row['NextBusTime'])
            let formateTime = ('0'+date.getHours()).substr(-2)+':'+('0'+date.getMinutes()).substr(-2)
            let formateEst = row['EstimateTime']>60?Math.floor(row['EstimateTime']/60):row['EstimateTime']
            let state = {
                time: row['EstimateTime']?formateEst+'分':formateTime,
                stop: row['StopName']['Zh_tw'],
                plate: row['PlateNumb']
            }
            let template = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="badge badge-primary badge-pill text-center" style="font-size: 16px;width:60px">${state.time}</span>
                    <span class="px-2" style="flex:1">${state.stop}</span>
                    <span class="badge badge-primary">${state.plate}</span>
                </li>
            `
            if(row.Direction==0){
                go.innerHTML += template
            }else{
                back.innerHTML += template
            }
        })
    })
}