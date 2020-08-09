import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const state = {
    // global
    isLoading: true, showDialog: true, 
    tab:'網格',
    gismap: {
        getSelectedFeatures:()=>([]),
        zoomEvent:{delta:0.5},
        view: {zoom:0,minZoom:0,maxZoom:20},
        notRenderPoints:false
    }, 
    interaction: {}, 
    heatmap: {},

    // settings
    fileExtension: '.geojson', filename: '', bgColor:'#333333', 
    extensions:['.geojson','.png','.svg','.csv','.json'], encoding:'utf-8', encodings: ['utf-8','big5'],
    search: '', showScale:true, allowAnimation: true, 

    // data table
    showDataTable: false, isImporting:false, 
    rows: [], cols:[], 
    tablePage: 1, maxItems:20, zoomRange: [0,20],

    // vector
    groupIndex:0, groups:[], tmpFeatures:[], 
    type2icon: {
        Point:'點',MultiPoint:'點(多重)',
        LineString:'線',MultiLineString:'線(多重)',
        Polygon:'面',MultiPolygon:'面(多重)'
    },
}
const mutations = {
    setState(state, payload){
        if(typeof payload=='object'){
            Object.assign(state, payload)
        }else if(typeof payload=='function'){
            Object.assign(state, payload(state))
        }
    }
}
const getters = {
    groupFeatures(state,getters){
        let vectors = state.gismap.vectors
        return vectors?vectors.filter(v=>v.properties['群組']==getters.groupName):[]
    },
    groupName(state,getters){
        return state.groups[state.groupIndex].name
    },
    groupRange(state,getters){
        let group = state.groups[state.groupIndex]
        let length = getters.groupFeatures.length
        let start = group.start>=length?0:group.start+1
        let end = group.start+state.maxItems>length?length:group.start+state.maxItems
        return {start,end,length}
    },
    selectedFeatures(state,getters){
        return state.gismap.getSelectedFeatures()
    },
    slicedGroupFeatures(state,getters){
        let start = state.groups[state.groupIndex].start
        return getters.groupFeatures.slice(start,start+state.maxItems)
    },
    filteredRows(state,getters){
        const sortRule = (a,b,key,direction=1)=>{
            let A = key?a[key]:a
            let B = key?b[key]:b
            if(A==undefined||B==undefined) return 0
            return isNaN(A)?A.toString().localeCompare(B.toString())*direction:(A-B)*direction
        }
        let rows = state.rows.slice()
        for(let col of state.cols)
            if(col.filter!='')
                rows = rows.filter(row=>row[col.key]==col.filter)
        if(state.search)
            rows = rows.filter(row=>state.cols.some(col=>row[col.key]||row[col.key]==0?row[col.key].toString().match(state.search):false))
        for(let col of state.cols)
            if(col.sort!=0)
                rows.sort((a,b)=>sortRule(a,b,col.key,col.sort))
        return rows
    },
    propKeys(state,getters){
        return [...new Set(getters.groupFeatures.flatMap(f=>Object.keys(f.properties)))]
    },
    sortIcon(state,getters){
        if(!state.groups[state.groupIndex]) return 'el-icon-d-caret'
        let dir = state.groups[state.groupIndex].sort
        switch(dir){
            case 0: return 'el-icon-d-caret'
            case 1: return 'el-icon-top'
            case -1: return 'el-icon-bottom'
        }
    },
}
const actions = {

}
export default new Vuex.Store({ state, mutations, getters, actions })