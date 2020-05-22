const chart = new Chart(document.getElementById('chart'),{
    data: [[1,1]],
    beginAtZero: true
})
chart.drawGrid()
chart.drawDots()