<template lang="pug">
.w-100.h-100
    canvas.w-100.h-100(ref="gismap" @drop="handleDrop($event)" @dragover="$event.preventDefault()")
    //el-dialog(title="新增群組" :visible.sync="dialog" width="300px" :modal-append-to-body="false")
        el-input(v-model="newGroup" placeholder="新群組名稱")
        el-button(slot="footer" @click="addGroup(newGroup)") 新增
    .position-fixed.h-100(v-if="!dialog" style="right:0;top:0;width:300px;overflow-y:scroll")
        el-tabs(v-model="tab" type="card")
            el-tab-pane(label="底圖" name="底圖")
                Draggable(v-model="gismap.imageShapes" :options="{animation:150}")
                    .d-flex.align-items-center(v-for="imageShape,i in gismap.imageShapes" :key="i")
                        span(style="white-space:nowrap;text-overflow:ellipsis") {{imageShape.filename}}
                        el-switch(v-model="imageShape.editable")
                        input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' v-model="imageShape.opacity"
                            draggable='true' ondragstart='event.preventDefault();event.stopPropagation()')
                        button.close(@click="gismap.imageShapes=gismap.imageShapes.filter(x=>x!=imageShape)")
                            span &times;
                Rasters(:gismap="gismap")
            el-tab-pane(label="群組" name="群組")
                .btn-group
                    .btn.btn-outline-info(@click="addGroupPrompt()") 新增群組
                    .btn.btn-outline-info(@click="moveGroup(groupName)") 移動至{{groupName}}
                .d-flex
                    div(style="width:100px")
                        Draggable(v-model="groups" :options="{animation:150}")
                            .btn.w-100(v-for="group,i in groups" :key="i" :class="groupIndex==i?`btn-${group.theme}`:`btn-outline-${group.theme}`"
                                @dblclick="interaction.fitExtent(gismap.vectors.filter(f=>f.properties['群組']==group.name))"
                                @click="handleGroupClick(i)") {{group.name}}
                    div(style="flex:1")
                        .d-flex.align-items-center
                            el-switch.mx-1(v-model="groups[groupIndex].active")
                            input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' 
                                v-model.number="groups[groupIndex].opacity" @input="setGroupProps(groupName,'opacity',$event.target.value)")
                            button.close(@click="removeGroupPrompt()")
                                span &times;
                        span {{groups[groupIndex].start}} - {{groups[groupIndex].start+maxItems}}
                        ol
                            li.cursor-pointer(v-for="feature,i in this.limitedGroupFeatures" :key="i" 
                                :class="selectedFeatures.includes(feature)?'text-danger':''"
                                @click="handleClickSelect(feature)"
                                @dblclick="interaction.fitExtent([feature])"
                                @wheel="handleWheel($event)") {{feature.geometry.type}}                        
            el-tab-pane(label="樣式" name="樣式")
                Styles(:gismap="gismap" :interaction="interaction" :selectedFeatures="selectedFeatures")
            el-tab-pane(label="檔案" name="檔案")
                input(ref="file" type='file' style='display: none' @change='handleFiles($event.target.files)' multiple='true')
                .btn.btn-outline-primary.w-100(@click="$refs['file'].click()") 選取檔案或拖曳匯入
                .input-group
                    .input-group-prepend
                        .btn.btn-outline-success(@click="exportFile()") 匯出
                    input.form-control.btn.btn-outline-success(type='text' style='width:50px' v-model="fileName")
                    select.btn.btn-outline-success(v-model="fileExtension")
                        option(value='.geojson') .geojson
                        option(value='.png') .png
                        option(value='.svg') .svg
                table.table.table-striped.table-hover.w-100
                    tbody
                        tr
                            td 動畫插值
                            td
                                el-switch(v-model="allowAnimation" @change="toggleAnimation($event)")
                        tr
                            td  縮放Delta
                            td
                                el-input-number(size="mini" v-model="zoomDelta" :min="0.1" :max="1" :step="0.1" @change="gismap.zoomEvent.delta=zoomDelta")
                        tr
                            td 最大顯示數量
                            td
                                el-input-number(size="mini" v-model="maxRows" :min="10" :max="100")
                        tr
                            td 縮放範圍
                            td {{gismap.view?gismap.view.zoom:0}} / {{zoomRange}}
                        tr
                            td(colspan="2").px-3.py-0
                                el-slider(v-model="zoomRange" range show-stops :max="20"
                    @input="gismap.view.minZoom=zoomRange[0];gismap.view.maxZoom=zoomRange[1]")
            el-tab-pane(label="PTX" name="PTX")
                PTX(:gismap="gismap" :interaction="interaction" @addGroup="addGroup($event)")
    table.table.table-striped.table-hover.position-fixed.bg-light(v-if="Object.keys(properties).length" style="left:0;top:0;max-width:250px")
        tbody
            tr(v-for="val,key in properties")
                td {{key}}
                td {{val}}
    .position-fixed(v-if="dialog" style="left:0;top:0;max-width:100%;max-height:100%")
        table.table.table-striped.table-hover.table-responsive
            thead.thead-light
                tr
                    th(v-for="col,ci in cols" :key="ci")
                        .d-flex.justify-content-between(@click="col.sort=(col.sort==0)?1:(col.sort==1)?-1:0" 
                            :class="(col.sort==1)?'text-success':(col.sort==-1)?'text-danger':''")
                                span(style="white-space:nowrap") {{col.key}}
                                button.close(@click="removeColumn(col.key);$event.stopPropagation()")
                                    span &times;
                        select.w-100(v-model="col.filter" @change="updateColumnList()")
                            option(value="")
                            option(v-for="li in col.list" :key="li" :value="li") {{li}}
                    th.d-flex
                        .btn.btn-success(@click="addGeojson();dialog=false") 匯入
                        button.close(@click="dialog=false")
                            span &times;
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
import Rasters from './rasters.vue'
import Styles from './styles.vue'
import PTX from './ptx.vue'
import LoadingPage from './loadingPage.vue'
import Draggable from 'vuedraggable'

