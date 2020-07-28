<template lang="pug">
.w-100.h-100
    .w-100.h-100(ref="heatmap")
        canvas.w-100.h-100(ref="gismap" @drop="handleDrop($event)" @dragover="$event.preventDefault()" :style="{background:bgColor}")
    .position-fixed.d-flex.align-items-center.px-2.py-1(v-if="gismap.view&&showScale" style="right:0;bottom:0;user-select:none;")
        span.text-shadow {{gismap.view.scaleText}}
        .mx-2.py-1.border(:style="scaleStyle")
    .position-fixed.h-100.bg-dark.text-light(style="left:0;top:0;width:320px;overflow-y:auto")
        .w-100.btn-group.btn-group-sm
            el-tooltip(content="新增群組" placement="bottom-start")
                .btn.btn-success(@click="addGroupPrompt()") 
                    i.el-icon-plus
            el-tooltip(content="移動選取項目至目前群組" placement="bottom-start")
                .btn.btn-info(@click="moveGroup(groupName)") 
                    i.el-icon-position
            el-tooltip(content="置頂" placement="bottom-end")
                .btn.btn-info(@click="interaction.moveLayerTo('top')")
                    i.el-icon-upload2
            el-tooltip(content="置底" placement="bottom-end")
                .btn.btn-info(@click="interaction.moveLayerTo('bottom')")
                    i.el-icon-download
            el-tooltip(content="聚焦" placement="bottom-end")
                .btn.btn-success(@click="interaction.fitExtent(selectedFeatures)")
                    i.el-icon-aim
            el-tooltip(content="複製(ctrl+c)" placement="bottom-end")
                .btn.btn-success(@click="interaction.copySelected()")
                    i.el-icon-document-copy
            el-tooltip(content="貼上(ctrl+v)" placement="bottom-end")
                .btn.btn-success(@click="interaction.pasteSelected(true)")
                    i.el-icon-document
            el-tooltip(content="刪除(ctrl+x)" placement="bottom-end")
                .btn.btn-danger(@click="interaction.deleteSelected()")
                    i.el-icon-delete
        el-tabs(v-model="tab" tab-position="top" type="card")
            el-tab-pane(label="網格" name="網格")
                Rasters(:gismap="gismap" :show="tab=='網格'")
            el-tab-pane(label="向量" name="向量" lazy)
                .w-100.px-2.py-1(v-for="group,i in groups" :key="i" :class="groupIndex==i?`border border-${group.theme}`:'border-bottom'" @click="handleGroupClick(i)")
                    .py-1
                        span {{group.name}}
                        select.float-right(v-model="group.propKey" :disabled="groupIndex!=i")
                            option(v-if="groupIndex!=i") {{group.propKey}}
                            option(v-else v-for="key in propKeys" :key="key" :value="key") {{key}}
                    div(v-if="groupIndex==i")
                        .btn-group.btn-group-sm.float-right
                            el-popover(placement="bottom" trigger="hover")
                                span 透明度
                                input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' 
                                    v-model.number="groups[groupIndex].opacity" @input="setGroupProps(groupName,'opacity',$event.target.value)")
                                .btn.btn-sm.btn-outline-info(slot="reference")
                                    i.el-icon-magic-stick
                            el-tooltip(content="資料表格" placement="bottom")
                                .btn.btn-outline-info(@click="renderTable(groupFeatures.map(f=>f.properties));showDataTable=true")
                                    i.el-icon-menu
                            el-tooltip(content="選取全部" placement="bottom")
                                .btn.btn-outline-info(@click="handleSelect(groupFeatures)")
                                    i.el-icon-finished
                            el-tooltip(content="檢視或隱藏" placement="bottom")
                                .btn(@click="toggleGroup()" :class="`btn-outline-${groups[groupIndex].active?'info':'danger'}`")
                                    i.el-icon-view
                            el-tooltip(content="重新命名" placement="bottom")
                                .btn.btn-outline-info(@click="renameGroupPrompt()")
                                    i.el-icon-edit-outline
                            el-tooltip(content="移除群組" placement="bottom")
                                .btn.btn-outline-danger(@click="removeGroupPrompt()")
                                    i.el-icon-close
                        ol.pr-3.my-1(style="clear:both;user-select:none")
                            li.cursor-pointer.border-bottom(v-for="feature,i in slicedGroupFeatures" :key="i" 
                                :value="groups[groupIndex].start+i+1"
                                :class="selectedFeatures.includes(feature)?'text-danger':''"
                                @click="handleClickSelect(feature)"
                                @contextmenu="$event.preventDefault();interaction.fitExtent([feature])") 
                                    span {{type2icon[feature.geometry.type]}}
                                    span.float-right {{feature.properties[groups[groupIndex].propKey]}}
                        el-pagination(small hide-on-single-page :page-size="maxItems" layout="prev,pager,next"
                            :total="groupFeatures.length" @current-change="groups[groupIndex].start=($event-1)*maxItems")
            el-tab-pane(label="設定" name="設定" lazy :class="'px-2'")
                input(ref="file" type='file' style='display: none' @change='handleFiles($event.target.files)' multiple='true')
                .btn.btn-outline-primary.w-100(@click="$refs['file'].click()") 選取檔案或拖曳匯入
                .input-group
                    .input-group-prepend
                        .btn.btn-outline-success(@click="exportFile()") 匯出
                    input.form-control.btn.btn-outline-success(type='text' v-model="filename" placeholder="檔案名稱")
                    select.form-control.btn.btn-outline-success(v-model="fileExtension")
                        option(v-for="ext in extensions" :key="ext" :value='ext') {{ext}}
                .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
                    span 檔案編碼
                    select(v-model="encoding")
                        option(v-for="enc in encodings" :key="enc" :value="enc") {{enc}}
                .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
                    span 背景顏色
                    el-color-picker(size="mini" :value="bgColor" @active-change="bgColor=$event")
                .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
                    span 顯示比例尺
                    el-switch(v-model="showScale")
                .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
                    span 產生熱點圖
                    el-switch(v-model="showHeatmap")
                .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
                    span 動畫插值
                    el-switch(v-model="allowAnimation" @change="toggleAnimation($event)")
                .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
                    span 縮放間距
                    el-input-number(size="mini" v-model="zoomDelta" :min="0.1" :max="1" :step="0.1" @change="gismap.zoomEvent.delta=zoomDelta")
                .px-2.py-2.border-bottom
                    span 縮放範圍
                    span.float-right {{gismap.view?gismap.view.zoom:0}} / {{zoomRange}}
                    .px-2.py-2
                        el-slider(v-model="zoomRange" range show-stops :max="20"
                            @input="gismap.view.minZoom=zoomRange[0];gismap.view.maxZoom=zoomRange[1]")
                Draggable(v-model="gismap.imageShapes" :options="{animation:150}")
                    .d-flex.align-items-center.shadow-sm.px-1.py-1.border.cursor-pointer(v-for="imageShape,i in gismap.imageShapes" :key="i" 
                            :class="imageShape.editing?'border-danger':'border-light'" @click="imageShape.editing=!imageShape.editing")
                        el-tooltip(:content="imageShape.filename" placement="left")
                            span.text-truncate(style="width:60px") {{imageShape.filename}}
                        .btn( @click="imageShape.editable=!imageShape.editable")
                            i(:class="imageShape.editable?'el-icon-unlock text-danger':'el-icon-lock text-success'")
                        input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl'
                            v-model="imageShape.opacity" draggable='true' ondragstart='event.preventDefault();event.stopPropagation()')
                        .btn.text-light(@click="gismap.imageShapes=gismap.imageShapes.filter(x=>x!=imageShape)")
                            i.el-icon-close
                .text-secondary.text-center(v-if="!(gismap.imageShapes&&gismap.imageShapes.length)").py-1.px-2 拖曳匯入圖片開始
            el-tab-pane(label="PTX" name="PTX")
                PTX(:gismap="gismap" :interaction="interaction" @addGroup="addGroup($event)" @handleSelect="handleSelect($event)" :show="tab=='PTX'")
            el-tab-pane(label="提示" name="提示" lazy)
                Tutorial
    transition(name="fade-left")
        .position-fixed.bg-dark.h-100(v-show="selectedFeatures.length" style="right:0;top:0;width:300px;overflow-y:auto")
            Styles(:gismap="gismap" :interaction="interaction" :selectedFeatures="selectedFeatures" :show="selectedFeatures.length")
    transition(name="fade-up")
        .position-fixed.w-100.h-100.d-flex.flex-column(v-if="showDataTable" style="left:0;top:0;")
            .w-100.flex-grow-1.bg-dark(style="max-height:100%;overflow:auto")
                table.table.table-dark.w-100.mb-0
                    thead
                        tr
                            th 
                            th(v-for="col,ci in cols" :key="ci")
                                .d-flex.align-items-center
                                    span.flex-grow-1(style="white-space:nowrap" @dblclick="renameColumnPrompt(col)").cursor-pointer {{col.key}}
                                    span.d-flex.cursor-pointer
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
            .d-flex.justify-content-center.align-items-center.bg-white.py-1
                el-pagination(:page-size="maxRows" :page-count="10" layout="prev,pager,next" :total="filteredRows.length" @current-change="page=$event")
                input.btn.btn-sm.btn-outline-primary(type="text" v-model="search" placeholder="搜尋")
                .btn.btn-sm.btn-outline-success(v-if="filename!=groupName" @click="confirmImport()") 匯入
                .btn.btn-sm.btn-outline-success(v-else @click="confirmSelect()") 選取
                el-popover(placement="top" trigger="click")
                    .btn.btn-sm.btn-outline-info(slot="reference") 其他
                    .input-group.input-group-sm.align-items-center
                        .input-group-prepend
                            span.input-group-text 每頁顯示
                        input.custom-range.form-control(type="range" v-model.number="maxRows" min="5" max="100" @change="page=1")
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
                        .btn.btn-sm.btn-outline-info(@click="leftJoin()") 合併資料表
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
    //- el-dialog(:visible.sync="dialog" :append-to-body="true")
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
import Heatmap from '../js/heatmap.js'

