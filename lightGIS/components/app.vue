<template lang="pug">
.w-100.h-100
    canvas.w-100.h-100(ref="gismap" @drop="handleDrop($event)" @dragover="$event.preventDefault()")
    .position-fixed(style="right:0;top:0;max-height:100%")
        el-tabs(v-model="tab" tab-position="left")
            el-tab-pane(label="網格" name="網格")
                Rasters(:gismap="gismap" :show="tab=='網格'")
            el-tab-pane(label="向量" name="向量" lazy)
                .d-flex
                    .border-right.pr-1(style="width:80px")
                        Draggable(v-model="groups" :options="{animation:150}")
                            el-tooltip(v-for="group,i in groups" :key="i" :content="group.name" placement="left")
                                .btn.w-100.text-truncate(:class="groupIndex==i?`btn-${group.theme}`:`btn-outline-${group.theme}`"
                                    @dblclick="renameGroupPrompt()"
                                    @click="handleGroupClick(i)") {{group.name}}
                        .w-100.border.my-2
                        .btn.btn-outline-danger.w-100(@click="addGroupPrompt()") 新增
                    .px-1.flex-grow-1
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
                            .border.d-flex.align-items-center.justify-content-center.flex-grow-1
                                span {{groupRange.start}}~{{groupRange.end}} / {{groupRange.length}}
                            .btn.btn-outline-primary(@click="scrollGroupFeatures(20)")
                                span &raquo;
                        .btn-group.w-100
                            .btn.btn-outline-info(@click="renderTable(groupFeatures.map(f=>f.properties));showDataTable=true") 欄位
                            select.btn.btn-outline-info(v-model="groups[groupIndex].propKey")
                                option(v-for="key in propKeys" :key="key" :value="key") {{key}}
                        ol(style="min-height:200px")
                            li.cursor-pointer(v-for="feature,i in this.limitedGroupFeatures" :key="i" 
                                :value="groups[groupIndex].start+i+1"
                                :class="selectedFeatures.includes(feature)?'text-danger':''"
                                @click="handleClickSelect(feature)"
                                @contextmenu="$event.preventDefault();interaction.fitExtent([feature])"
                                @wheel="handleWheel($event)") 
                                    i(:class="type2icon[feature.geometry.type]") 
                                    span.mr-1 {{feature.properties[groups[groupIndex].propKey]}}
            el-tab-pane(label="樣式" name="樣式")
                Styles(:gismap="gismap" :interaction="interaction" :selectedFeatures="selectedFeatures" :show="tab=='樣式'")
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
                            td 縮放範圍
                            td {{gismap.view?gismap.view.zoom:0}} / {{zoomRange}}
                        tr
                            td(colspan="2").px-3.py-0
                                el-slider(v-model="zoomRange" range show-stops :max="20"
                    @input="gismap.view.minZoom=zoomRange[0];gismap.view.maxZoom=zoomRange[1]")
                .w100.border.mx-2.my-1
                // 圖片底圖
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
                PTX(:gismap="gismap" :interaction="interaction" @addGroup="addGroup($event)" @handleSelect="handleSelect($event)" :show="tab=='PTX'")
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
        .position-fixed.w-100.h-100.d-flex.flex-column(v-if="showDataTable" style="left:0;top:0;")
            .w-100.flex-grow-1.bg-dark(style="max-height:100%;overflow:auto")
                table.table.table-dark.w-100.mb-0
                    thead
                        tr
                            th 
                            th(v-for="col,ci in cols" :key="ci")
                                .d-flex.align-items-center
                                    span.flex-grow-1(style="white-space:nowrap") {{col.key}}
                                    span.d-flex.cursor=pointer
                                        i.el-icon-d-caret(v-if="col.sort==0" @click="col.sort=1")
                                        i.el-icon-top(v-else-if="col.sort==1" @click="col.sort=-1")
                                        i.el-icon-bottom(v-else @click="col.sort=0")
                                    i.el-icon-close.cursor-pointer(@click="removeColumn(col.key);$event.stopPropagation()")
                                select.w-100(v-model="col.filter" @change="updateColumnList();page=1")
                                    option(value="")
                                    option(v-for="li in col.list" :key="li" :value="li") {{li}}
                            
                    tbody
                        tr(v-for="row,ri in filteredRows.slice((page-1)*maxRows,page*maxRows)" :key="ri")
                            td {{(page-1)*maxRows+ri+1}}
                            td(v-for="col,ci in cols" :key="ci" style="max-width:150px;text-overflow:ellipsis;" 
                                contenteditable @blur="row[col.key]=$event.target.textContent") {{row[col.key]}}
            .d-flex.justify-content-center.align-items-center.bg-white
                el-pagination(:page-size="maxRows" :page-count="10" layout="prev,pager,next" :total="filteredRows.length" @current-change="page=$event")
                .btn.btn-sm.btn-outline-success(v-if="filename!=groupName" @click="confirmImport()") 匯入
                .btn.btn-sm.btn-outline-success(v-else @click="confirmSelect()") 選取
                el-popover(placement="top" trigger="click")
                    .btn.btn-sm.btn-outline-info(slot="reference") 其他
                    .input-group.input-group-sm.align-items-center
                        .input-group-prepend
                            span.input-group-text 每頁顯示
                        input.custom-range.form-control(type="range" v-model="maxRows" min="5" max="100")
                    .w-100(v-if="!importing")
                        .input-group.input-group-sm
                            .input-group-prepend
                                .btn.btn-outline-success(
                                    @click="rows.map(row=>{row[newColumn]=''});renderTable(groupFeatures.map(f=>f.properties))") 新增欄位
                            input.form-control(type="text" v-model="newColumn")
                    .w-100(v-else)
                        .input-group.input-group-sm
                            .input-group-prepend
                                span.input-group-text 圖層名稱
                            input.form-control(v-model="filename")
                        .input-group.input-group-sm
                            .input-group-prepend
                                span.input-group-text 緯度
                            select.form-control(v-model="importParams.lat")
                                option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                        .input-group.input-group-sm
                            .input-group-prepend
                                span.input-group-text 經度
                            select.form-control(v-model="importParams.lng")
                                option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                        .input-group.input-group-sm
                            .input-group-prepend
                                span.input-group-text WKT
                            select.form-control(v-model="importParams.WKT")
                                option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                        .btn.btn-sm.btn-outline-info(@click="leftJoin()") LEFT JOIN LIKE NOW
                        .input-group.input-group-sm
                            .input-group-prepend
                                span.input-group-text 輸入欄位
                            select.form-control(v-model="importParams.rightTableColumn")
                                option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                        .input-group.input-group-sm
                            .input-group-prepend
                                span.input-group-text 目標群組
                            select.form-control(v-model="groupIndex")
                                option(v-for="group,gi in groups" :key="gi" :value="gi") {{group.name}}
                        .input-group.input-group-sm
                            .input-group-prepend
                                span.input-group-text 合併欄位
                            select.form-control(v-model="groups[groupIndex].propKey")
                                option(v-for="key in propKeys" :key="key" :value="key") {{key}}
                .btn.btn-sm.btn-outline-danger(@click="importing=showDataTable=false;") 關閉
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
        showDataTable: false, importing:false, newGroup: '', newColumn:'', page: 1, maxRows: 10, maxItems:20, zoomRange: [0,20], zoomDelta:0.5,
        selectedFeatures: [], groupIndex:0, groups:[], imageShapes: [], importParams: {lat:'',lng:'',WKT:'',rightTableColumn:''},
        tmpFeatures:[], rows: [], cols:[], properties: [], allowAnimation: true, 
        type2icon: {
            Point:'el-icon-s-help',MultiPoint:'el-icon-s-help',
            LineString:'el-icon-data-line',MultiLineString:'el-icon-data-line',
            Polygon:'el-icon-picture',MultiPolygon:'el-icon-picture'
        },
        loading: false,
    }),
    methods: {
        confirmImport(){
            let {lng,lat,WKT} = this.importParams
            if(this.tmpFeatures.length){
                this.tmpFeatures = this.tmpFeatures.filter(f=>this.filteredRows.includes(f.properties))
                // add group name
                this.tmpFeatures.map(f=>{f.properties['群組']=f.properties['群組']??this.filename})
                let groupNames = [...new Set(this.tmpFeatures.map(f=>f.properties['群組']))].filter(g=>g)
                for(let groupName of groupNames)
                    this.addGroup(groupName)
                // add vector
                this.gismap.geojson({type:'FeatureCollection',features:this.tmpFeatures})
                this.interaction.fitExtent(this.tmpFeatures)
                this.handleSelect(this.tmpFeatures)
                this.tmpFeatures = []
            }else if(lng&&lat){
                let features = this.filteredRows.filter(row=>!(isNaN(row[lng])||isNaN(row[lat]))).map(row=>{
                    return this.gismap.addVector('Point',[row[lng],row[lat]],{...row,'群組':this.filename})
                })
                this.interaction.fitExtent(features)
                this.handleSelect(features)
                this.addGroup(this.filename)
            }else if(WKT){
                let features = this.filteredRows.filter(row=>row[WKT]).map(row=>{
                    let props = {...row,'群組':this.filename}
                    delete props[WKT]
                    return this.gismap.WKT(row[WKT],props)
                })
                this.interaction.fitExtent(features)
                this.handleSelect(features)
                this.addGroup(this.filename)
            }
            this.showDataTable = false
        },
        confirmSelect(){
            let features = this.groupFeatures.filter(f=>this.filteredRows.includes(f.properties))
            this.handleSelect(features)
            this.showDataTable=false
            this.interaction.fitExtent(features)
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
                col.list = [...new Set(this.filteredRows.map(obj=>obj[col.key]))]
                    .sort((a,b)=>this.sortRule(a,b,null,1)).slice(0,100)
            }
        },
        renderTable(array){
            this.rows = array
            let cols = [...new Set(array.flatMap(obj=>Object.keys(obj)))]
            this.cols = cols.map(col=>({
                key:col, sort:0, filter:'',
                list:[...new Set(array.map(obj=>obj[col]))]
                    .sort((a,b)=>this.sortRule(a,b,null,1)).slice(0,100)
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
            this.filename = this.groupName
        },
        addGroup(name,theme='success'){
            if(name&&this.groups.findIndex(g=>g.name==name)==-1){
                let propKey
                if(this.gismap.vectors){
                    let idx = this.gismap.vectors.findIndex(f=>f.properties['群組']==name)
                    if(idx!==-1){
                        let keys = Object.keys(this.gismap.vectors[idx].properties)
                        if(keys.length)
                            propKey = keys[0]
                    }
                }
                this.groups.push({name,theme,start:0,active:true,temp:[],opacity:1,propKey})
                this.newGroup = ''
            }
        },
        renameGroupPrompt(){
            let oldName = this.groupName
            let newName = prompt('變更群組名稱',oldName)
            if(this.groups.map(g=>g.name).includes(newName)&&oldName!=newName){
                alert(`${newName} 名稱重複了`)
            }else if(newName){
                this.groups[this.groupIndex].name = newName
                this.gismap.vectors.filter(f=>f.properties['群組']==oldName).map(f=>{f.properties['群組']=newName})
            }
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
            this.importing = this.showDataTable = false
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
        filteredRows(){
            let rows = this.rows.slice()
            for(let col of this.cols)
                if(col.filter!='')
                    rows = rows.filter(row=>row[col.key]==col.filter)
            for(let col of this.cols)
                if(col.sort!=0)
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
        window.addEventListener('paste',e=>{
            this.handleSelect(this.gismap.selectEvent.features)
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