export default {
    name: 'app',
    components: {Rasters,Draggable,Styles,PTX,LoadingPage},
    mixins: [importHandler,exportHandler],
    data: ()=>({
        tab: '底圖', gismap: GisMap, interaction: Interaction, fileExtension: '.geojson', fileName: '',
        dialog: false, newGroup: '', maxItems: 20, zoomRange: [0,20], zoomDelta:0.5,
        selectedFeatures: [], groupIndex:0, groups:[], imageShapes: [],
        tmpFeatures:[], rows: [], cols:[], maxRows: 50, properties: [], allowAnimation: true,
    }),
    methods: {
        addGeojson(){
            this.tmpFeatures = this.tmpFeatures.filter(f=>this.filterdRows.includes(f.properties))
            this.tmpFeatures.map(f=>{f.properties['群組']=f.properties['群組']??filename})
            let groupNames = [...new Set(this.tmpFeatures.map(f=>f.properties['群組']))].filter(g=>g)
            for(let groupName of groupNames)
                this.addGroup(groupName)
            this.gismap.geojson({type:'FeatureCollection',features:this.tmpFeatures})
            this.interaction.fitExtent(this.tmpFeatures)
            this.tmpFeatures = []
        },
        addRowFeature(row){
            let idx = this.tmpFeatures.findIndex(f=>f.properties==row)
            let features = [JSON.parse(JSON.stringify(this.tmpFeatures[idx]))]
            this.gismap.geojson({type:'FeatureCollection',features})
            this.interaction.fitExtent(features)
        },
        removeColumn(key){
            this.cols = this.cols.filter(col=>col.key!=key)
            this.rows.map(row=>{delete row[key]})
        },
        sortRule(a,b,key,direction=1){
            let A = key?a[key]:a
            let B = key?b[key]:b
            return isNaN(A)?A.localeCompare(B)*direction:(A-B)*direction
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
            let sign = Math.sign(e.deltaY)*this.maxItems
            let group = this.groups[this.groupIndex]
            group.start = 
                group.start+sign<0?0:
                group.start+sign>=this.groupFeatures.length?group.start:group.start+sign
        },
        handleGroupClick(groupIndex){
            if(this.groupIndex==groupIndex){
                let features = this.gismap.vectors.filter(f=>f.properties['群組']==this.groupName)
                this.handleSelect(features)
            }else{
                this.groupIndex = groupIndex
            }
        },
        addGroup(name,theme='success'){
            if(name&&this.groups.findIndex(g=>g.name==name)==-1)
                this.groups.push({name,theme,start:0,active:true,temp:[],opacity:1})
                this.newGroup = ''
        },
        addGroupPrompt(){
            this.addGroup(prompt('新增群組',`群組名稱${this.groups.length+1}`))
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
        removeGroupPrompt(){
            if(this.groups.length==1){
                alert('至少要留一個群組')
            }else if(confirm('確定要移除群組？移除後資料將無法復原')){
                this.gismap.vectors = this.gismap.vectors.filter(f=>f.properties['群組']!=this.groupName)
                this.groups.splice(this.groupIndex,1)
                this.groupIndex = 0
            }
        },
        toggleAnimation(){
            this.gismap.moveEvent.frames = this.allowAnimation?90:1
            this.gismap.zoomEvent.frames = this.allowAnimation?25:1
            this.gismap.panEvent.frames = this.allowAnimation?60:1
        }
    },
    computed:{
        groupFeatures(){
            return this.gismap.vectors?this.gismap.vectors.filter(v=>v.properties['群組']==this.groupName):[]
        },
        groupName(){
            return this.groups[this.groupIndex].name
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
        }
    },
    created(){
        this.addGroup('群組名稱1')
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
</style>