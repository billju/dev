const chart = new Chart(document.getElementById('chart'),{
    data: [[1,1]],
    beginAtZero: true
})
chart.drawGrid()
chart.drawDots()
hiddenText(document.getElementById('chuboy'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'top')
hiddenText(document.getElementById('web-dev'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'left')
hiddenText(document.getElementById('data-analyst'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'right')
hiddenText(document.getElementById('metro'),{padding:'25px',fontWeight:'bold'},{background:'dodgerblue'},'left')
typingText(document.getElementById('description'),100)
hoppingText(document.getElementById('my-skills'))
window.addEventListener('scroll',e=>{
    chart.canvas.style.top = window.scrollY+'px'
})
skr(document.getElementById('application'))