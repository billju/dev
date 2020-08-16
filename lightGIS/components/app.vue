<template lang="pug">
.w-100.h-100
    .w-100.h-100(ref="mapContainer")
        canvas.w-100.h-100(ref="gismap" @drop="handleDrop($event)" @dragover="$event.preventDefault()" :style="{background:bgColor}")
    .position-fixed.d-flex.align-items-center.px-2.py-1(v-if="gismap.view&&showScale" style="right:0;bottom:0;user-select:none;")
        span.text-shadow {{gismap.view.scaleText}}
        .mx-2.py-1.border(:style="scaleStyle")
    .position-fixed.h-100.bg-dark.text-light(style="width:320px;top:0;transition:left 0.5s" :style="{left: tab=='隱藏'?'-320px':0}")
        .position-absolute.bg-secondary(style="top:0;right:-60px;width:60px")
            Toolbar
        .px-2.py-2.h-100(style="overflow-y:auto")
            Rasters
            Vectors
            Settings
            PTX
            ColorSampler(v-if="tab=='調色'")
            Tutorial
    transition(name="fade-left")
        Styles(v-show="selectedFeatures.length")
    transition(name="fade-up")
        DataTable(v-if="showDataTable")
    //- transition(name="fade-left")
    //-     Intro(v-if="showDialog")
    //- transition(name="fade-up")
    //-     LoadingPage(v-if="isLoading")
</template>

<script>
import {mapState, mapGetters} from 'vuex'
// js library
import GisMap from '../js/GisMap.js'
import Interaction from '../js/interaction.js'
import Heatmap from '../js/heatmap.js'
// mixins
import importMixin from '../mixins/importMixin.js'
import exportMixin from '../mixins/exportMixin.js'
import utilsMixin from '../mixins/utilsMixin.js'
// components
import Toolbar from './toolbar.vue'
import Tutorial from './tutorial.vue'
import Rasters from './rasters.vue'
import Vectors from './vectors.vue'
import Styles from './styles.vue'
import PTX from './ptx.vue'
import DataTable from './dataTable.vue'
import ColorSampler from './colorsampler.vue'
import LoadingPage from './loadingPage.vue'
import Intro from './intro.vue'
import Settings from './settings.vue'

export default {
    name: 'app',
    components: {
        Toolbar, Tutorial, Rasters, Vectors, Styles, PTX, 
        LoadingPage, Intro, ColorSampler, DataTable, Settings
    }, 
    mixins: [importMixin, exportMixin, utilsMixin],
    methods: {
        getCurrentPosition(){
            navigator.geolocation.getCurrentPosition(pos=>{
                let {latitude,longitude} = pos.coords
                this.gismap.panTo(this.gismap.lnglat2coord([longitude,latitude]))
            })
        },
        parseURL(){
            let url = new URL(document.URL)
            url.searchParams()
        }
    },
    computed:{
        // global
        ...mapState(['gismap','interaction','heatmap','tab','tabs','isLoading','showDialog','rasters']),
        // vectors
        ...mapState(['groups','groupIndex','tmpFeatures','maxItems','type2icon']),
        // settings
        ...mapState(['fileExtension','filename','bgColor','extensions','encoding','encodings','showScale','allowAnimation']),
        // DataTable
        ...mapState(['showDataTable','isImporting', 'rows', 'cols','tablePage','search','filename']),
        ...mapGetters(['groupFeatures','groupName','groupRange','selectedFeatures','slicedGroupFeatures','filteredRows','propKeys','sortIcon']),
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
        let gismap = new GisMap(this.$refs['gismap'])
        gismap.set('rasters',this.rasters)
        gismap.addEventListener('select',e=>{
            this.handleSelect(e.features)
        })
        gismap.addEventListener('drawend',e=>{
            e.feature.properties['群組'] = this.groupName
        })
        gismap.addEventListener('render',e=>{
            if(this.gismap.notRenderPoints){
                let points = e.features.filter(f=>f.geometry.type=='Point')
                let data = points.map(f=>{
                    let [x,y] = this.gismap.coord2client(f.geometry.coordinates)
                    return {x:Math.round(x),y:Math.round(y),value:f.properties['radius']||10}
                })
                this.heatmap.setData({max:20, data})
            }
        })
        gismap.addEventListener('moveend',e=>{
            let url = `@${e.lnglat[1].toFixed(7)},${e.lnglat[0].toFixed(7)},${e.zoom.toFixed(2)}z`
            let title = url
            // window.history.replaceState({},title,url)
        })
        let interaction = new Interaction(this.$refs['mapContainer'],gismap)
        interaction.addEventListener('paste',e=>{
            e.features.map(f=>{f.properties['群組']=this.groupName})
        })
        let heatmap = new Heatmap(this.$refs['gismap'])
        this.setState({ gismap, interaction, heatmap })
        // this.getCurrentPosition()
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
.custom-control-label:before{
    background: #343a40;
}
input[type=range]::-webkit-slider-runnable-track{
    background: #adb5bd;
}
input[type=range]::-moz-range-track{
    background: #adb5bd;
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
</style>