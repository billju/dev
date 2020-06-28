<template lang="pug">
.px-2
    .btn-group
        .btn.btn-outline-info(@click="interaction.moveLayerTo('top')") 置頂
        .btn.btn-outline-info(@click="interaction.moveLayerTo('bottom')") 置底
        .btn.btn-outline-info(@click="interaction.fitExtent(selectedFeatures)") 聚焦
        .btn.btn-outline-info(@click="addFavorite()") 最愛
    table#custom-style.table.table-striped.table-hover
        tbody
            tr
                td text
                td
                    input(type="text" style="width:100px" :value="style['text']" @input="setSFP('text',$event.target.value)")
            tr
                td textAnchor
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
                td textColor
                td
                    el-color-picker(show-alpha :value="style['textFill']" @active-change="setSFP('textFill',$event)")
                    el-color-picker(show-alpha :value="style['textStroke']" @active-change="setSFP('textStroke',$event)")
            tr
                td textSize
                td
                    input(type='number' :value="style['fontSize']" min='6' max='72' @input="setSFP('fontSize',$event.target.value*1)")
                    input(type='number' :value="style['fontWeight']" min='0' max='5' @input="setSFP('fontWeight',$event.target.value*1)")
            tr
                td fontFamily
                td
                    select(:value="style['fontFamily']" @input="setSFP('fontFamily',$event.target.value)")
                        option(v-for="fontFamily in fontFamilies" :value="fontFamily") {{fontFamily}}
            tr
                td radius
                td
                    input(type='number' :value="style['radius']" min='1' @input="setSFP('radius',$event.target.value*1)")
            tr
                td opacity
                td
                    input(type='number' :value="style['opacity']" min='0.1' max='1' step='0.1' @input="setSFP('opacity',$event.target.value*1)")
            tr
                td lineDash
                td
                    input(type='number' :value="style['lineDash'][0]" min="0" @input="setSFP('lineDash',[$event.target.value*1,$event.target.value*1])")
                    input(type='number' :value="style['lineDashOffset']" min="0" @input="setSFP('lineDashOffset',$event.target.value*1)")
            tr
                td lineWidth
                td
                    input(type="number" :value="style['lineWidth']" min="0" @input="setSFP('lineWidth',$event.target.value*1)")
            tr
                td stroke
                td
                    el-color-picker(show-alpha :value="style['stroke']" @active-change="setSFP('stroke',$event)")
            tr
                td fill
                td
                    el-color-picker(show-alpha :value="style['fill']" @active-change="setSFP('fill',$event)")
            tr
                td propText
                td
                    select(@change="mapSFP('text',$event.target.value)")
                        option(value="")
                        option(v-for="prop in properties" :value="prop") {{prop}}
    .btn(v-for="fav,i in favorites" :key="i" @click="setFavorite(fav)"
        :style="{border:`solid ${fav.lineWidth}px ${fav.stroke}`,background:fav.fill}"
        @contextmenu.prevent="favorites=favorites.filter(f=>f!=fav)") {{i}}
</template>

<script>
export default {
    name: 'Styles',
    props: ['gismap','interaction','selectedFeatures'],
    data:  ()=>({
        defaultStyle: {lineWidth:1,lineDash:[]}, featureIndex:0, favorites: [],
        fontFamilies: ['arial','monospace','微軟正黑體'],
    }),
    methods: {
        setSFP(key,value){
            this.interaction.setSelectedFeaturesProp(key,value)
        },
        mapSFP(fKey,tKey){
            this.interaction.mapSelectedFeaturesProp(fKey,tKey)
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
    }
}
</script>

<style scoped>
input[type="number"]{
    width: 50px;
}
</style>