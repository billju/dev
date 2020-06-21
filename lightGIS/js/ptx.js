export default class PTX{
    constructor(gismap,interaction){
        this.gismap = gismap
        this.interaction = interaction
        this.city = 'Taichung'
        this.cities = {
            Taipei:'臺北市',NewTaipei:'新北市',Taoyuan:'桃園市',Taichung:'臺中市',Tainan:'臺南市',
            Kaohsiung:'高雄市',Keelung:'基隆市',Hsinchu:'新竹市',HsinchuCounty:'新竹縣',MiaoliCounty:'苗栗縣',
            ChanghuaCounty:'彰化縣',NantouCounty:'南投縣',YunlinCounty:'雲林縣',ChiayiCounty:'嘉義縣',
            Chiayi:'嘉義市',PingtungCounty:'屏東縣',YilanCounty:'宜蘭縣',HualienCounty:'花蓮縣',
            TaitungCounty:'臺東縣',KinmenCounty:'金門縣',PenghuCounty:'澎湖縣',LienchiangCounty:'連江縣'
        }
    }
    renderTable(array){
        let table = document.createElement('table')
        table.className = 'table table-striped table-hover'
        let cols = [...new Set(array.flatMap(obj=>Object.keys(obj)))]
        let tr = table.insertRow()
        for(let col of cols){
            let th = document.createElement('th')
            th.textContent = col
            tr.appendChild(th)
        }
        for(let obj of array){
            let tr = table.insertRow()
            for(let col of cols){
                let td = tr.insertCell()
                td.textContent = obj[col]
            }
            tr.setAttribute('onclick',`PTX.`)
        }
        return table
    }
    renderTemplate(template,state){
        function replaceTemplateWithObject(temp,obj){
            for(let key in obj){
                temp = temp.replace(new RegExp(`{{${key}}}`,'g'),obj[key])
            }
            return temp
        }
        if(Array.isArray(state)){
            return state.reduce((acc,cur)=>acc+replaceTemplateWithObject(template,cur),'')
        }else{
            return replaceTemplateWithObject(template,state)
        }
    }
    fetchJSON(url){
        return new Promise((resolve,reject)=>{
            fetch(url).then(res=>res.json()).then(json=>{
                if(Array.isArray(json)&&json.length)
                    resolve(json)
                else
                    reject(new Error(JSON.stringify(json)))
            })
        })
    }
    renameArray(array,props){
        function nest(obj,key){
            function helper(obj,splitKey,idx=0){
                if(idx>=splitKey.length-1)
                    return obj[splitKey[idx]]
                else
                    return helper(obj[splitKey[idx]],splitKey,idx+1)
            }
            return helper(obj,key.split('.'))
        }
        return array.map(obj=>{
            let row = {}
            for(let key in props){
                row[props[key]] = nest(obj,key)
            }
            return row
        })
    }
    props2select(props){
        return [...new Set(Object.keys(props).map(key=>key.split('.')[0]))].join(',')
    }
    async Tourism(city='Taichung',type='ScenicSpot'){
        const basicInfo = {
            'Name':'名稱',
            'Description':'敘述',
            'Phone':'電話',
            'Address':'地址',
            'OpenTime':'開放時間',
            'Picture.PictureUrl1':'圖片網址',
            'Picture.PictureDescription1':'圖片簡介',
            'Position.PositionLat':'緯度',
            'Position.PositionLon':'經度'
        }
        let props = {
            ScenicSpot: basicInfo,
            Restaurant: basicInfo,
            Hotel: {
                ...basicInfo,
                'WebsiteUrl':'飯店網址',
                'ParkingInfo':'停車資訊',
            },
            Activity: {
                ...basicInfo,
                'WebsiteUrl':'活動網址',
                'Organizer':'主辦單位',
            },
        }[type]
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Tourism/${type}/${city}?$select=${this.props2select(props)}&$format=JSON`)
        if(json instanceof Error) return
        this.renameArray(json,props).map(row=>{
            this.gismap.addVector('Point',[row['經度'],row['緯度']],row)
        })
    }
    async BikeAvaiable(city='Taichung'){
        let props = {
            'StationUID':'UID',
            'ServiceAvailable':'服務中',
            'AvailableRentBikes':'可借',
            'AvailableReturnBikes':'可還',
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/${city}?$select=${this.props2select(props)}&$format=JSON`)
        return this.renameArray(json,props)
    }
    async Bike(city='Taichung'){
        let props = {
            'StationUID':'UID',
            'StationPosition.PositionLon':'經度',
            'StationPosition.PositionLat':'緯度',
            'StationName.Zh_tw':'站名',
            'StationAddress.Zh_tw':'地址',
            'BikesCapacity':'容量'
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bike/Station/${city}?$select=${this.props2select(props)}&$format=JSON`)
        if(json instanceof Error) return
        let avails = await this.BikeAvaiable(city)
        if(avails instanceof Error) return
        this.renameArray(json,props).map(row=>{
            let idx = avails.findIndex(x=>x['UID']==row['UID'])
            let extProps = idx==-1?{}:avails[idx]
            this.gismap.addVector('Point',[row['經度'],row['緯度']],{...row,...extProps,radius:row['容量']/10})
        })
    }
    async BusRoutes(city='Taichung'){
        let props = {
            'RouteUID':'UID',
            'RouteName.Zh_tw':'路線',
            'DepartureStopNameZh':'起點',
            'DestinationStopNameZh':'迄點'
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/${city}?$select=${this.props2select(props)}&$format=JSON`)
        if(json instanceof Error) return
        let table = this.renderTable(this.renameArray(json,props))
        for(let row of table.rows){
            row.onclick = ()=>{
                let UID = row.cells[0].textContent
                Promise.all([
                    this.BusShape(city,UID),
                    this.BusStops(city,UID)
                ]).then(arr=>{
                    let features = [...arr[0],...arr[1]]
                    this.interaction.addGroup(UID)
                    this.interaction.fitExtent(features)
                })
                
            }
        }
        document.getElementById('files').innerHTML = ''
        document.getElementById('files').appendChild(table)
    }
    async BusStops(city='Taichung',UID='TXG9'){
        let props = {
            'StopUID':'UID',
            'StopName.Zh_tw':'站名', 
            'StopSequence':'站序',
            'StopPosition.PositionLon':'經度',
            'StopPosition.PositionLat':'緯度',
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/${city}?$filter=RouteUID eq '${UID}'&$format=JSON`)
        if(json instanceof Error) return
        let route = json[0]
        let routeName = route['SubRouteName']['Zh_tw']
        let direction = route['Direction']
        return this.renameArray(route['Stops'],props).map(row=>{
            return this.gismap.addVector('Point',[row['經度'],row['緯度']],{...row,'路線':routeName,'方向':direction,'群組':UID})
        })
    }
    async BusShape(city='Taichung',UID='TXG9'){
        let props = {
            'RouteName.Zh_tw':'路線',
            'Direction':'方向',
            'Geometry':'WKT'
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/Shape/City/${city}?$select=${this.props2select(props)}&$filter=RouteUID eq '${UID}'&$format=JSON`)
        if(json instanceof Error) return
        return this.renameArray(json,props).map(row=>{
            return this.gismap.WKT(row['WKT'],{'路線':row['路線'],'方向':row['方向'],'群組':UID})
        })
    }
    async BusSchedule(city='Taichung',route=9){

    }
    async BusETA(city='Taichung',route=9){
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${city}/${route}?$select=PlateNumb,StopName,EstimateTime&$filter=NextBusTime ne null and RouteID eq '${route}'&$orderby=Direction,StopSequence&$format=JSON`)
        if(json instanceof Error) return
        let state = json.map(row=>{
            let date = new Date(row['NextBusTime'])
            let formateTime = ('0'+date.getHours()).substr(-2)+':'+('0'+date.getMinutes()).substr(-2)
            let formateEst = row['EstimateTime']>60?Math.floor(row['EstimateTime']/60):row['EstimateTime']
            return {
                dir: row['Direction'],
                time: row['EstimateTime']?formateEst+'分':formateTime,
                stop: row['StopName']['Zh_tw'],
                plate: row['PlateNumb']
            }
        })
        let template = `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span class="badge badge-primary badge-pill text-center" style="font-size: 16px;width:60px">{{time}}</span>
                <span class="px-2" style="flex:1">{{stop}}</span>
                <span class="badge badge-primary">{{plate}}</span>
            </li>
        `
        document.getElementById('files').innerHTML = this.renderTemplate(template,state)
    }
    async TRAShape(){
        let props = {
            'LineName.Zh_tw':'路線',
            'Geometry':'WKT'
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/TRA/Shape?$select=${this.props2select(props)}&$format=JSON`)
        if(json instanceof Error) return
        this.renameArray(json,props).map(row=>{
            this.gismap.WKT(row['WKT'],{'路線':row['路線']})
        })
    }
    async TRAStation(){
        let props = {
            'StationID':'UID',
            'StationName.Zh_tw':'車站',
            'StationPosition.PositionLon':'經度',
            'StationPosition.PositionLat':'緯度',
            'StationAddress':'地址'
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/TRA/Station?$select=${this.props2select(props)}&$format=JSON`)
        if(json instanceof Error) return
        this.renameArray(json,props).map(row=>{
            this.gismap.addVector('Point',[row['經度'],row['緯度']],row)
        })
    }
    async TRALiveBoard(StationID='0900'){
        let props = {
            'StationName.Zh_tw':'車站',
            'TrainNo':'車次',
            'Direction':'方向',
            'TrainTypeName.Zh_tw':'車種',
            'EndingStationName.Zh_tw':'末站',
            'DelayTime':'延遲(分)',
            'ScheduledArrivalTime':'抵達',
            'ScheduledDepartureTime':'發車'
        }
        let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/TRA/LiveBoard?$select=${this.props2select(props)}&$filter=StationID eq '${StationID}'&$format=JSON`)
        if(json instanceof Error) return
        let table = this.renderTable(this.renameArray(json,props))
        document.getElementById('files').innerHTML = table.outerHTML
    }
}