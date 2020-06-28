<template lang="pug">
.px-1
    .input-group
        .input-group-prepend
            .btn.btn-outline-primary(@click="Tourism(city,tourType)") {{tourTypes[tourType]}}位址
        select.form-control(v-model="tourType")
            option(v-for="(val,key) in tourTypes" :key="key" :value="key") {{val}}
    .input-group
        .input-group-prepend
            .btn.btn-outline-primary(@click="Bike()") iBike即時站位
        select.form-control(v-model="city")
            option(v-for="(val,key) in cities" :key="key" :value="key") {{val}}
    .btn-group
        .btn.btn-outline-primary(@click="TRAShape()") 台鐵線型
        .btn.btn-outline-primary(@click="TRAStation()") 台鐵車站
    .input-group
        .input-group-prepend
            .btn.btn-outline-primary(@click="TRALiveBoard(TRAStationID)") 台鐵動態
        input.form-control.btn.btn-outline-primary(type='text' style='width:50px' v-model="TRAStationID")
    .input-group
        .input-group-prepend
            .btn.btn-outline-success(@click="BusRoutes(city)") 公車路線
        select.form-control.btn.btn-outline-success(v-model="city")
            option(v-for="(val,key) in cities" :key="key" :value="key") {{val}}
    .input-group
        .input-group-prepend
            .btn.btn-outline-success(@click="BusETA(city,UID)") 公車抵達時間
        input.form-control.btn.btn-outline-success(type='text' style='width:50px' v-model="UID")
    .position-fixed.h-100(v-if="rows.length" style="left:0;top:0;max-width:500px;overflow-y:scroll")
        table.table.table-striped.table-hover.table-responsive.bg-light
            thead.thead-light
                tr
                    th(v-for="col in cols" :key="col") {{col}}
            tbody
                tr(v-for="row,i in rows" :key="i" @click="row.handleClick()")
                    td(v-for="col in cols" :key="col") {{row[col]}}
    el-tabs(v-model="tab" stretch)
        el-tab-pane(label="去程" name="去程")
            ETA(:busETA="busETA.filter(x=>x.dir==0)")
        el-tab-pane(label="返程" name="返程")
            ETA(:busETA="busETA.filter(x=>x.dir==1)")
        el-tab-pane(label="環狀" name="環狀")
            ETA(:busETA="busETA.filter(x=>x.dir==2)")
</template>

