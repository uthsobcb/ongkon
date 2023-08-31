const canvas = document.querySelector("canvas"),
    toolBtns = document.querySelectorAll(".tool"),
    sizeSlider = document.querySelector("#size-slider"),
    colorBtns = document.querySelectorAll(".colors .option"),
    colorPicker = document.querySelector("#color-picker"),
    clearCanvas = document.querySelector(".clear"),
    saveImg = document.querySelector(".save"),
    ctx = canvas.getContext("2d");

let pervMouseX, pervMouseY, snapshot,
    isDrawing = false,
    brushwidth = 5,
    selectedTool = "brush",
    selectedColor = "#000";


window.addEventListener("load", () => {
    canvas.height = canvas.offsetHeight;
    canvas.width = canvas.offsetWidth;
});


const startDraw = (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.lineWidth = brushwidth;
    ctx.strokeStyle = selectedColor;
}

const drawCircle = (e) => {
    ctx.arc(pervMouseX, pervMouseY, 50, 0, 2 * Math.PI);
    ctx.stroke();
}

const drawRect = (e) => {
    ctx.strokeRect(e.offsetX, e.offsetY, pervMouseX - e.offsetX, pervMouseY - e.offsetY);
}

const drawing = (e) => {
    if (!isDrawing) return;

    if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        //console.log(selectedTool);
    }
}

toolBtns.forEach(btn => {
    if (btn.id != "size") {
        btn.addEventListener("click", () => {
            //console.log(btn.id)
            document.querySelector(".options .active").classList.remove("active");
            btn.classList.add("active");
            selectedTool = btn.id;
            //console.log(selectedTool);
        })
    }
});

sizeSlider.addEventListener("change", () => {
    //console.log("Dense")
    brushwidth = sizeSlider.value
});

colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
    })
});
colorPicker.addEventListener("change", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
})
clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
})
saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
})

canvas.addEventListener("pointerdown", startDraw);
canvas.addEventListener("pointermove", drawing);
canvas.addEventListener("pointerup", () => isDrawing = false);