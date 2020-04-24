class Encoder{
    constructor(){

    }
    encodeWAV(audioBuffer, smapleRate){
        const samples = interleave(audioBuffer)
        const buffer = new ArrayBuffer(44 + samples.length * 2)
        const view = new DataView(buffer)

        /* RIFF identifier */
        writeString(view, 0, 'RIFF')
        /* RIFF chunk length */
        view.setUint32(4, 36 + samples.length * 2, true)
        /* RIFF type */
        writeString(view, 8, 'WAVE')
        /* format chunk identifier */
        writeString(view, 12, 'fmt ')
        /* format chunk length */
        view.setUint32(16, 16, true)
        /* sample format (raw) */
        view.setUint16(20, 1, true)
        /* channel count */
        view.setUint16(22, numChannels, true)
        /* sample rate */
        view.setUint32(24, sampleRate, true)
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * 4, true)
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, numChannels * 2, true)
        /* bits per sample */
        view.setUint16(34, 16, true)
        /* data chunk identifier */
        writeString(view, 36, 'data')
        /* data chunk length */
        view.setUint32(40, samples.length * 2, true)

        floatTo16BitPCM(view, 44, samples)
        return view

        function interleave(audioBuffer=AudioBuffer) {
            if (audioBuffer.numberOfChannels === 1) {
                return audioBuffer.getChannelData(0)
            } else {
                const L = audioBuffer.getChannelData(0)
                const R = audioBuffer.getChannelData(1)
                let len = L.length+R.length, i = 0, j = 0
                const result = new Float32Array(len)
                while (i<len) {
                    result[i++] = inputL[j]
                    result[i++] = inputR[j]
                    j++
                }
                return result
            }
        }
        function floatTo16BitPCM (view=DataView, offset=Number, input=Float32Array) {
            for (let i = 0; i < input.length; i++, offset += 2) {
                let s = input[i]
                if (s < 0) {
                    if (s < -1) s = -1
                    s *= 0x8000
                } else {
                    if (s > 1) s = 1
                    s *= 0x7FFF
                }
                view.setInt16(offset, s, true)
            }
        }
        function writeString (view=DataView, offset=Number, string=String) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i))
            }
        }
    }
    sliceAudioBuffer(audioBuffer,start=0,end=audioBuffer.length){
        const newBuffer = audioCtx.createBuffer(
            audioBuffer.numberOfChannels,
            end - start,
            audioBuffer.sampleRate
        )
        for(let i=0;i<audioBuffer.numberOfChannels;i++){
            newBuffer.copyToChannel(audioBuffer.getChannelData(i).slice(start,end))
        }
        return newBuffer
    }
    download(blob){
        new Blob([arrayBuffer],{type:'audio/mp3'})
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'download.mp3'
        document.body.appendChild(link)
        link.click()
        link.remove()
    }
}