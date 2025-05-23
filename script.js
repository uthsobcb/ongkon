const canvas = document.querySelector("canvas"),
    toolBtns = document.querySelectorAll(".tool"),
    sizeSlider = document.querySelector("#size-slider"),
    colorBtns = document.querySelectorAll(".colors .option"),
    colorPicker = document.querySelector("#color-picker"),
    clearCanvas = document.querySelector(".clear"),
    saveImg = document.querySelector(".save"),
    ctx = canvas.getContext("2d"),
    hamburgerMenu = document.getElementById("hamburger"),
    hamburgerIcon1 = document.getElementById("hamburger-icon-1"),
    hamburgerIcon2 = document.getElementById("hamburger-icon-2"),
    toolsBoard = document.getElementById("tools-board"),
    drawingBoard = document.getElementById("drawing-board");
const saveJsonBtn = document.getElementById("save-json");
const loadJsonBtn = document.getElementById("load-json");
const jsonDataArea = document.getElementById("json-data");


let prevMouseX, prevMouseY, isDrawing = false, brushWidth = 5, selectedTool = "brush", selectedColor = "#000";

const setCanvasBackground = () => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
}


// Store information about drawn circles, rectangles, and triangles
let circles = [];
let rectangles = [];
let triangles = [];
let data = { brushStrokes: [] }; // Initialize data with an empty brushStrokes array
let brushStrokes = data.brushStrokes; // Store all freehand strokes
let currentStroke = []; // Current stroke path

function windowResize() {
    canvas.width = drawingBoard.clientWidth;
    canvas.height = drawingBoard.clientHeight;
}

window.addEventListener("load", () => {
    windowResize();
    setCanvasBackground();
    const saved = localStorage.getItem("drawingData");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            circles = data.circles || [];
            rectangles = data.rectangles || [];
            triangles = data.triangles || [];
            brushStrokes = data.brushStrokes || [];

            redrawBrushStrokes();
            redrawCircles();
            redrawRectangles();
            redrawTriangles();
        } catch (err) {
            console.error("Failed to load saved drawing:", err);
        }
    }

});
window.onresize = windowResize;

const startDraw = (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.imageSmoothingEnabled = true;
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;

    if (selectedTool === "brush" || selectedTool === "eraser") {
        currentStroke = [{
            x: prevMouseX,
            y: prevMouseY,
            color: ctx.strokeStyle,
            width: ctx.lineWidth
        }];
    }
};


let isDrawingCircle = false;
let isDrawingRectangle = false;
let isDrawingTriangle = false;
let currentCircle = null;
let currentRectangle = null;
let currentTriangle = null;

const drawCircle = (e) => {
    if (isDrawingCircle) {
        const radius = Math.sqrt((e.offsetX - prevMouseX) ** 2 + (e.offsetY - prevMouseY) ** 2);
        const centerX = (e.offsetX + prevMouseX) / 2;
        const centerY = (e.offsetY + prevMouseY) / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        // Redraw previously drawn shapes
        redrawCircles();
        redrawRectangles();
        redrawTriangles();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Store information about the current circle
        currentCircle = { centerX, centerY, radius };
    }
};

const drawRectangle = (e) => {
    if (isDrawingRectangle) {
        const width = e.offsetX - prevMouseX;
        const height = e.offsetY - prevMouseY;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        // Redraw previously drawn shapes
        redrawCircles();
        redrawRectangles();
        redrawTriangles();

        ctx.beginPath();
        ctx.strokeRect(prevMouseX, prevMouseY, width, height);

        // Store information about the current rectangle
        currentRectangle = { x: prevMouseX, y: prevMouseY, width, height };
    }
};

const drawTriangle = (e) => {
    if (isDrawingTriangle) {
        const x2 = e.offsetX;
        const y2 = e.offsetY;
        const x3 = prevMouseX + (prevMouseX - x2);
        const y3 = y2;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        // Redraw previously drawn shapes
        redrawCircles();
        redrawRectangles();
        redrawTriangles();

        ctx.beginPath();
        ctx.moveTo(prevMouseX, prevMouseY);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.stroke();

        // Store information about the current triangle
        currentTriangle = { x1: prevMouseX, y1: prevMouseY, x2, y2, x3, y3 };
    }
};
function saveToLocal() {
    const saveData = {
        circles,
        rectangles,
        triangles,
        brushStrokes
    };
    localStorage.setItem("drawingData", JSON.stringify(saveData));
}

canvas.addEventListener("mousedown", (e) => {
    startDraw(e);
    if (selectedTool === "circle") {
        isDrawingCircle = true;
        currentCircle = null; // Reset the current circle
    } else if (selectedTool === "rectangle") {
        isDrawingRectangle = true;
        currentRectangle = null; // Reset the current rectangle
    } else if (selectedTool === "triangle") {
        isDrawingTriangle = true;
        currentTriangle = null; // Reset the current triangle
    }
});

canvas.addEventListener("mouseup", () => {
    isDrawingCircle = false;
    isDrawingRectangle = false;
    isDrawingTriangle = false;
    if (currentStroke.length > 0) {
        brushStrokes.push(currentStroke);
        currentStroke = [];
    }

    if (currentCircle) {
        // Store information about the completed circle
        circles.push(currentCircle);
        currentCircle = null; // Reset the current circle
    } else if (currentRectangle) {
        // Store information about the completed rectangle
        rectangles.push(currentRectangle);
        currentRectangle = null; // Reset the current rectangle
    } else if (currentTriangle) {
        // Store information about the completed triangle
        triangles.push(currentTriangle);
        currentTriangle = null; // Reset the current triangle
    }
    saveToLocal();

});

