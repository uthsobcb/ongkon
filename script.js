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
    drawingBoard = document.getElementById("drawing-board"),
    zoomIndicator = document.getElementById("zoom-indicator");
const saveJsonBtn = document.getElementById("save-json");
const loadJsonBtn = document.getElementById("load-json");
const jsonDataArea = document.getElementById("json-data");


// --- State Management ---
let isDrawing = false;
let brushWidth = 5;
let selectedTool = "select"; // Default to select
let selectedColor = "#000";

let viewport = { x: 0, y: 0, zoom: 1 };
let isPanning = false;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Data Storage
let circles = [];
let rectangles = [];
let triangles = [];
let brushStrokes = [];

// Current Interaction State
let currentStroke = [];
let currentShape = null;
let selectedElement = null; // { type: 'circle'|'rect'|'triangle'|'brush', index: number, offsetX: number, offsetY: number }

// --- Coordinate Conversions ---
const toWorld = (screenX, screenY) => {
    return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom
    };
};

const toScreen = (worldX, worldY) => {
    return {
        x: worldX * viewport.zoom + viewport.x,
        y: worldY * viewport.zoom + viewport.y
    };
};

// --- Initialization ---
const windowResize = () => {
    canvas.width = drawingBoard.clientWidth;
    canvas.height = drawingBoard.clientHeight;
    render();
};

window.addEventListener("load", () => {
    windowResize();
    // Default tool selection in UI
    document.querySelector(".options .active").classList.remove("active");
    document.getElementById("select").classList.add("active");
    selectedTool = "select";

    const saved = localStorage.getItem("drawingData");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            circles = data.circles || [];
            rectangles = data.rectangles || [];
            triangles = data.triangles || [];
            brushStrokes = data.brushStrokes || [];
            if (data.viewport) viewport = data.viewport;
            render();
        } catch (err) {
            console.error("Failed to load saved drawing:", err);
        }
    }
});

window.onresize = windowResize;

// --- Rendering ---
const render = () => {
    // Clear Screen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Viewport Transform
    ctx.setTransform(viewport.zoom, 0, 0, viewport.zoom, viewport.x, viewport.y);

    // Draw All Types
    // 1. Brush Strokes
    brushStrokes.forEach(stroke => drawStrokePath(stroke));
    // 2. Shapes
    circles.forEach(c => drawCirclePath(c));
    rectangles.forEach(r => drawRectPath(r));
    triangles.forEach(t => drawTrianglePath(t));

    // 3. Current Interaction
    if (currentStroke.length > 0) drawStrokePath(currentStroke, true);
    if (currentShape) {
        if (selectedTool === 'circle') drawCirclePath(currentShape);
        else if (selectedTool === 'rectangle') drawRectPath(currentShape);
        else if (selectedTool === 'triangle') drawTrianglePath(currentShape);
    }

    // 4. Selection Highlight
    if (selectedElement) {
        drawSelectionHighlight(selectedElement);
    }

    // 5. Zoom UI
    if (zoomIndicator) zoomIndicator.innerText = Math.round(viewport.zoom * 100) + "%";
};

// Drawing Helpers
const drawStrokePath = (stroke, isCurrent = false) => {
    if (stroke.length < 1) return;
    ctx.beginPath();
    ctx.lineWidth = stroke[0].width;
    ctx.strokeStyle = stroke[0].color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
};

const drawCirclePath = (circle) => {
    ctx.beginPath();
    ctx.lineWidth = brushWidth; // Or store per shape
    ctx.strokeStyle = circle.color || "#000"; // Assuming color storage
    ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
};

const drawRectPath = (rect) => {
    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = rect.color || "#000";
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
};

const drawTrianglePath = (tri) => {
    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = tri.color || "#000";
    ctx.moveTo(tri.x1, tri.y1);
    ctx.lineTo(tri.x2, tri.y2);
    ctx.lineTo(tri.x3, tri.y3);
    ctx.closePath();
    ctx.stroke();
};

