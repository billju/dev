<template lang="pug">
.position-fixed.bg-dark.text-light.w-100.h-100.d-flex.justify-content-center.align-items-center(style="left:0;top:0")
    el-carousel.w-100.mx-5(:interval="4000", type="card" trigger="click" @change="pageIndex=$event")
        el-carousel-item(v-for="img,i in imgs" :key="img.src")
            el-image.w-100.h-100(:src="img.src" fit="cover" @click="setState({showDialog:pageIndex!=i})")
                .image-slot(slot="placeholder") 載入中
                    span.dot ...
                .image-slot(slot="error")
                    i.el-icon-picture-outline
            h3 {{ img.title }}
            p {{ img.text }}
    .btn.position-absolute.text-light(style="right:0;top:0" @click="setState({showDialog:false})")
        i.el-icon-close
</template>

<script>
import utilsMixin from '../mixins/utilsMixin.js'

export default {
    name: "Intro",
    mixins: [utilsMixin],
    data: () => ({
        pageIndex: 0,
        imgs: [
            {
                src: "assets/png/shortcut-bus.png",
                title: "公車即時動態",
                text: "PTX>公車>搜尋路線",
            },
            {
                src: "assets/png/shortcut-choropleth.png",
                title: "分層設色圖",
                text: "加入多邊形>選取>填滿>指定欄位",
            },
            { 
                src: "assets/png/shortcut-heatmap.png", 
                title: "熱點圖", 
                text: "加入點位資料>設定>熱點圖" 
            },
            {
                src: "assets/png/shortcut-ibike.png",
                title: "公共自行車即時佔位",
                text: "PTX>即時站位",
            },
            {
                src: "assets/png/shortcut-measure.png",
                title: "長度與面積測量",
                text: "點擊右鍵>連點左鍵兩下結束繪製",
            },
            { 
                src: "assets/png/shortcut-metro.png", 
                title: "繪製路網圖", 
                text: "PTX>台北捷運>填滿>指定欄位>代號>捷運代號" 
            },
            {
                src: "assets/png/shortcut-raster.png",
                title: "網格疊圖分析",
                text: "網格>開關切換、推桿調整透明度、拖曳進行排序",
            },
            { 
                src: "assets/png/shortcut-table.png", 
                title: "資料表格檢索", 
                text: "向量>群組工具列>資料表格"
            },
        ],
    }),
};
</script>

<style>
.el-carousel__container {
    height: 500px !important;
}
</style>
<style scoped>
h3 {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.8);
}
p {
    position: absolute;
    bottom: 0;
    right: 10px;
    padding: 10px;
    max-width: 80%;
    background: rgba(0, 0, 0, 0.8);
}
</style>