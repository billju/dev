function getPTX(){
    fetch('https://ptx.transportdata.tw/MOTC/v2/Bike/Station/Taichung?$select=StationName%2CStationPosition%2CBikesCapacity&$format=JSON')
    .then(res=>res.json()).then(json=>{
        for(let row of json){
            gm.addVector('POINT',[row.StationPosition.PositionLon,row.StationPosition.PositionLat],{
                "車站": row.StationName.Zh_tw,
                "容量": row.BikesCapacity,
                "經度": row.StationPosition.PositionLon,
                "緯度": row.StationPosition.PositionLat,
                radius: row.BikesCapacity/10,
            })
        }
    })
}