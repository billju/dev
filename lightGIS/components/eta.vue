<template lang="pug">
    ul.list-group
        li.list-group-item.d-flex.justify-content-between.align-items-center(v-for="eta,i in busETA" :key="i")
            span.badge.badge-primary.badge-pill.text-center(style="font-size: 16px;width:60px") {{eta.time}}
            span.px-2(style="flex:1") {{eta.stop}}
            span.badge.badge-primary {{eta.plate}}
</template>

<script>
export default {
    name:'ETA',
    props: ['busETA']
}
</script>