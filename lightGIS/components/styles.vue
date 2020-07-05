<template lang="pug">
.px-2(v-if="show")
    .btn-group
        .btn.btn-outline-info(@click="interaction.moveLayerTo('top')") 置頂
        .btn.btn-outline-info(@click="interaction.moveLayerTo('bottom')") 置底
        .btn.btn-outline-info(@click="interaction.fitExtent(selectedFeatures)") 聚焦
        .btn.btn-outline-info(@click="addFavorite()") 加到最愛
    table#custom-style.table-striped.w-100.text-shadow(:style="{opacity:selectedFeatures&&selectedFeatures.length?1:0.2}")
        tbody
            tr
                td 文字內容
                td
                    input.w-100(type="text" style="width:100px" :value="style['text']" @input="setSFP('text',$event.target.value)")
            tr
                td 文字位置
                td
                    select(:value="style['textAnchor']" @input="setSFP('textAnchor',$event.target.value)")
                        option(value="[0,0]") 中
                        option(value="[-1,-1]") 左上
                        option(value="[0,-1.2]") 上
                        option(value="[1,-1]") 右上
                        option(value="[1.2,0]") 右
                        option(value="[1,1]") 右下
                        option(value="[0,1.2]") 下
                        option(value="[-1,1]") 左下
                        option(value="[-1.2,0]") 左
            tr
                td 文字顏色
                td.px-0.py-1
                    el-color-picker(show-alpha :value="style['textFill']" @active-change="setSFP('textFill',$event)")
                    el-color-picker(show-alpha :value="style['textStroke']" @active-change="setSFP('textStroke',$event)")
            tr
                td 文字大小/邊框
                td
                    input(type='number' :value="style['fontSize']" min='6' max='72' @input="setSFP('fontSize',$event.target.value*1)")
                    input(type='number' :value="style['fontWeight']" min='0' max='5' @input="setSFP('fontWeight',$event.target.value*1)")
            tr
                td 字型
                td
                    select(:value="style['fontFamily']" @input="setSFP('fontFamily',$event.target.value)")
                        option(v-for="fontFamily in fontFamilies" :value="fontFamily") {{fontFamily}}
            tr
                td 圓圈/文字半徑
                td
                    el-input-number(size="mini" :value="style['radius']" :min="0" @change="setSFP('radius',$event)")
            tr
                td 透明度
                td
                    input.custom-range(type="range" :value="style['opacity']" min='0' max='1' step='0.1' style="direction:rtl" @input="setSFP('opacity',$event.target.value*1)")
            tr
                td 虛線/偏移
                td
                    input(type='number' :value="style['lineDash'][0]" min="0" @input="setSFP('lineDash',[$event.target.value*1,$event.target.value*1])")
                    input(type='number' :value="style['lineDashOffset']" min="0" @input="setSFP('lineDashOffset',$event.target.value*1)")
            tr
                td 框線顏色/寬度
                td.px-0.py-1.d-flex.align-items-center
                    el-color-picker(show-alpha :value="style['stroke']" @active-change="setSFP('stroke',$event)")
                    el-input-number(size="mini" :value="style['lineWidth']" :min="0" @change="setSFP('lineWidth',$event)")
            tr
                td 填滿顏色
                td.px-0.py-1
                    el-color-picker(show-alpha :value="style['fill']" @active-change="setSFP('fill',$event)")
            tr
                td 文字欄位
                td
                    select(@change="mapSFP('text',$event.target.value)")
                        option(value="")
                        option(v-for="prop in properties" :value="prop") {{prop}}
            tr
                td {{rule.isGradient?'漸':'分'}}層設色
                td 
                    select(v-model="rule.col" @change="handleSelect()")
                        option(value="")
                        option(v-for="prop in properties" :value="prop") {{prop}}
                    el-switch(v-model="rule.isGradient")
    .w-100(v-if="rule.isGradient")
        .d-flex.align-items-center(v-for="gd,i in rule.gradients" :key="i")
            el-color-picker(show-alpha size="mini" v-model="gd.rgba" 
                @change="updateRule();mapSFP('fill',rule.col,gradientColor)")
            input.custom-range(type="range" v-model.number="gd.pct" min="0" max="1" step="0.1" 
                @input="updateRule();mapSFP('fill',rule.col,gradientColor)")
            button.close(@click="rule.gradients.splice(i,1)")
                span &times;
    .w-100(v-else)
        .d-flex.align-items-center(v-for="(val,key) in rule.categories" :key="key")
            span.flex-grow-1 {{key}}
            el-color-picker(show-alpha size="mini" v-model="rule.categories[key]" 
                @change="mapSFP('fill',rule.col,categoryColor);mapSFP('stroke',rule.col,categoryColor)")
            button.close(@click="$delete(rule.categories,key)")
                span &times;
    .btn.btn-success(@click="addRule()")
        i.el-icon-plus
    .btn.btn-secondary(v-if="!rule.isGradient" v-for="fav,i in favCategories" :key="`cat${i}`" 
        @click="rule.categories={...fav};mapSFP('fill',rule.col,categoryColor);mapSFP('stroke',rule.col,categoryColor)"
        @contextmenu.prevent="$delete(favCategories,i)") 設定{{i+1}}
    .w-100.border.mx-1.my-1
    .btn(v-for="fav,i in favorites" :key="`fav${i}`" @click="setFavorite(fav)" :style="getFavorite(fav)"
        @contextmenu.prevent="$delete(favorites,i)") {{i+1}}
