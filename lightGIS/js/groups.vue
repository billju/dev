<template lang="pug">
.px-2
    el-dialog(title="新增群組" :visible.sync="dialog" width="300px" :modal="false")
        el-input(v-model="newGroup" placeholder="新群組名稱")
        el-button(slot="footer" @click="addGroup(newGroup)") 新增
    el-button(@click="dialog=true") 新增群組
    el-tabs(v-model="groupIndex" tab-position="left")
        el-tab-pane(v-for="group,i in groups" :key="i" :label="group.name")
            .d-flex.align-items-center
                el-switch(v-model="group.active")
                el-slider.mx-2(v-model.number="group.opacity" :min="0" :max="1" :step="0.1" style="flex:1")
</template>

<script>
export default {
    name: 'Groups',
    data: ()=>({
        groupIndex: 0, groups: [], dialog: false, newGroup: '',
    }),
    methods: {
        addGroup(name=this.newGroup,theme='success'){
            if(name&&this.groups.findIndex(g=>g.name==name)==-1){
                this.groups.push({name,theme,start:0,active:true,temp:[],opacity:1})
                this.newGroup = ''
                this.dialog = false
            }
        }
    },
    mounted(){
        this.addGroup('bang')
        this.addGroup('gang')
    }
}
</script>

<style scoped>

</style>