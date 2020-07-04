<template lang="pug">
.w-100.h-100
    canvas.w-100.h-100(ref="gismap" @drop="handleDrop($event)" @dragover="$event.preventDefault()")
    .position-fixed(v-if="!dialog" style="right:0;top:0;max-height:100%")
        el-tabs(v-model="tab" tab-position="left")
            el-tab-pane(label="網格" name="網格")
                Rasters(:gismap="gismap")
            el-tab-pane(label="向量" name="向量")
                .d-flex
                    .border-right.pr-1(style="width:80px")
                        Draggable(v-model="groups" :options="{animation:150}")
                            el-tooltip(v-for="group,i in groups" :key="i" :content="group.name" placement="left")
                                .btn.w-100.text-truncate(:class="groupIndex==i?`btn-${group.theme}`:`btn-outline-${group.theme}`"
                                    @dblclick="interaction.fitExtent(gismap.vectors.filter(f=>f.properties['群組']==group.name))"
                                    @click="handleGroupClick(i)") {{group.name}}
                        .w-100.border.my-2
                        .btn.btn-outline-danger.w-100(@click="addGroupPrompt()") 新增
                    .px-1(style="flex:1")
                        .btn-group.w-100
                            .btn.btn-outline-info(@click="moveGroup(groupName)") 移動至此
                            .btn.btn-outline-success(@click="interaction.fitExtent(selectedFeatures)") 聚焦
                            .btn.btn-outline-danger(@click="removeGroupPrompt()")
                                span &times;
                        .d-flex.align-items-center
                            el-switch.mx-1(v-model="groups[groupIndex].active" @change="toggleGroup($event)")
                            input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' 
                                v-model.number="groups[groupIndex].opacity" @input="setGroupProps(groupName,'opacity',$event.target.value)")
                        .d-flex.w-100
                            .btn.btn-outline-primary(@click="scrollGroupFeatures(-20)")
                                span &laquo;
                            .border.d-flex.align-items-center.justify-content-center(style="flex:1")
                                span {{groupRange.start}}~{{groupRange.end}} / {{groupRange.length}}
                            .btn.btn-outline-primary(@click="scrollGroupFeatures(20)")
                                span &raquo;
                        .btn-group.w-100
                            .btn.btn-outline-info(@click="renderTable(groupFeatures.map(f=>f.properties));dialog=true") 欄位
                            select.btn.btn-outline-info(v-model="groups[groupIndex].propKey")
                                option(v-for="key in propKeys" :key="key" :value="key") {{key}}
                        ol
                            li.cursor-pointer(v-for="feature,i in this.limitedGroupFeatures" :key="i" 
                                :value="groups[groupIndex].start+i+1"
                                :class="selectedFeatures.includes(feature)?'text-danger':''"
                                @click="handleClickSelect(feature)"
                                @contextmenu="$event.preventDefault();interaction.fitExtent([feature])"
                                @wheel="handleWheel($event)") 
                                    i(:class="type2icon[feature.geometry.type]") 
                                    span.mr-1 {{feature.properties[groups[groupIndex].propKey]}}
            el-tab-pane(label="樣式" name="樣式")
                Styles(:gismap="gismap" :interaction="interaction" :selectedFeatures="selectedFeatures")
            el-tab-pane(label="檔案" name="檔案" lazy)
                input(ref="file" type='file' style='display: none' @change='handleFiles($event.target.files)' multiple='true')
                .btn.btn-outline-primary.w-100(@click="$refs['file'].click()") 選取檔案或拖曳匯入
                .input-group
                    .input-group-prepend
                        .btn.btn-outline-success(@click="exportFile()") 匯出
                    input.form-control.btn.btn-outline-success(type='text' style='width:50px' v-model="filename")
                    select.btn.btn-outline-success(v-model="fileExtension")
                        option(v-for="ext in extensions" :key="ext" :value='ext') {{ext}}
                table.table.table-striped.table-hover.w-100
                    tbody
                        tr
                            td 檔案編碼
                            td 
                                select(v-model="encoding")
                                    option(v-for="enc in encodings" :key="enc" :value="enc") {{enc}}
                        tr
                            td 動畫插值
                            td
                                el-switch(v-model="allowAnimation" @change="toggleAnimation($event)")
                        tr
                            td  縮放Delta
                            td
                                el-input-number(size="mini" v-model="zoomDelta" :min="0.1" :max="1" :step="0.1" @change="gismap.zoomEvent.delta=zoomDelta")
                        tr
                            td 最大顯示
                            td
                                el-input-number(size="mini" v-model="maxRows" :min="10" :max="100")
                        tr
                            td 縮放範圍
                            td {{gismap.view?gismap.view.zoom:0}} / {{zoomRange}}
                        tr
                            td(colspan="2").px-3.py-0
                                el-slider(v-model="zoomRange" range show-stops :max="20"
                    @input="gismap.view.minZoom=zoomRange[0];gismap.view.maxZoom=zoomRange[1]")
                .w100.border.mx-2.my-1
                Draggable(v-model="gismap.imageShapes" :options="{animation:150}")
                    .d-flex.align-items-center.shadow-sm.px-1.py-1.cursor-pointer(v-for="imageShape,i in gismap.imageShapes" :key="i" 
                            :class="imageShape.editing?'bg-danger text-light':''" @click="imageShape.editing=!imageShape.editing")
                        span {{imageShape.filename}}
                        .custom-control.custom-switch.ml-2
                            input.custom-control-input(type='checkbox' v-model="imageShape.editable" :id="i")
                            label.custom-control-label(:for="i")
                        input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' v-model="imageShape.opacity"
                            draggable='true' ondragstart='event.preventDefault();event.stopPropagation()')
                        button.close(@click="gismap.imageShapes=gismap.imageShapes.filter(x=>x!=imageShape)")
                            span &times;
            el-tab-pane(label="PTX" name="PTX")
                PTX(:gismap="gismap" :interaction="interaction" @addGroup="addGroup($event)")
            el-tab-pane(label="說明" name="說明" lazy)
                Tutorial
            el-tab-pane(label="隱藏" name="隱藏")
    transition(name="fade-right")
        .position-fixed.bg-light(v-if="Object.keys(properties).length" style="left:0;top:0;max-width:250px;max-height:100%;overflow-y:auto")
            table.table.table-striped.table-hover
                tbody
                    tr(v-for="val,key in properties")
                        td {{key}}
                        td(v-html="val")
    transition(name="fade-up")
        .position-fixed(v-if="dialog" style="left:0;top:0;max-width:100%;max-height:100%;overflow:auto")
            table.table.table-striped.table-hover.w-100.h-100.pb-0(style="background:rgba(255,255,255,0.3)")
                thead.thead-light
                    tr
                        th(v-for="col,ci in cols" :key="ci")
                            .d-flex.justify-content-between.align-items-center
                                span(style="white-space:nowrap") {{col.key}}
                                span.d-flex
                                    i.el-icon-sort-down(@click="col.sort=col.sort==-1?0:-1" :class="col.sort==-1?'text-danger':'text-secondary'")
                                    i.el-icon-sort-up(@click="col.sort=col.sort==1?0:1" :class="col.sort==1?'text-danger':'text-secondary'")
                                button.close(@click="removeColumn(col.key);$event.stopPropagation()")
                                    span &times;
                            select.w-100(v-model="col.filter" @change="updateColumnList()")
                                option(value="")
                                option(v-for="li in col.list" :key="li" :value="li") {{li}}
                        th
                            .d-flex
                                .btn.btn-success(@click="confirmImport()") 匯入
                                button.close(@click="dialog=false")
                                    span &times;
                            .d-flex
                                label 緯度
                                select(v-model="importParams.lat")
                                    option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                            .d-flex
                                label 經度
                                select(v-model="importParams.lng")
                                    option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                            .d-flex
                                label WKT
                                select(v-model="importParams.WKT")
                                    option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                            .btn.btn-success(@click="leftJoin()") LEFT JOIN LIKE NOW
                            select(v-model="importParams.rightTableColumn")
                                option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                            select.btn.btn-outline-info(v-model="groups[groupIndex].propKey")
                                option(v-for="key in propKeys" :key="key" :value="key") {{key}}
                tbody
                    tr(v-for="row,ri in filterdRows.slice(0,maxRows)" :key="ri")
                        td(v-for="col,ci in cols" :key="ci" style="max-width:150px;text-overflow:ellipsis;") {{row[col.key]}}
                        td.d-flex
                            .btn.btn-outline-success(@click="addRowFeature(row)" style="white-space:nowrap") 試水溫
                            button.close(@click="rows=rows.filter(r=>r!=row)")
                                span &times;
    //- LoadingPage
