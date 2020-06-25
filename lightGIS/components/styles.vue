<template lang="pug">
.px-2
    .btn.btn-outline(@click="interaction.moveLayerTo('top')") 置頂
    .btn.btn-outline(@click="interaction.moveLayerTo('bottom')") 置底
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
                    input(type='number' :value="style['lineDash']" min="0" @input="setSFP('lineDash',JSON.stringify([$event.target.value*1,$event.target.value*1]))")
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
    table#data-driven
        tbody
            tr
                td propText
                td
                    select#propText(name="propt-text")
</template>

<script>
export default {
    name: 'Styles',
    props: ['gismap','interaction'],
    data:  ()=>({
        defaultStyle: {lineWidth:1},
        fontFamilies: ['arial','monospace','微軟正黑體'],
    }),
    methods: {
        setSFP(key,value){
            return this.interaction.setSelectedFeaturesProp(key,value)
        },
        renderStyleTable(feature){
            let style = this.gismap.getDefaultStyle(feature)
            for(let key in style){
                if(key=='lineDash')
                    document.getElementById(key).value = style[key][0]||''
                else
                    document.getElementById(key).value = style[key]||''
            }
            let options = Object.keys(feature.properties).filter(key=>!(key in style))
            let propText = document.getElementById('propText')
            // propText.innerHTML = options.map(option=>
            //     `<option value="${option}">${option}</option>`
            // ).join('')
            // propText.@input = ()=>{
            //     this.gismap.selectEvent.features.map(f=>{
            //         f.properties['text'] = f.properties[propText.value]
            //     })
            // }
        }
    },
    computed:{
        style(){
            if(this.gismap.selectEvent&&this.gismap.selectEvent.features.length){
                let feature = this.gismap.selectEvent.features[0]
                return this.gismap.getDefaultStyle(feature)
            }else{return this.defaultStyle}
        }
    }
}
</script>

<style scoped>
input[type="number"]{
    width: 50px;
}
</style>