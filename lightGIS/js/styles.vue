<template lang="pug">
.px-2
    table#custom-style.table.table-striped.table-hover
        tbody
            tr
                td text
                td
                    input#text(type="text" style="width:100px" oninput="interaction.setFeatureProps('text',event.target.value)")
            tr
                td textAnchor
                td
                    select#textAnchor(name="text-anchor" oninput="interaction.setFeatureProps('textAnchor',event.target.value)")
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
                    input#textFill(type='color' oninput="interaction.setFeatureProps('textFill',event.target.value)")
                    input#textStroke(type='color' oninput="interaction.setFeatureProps('textStroke',event.target.value)")
            tr
                td textSize
                td
                    input#fontSize(type='number' style='width:50px;' min='6' max='72' oninput="interaction.setFeatureProps('fontSize',event.target.value)")
                    input#fontWeight(type='number' style='width:50px;' min='0' max='5' oninput="interaction.setFeatureProps('fontWeight',event.target.value)")
            tr
                td fontFamily
                td
                    select#fontFamily(name="font-family" oninput="interaction.setFeatureProps('fontFamily',event.target.value)")
                        option(value="arial") arial
                        option(value="monospace") monospace
                        option(value="微軟正黑體") 微軟正黑體                        
            tr
                td radius
                td
                    input#radius(type='number' style='width:50px;' min='1' oninput="interaction.setFeatureProps('radius',event.target.value)")
            tr
                td opacity
                td
                    input#opacity(type='number' style='width:50px;' min='0.1' max='1' step='0.1' oninput="interaction.setFeatureProps('opacity',event.target.value)")
            tr
                td lineDash
                td
                    input#lineDash(type='number' style='width:50px;' min='0' oninput="interaction.setFeatureProps('lineDash',JSON.stringify([event.target.value,event.target.value]))")
                    input#lineDashOffset(type='number' style='width:50px;' value="0" oninput="interaction.setFeatureProps('lineDashOffset',event.target.value)")
            tr
                td lineWidth
                td
                    input#lineWidth(type='number' style='width:50px;' min='0' oninput="interaction.setFeatureProps('lineWidth',event.target.value)")
            tr
                td stroke
                td
                    input#stroke(type='color' oninput="interaction.setFeatureProps('stroke',event.target.value)")
            tr
                td fill
                td
                    input#fill(type='color' oninput="interaction.setFeatureProps('fill',event.target.value)")
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
    props: ['gismap'],
    data:  ()=>({

    }),
    methods: {
        setFeatureProps(key,value){
            this.gismap.selectEvent.styling = true
            for(let feature of this.gismap.selectEvent.features){
                feature.properties[key] = value
            }
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
            propText.innerHTML = options.map(option=>
                `<option value="${option}">${option}</option>`
            ).join('')
            propText.oninput = ()=>{
                this.gismap.selectEvent.features.map(f=>{
                    f.properties['text'] = f.properties[propText.value]
                })
            }
        }
    }
}
</script>

<style scoped>

</style>