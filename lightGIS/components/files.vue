<template lang="pug">
.px-2
    input(ref="file" type='file' style='display: none' @change='handleFiles(event.target.files)' multiple='true')
    .btn.btn-outline-primary.w-100(@click="$refs['file'].click()") 選取檔案或拖曳匯入
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
import importHandler from '../js/importHandler.js'
import exportHandler from '../js/exportHandler.js'
export default {
    name: 'Files',
    mixins: [importHandler,exportHandler]
}
</script>

<style scoped>

</style>