</template>

<script>
export default {
    name: 'Styles',
    props: ['gismap','interaction','selectedFeatures','show'],
    data:  ()=>({
        defaultStyle: {
            lineWidth:3,lineDash:[],stroke:'rgba(3,169,244,1)',
            fill:'rgba(0,0,255,0.3)', textAnchor:'[0,0]',
            textStroke:'rgba(0,0,0,1)',fontWeight:2,textFill:'rgba(255,255,255,1)'
        }, 
        featureIndex:0, favorites: [],
        fontFamilies: ['微軟正黑體','serif','sans-serif','fantasy','monospace','標楷體'],
        rule:{min:0,max:100,col:'',categories:{},isGradient:true,gradients:[
            {pct:0,rgba:'rgba(244,67,54,1)'},
            {pct:0.3,rgba:'rgba(255,152,0,1)'},
            {pct:0.6,rgba:'rgba(255,235,59,1)'},
            {pct:1,rgba:'rgba(76,175,80,1)'},
        ]}, 
        favCategories: [
            {'公':'rgba(254,255,191,1)','私':'rgba(188,233,252,1)','公私共有':'rgba(202,214,159,1)',
            '公法人':'rgba(215,177,158,1)','糖':'rgba(239,177,208,1)','預設':'rgba(204,204,204,1)'},
        ],
        colors:['rgba(244,67,54,1)','rgba(233,30,99,1)','rgba(156,39,176,1)','rgba(103,58,183,1)',
        'rgba(63,81,181,1)','rgba(33,150,243,1)','rgba(3,169,244,1)','rgba(0,188,212,1)','rgba(0,150,136,1)',
        'rgba(76,175,80,1)','rgba(139,195,74,1)','rgba(205,220,57,1)','rgba(255,235,59,1)','rgba(255,193,7,1)',
        'rgba(255,152,0,1)','rgba(255,87,34,1)','rgba(121,85,72,1)','rgba(158,158,158,1)','rgba(96,125,139,1)'],
    }),
    methods: {
        handleSelect(){
            this.updateRule()
            if(this.rule.isGradient){
                this.mapSFP('fill',this.rule.col,this.gradientColor)
            }else{
                this.mapSFP('fill',this.rule.col,this.categoryColor)
                this.mapSFP('stroke',this.rule.col,this.categoryColor)
            }
        },
        gradientColor(input){
            if(isNaN(input)||!this.rule.gradients.length) return this.style.fill
            const mapRange = (num,min,max,MIN,MAX)=>(num-min)/(max-min)*(MAX-MIN)+MIN
            let pct = mapRange(input,this.rule.min,this.rule.max,0,1)
            let gd1, gd2, gradients = this.rule.gradients
            for(let i=0;i<gradients.length;i++){
                if(gradients[i].pct>pct){
                    gd1=i>0?gradients[i-1]:gradients[i]
                    gd2=gradients[i]
                    break
                }else if(i==gradients.length-1){
                    return gradients[i].rgba
                }
            }
            let arr = gd1.arr.map((min,i)=>mapRange(pct,gd1.pct,gd2.pct,min,gd2.arr[i])).map(x=>parseInt(x))
            return `rgba(${arr[0]},${arr[1]},${arr[2]},${arr[3]})`
        },
        categoryColor(input){
            return this.rule.categories[input]||this.rule.categories['預設']
        },
        setSFP(key,value){
            this.interaction.setSelectedFeaturesProp(key,value)
            this.featureIndex=1;this.featureIndex=0 // force update
        },
        addRule(){
            if(this.rule.isGradient)
                this.rule.gradients.push({pct:1,rgba:'rgba(0,0,0,1)',arr:[0,0,0,1]})
            else
                this.favCategories.push({...this.rule.categories})
        },
        updateRule(){
            let props = this.selectedFeatures.map(f=>f.properties[this.rule.col])
            let entries = [...new Set(props)].slice(0,this.colors.length).map((key,i)=>([key,this.colors[i%this.colors.length]]))
            this.rule.categories = Object.fromEntries(entries)
            this.rule.categories['預設'] = ''
            let values = props.filter(v=>!isNaN(v))
            this.rule.max = Math.max(...values)
            this.rule.min = Math.min(...values)
            this.rule.gradients.sort((a,b)=>a.pct-b.pct)
            this.rule.gradients.map(gd=>{
                gd.arr=gd.rgba.replace(/\s/g,'').match(/(\d+),(\d+),(\d+),(\d+)/i).slice(1,5).map(x=>parseInt(x))
            })
        },
        mapSFP(fKey,tKey,rule=undefined){
            this.interaction.mapSelectedFeaturesProp(fKey,tKey,rule)
            this.featureIndex=1;this.featureIndex=0 // force update
        },
        addFavorite(){
            this.featureIndex=1;this.featureIndex=0 // force update
            let newFav = Object.assign({},this.style)
            delete newFav.text
            this.favorites.push(newFav)
        },
        setFavorite(style){
            this.defaultStyle = style
            for(let key in style)
                this.setSFP(key,style[key])
        },
        getFavorite(fav){
            let tS = fav.textStroke, fW = fav.fontWeight?1:0
            return {
                border:`solid ${fav.lineWidth}px ${fav.stroke}`,
                background:fav.fill,
                color:fav.textFill,
                textShadow:`-${fW}px 0 ${tS}, ${fW}px 0 ${tS}, 0 -${fW}px ${tS}, 0 ${fW}px ${tS}`
            }
        }
    },
    computed:{
        style(){
            if(this.selectedFeatures.length>this.featureIndex){
                let feature = this.selectedFeatures[this.featureIndex]
                return this.gismap.getDefaultStyle(feature)
            }else{return this.defaultStyle}
        },
        properties(){
            if(this.selectedFeatures.length){
                let feature = this.selectedFeatures[this.featureIndex]
                return Object.keys(feature.properties).filter(key=>!(key in this.style))
            }else{
                return []
            }
        }
    },
    created(){
        this.favorites = this.colors.map(color=>{
            return Object.assign({...this.defaultStyle},{stroke:color,fill:color.replace('1)','0.6)')})
        })
    }
}
</script>

<style scoped>
input[type="number"]{
    width: 50px;
    border: 1px solid dodgerblue;
    border-radius: 3px;
}
input[type="text"]{
    border: 1px solid dodgerblue;
    border-radius: 3px;
}
</style>