<script>
import ETA from './eta.vue'
export default {
    name: 'PTX',
    props: ['gismap','interaction'],
    components: {ETA},
    data:()=>({
        UID:'TXG9', city:'Taichung', cities: {
            Taipei:'臺北市',NewTaipei:'新北市',Taoyuan:'桃園市',Taichung:'臺中市',Tainan:'臺南市',
            Kaohsiung:'高雄市',Keelung:'基隆市',Hsinchu:'新竹市',HsinchuCounty:'新竹縣',MiaoliCounty:'苗栗縣',
            ChanghuaCounty:'彰化縣',NantouCounty:'南投縣',YunlinCounty:'雲林縣',ChiayiCounty:'嘉義縣',
            Chiayi:'嘉義市',PingtungCounty:'屏東縣',YilanCounty:'宜蘭縣',HualienCounty:'花蓮縣',
            TaitungCounty:'臺東縣',KinmenCounty:'金門縣',PenghuCounty:'澎湖縣',LienchiangCounty:'連江縣'
        }, cols: [], rows:[], busETA:[], tab: '去程', TRAStationID:'0900', 
        tourType: 'ScenicSpot', tourTypes:{
            ScenicSpot:'景點',Restaurant:'餐廳',Hotel:'飯店',Activity:'活動'
        }
    }),
    methods:{
        renderTable(rows){
            for(let row of rows)
                if(!row.handleClick) row.handleClick = ()=>{}
            this.cols = [...new Set(rows.flatMap(obj=>Object.keys(obj)))].filter(col=>col!='handleClick')
            let key = this.cols[0]
            this.rows = rows.sort((a,b)=>a[key].toString().localeCompare(b[key]))
        },
        fetchJSON(url){
            return new Promise((resolve,reject)=>{
                fetch(url).then(res=>res.json()).then(json=>{
                    if(Array.isArray(json)&&json.length)
                        resolve(json)
                    else
                        reject(new Error(JSON.stringify(json)))
                })
            })
        },
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
        },
        props2select(props){
            return [...new Set(Object.keys(props).map(key=>key.split('.')[0]))].join(',')
        },
        async Tourism(city='Taichung',type='ScenicSpot'){
            const basicInfo = {
                'Name':'名稱',
                'Description':'敘述',
                'Phone':'電話',
                'Address':'地址',
                'Picture.PictureUrl1':'圖片網址',
                'Picture.PictureDescription1':'圖片簡介',
                'Position.PositionLat':'緯度',
                'Position.PositionLon':'經度'
            }
            let props = {
                ScenicSpot: {
                    ...basicInfo,
                    'OpenTime':'開放時間',
                },
                Restaurant: {
                    ...basicInfo,
                    'OpenTime':'開放時間',
                },
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
            let group = this.cities[city]+this.tourTypes[type]
            this.renameArray(json,props).map(row=>{
                this.gismap.addVector('Point',[row['經度'],row['緯度']],{...row,'群組':group})
            })
            this.$emit('addGroup',group)
        },
        async BikeAvaiable(city='Taichung'){
            let props = {
                'StationUID':'UID',
                'ServiceAvailable':'服務中',
                'AvailableRentBikes':'可借',
                'AvailableReturnBikes':'可還',
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/${city}?$select=${this.props2select(props)}&$format=JSON`)
            return this.renameArray(json,props)
        },
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
            let group = 'iBike'+city
            this.renameArray(json,props).map(row=>{
                let idx = avails.findIndex(x=>x['UID']==row['UID'])
                let extProps = idx==-1?{}:avails[idx]
                this.gismap.addVector('Point',[row['經度'],row['緯度']],{...row,...extProps,radius:row['容量']/10,'群組':group})
            })
            this.$emit('addGroup',group)
        },
        async BusRoutes(city='Taichung'){
            let props = {
                'RouteUID':'UID',
                'RouteName.Zh_tw':'路線',
                'DepartureStopNameZh':'起點',
                'DestinationStopNameZh':'迄點'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/${city}?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            let rows = this.renameArray(json,props)
            rows.map(row=>{
                row.handleClick = async ()=>{
                    let shape = await this.BusShape(city,row.UID)
                    let stops = await this.BusStops(city,row.UID)
                    this.interaction.fitExtent([...shape,...stops])
                    this.$emit('addGroup',row.UID)
                }
            })
            this.renderTable(rows)
        },
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
                return this.gismap.addVector('Point',[row['經度'],row['緯度']],{
                    ...row,'路線':routeName,'方向':direction,'群組':UID,
                    fontWeight:3,fontFamily:'微軟正黑體',textFill:'rgba(255,255,255,1)',
                    textStroke:'rgba(0,0,0,1)',radius:6,lineWidth:3,text:row['站名']
                })
            })
        },
        async BusShape(city='Taichung',UID='TXG9'){
            let props = {
                'RouteName.Zh_tw':'路線',
                'Direction':'方向',
                'Geometry':'WKT'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/Shape/City/${city}?$select=${this.props2select(props)}&$filter=RouteUID eq '${UID}'&$format=JSON`)
            if(json instanceof Error) return
            return this.renameArray(json,props).map(row=>{
                return this.gismap.WKT(row['WKT'],{
                    '路線':row['路線'],'方向':row['方向'],'群組':UID, lineWidth: 6
                })
            })
        },
        async BusSchedule(city='Taichung',route=9){

        },
        async BusETA(city=this.city,UID='TXG9'){
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${city}?$select=PlateNumb,StopName,EstimateTime&$filter=NextBusTime ne null and RouteUID eq '${UID}'&$orderby=Direction,StopSequence&$format=JSON`)
            if(json instanceof Error) return
            this.busETA = json.map(row=>{
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
        },
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
        },
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
        },
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
            this.renderTable(this.renameArray(json,props))
        }
    },
    mounted(){

    }
}
</script>

<style scoped>

</style>