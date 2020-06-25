<template lang="pug">
.px-1
    Draggable(v-model="rasters" @update="gismap.setRasters(rasters)" :options="{animation:150}")
        .d-flex.align-items-center(v-for="raster,i in rasters" :key="raster.name")
            span(style="flex:1") {{raster.name}}
            .custom-control.custom-switch.mx-1
                input.custom-control-input(type='checkbox' v-model="raster.active" :id="raster.name" @input="gismap.setRasters(rasters)")
                label.custom-control-label(:for="raster.name")
            .input-text(draggable='true' ondragstart='event.preventDefault();event.stopPropagation()')
                input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' v-model.number="raster.opacity" @input="gismap.setRasters(rasters)")
</template>

<script>
import Draggable from 'vuedraggable'
export default {
    name: 'Rasters',
    components: {Draggable},
    props: ['gismap'],
    data:()=>({rasters:[]}),
    methods: {
        getDefaultRaster(){
            const token = "qn5cMMfaz2E84GbcNlqB2deRwJpO0NfuIorLEzgqLiaQv3lB8mfoVF7VU0u0rJCMbkMjDCBz2xD1JH-8fYMuBg.."
            return [
                {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/URBAN3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'臺中都市計畫',opacity:0.8,active:false},
                {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/Land3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'地段及地籍圖',opacity:0.8,active:false},
                {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA163857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告現值',opacity:0.8,active:false},
                {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA173857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告地價',opacity:0.8,active:false},
                {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_policy/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'特殊管制',opacity:0.8,active:false},
                {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_water/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'水源水質',opacity:0.8,active:false},
                {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_geo/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'地質敏感',opacity:0.8,active:false},
                {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_environment/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'環保與汙染',opacity:0.8,active:false},
                {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/SlopeTW3857_fix/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'坡度示意圖',opacity:0.8,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/LUIMAP/default/EPSG:3857/{z}/{y}/{x}',name:'國土利用',opacity:0.8,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/LAND_OPENDATA/default/EPSG:3857/{z}/{y}/{x}',name:'公有土地',opacity:0.8,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/SCHOOL/default/EPSG:3857/{z}/{y}/{x}',name:'學校',opacity:0.8,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/Village/default/EPSG:3857/{z}/{y}/{x}',name:'村里界',opacity:0.8,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/TOWN/default/EPSG:3857/{z}/{y}/{x}',name:'鄉市鎮界',opacity:0.8,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/CITY/default/EPSG:3857/{z}/{y}/{x}',name:'縣市界',opacity:0.8,active:false},
                {url:'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',name:'OSM',opacity:1,active:false,max:18},
                {url:'https://wmts.nlsc.gov.tw/wmts/EMAP5/default/EPSG:3857/{z}/{y}/{x}',name:'通用',opacity:1,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/EMAP01/default/EPSG:3857/{z}/{y}/{x}',name:'灰階',opacity:1,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/EPSG:3857/{z}/{y}/{x}',name:'航照',opacity:1,active:false},
                {url:'https://mts1.google.com/vt/lyrs=s@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile',name:'Google衛星',opacity:1,active:false},
                {url:'https://mts1.google.com/vt/lyrs=p@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile',name:'Google地形',opacity:1,active:false},
                {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',name:'ESRI衛星',opacity:1,active:false},
                {url:'https://wmts.nlsc.gov.tw/wmts/EMAPX99/default/EPSG:3857/{z}/{y}/{x}',name:'交通路網',opacity:1,active:false},
            ].map(raster=>{
                raster.url = raster.url.replace('{token}',token)
                return raster
            })
        },
    },
    created(){
        this.rasters = this.getDefaultRaster()
    }
}
</script>

<style scoped>

</style>