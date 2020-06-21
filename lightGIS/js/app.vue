<template lang="pug">
div
    //- canvas#canvas(ondrop='handleDrop(event)' ondragover='event.preventDefault()')
    .position-fixed(style='left:0;top:0;max-height:100%;width:300px;overflow-y:scroll;background:rgba(255,255,255,0.3')
        el-tabs(v-model="tab" type="card")
            el-tab-pane(label="底圖" name="底圖")
                Rasters
            el-tab-pane(label="群組" name="群組")
                Groups
            el-tab-pane(label="樣式" name="樣式")
                Styles
            el-tab-pane(label="檔案" name="檔案")
                Files
        //- Rasters
    //- LoadingPage
</template>

<script>
import Rasters from './rasters.vue'
import Groups from './groups.vue'
import Styles from './styles.vue'
import Files from './files.vue'
import LoadingPage from './loadingPage.vue'
export default {
    name: 'app',
    components: {Rasters,Groups,Styles,Files,LoadingPage},
    data: ()=>({
        tab: '底圖',
    }),
    methods: {
        
    },
    mounted(){

    }
}
</script>

<style scoped>
*{
    font-family: 微軟正黑體;
}
html, body{
    margin: 0;
    height: 100%;
}
#canvas{
    width: 100%;
    height: 100%;
}
</style>