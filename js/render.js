import { state } from './state.js';
import { getResizeHandleRects } from './utils.js';

let canvas, ctx, zoomIndicator;

export const initRender = (canvasEl, zoomIndicatorEl) => {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    zoomIndicator = zoomIndicatorEl;
};

export const render = () => {
    if (!ctx) return;

    // Clear Screen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Viewport Transform
    ctx.setTransform(state.viewport.zoom, 0, 0, state.viewport.zoom, state.viewport.x, state.viewport.y);

    // Draw All Types
    // 1. Brush Strokes
    state.brushStrokes.forEach(stroke => drawStrokePath(stroke));
    // 2. Shapes
    state.circles.forEach(c => drawCirclePath(c));
    state.rectangles.forEach(r => drawRectPath(r));
    state.triangles.forEach(t => drawTrianglePath(t));

    // 3. Current Interaction
    if (state.currentStroke.length > 0) drawStrokePath(state.currentStroke, true);
    if (state.currentShape) {
        if (state.selectedTool === 'circle') drawCirclePath(state.currentShape);
        else if (state.selectedTool === 'rectangle') drawRectPath(state.currentShape);
        else if (state.selectedTool === 'triangle') drawTrianglePath(state.currentShape);
    }

    // 4. Selection Highlight
    if (state.selectedElement) {
        drawSelectionHighlight(state.selectedElement);
    }

    // 5. Zoom UI
    if (zoomIndicator) zoomIndicator.innerText = Math.round(state.viewport.zoom * 100) + "%";
};

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
    ctx.lineWidth = state.brushWidth; // Note: Original used global brushWidth for all shapes. To fix this, store width in shape.
    ctx.strokeStyle = circle.color || "#000";
    ctx.fillStyle = circle.color || "#000";
    ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, 2 * Math.PI);
    if (circle.isFilled) ctx.fill();
    ctx.stroke();
};

const drawRectPath = (rect) => {
    ctx.beginPath();
    ctx.lineWidth = state.brushWidth;
    ctx.strokeStyle = rect.color || "#000";
    ctx.fillStyle = rect.color || "#000";
    if (rect.isFilled) ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
};

const drawTrianglePath = (tri) => {
    ctx.beginPath();
    ctx.lineWidth = state.brushWidth;
    ctx.strokeStyle = tri.color || "#000";
    ctx.fillStyle = tri.color || "#000";
    ctx.moveTo(tri.x1, tri.y1);
    ctx.lineTo(tri.x2, tri.y2);
    ctx.lineTo(tri.x3, tri.y3);
    ctx.closePath();
    if (tri.isFilled) ctx.fill();
    ctx.stroke();
};

const drawSelectionHighlight = (el) => {
    ctx.save();
    ctx.strokeStyle = "#4A98F7";
    ctx.lineWidth = 2 / state.viewport.zoom;
    ctx.setLineDash([5 / state.viewport.zoom, 5 / state.viewport.zoom]);

    let obj;
    if (el.type === 'circle') {
        obj = state.circles[el.index];
        ctx.beginPath();
        ctx.rect(obj.centerX - obj.radius - 5, obj.centerY - obj.radius - 5, obj.radius * 2 + 10, obj.radius * 2 + 10);
        ctx.stroke();
    } else if (el.type === 'rectangle') {
        obj = state.rectangles[el.index];
        ctx.strokeRect(obj.x - 5, obj.y - 5, obj.width + 10, obj.height + 10);
    } else if (el.type === 'triangle') {
        obj = state.triangles[el.index];
        const minX = Math.min(obj.x1, obj.x2, obj.x3);
        const maxX = Math.max(obj.x1, obj.x2, obj.x3);
        const minY = Math.min(obj.y1, obj.y2, obj.y3);
        const maxY = Math.max(obj.y1, obj.y2, obj.y3);
        ctx.strokeRect(minX - 5, minY - 5, (maxX - minX) + 10, (maxY - minY) + 10);
    } else if (el.type === 'brush') {
        obj = state.brushStrokes[el.index];
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

    // Draw Handles
    if (el.type !== 'brush') {
        const handles = getResizeHandleRects(el);
        if (handles) {
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "#4A98F7";
            ctx.lineWidth = 1 / state.viewport.zoom;

            [handles.tl, handles.tr, handles.bl, handles.br].forEach(h => {
                ctx.beginPath();
                ctx.fillRect(h.x, h.y, h.w, h.h);
                ctx.strokeRect(h.x, h.y, h.w, h.h);
            });
        }
    }
};
