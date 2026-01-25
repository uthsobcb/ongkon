import { state, setState, loadState, resetState } from './state.js';
import { initRender, render } from './render.js';
import { initHandlers, windowResize, handleStart, handleMove, handleEnd, handleWheel } from './handlers.js';

// DOM Elements
const canvas = document.querySelector("canvas"),
    toolBtns = document.querySelectorAll(".tool"),
    sizeSlider = document.querySelector("#size-slider"),
    colorBtns = document.querySelectorAll(".colors .option"),
    colorPicker = document.querySelector("#color-picker"),
    fillColor = document.querySelector("#fill-color"),
    clearCanvas = document.querySelector(".clear"),
    saveImg = document.querySelector(".save"),
    hamburgerMenu = document.getElementById("hamburger"),
    hamburgerIcon1 = document.getElementById("hamburger-icon-1"),
    hamburgerIcon2 = document.getElementById("hamburger-icon-2"),
    toolsBoard = document.getElementById("tools-board"),
    drawingBoard = document.getElementById("drawing-board"),
    zoomIndicator = document.getElementById("zoom-indicator"),
    saveJsonBtn = document.getElementById("save-json"),
    loadJsonBtn = document.getElementById("load-json"),
    jsonDataArea = document.getElementById("json-data");

// Initialization
window.addEventListener("load", () => {
    initRender(canvas, zoomIndicator);
    initHandlers(canvas);

    // Resize (also triggers render)
    windowResize(drawingBoard);

    // Default tool selection in UI
    document.querySelector(".options .active").classList.remove("active");
    document.getElementById("brush").classList.add("active");
    setState({ selectedTool: "brush" });

    // Load saved data
    const saved = localStorage.getItem("drawingData");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            loadState(data);
            render();
        } catch (err) {
            console.error("Failed to load saved drawing:", err);
        }
    }
});

window.addEventListener("resize", () => windowResize(drawingBoard));

// Canvas Interaction
canvas.addEventListener("mousedown", handleStart);
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleEnd);
canvas.addEventListener("mouseleave", handleEnd);

canvas.addEventListener("touchstart", handleStart);
canvas.addEventListener("touchmove", handleMove);
canvas.addEventListener("touchend", handleEnd);

canvas.addEventListener("wheel", handleWheel);

// Tool Switching
toolBtns.forEach(btn => {
    if (btn.id != "size") {
        btn.addEventListener("click", () => {
            document.querySelector(".options .active").classList.remove("active");
            btn.classList.add("active");
            setState({ selectedTool: btn.id, selectedElement: null });
            render();

            if (btn.id === 'select') {
                canvas.style.cursor = 'default';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        });
    }
});

sizeSlider.addEventListener("change", () => setState({ brushWidth: sizeSlider.value }));

colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        const color = window.getComputedStyle(btn).getPropertyValue("background-color");
        setState({ selectedColor: color });
    });
});

colorPicker.addEventListener("change", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
    colorPicker.parentElement.style.background = colorPicker.value;
    setState({ selectedColor: colorPicker.value });
});

fillColor.addEventListener("change", () => {
    setState({ isFilled: fillColor.checked });
});

saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `ongkon-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

clearCanvas.addEventListener("click", () => {
    resetState();
    render();
    localStorage.removeItem("drawingData");
});

hamburgerMenu.addEventListener("click", () => {
    toolsBoard.classList.toggle("tools-board-closed");
    hamburgerIcon1.classList.toggle("hamburger-icon-1-closed");
    hamburgerIcon2.classList.toggle("hamburger-icon-2-closed");
});

saveJsonBtn.addEventListener("click", () => {
    const data = {
        viewport: state.viewport,
        circles: state.circles,
        rectangles: state.rectangles,
        triangles: state.triangles,
        brushStrokes: state.brushStrokes
    };
    jsonDataArea.value = JSON.stringify(data, null, 2);
});

loadJsonBtn.addEventListener("click", () => {
    try {
        const data = JSON.parse(jsonDataArea.value);
        if (data.circles || data.brushStrokes) {
            loadState(data);
            render();
        } else {
            alert("Invalid data format.");
        }
    } catch (e) {
        alert("Invalid JSON.");
    }
});