const drawSelectionHighlight = (el) => {
    ctx.save();
    ctx.strokeStyle = "#4A98F7";
    ctx.lineWidth = 2 / viewport.zoom;
    ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);

    let obj;
    if (el.type === 'circle') {
        obj = circles[el.index];
        ctx.beginPath();
        // Bounding box for circle
        ctx.rect(obj.centerX - obj.radius - 5, obj.centerY - obj.radius - 5, obj.radius * 2 + 10, obj.radius * 2 + 10);
        ctx.stroke();
    } else if (el.type === 'rectangle') {
        obj = rectangles[el.index];
        ctx.strokeRect(obj.x - 5, obj.y - 5, obj.width + 10, obj.height + 10);
    } else if (el.type === 'triangle') {
        obj = triangles[el.index];
        // Bounding box for triangle
        const minX = Math.min(obj.x1, obj.x2, obj.x3);
        const maxX = Math.max(obj.x1, obj.x2, obj.x3);
        const minY = Math.min(obj.y1, obj.y2, obj.y3);
        const maxY = Math.max(obj.y1, obj.y2, obj.y3);
        ctx.strokeRect(minX - 5, minY - 5, (maxX - minX) + 10, (maxY - minY) + 10);
    } else if (el.type === 'brush') {
        obj = brushStrokes[el.index];
        // Simple bounding box for stroke
        if (obj.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            obj.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            ctx.strokeRect(minX - 5, minY - 5, (maxX - minX) + 10, (maxY - minY) + 10);
        }
    }
    ctx.restore();
};

// --- Hit Testing ---
const isPointInCircle = (x, y, circle) => {
    return Math.sqrt((x - circle.centerX) ** 2 + (y - circle.centerY) ** 2) <= circle.radius + brushWidth / 2;
};

const isPointInRect = (x, y, rect) => {
    // Handle negative width/height
    const rx = rect.width >= 0 ? rect.x : rect.x + rect.width;
    const ry = rect.height >= 0 ? rect.y : rect.y + rect.height;
    const rw = Math.abs(rect.width);
    const rh = Math.abs(rect.height);
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
};

// Barycentric technique or simple box + side checks
const isPointInTriangle = (mx, my, tri) => {
    // Bounding box check first
    const minX = Math.min(tri.x1, tri.x2, tri.x3);
    const maxX = Math.max(tri.x1, tri.x2, tri.x3);
    const minY = Math.min(tri.y1, tri.y2, tri.y3);
    const maxY = Math.max(tri.y1, tri.y2, tri.y3);
    if (mx < minX || mx > maxX || my < minY || my > maxY) return false;

    // Barycentric coordinates
    const area = 0.5 * (-tri.y2 * tri.x3 + tri.y1 * (-tri.x2 + tri.x3) + tri.x1 * (tri.y2 - tri.y3) + tri.x2 * tri.y3);
    const s = 1 / (2 * area) * (tri.y1 * tri.x3 - tri.x1 * tri.y3 + (tri.y3 - tri.y1) * mx + (tri.x1 - tri.x3) * my);
    const t = 1 / (2 * area) * (tri.x1 * tri.y2 - tri.y1 * tri.x2 + (tri.y1 - tri.y2) * mx + (tri.x2 - tri.x1) * my);
    return s > 0 && t > 0 && 1 - s - t > 0;
};

const isPointNearStroke = (x, y, stroke) => {
    const threshold = 10;
    for (let i = 0; i < stroke.length - 1; i++) {
        const p1 = stroke[i];
        const p2 = stroke[i + 1];
        // Distance from point to line segment p1-p2
        const A = x - p1.x;
        const B = y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) // in case of 0 length line
            param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        }
        else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        }
        else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
    }
    return false;
};

const findObjectAt = (wx, wy) => {
    // Check in reverse draw order (top to bottom)

    // 3. Triangles
    for (let i = triangles.length - 1; i >= 0; i--) {
        if (isPointInTriangle(wx, wy, triangles[i])) return { type: 'triangle', index: i };
    }
    // 2. Rectangles
    for (let i = rectangles.length - 1; i >= 0; i--) {
        if (isPointInRect(wx, wy, rectangles[i])) return { type: 'rectangle', index: i };
    }
    // 1. Circles
    for (let i = circles.length - 1; i >= 0; i--) {
        if (isPointInCircle(wx, wy, circles[i])) return { type: 'circle', index: i };
    }
    // 0. Brush
    for (let i = brushStrokes.length - 1; i >= 0; i--) {
        if (isPointNearStroke(wx, wy, brushStrokes[i])) return { type: 'brush', index: i };
    }
    return null;
};

