<template lang="pug">
.px-2
    input#file(type='file' style='display: none' onchange='handleFiles(event.target.files)' multiple='true')
    .btn.btn-outline-primary.w-100(onclick="document.getElementById('file').click()") 選取檔案或拖曳匯入
    .btn.btn-outline-secondary.w-100(onclick="PTX.BusRoutes()") 公車路線
    .input-group
        .input-group-prepend
            .btn.btn-outline-success(onclick="exportFile('geojson')") 匯出
        input#file-export.form-control.btn.btn-outline-success(type='text' name='file-export' style='width:50px')
        select#file-extension.btn.btn-outline-success(name='file-extension')
            option(value='.geojson') .geojson
            option(value='.png') .png
            option(value='.svg') .svg
</template>

<script>
export default {
    
}
</script>

<style scoped>

</style>