export default {
    name: 'app',
    components: {Tutorial,Rasters,Draggable,Styles,PTX,LoadingPage},
    mixins: [importHandler,exportHandler],
    data: ()=>({
        tab: '網格', gismap: {getSelectedFeatures:()=>([])}, interaction: Interaction, heatmap: Heatmap,
        fileExtension: '.geojson', filename: '', bgColor:'#333333',
        extensions:['.geojson','.png','.svg','.csv','.json'], encoding:'utf-8', encodings: ['utf-8','big5'],
        showDataTable: false, importing:false, newGroup: '', newColumn:'', page: 1, maxRows: 10, maxItems:20, zoomRange: [0,20], zoomDelta:0.5,
        groupIndex:0, groups:[], imageShapes: [], importParams: {lat:'',lng:'',WKT:'',rightTableColumn:''},
        tmpFeatures:[], rows: [], cols:[], allowAnimation: true, 
        type2icon: {
            Point:'點',MultiPoint:'點(多重)',
            LineString:'線',MultiLineString:'線(多重)',
            Polygon:'面',MultiPolygon:'面(多重)'
        },
        loading: false, dialog:false, search: '', showScale:true, showHeatmap: false,
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
        renameColumnPrompt(col){
            let newName = prompt('變更欄位名稱',col.key)
            if(this.cols.map(col=>col.key).includes(newName)){
                alert(`${newName} 名稱重複了`)
            }else if(newName){
                this.rows.map(row=>{
                    row[newName] = row[col.key]
                    delete row[col.key]
                })
                col.key = newName
                this.$set(this.groups,this.groupIndex,this.groups[this.groupIndex]) //force update
            }
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
        handleClickSelect(feature){
            if(this.selectedFeatures.includes(feature)){
                this.handleSelect(this.selectedFeatures.filter(f=>f!=feature))
            }else if(this.gismap.selectEvent.ctrlKey){
                this.handleSelect([...this.selectedFeatures,feature])
            }else if(this.gismap.selectEvent.shiftKey&&
                this.selectedFeatures.some(f=>this.groupFeatures.includes(f))){
                let features = this.selectedFeatures.map(sf=>this.groupFeatures.findIndex(gf=>gf==sf)).filter(i=>i!=-1)
                let startIdx = Math.min(...features)
                let endIdx = this.groupFeatures.findIndex(f=>f==feature)
                if(startIdx>endIdx) [startIdx,endIdx] = [endIdx,startIdx]
                this.handleSelect(this.groupFeatures.slice(startIdx,endIdx+1))
            }else{
                this.handleSelect([feature])  
            }
        },
        handleSelect(features){
            this.gismap.setSelectedFeatures(features)
        },
        handleGroupScroll(e){
            e.preventDefault()
            let offset = Math.sign(e.deltaY)*this.maxItems
            let group = this.groups[this.groupIndex]
            group.start = 
                group.start+offset<0?0:
                group.start+offset>=this.groupFeatures.length?group.start:group.start+offset
        },
        handleGroupClick(groupIndex){
            if(this.groupIndex==groupIndex){
                let features = this.gismap.vectors.filter(f=>f.properties['群組']==this.groupName)
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
        toggleGroup(){
            this.groups[this.groupIndex].active = !this.groups[this.groupIndex].active
            if(this.groups[this.groupIndex].active){
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
        },
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
        selectedFeatures(){
            return this.gismap.getSelectedFeatures()
        },
        slicedGroupFeatures(){
            let start = this.groups[this.groupIndex].start
            return this.groupFeatures.slice(start,start+this.maxItems)
        },
        filteredRows(){
            let rows = this.rows.slice()
            for(let col of this.cols)
                if(col.filter!='')
                    rows = rows.filter(row=>row[col.key]==col.filter)
            if(this.search)
                rows = rows.filter(row=>this.cols.some(col=>row[col.key]||row[col.key]==0?row[col.key].toString().match(this.search):false))
            for(let col of this.cols)
                if(col.sort!=0)
                    rows.sort((a,b)=>this.sortRule(a,b,col.key,col.sort))
            return rows
        },
        propKeys(){
            return [...new Set(this.groupFeatures.flatMap(f=>Object.keys(f.properties)))]
        },
        scaleStyle(){
            let w = this.gismap.view.scaleStripe
            return {
                width: this.gismap.view.scaleWidth,
                background:`repeating-linear-gradient(to right,black,black ${w}px,white ${w}px,white ${2*w}px)`
            }
        }
    },
    created(){
        this.addGroup('群組1')
    },
    mounted(){
        this.gismap = new GisMap(this.$refs['gismap'])
        this.interaction = new Interaction(this.$refs['heatmap'],this.gismap)
        this.gismap.addEventListener('select',e=>{
            this.handleSelect(e.features)
        })
        this.gismap.addEventListener('drawend',e=>{
            e.feature.properties['群組'] = this.groupName
        })
        this.heatmap = new Heatmap(this.$refs['gismap'])
        this.gismap.addEventListener('render',e=>{
            if(this.showHeatmap){
                const isOverlaped = (bbox1,bbox2)=>bbox1[0]<=bbox2[2]&&bbox1[2]>=bbox2[0]&&bbox1[1]<=bbox2[3]&&bbox1[3]>=bbox2[1]
                let points = this.gismap.vectors.filter(f=>isOverlaped(f.geometry.bbox,this.gismap.view.bbox)).filter(f=>f.geometry.type=='Point')
                let data = points.map(f=>{
                    let [x,y] = this.gismap.coord2client(f.geometry.coordinates)
                    return {x:Math.round(x),y:Math.round(y),value:f.properties['radius']||10}
                })
                this.heatmap.setData({max:20, data})
            }
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
.cursor-pointer{
    cursor: pointer;
}
.text-shadow{
    font-weight: bold;
    color: white;
    text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
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
.fade-left-enter-active, .fade-left-leave-active {
    transition: opacity .5s,transform .5s;
}
.fade-left-enter, .fade-left-leave-to{
    opacity: 0;
    transform: translateX(50%);
}
.el-tabs__item{
    color: grey !important;
}
.el-tabs__item.is-active{
    color: white !important;
}
.el-tabs__content{
    padding: 0 5px;
}
</style>