// --- Interaction Handlers ---

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    // Check for Zoom (Ctrl/Cmd + Scroll)
    if (e.ctrlKey || e.metaKey) {
        const zoomIntensity = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        const factor = 1 + (zoomIntensity * direction);

        // Zoom around mouse
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        const wx = (mouseX - viewport.x) / viewport.zoom;
        const wy = (mouseY - viewport.y) / viewport.zoom;

        const newZoom = Math.max(0.1, Math.min(viewport.zoom * factor, 10)); // Limit zoom

        viewport.x = mouseX - wx * newZoom;
        viewport.y = mouseY - wy * newZoom;
        viewport.zoom = newZoom;
    } else {
        // Pan (Scroll)
        viewport.x -= e.deltaX;
        viewport.y -= e.deltaY;
    }

    render();
});

const getMousePos = (e) => {
    if (e.touches) {
        return {
            x: e.touches[0].clientX - canvas.getBoundingClientRect().left,
            y: e.touches[0].clientY - canvas.getBoundingClientRect().top
        };
    }
    return { x: e.offsetX, y: e.offsetY };
};

const handleStart = (e) => {
    let { x, y } = getMousePos(e);
    lastMouseX = x;
    lastMouseY = y;
    let worldPos = toWorld(x, y);

    // Pan with Middle Mouse or if Space is held
    if (e.button === 1 || (e.buttons === 1 && e.getModifierState && e.getModifierState("Space"))) { // Middle click or Space+Left
        isPanning = true;
        document.body.classList.add('cursor-grabbing');
        return;
    }

    if (selectedTool === 'select') {
        const found = findObjectAt(worldPos.x, worldPos.y);
        if (found) {
            selectedElement = found;
            isDragging = true;
            // Store offset
            let obj;
            if (found.type === 'circle') obj = circles[found.index];
            else if (found.type === 'rectangle') obj = rectangles[found.index];
            else if (found.type === 'triangle') obj = triangles[found.index];
            else if (found.type === 'brush') obj = brushStrokes[found.index];

            // For simplicity, we just track delta movement
        } else {
            selectedElement = null; // Deselect
        }
        render();
        return;
    }

    // Tools
    isDrawing = true;
    ctx.beginPath();

    if (selectedTool === 'brush' || selectedTool === 'eraser') {
        currentStroke = [{
            x: worldPos.x,
            y: worldPos.y,
            color: selectedTool === "eraser" ? "#fff" : selectedColor,
            width: brushWidth
        }];
    } else if (selectedTool === 'circle') {
        currentShape = { centerX: worldPos.x, centerY: worldPos.y, radius: 0, color: selectedColor };
    } else if (selectedTool === 'rectangle') {
        currentShape = { x: worldPos.x, y: worldPos.y, width: 0, height: 0, color: selectedColor };
    } else if (selectedTool === 'triangle') {
        currentShape = { x1: worldPos.x, y1: worldPos.y, x2: worldPos.x, y2: worldPos.y, x3: worldPos.x, y3: worldPos.y, color: selectedColor };
    }
};