</template>

<script>
import GisMap from '../js/GisMap.js'
import Interaction from '../js/interaction.js'
import importHandler from '../js/importHandler.js'
import exportHandler from '../js/exportHandler.js'
import Tutorial from './tutorial.vue'
import Rasters from './rasters.vue'
import Styles from './styles.vue'
import PTX from './ptx.vue'
import LoadingPage from './loadingPage.vue'
import Draggable from 'vuedraggable'

export default {
    name: 'app',
    components: {Tutorial,Rasters,Draggable,Styles,PTX,LoadingPage},
    mixins: [importHandler,exportHandler],
    data: ()=>({
        tab: '網格', gismap: GisMap, interaction: Interaction, fileExtension: '.geojson', filename: '', 
        extensions:['.geojson','.png','.svg','.csv'], encoding:'utf-8', encodings: ['utf-8','big5'],
        dialog: false, newGroup: '', maxRows: 50, maxItems:20, zoomRange: [0,20], zoomDelta:0.5,
        selectedFeatures: [], groupIndex:0, groups:[], imageShapes: [], importParams: {lat:'',lng:'',WKT:'',rightTableColumn:''},
        tmpFeatures:[], rows: [], cols:[], properties: [], allowAnimation: true, 
        type2icon: {
            Point:'el-icon-s-help',MultiPoint:'el-icon-s-help',
            LineString:'el-icon-data-line',MultiLineString:'el-icon-data-line',
            Polygon:'el-icon-picture',MultiPolygon:'el-icon-picture'
        },
    }),
    methods: {
        confirmImport(){
            if(this.tmpFeatures.length){
                this.tmpFeatures = this.tmpFeatures.filter(f=>this.filterdRows.includes(f.properties))
                let groupNames = [...new Set(this.tmpFeatures.map(f=>f.properties['群組']))].filter(g=>g)
                for(let groupName of groupNames)
                    this.addGroup(groupName)
                this.gismap.geojson({type:'FeatureCollection',features:this.tmpFeatures})
                this.interaction.fitExtent(this.tmpFeatures)
                this.tmpFeatures = []
            }else if(this.importParams.lng&&this.importParams.lat){
                let {lng,lat} = this.importParams
                let features = this.rows.filter(row=>!(isNaN(row[lng])||isNaN(row[lat]))).map(row=>{
                    return this.gismap.addVector('Point',[row[lng],row[lat]],{...row,'群組':this.filename})
                })
                this.interaction.fitExtent(features)
                this.addGroup(this.filename)
            }
            this.dialog = false
        },
        addRowFeature(row){
            let idx = this.tmpFeatures.findIndex(f=>f.properties==row)
            let feature = JSON.parse(JSON.stringify(this.tmpFeatures[idx]))
            this.gismap.geojson({type:'FeatureCollection',features:[feature]})
            this.interaction.fitExtent([feature])
            this.addGroup(feature.properties['群組'])
        },
        removeColumn(key){
            this.cols = this.cols.filter(col=>col.key!=key)
            this.rows.map(row=>{delete row[key]})
        },
        sortRule(a,b,key,direction=1){
            let A = key?a[key]:a
            let B = key?b[key]:b
            if(A==undefined||B==undefined) return 0
            return isNaN(A)?A.toString().localeCompare(B.toString())*direction:(A-B)*direction
        },
        updateColumnList(){
            for(let col of this.cols){
                col.list = [...new Set(this.filterdRows.map(obj=>obj[col.key]))]
                    .sort((a,b)=>this.sortRule(a,b,null,1)).slice(0,this.maxRows)
            }
        },
        renderTable(array){
            this.rows = array
            let cols = [...new Set(array.flatMap(obj=>Object.keys(obj)))]
            this.cols = cols.map(col=>({
                key:col, sort:0, filter:'',
                list:[...new Set(array.map(obj=>obj[col]))]
                    .sort((a,b)=>this.sortRule(a,b,null,1)).slice(0,this.maxRows)
            }))
        },
        handleDrawend(e){
            e.detail.feature.properties['群組'] = this.groupName
        },
        handleClickSelect(feature){
            if(this.selectedFeatures.includes(feature))
                this.handleSelect(this.selectedFeatures.filter(f=>f!=feature))
            else if(this.gismap.selectEvent.ctrlKey)
                this.handleSelect([...this.selectedFeatures,feature])
            else
                this.handleSelect([feature])
        },
        handleSelect(features){
            this.gismap.selectEvent.styling = false
            this.gismap.setSelectedFeatures(features)
            this.selectedFeatures = features
            this.properties = this.interaction.getFeaturesProp(features)
        },
        handleWheel(e){
            e.preventDefault()
            let offset = Math.sign(e.deltaY)*this.maxItems
            this.scrollGroupFeatures(offset)
        },
        scrollGroupFeatures(offset){
            let group = this.groups[this.groupIndex]
            group.start = 
                group.start+offset<0?0:
                group.start+offset>=this.groupFeatures.length?group.start:group.start+offset
        },
        handleGroupClick(groupIndex){
            if(this.groupIndex==groupIndex){
                let features = this.gismap.vectors.filter(f=>f.properties['群組']==this.groupName)
                this.handleSelect(features)
            }else{
                this.propKey = this.groups[groupIndex].propKey
                this.groupIndex = groupIndex
            }
        },
        addGroup(name,theme='success'){
            if(name&&this.groups.findIndex(g=>g.name==name)==-1)
                this.groups.push({name,theme,start:0,active:true,temp:[],opacity:1,propKey:''})
                this.newGroup = ''
        },
        addGroupPrompt(){
            this.addGroup(prompt('新增群組',`群組${this.groups.length+1}`))
        },
        setGroupProps(groupName,key,value){
            this.gismap.vectors.filter(f=>f.properties['群組']==groupName).map(f=>{f.properties[key]=value})
        },
        moveGroup(groupName){
            this.selectedFeatures.map(f=>{
                f.properties['群組'] = groupName
            })
            this.$set(this.groups,0,this.groups[0])
        },
        toggleGroup(bool){
            if(bool){
                this.gismap.vectors.unshift(...this.groups[this.groupIndex].temp)
                this.groups[this.groupIndex].temp = []
            }else{
                this.groups[this.groupIndex].temp = this.gismap.vectors.filter(f=>f.properties['群組']==this.groupName)
                this.gismap.vectors = this.gismap.vectors.filter(f=>f.properties['群組']!=this.groupName)
            }
        },
        removeGroupPrompt(){
            if(this.groups.length==1){
                alert('至少要留一個群組')
            }else if(confirm('確定要移除群組？移除後資料將無法復原')){
                this.gismap.vectors = this.gismap.vectors.filter(f=>f.properties['群組']!=this.groupName)
                this.groups.splice(this.groupIndex,1)
                this.groupIndex = this.groupIndex>0?this.groupIndex-1:0
            }
        },
        toggleAnimation(){
            this.gismap.moveEvent.frames = this.allowAnimation?90:1
            this.gismap.zoomEvent.frames = this.allowAnimation?25:1
            this.gismap.panEvent.frames = this.allowAnimation?60:1
        },
        leftJoin(){
            let rtc = this.importParams.rightTableColumn
            let ltc = this.groups[this.groupIndex].propKey
            for(let feature of this.groupFeatures){
                let prop = feature.properties[ltc]
                let idx = this.rows.findIndex(row=>row[rtc]==prop)
                if(idx!=-1){
                    feature.properties = {...feature.properties,...this.rows[idx]}
                }
            }
            this.dialog = false
        }
    },
    computed:{
        groupFeatures(){
            return this.gismap.vectors?this.gismap.vectors.filter(v=>v.properties['群組']==this.groupName):[]
        },
        groupName(){
            return this.groups[this.groupIndex].name
        },
        groupRange(){
            let group = this.groups[this.groupIndex]
            let length = this.groupFeatures.length
            let start = group.start>=length?0:group.start+1
            let end = group.start+this.maxItems>length?length:group.start+this.maxItems
            return {start,end,length}
        },
        limitedGroupFeatures(){
            let start = this.groups[this.groupIndex].start
            return this.groupFeatures.slice(start,start+this.maxItems)
        },
        filterdRows(){
            let rows = this.rows.slice()
            for(let col of this.cols)
                if(col.filter)
                    rows = rows.filter(row=>row[col.key]==col.filter)
            for(let col of this.cols)
                if(col.sort)
                    rows.sort((a,b)=>this.sortRule(a,b,col.key,col.sort))
            return rows
        },
        propKeys(){
            return [...new Set(this.groupFeatures.flatMap(f=>Object.keys(f.properties)))]
        }
    },
    created(){
        this.addGroup('群組1')
    },
    mounted(){
        this.gismap = new GisMap(this.$refs['gismap'])
        this.interaction = new Interaction(this.gismap)
        this.gismap.canvas.addEventListener('select',e=>{
            this.handleSelect(e.detail.features)
        })
        this.gismap.canvas.addEventListener('drawend',e=>{
            this.handleDrawend(e)
        })        
    }
}
</script>

<style>
*{
    font-family: 微軟正黑體;
}
html, body{
    margin: 0;
    height: 100%;
}
.w-100{
    width: 100%;
}
.h-100{
    height: 100%;
}
.cursor-pointer{
    cursor: pointer;
}
.text-shadow{
    font-weight: bold;
    color: black;
    text-shadow: -1px 0 white, 0 1px white, 1px 0 white, 0 -1px white;
}
.fade-enter-active, .fade-leave-active {
    transition: opacity .5s;
}
.fade-enter, .fade-leave-to{
    opacity: 0;
}
.fade-up-enter-active, .fade-up-leave-active {
    transition: opacity .5s,transform .5s;
}
.fade-up-enter, .fade-up-leave-to{
    opacity: 0;
    transform: translateY(30%);
}
.fade-right-enter-active, .fade-right-leave-active {
    transition: opacity .5s,transform .5s;
}
.fade-right-enter, .fade-right-leave-to{
    opacity: 0;
    transform: translateX(-50%);
}
</style>
<style scoped>
.el-tabs__content, .el-tab-pane{
    padding: 5px;
    max-width:320px;
    max-height:100vh;
    overflow-y:auto;
    background:rgba(255,255,255,0.6);
}
</style>