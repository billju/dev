import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
function sortRule(a,b,key,direction=1){
    let A = key?a[key]:a
    let B = key?b[key]:b
    if(A==undefined||B==undefined) return 0
    return isNaN(A)?A.toString().localeCompare(B.toString())*direction:(A-B)*direction
}
const state = {
    // global
    loading: false, dialog:false, 
    gismap: {
        getSelectedFeatures:()=>([]),
        zoomEvent:{delta:0.5},
        notRenderPoints:false
    }, 
    interaction: {}, 
    heatmap: {},

    // settings
    fileExtension: '.geojson', filename: '', bgColor:'#333333', 
    extensions:['.geojson','.png','.svg','.csv','.json'], encoding:'utf-8', encodings: ['utf-8','big5'],
    search: '', showScale:true, allowAnimation: true, 

    // data table
    showDataTable: false, importing:false, rows: [], cols:[], 
    newGroup: '', newColumn:'', tablePage: 1, maxRows: 10, maxItems:20, zoomRange: [0,20],
    importParams: {lat:'',lng:'',WKT:'',rightTableColumn:''},

    // vector
    groupIndex:0, groups:[], tmpFeatures:[], 
    type2icon: {
        Point:'點',MultiPoint:'點(多重)',
        LineString:'線',MultiLineString:'線(多重)',
        Polygon:'面',MultiPolygon:'面(多重)'
    },
}
const mutations = {
    set(state, payload){
        Object.keys(payload).map(key=>{
            state[key] = payload[key]
        })
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
    scaleStyle(state,getters){
        let w = state.gismap.view.scaleStripe
        return {
            width: state.gismap.view.scaleWidth,
            background:`repeating-linear-gradient(to right,black,black ${w}px,white ${w}px,white ${2*w}px)`
        }
    }
}
const actions = {

}
export default new Vuex.Store({ state, mutations, getters, actions })