const handleMove = (e) => {
    e.preventDefault(); // Prevent touch scrolling
    let { x, y } = getMousePos(e);
    let worldPos = toWorld(x, y);

    if (isPanning) {
        const dx = x - lastMouseX;
        const dy = y - lastMouseY;
        viewport.x += dx;
        viewport.y += dy;
        lastMouseX = x;
        lastMouseY = y;
        render();
        return;
    }

    if (isDragging && selectedElement) {
        const dx = (x - lastMouseX) / viewport.zoom;
        const dy = (y - lastMouseY) / viewport.zoom;

        // Update Object Position
        if (selectedElement.type === 'circle') {
            const obj = circles[selectedElement.index];
            obj.centerX += dx;
            obj.centerY += dy;
        } else if (selectedElement.type === 'rectangle') {
            const obj = rectangles[selectedElement.index];
            obj.x += dx;
            obj.y += dy;
        } else if (selectedElement.type === 'triangle') {
            const obj = triangles[selectedElement.index];
            obj.x1 += dx; obj.y1 += dy;
            obj.x2 += dx; obj.y2 += dy;
            obj.x3 += dx; obj.y3 += dy;
        } else if (selectedElement.type === 'brush') {
            const obj = brushStrokes[selectedElement.index];
            obj.forEach(p => { p.x += dx; p.y += dy; });
        }

        lastMouseX = x;
        lastMouseY = y;
        render();
        return;
    }

    if (!isDrawing) return;

    if (selectedTool === 'brush' || selectedTool === 'eraser') {
        currentStroke.push({
            x: worldPos.x,
            y: worldPos.y,
            color: selectedTool === "eraser" ? "#fff" : selectedColor,
            width: brushWidth
        });
    } else if (selectedTool === 'circle') {
        const dx = worldPos.x - currentShape.centerX;
        const dy = worldPos.y - currentShape.centerY;
        currentShape.radius = Math.sqrt(dx * dx + dy * dy);
    } else if (selectedTool === 'rectangle') {
        currentShape.width = worldPos.x - currentShape.x;
        currentShape.height = worldPos.y - currentShape.y;
    } else if (selectedTool === 'triangle') {
        currentShape.x2 = worldPos.x;
        currentShape.y2 = worldPos.y;
        currentShape.x3 = currentShape.x1 - (worldPos.x - currentShape.x1);
        currentShape.y3 = worldPos.y;
    }

    lastMouseX = x; // Update for next drag calcs if any, though mostly used for pan/drag
    render();
};

const handleEnd = (e) => {
    isPanning = false;
    isDragging = false;
    document.body.classList.remove('cursor-grabbing');

    if (!isDrawing) return;
    isDrawing = false;

    if (selectedTool === 'brush' || selectedTool === 'eraser') {
        if (currentStroke.length > 0) brushStrokes.push(currentStroke);
        currentStroke = [];
    } else if (selectedTool === 'circle' && currentShape) {
        circles.push(currentShape);
    } else if (selectedTool === 'rectangle' && currentShape) {
        rectangles.push(currentShape);
    } else if (selectedTool === 'triangle' && currentShape) {
        triangles.push(currentShape);
    }

    currentShape = null;
    saveToLocal();
    render();
};

// Listeners
canvas.addEventListener("mousedown", handleStart);
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleEnd);
canvas.addEventListener("mouseleave", handleEnd); // Stop if leaving canvas

canvas.addEventListener("touchstart", handleStart);
canvas.addEventListener("touchmove", handleMove);
canvas.addEventListener("touchend", handleEnd);

// Tool Switching
toolBtns.forEach(btn => {
    if (btn.id != "size") {
        btn.addEventListener("click", () => {
            document.querySelector(".options .active").classList.remove("active");
            btn.classList.add("active");
            selectedTool = btn.id;
            selectedElement = null;
            render();

            // Checkboxes
            if (selectedTool === 'select') {
                canvas.style.cursor = 'default';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        });
    }
});

sizeSlider.addEventListener("change", () => brushWidth = sizeSlider.value);

colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
    });
});

colorPicker.addEventListener("change", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
    selectedColor = colorPicker.value;
});

saveImg.addEventListener("click", () => {
    // Render full scene to temp canvas if needed, or just current view
    // For now, save current view
    const link = document.createElement("a");
    link.download = `ongkon-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

function saveToLocal() {
    const saveData = {
        viewport,
        circles,
        rectangles,
        triangles,
        brushStrokes
    };
    localStorage.setItem("drawingData", JSON.stringify(saveData));
}

clearCanvas.addEventListener("click", () => {
    circles = [];
    rectangles = [];
    triangles = [];
    brushStrokes = [];
    viewport = { x: 0, y: 0, zoom: 1 };
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
        viewport,
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
        if (data.circles || data.brushStrokes) {
            circles = data.circles || [];
            rectangles = data.rectangles || [];
            triangles = data.triangles || [];
            brushStrokes = data.brushStrokes || [];
            if (data.viewport) viewport = data.viewport;
            render();
        } else {
            alert("Invalid data format.");
        }
    } catch (e) {
        alert("Invalid JSON.");
    }
});
