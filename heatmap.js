class HeatCanvas{
    constructor(canvas){
        this.canvas = canvas
        this.counter = {}
    }
    push(x,y,value){
        if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) {
            return ;
        }
        var i = x+y*this.canvas.width;
        this.counter[i] = this.counter[i]?this.counter[i]+value:value 
    }
    value2hsla(value){
        const hsla = new Float64Array(4);
        hsla[0] = (1 - value);// h
        hsla[1] = 0.8;// s
        hsla[2] = value * 0.6;// l
        hsla[3] = 1.0;// a
        return hsla;
    }
    hsla2rgba(hsla){
        const rgba = new Uint8ClampedArray(4);
        var [h,s,l,a] = hsla
        if(s == 0){
            r = g = b = l;
        }else{
            function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        rgba[0] = r * 255;
        rgba[1] = g * 255;
        rgba[2] = b * 255;
        rgba[3] = a * 255;
        return rgba;
    }
    draw(step,pow){
        var counter = {}
        var ctx = this.canvas.getContext('2d')
        var maxValue = Math.max(...Object.value(this.counter))||0
        ctx.clearRect(0,0,this.canvas.width, this.canvas.height)
        for(let i in this.counter){
            let value = this.counter[i]
            let radius = Math.fllor(Math.pow(value/step,1/pow))
            let x = Math.floor(i%this.canvas.width)
            let y = Math.floor(i/this.canvas.width)
            // calculate point x.y 
            for(var scanx=x-radius; scanx<x+radius; scanx+=1){            
                // out of extent
                if(scanx<0 || scanx>this.canvas.width)
                    continue;
                for(var scany=y-radius; scany<y+radius; scany+=1){
                    if(scany<0 || scany>params.height)
                        continue;
                    var dx = scanx-x
                    var dy = scany-y
                    var dist = Math.sqrt(dx*dx+dy*dy);
                    if(dist > radius){
                        continue;
                    } else {
                        var v = value - step * Math.pow(dist, pow);
                        var j = scanx+scany*this.canvas.width
                        counter[j] = counter[j]?counter[j]+v:v
                    }
                }
            }
        }
        var imageData = ctx.createImageData(this.canvas.width, this.canvas.height)
        for (var i=0; i<imageData.data.length; i+=4){
            let normValue = counter[i]/maxValue
            let rgba = isNaN(normValue)?[0,0,0,255]:this.hsla2rgba(this.value2hsla(normValue))
            imageData.data[i] = rgba[0]; // r
            imageData.data[i+1] = rgba[1]; // g
            imageData.data[i+2] = rgba[2]; // b
            imageData.data[i+3] = rgba[3]; // a
        }
        ctx.putImageData(imageData, 0, 0);
    }
}