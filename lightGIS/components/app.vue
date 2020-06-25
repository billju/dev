<template lang="pug">
.w-100.h-100
    canvas.w-100.h-100(ref="gismap" @drop="handleDrop($event)" @dragover="$event.preventDefault()")
    //el-dialog(title="新增群組" :visible.sync="dialog" width="300px" :modal-append-to-body="false")
        el-input(v-model="newGroup" placeholder="新群組名稱")
        el-button(slot="footer" @click="addGroup(newGroup)") 新增
    .position-fixed(style='left:0;top:0;max-height:100%;width:300px;overflow-y:scroll;background:rgba(255,255,255,0.3')
        el-tabs(v-model="tab" type="card")
            el-tab-pane(label="底圖" name="底圖")
                Rasters(:gismap="gismap")
                el-switch(v-model="allowAnimation" @change="toggleAnimation($event)")
            el-tab-pane(label="群組" name="群組")
                el-button(@click="addGroupPrompt()") 新增群組
                el-button(@click="moveGroup(groupName)") 移動選取項目至選定群組
                .d-flex
                    div(style="width:60px")
                        Draggable(:options="{animation:150}")
                            .w-100(v-for="group,i in groups" :key="i" :type="groupIndex==i?group.theme:'info'"
                                @dblclick="handleSelect(gismap.vectors.filter(f=>f.properties['群組']==group.name))"
                                @click="groupIndex=i") {{group.name}}
                    div(style="flex:1")
                        .d-flex.align-items-center
                            el-switch.mx-1(v-model="groups[groupIndex].active")
                            input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' v-model.number="groups[groupIndex].opacity")
                        span {{groups[groupIndex].start}} - {{groups[groupIndex].start+maxItems}}
                        ul
                            li(v-for="feature,i in this.limitedGroupFeatures" :key="i" 
                                :class="selectedFeatures.includes(feature)?'text-danger':'text-dark'"
                                @click="handleSelect([feature])"
                                @dblclick="interaction.fitExtent([feature])"
                                @wheel="handleWheel($event)") {{feature.geometry.type}}
            el-tab-pane(label="樣式" name="樣式")
                Styles(:gismap="gismap" :interaction="interaction" :selectedFeatures="selectedFeatures")
            el-tab-pane(label="檔案" name="檔案")
                Files(:gismap="gismap" :interaction="interaction")
            el-tab-pane(label="PTX" name="PTX")
                PTX(:gismap="gismap" @addGroup="addGroup($event)")
            el-tab-pane(label="屬性" name="屬性")
                table.table.table-striped.table-hover
                    tbody
                        tr(v-for="val,key in properties")
                            td {{key}}
                            td {{val}}
    //- LoadingPage
</template>

<script>
import GisMap from '../js/GisMap.js'
import Interaction from '../js/interaction.js'
import importHandler from '../js/importHandler.js'
import Rasters from './rasters.vue'
import Styles from './styles.vue'
import Files from './files.vue'
import PTX from './ptx.vue'
import LoadingPage from './loadingPage.vue'
import Draggable from 'vuedraggable'

export default {
    name: 'app',
    components: {Rasters,Draggable,Styles,Files,PTX,LoadingPage},
    mixins: [importHandler],
    data: ()=>({
        tab: '底圖', gismap: GisMap, interaction: Interaction, 
        dialog: false, newGroup: '', maxItems: 20,
        selectedFeatures: [], groupIndex:0, groups:[], imageShapes: [],
        rows: [], cols:[], properties: [], allowAnimation: true,
    }),
    methods: {
        renderTable(array){
            this.cols = [...new Set(array.flatMap(obj=>Object.keys(obj)))]
            this.rows = array
        },
        handleDrawend(e){
            e.detail.feature.properties['群組'] = this.groupName
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
        addGroup(name,theme='success'){
            if(name&&this.groups.findIndex(g=>g.name==name)==-1)
                this.groups.push({name,theme,start:0,active:true,temp:[],opacity:1})
                this.dialog = false
                this.newGroup = ''
        },
        addGroupPrompt(){
            this.addGroup(prompt('新增群組','群組名稱'))
        },
        moveGroup(groupName){
            this.selectedFeatures.map(f=>{
                f.properties['群組'] = groupName
            })
            this.$set(this.groups,0,this.groups[0])
        },
        removeGroupPrompt(groupName){
            if(confirm('確定要移除群組？移除後資料將無法復原')){
                this.gismap.vectors = this.gismap.vectors.filter(f=>f.properties['群組']!=groupName)
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
    },
    created(){
        this.addGroup('bang')
    },
    mounted(){
        this.gismap = new GisMap(this.$refs['gismap'])
        this.interaction = new Interaction(this.gismap)
        this.interaction.addGroup = this.addGroup
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
</style>