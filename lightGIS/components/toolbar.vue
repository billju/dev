<template lang="pug">
.w-100.btn-group-vertical
    .btn(v-for="t in tabs" :key="t" style="white-space:pre"
        :class="t==tab?'btn-dark':'btn-secondary'" @click="setState({tab:t})") {{t}}
    el-tooltip(content="新增群組" placement="right")
        .btn.btn-primary(@click="addGroupPrompt()") 
            i.el-icon-plus
    el-tooltip(content="移動選取項目至目前群組" placement="right")
        .btn.btn-info(@click="moveGroup(groupName)") 
            i.el-icon-position
    el-tooltip(content="置頂" placement="right")
        .btn.btn-info(@click="interaction.moveLayerTo('top')")
            i.el-icon-upload2
    el-tooltip(content="置底" placement="right")
        .btn.btn-info(@click="interaction.moveLayerTo('bottom')")
            i.el-icon-download
    el-tooltip(content="聚焦" placement="right")
        .btn.btn-success(@click="interaction.fitExtent(selectedFeatures)")
            i.el-icon-aim
    el-tooltip(content="複製(ctrl+c)" placement="right")
        .btn.btn-success(@click="interaction.copySelected()")
            i.el-icon-document-copy
    el-tooltip(content="貼上(ctrl+v)" placement="right")
        .btn.btn-success(@click="interaction.pasteSelected(true)")
            i.el-icon-document
    el-tooltip(content="刪除(ctrl+x)" placement="right")
        .btn.btn-danger(@click="interaction.deleteSelected()")
            i.el-icon-delete
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import utilsMixin from '../mixins/utilsMixin.js'

export default {
    name: 'toolbar',
    mixins: [utilsMixin],
    methods: {
        addGroupPrompt(){
            this.addGroup(prompt('新增群組',`群組${this.groups.length+1}`))
        },
        moveGroup(groupName){
            this.selectedFeatures.map(f=>{
                f.properties['群組'] = groupName
            })
        },
    },
    computed: {
        ...mapState(['interaction','tab','tabs']),
        ...mapGetters(['groupName','selectedFeatures'])
    }
}
</script>

<style scoped>

</style>