canvas.addEventListener("mousemove", (e) => {
    if (selectedTool === "circle") {
        if (isDrawingCircle) {
            drawCircle(e);
        }
    } else if (selectedTool === "rectangle") {
        if (isDrawingRectangle) {
            drawRectangle(e);
        }
    } else if (selectedTool === "triangle") {
        if (isDrawingTriangle) {
            drawTriangle(e);
        }
    } else {
        drawing(e);
    }
});

clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circles = [];
    rectangles = [];
    triangles = [];
    brushStrokes = [];
    localStorage.removeItem("drawingData");
    setCanvasBackground();
});

// Additional functions to redraw existing shapes
function redrawCircles() {
    circles.forEach((circle) => {
        ctx.beginPath();
        ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, 2 * Math.PI);
        ctx.stroke();
    });
}

function redrawRectangles() {
    rectangles.forEach((rectangle) => {
        ctx.beginPath();
        ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    });
}

function redrawTriangles() {
    triangles.forEach((triangle) => {
        ctx.beginPath();
        ctx.moveTo(triangle.x1, triangle.y1);
        ctx.lineTo(triangle.x2, triangle.y2);
        ctx.lineTo(triangle.x3, triangle.y3);
        ctx.closePath();
        ctx.stroke();
    });
}
function redrawBrushStrokes() {
    brushStrokes.forEach(stroke => {
        if (stroke.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke[0].color || "#000";
        ctx.lineWidth = stroke[0].width || 5;
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
    });
}


const drawRect = (e) => {
    ctx.beginPath();
    const width = e.offsetX - prevMouseX;
    const height = e.offsetY - prevMouseY;
    ctx.strokeRect(prevMouseX, prevMouseY, width, height);
};
const drawing = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    if (selectedTool === "brush" || selectedTool === "eraser") {
        const x = e.offsetX;
        const y = e.offsetY;

        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
        ctx.lineTo(x, y);
        ctx.stroke();

        prevMouseX = x;
        prevMouseY = y;

        currentStroke.push({ x, y, color: ctx.strokeStyle, width: ctx.lineWidth });
    }
};

toolBtns.forEach(btn => {
    if (btn.id != "size") {
        btn.addEventListener("click", () => {
            document.querySelector(".options .active").classList.remove("active");
            btn.classList.add("active");
            selectedTool = btn.id;

            // Remove previous drawing event listeners
            canvas.removeEventListener("mousemove", drawing);
            canvas.removeEventListener("mousemove", drawCircle);
            canvas.removeEventListener("mousemove", drawRectangle);
            canvas.removeEventListener("mousemove", drawTriangle);

            // Add the appropriate event listener based on the selected tool
            if (selectedTool === "brush" || selectedTool === "eraser") {
                canvas.addEventListener("mousemove", drawing);
            } else if (selectedTool === "circle") {
                canvas.addEventListener("mousemove", drawCircle);
            } else if (selectedTool === "rectangle") {
                canvas.addEventListener("mousemove", drawRectangle);
            } else if (selectedTool === "triangle") {
                canvas.addEventListener("mousemove", drawTriangle);
            }
        });
    }
});

sizeSlider.addEventListener("change", () => {
    brushWidth = sizeSlider.value;
});

colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
    });
});

colorPicker.addEventListener("change", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
});

saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", () => isDrawing = false);

// Touch Support 

const startDrawTouch = (e) => {
    e.preventDefault();
    isDrawing = true;
    ctx.beginPath();
    ctx.imageSmoothingEnabled = true;
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    const touch = e.touches[0];
    prevMouseX = touch.clientX - canvas.getBoundingClientRect().left;
    prevMouseY = touch.clientY - canvas.getBoundingClientRect().top;
};

const drawTouch = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const offsetX = touch.clientX - canvas.getBoundingClientRect().left;
    const offsetY = touch.clientY - canvas.getBoundingClientRect().top;

    if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        prevMouseX = offsetX;
        prevMouseY = offsetY;
    }
};

const endDrawTouch = () => {
    isDrawing = false;
};

canvas.removeEventListener("touchstart", startDrawTouch);
canvas.removeEventListener("touchmove", drawTouch);
canvas.removeEventListener("touchend", endDrawTouch);

canvas.addEventListener("touchstart", startDrawTouch);
canvas.addEventListener("touchmove", drawTouch);
canvas.addEventListener("touchend", endDrawTouch);



canvas.removeEventListener("mousedown", startDraw);
canvas.removeEventListener("mouseup", () => isDrawing = false);


hamburgerMenu.addEventListener("click", () => {
    toolsBoard.classList.toggle("tools-board-closed");
    hamburgerIcon1.classList.toggle("hamburger-icon-1-closed");
    hamburgerIcon2.classList.toggle("hamburger-icon-2-closed");
});

saveJsonBtn.addEventListener("click", () => {
    const data = {
        circles,
        rectangles,
        triangles,
        brushStrokes
    };
    jsonDataArea.value = JSON.stringify(data, null, 2);
});

loadJsonBtn.addEventListener("click", () => {
    try {
        const data = JSON.parse(jsonDataArea.value);
        if (data.circles && data.rectangles && data.triangles && data.brushStrokes) {
            circles = data.circles;
            rectangles = data.rectangles;
            triangles = data.triangles;
            brushStrokes = data.brushStrokes;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setCanvasBackground();

            redrawBrushStrokes();
            redrawCircles();
            redrawRectangles();
            redrawTriangles();
            redrawBrushStrokes();
        } else {
            alert("Invalid data format.");
        }
    } catch (e) {
        alert("Invalid JSON.");
    }
});
