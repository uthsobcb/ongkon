import { state, setState, resetState } from './state.js';
import { render } from './render.js';
import { toWorld, findObjectAt } from './utils.js';

let canvas;

export const initHandlers = (canvasEl) => {
    canvas = canvasEl;
};

export const windowResize = (drawingBoard) => {
    canvas.width = drawingBoard.clientWidth;
    canvas.height = drawingBoard.clientHeight;
    render();
};

const getMousePos = (e) => {
    if (e.touches) {
        return {
            x: e.touches[0].clientX - canvas.getBoundingClientRect().left,
            y: e.touches[0].clientY - canvas.getBoundingClientRect().top
        };
    }
    return { x: e.offsetX, y: e.offsetY };
};

export const handleStart = (e) => {
    let { x, y } = getMousePos(e);
    state.lastMouseX = x;
    state.lastMouseY = y;
    let worldPos = toWorld(x, y);

    if (e.button === 1 || (e.buttons === 1 && e.getModifierState && e.getModifierState("Space"))) {
        state.isPanning = true;
        document.body.classList.add('cursor-grabbing');
        return;
    }

    if (state.selectedTool === 'select') {
        const found = findObjectAt(worldPos.x, worldPos.y);
        if (found) {
            state.selectedElement = found;
            state.isDragging = true;
        } else {
            state.selectedElement = null;
        }
        render();
        return;
    }

    state.isDrawing = true;

    if (state.selectedTool === 'brush' || state.selectedTool === 'eraser') {
        state.currentStroke = [{
            x: worldPos.x,
            y: worldPos.y,
            color: state.selectedTool === "eraser" ? "#fff" : state.selectedColor,
            width: state.brushWidth
        }];
    } else if (state.selectedTool === 'circle') {
        state.currentShape = { centerX: worldPos.x, centerY: worldPos.y, radius: 0, color: state.selectedColor };
    } else if (state.selectedTool === 'rectangle') {
        state.currentShape = { x: worldPos.x, y: worldPos.y, width: 0, height: 0, color: state.selectedColor };
    } else if (state.selectedTool === 'triangle') {
        state.currentShape = { x1: worldPos.x, y1: worldPos.y, x2: worldPos.x, y2: worldPos.y, x3: worldPos.x, y3: worldPos.y, color: state.selectedColor };
    }
};

export const handleMove = (e) => {
    e.preventDefault();
    let { x, y } = getMousePos(e);
    let worldPos = toWorld(x, y);

    if (state.isPanning) {
        const dx = x - state.lastMouseX;
        const dy = y - state.lastMouseY;
        state.viewport.x += dx;
        state.viewport.y += dy;
        state.lastMouseX = x;
        state.lastMouseY = y;
        render();
        return;
    }

    if (state.isDragging && state.selectedElement) {
        const dx = (x - state.lastMouseX) / state.viewport.zoom;
        const dy = (y - state.lastMouseY) / state.viewport.zoom;

        if (state.selectedElement.type === 'circle') {
            const obj = state.circles[state.selectedElement.index];
            obj.centerX += dx;
            obj.centerY += dy;
        } else if (state.selectedElement.type === 'rectangle') {
            const obj = state.rectangles[state.selectedElement.index];
            obj.x += dx;
            obj.y += dy;
        } else if (state.selectedElement.type === 'triangle') {
            const obj = state.triangles[state.selectedElement.index];
            obj.x1 += dx; obj.y1 += dy;
            obj.x2 += dx; obj.y2 += dy;
            obj.x3 += dx; obj.y3 += dy;
        } else if (state.selectedElement.type === 'brush') {
            const obj = state.brushStrokes[state.selectedElement.index];
            obj.forEach(p => { p.x += dx; p.y += dy; });
        }

        state.lastMouseX = x;
        state.lastMouseY = y;
        render();
        return;
    }

    if (!state.isDrawing) return;

    if (state.selectedTool === 'brush' || state.selectedTool === 'eraser') {
        state.currentStroke.push({
            x: worldPos.x,
            y: worldPos.y,
            color: state.selectedTool === "eraser" ? "#fff" : state.selectedColor,
            width: state.brushWidth
        });
    } else if (state.selectedTool === 'circle') {
        const dx = worldPos.x - state.currentShape.centerX;
        const dy = worldPos.y - state.currentShape.centerY;
        state.currentShape.radius = Math.sqrt(dx * dx + dy * dy);
    } else if (state.selectedTool === 'rectangle') {
        state.currentShape.width = worldPos.x - state.currentShape.x;
        state.currentShape.height = worldPos.y - state.currentShape.y;
    } else if (state.selectedTool === 'triangle') {
        state.currentShape.x2 = worldPos.x;
        state.currentShape.y2 = worldPos.y;
        state.currentShape.x3 = state.currentShape.x1 - (worldPos.x - state.currentShape.x1);
        state.currentShape.y3 = worldPos.y;
    }

    state.lastMouseX = x; // Update for next drag calcs
    render();
};

export const handleEnd = (e) => {
    state.isPanning = false;
    state.isDragging = false;
    document.body.classList.remove('cursor-grabbing');

    if (!state.isDrawing) return;
    state.isDrawing = false;

    if (state.selectedTool === 'brush' || state.selectedTool === 'eraser') {
        if (state.currentStroke.length > 0) state.brushStrokes.push(state.currentStroke);
        state.currentStroke = [];
    } else if (state.selectedTool === 'circle' && state.currentShape) {
        state.circles.push(state.currentShape);
    } else if (state.selectedTool === 'rectangle' && state.currentShape) {
        state.rectangles.push(state.currentShape);
    } else if (state.selectedTool === 'triangle' && state.currentShape) {
        state.triangles.push(state.currentShape);
    }

    state.currentShape = null;
    saveToLocal();
    render();
};

export const handleWheel = (e) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
        const zoomIntensity = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        const factor = 1 + (zoomIntensity * direction);

        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        const wx = (mouseX - state.viewport.x) / state.viewport.zoom;
        const wy = (mouseY - state.viewport.y) / state.viewport.zoom;

        const newZoom = Math.max(0.1, Math.min(state.viewport.zoom * factor, 10));

        state.viewport.x = mouseX - wx * newZoom;
        state.viewport.y = mouseY - wy * newZoom;
        state.viewport.zoom = newZoom;
    } else {
        state.viewport.x -= e.deltaX;
        state.viewport.y -= e.deltaY;
    }

    render();
};

export const saveToLocal = () => {
    const saveData = {
        viewport: state.viewport,
        circles: state.circles,
        rectangles: state.rectangles,
        triangles: state.triangles,
        brushStrokes: state.brushStrokes
    };
    localStorage.setItem("drawingData", JSON.stringify(saveData));
};
