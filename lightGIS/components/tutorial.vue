<template lang="pug">
.px-2(style="width:300px")
    el-collapse(accordion)
        el-collapse-item(title="網格")
            ul
                li 點擊開關打開地圖(建議：OSM)
                li 拉動滑桿可調整透明度
                li 按住文字拖曳可排序圖層先後順序
                li 可加入自定義WMS server
        el-collapse-item(title="向量繪製")
            ul
                li 點擊右鍵開始繪製
                li 連點兩下結束
                li 點：如果滑鼠沒有移動
                li 線：連線沒有閉合
                li 面：最後一點與第一點重疊
                li 點擊物件進行選取，左邊會跳出屬性列
                li ctrl+左鍵+移動：框選(範圍內)
                li ctrl+左鍵：多重選取或取消
                li ctrl+x：剪下(複製並刪除)
                li ctrl+z：復原刪除
                li ctrl+c：複製
                li ctrl+v：貼上
                li ctrl+b：原地複製貼上
                li 方向鍵：微調位置
        el-collapse-item(title="向量管理")
            ul
                li 左方列為群組名稱集，群組名稱不重複
                li 點選群組切換，再點一次聚焦至全觀
                li 右方列為控制項
        el-collapse-item(title="樣式")
            ul
                li 加入最愛：新增常用樣式置於底下，左鍵套用右鍵刪除
                li 置頂：將向量置於地圖最上方
                li 置底：將向量置於向量最下方(仍在圖片上方)
        el-collapse-item(title="檔案")
            ul
                li 可以直接拖曳匯入圖片、向量檔
                li 向量檔支援geojson
                li 圖片可以拖曳、鎖定或調透明度
                li 框選指定範圍並匯出
                li geojson：匯出所有向量
                li png：以目前網頁大小為尺寸
                li svg：可以再匯入繪圖軟體加工
        el-collapse-item(title="PTX")
            ul
                li 資料取自交通部大眾運輸資料平台
                li 觀光：皆為點位資料
                    ul
                        li 景點
                        li 餐廳
                        li 旅館
                        li 活動
                li 公共自行車：
                li 公車：
                li 火車：
                li 高鐵：
                li 捷運：
</template>

<script>
export default {
    data:()=>({
        
    })
}
</script>

<style scoped>
.el-carousel__item{
    background: #99a9bf;
}
</style>