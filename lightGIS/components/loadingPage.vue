<template lang="pug">
transition(name="fade")
    .position-fixed.w-100.h-100(ref="loadingPage" v-if="loading" style="top:0;left:0").bg-dark
</template>

<script>
export default {
    name: 'loadingPage',
    data: ()=>({
        loading: true
    }),
    methods: {
        svgAnimation(
            container,url,callback,style={
                strokeDasharray:3000,
                strokeDashoffset:3000,
                transition: 'stroke-dashoffset 2s ease-out',
                width:'100%',
                height:'100%',
            }){
            const xhr = new XMLHttpRequest();
            xhr.open("GET",url,false);
            xhr.overrideMimeType("image/svg+xml");
            xhr.onload = function() {
                let svg = xhr.responseXML.documentElement
                Object.assign(svg.style,style)
                container.appendChild(svg);
                setTimeout(()=>{
                    svg.style.strokeDashoffset = 0
                    setTimeout(()=>{ callback() },1500)
                },100)
            }
            xhr.send();
        }
    },
    mounted(){
        this.svgAnimation(this.$refs.loadingPage,'assets/light.svg',()=>{
            this.loading = false
        })
    }
}
</script>

<style scoped>

</style>