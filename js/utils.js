import { state } from './state.js';

export const toWorld = (screenX, screenY) => {
    return {
        x: (screenX - state.viewport.x) / state.viewport.zoom,
        y: (screenY - state.viewport.y) / state.viewport.zoom
    };
};

export const toScreen = (worldX, worldY) => {
    return {
        x: worldX * state.viewport.zoom + state.viewport.x,
        y: worldY * state.viewport.zoom + state.viewport.y
    };
};

export const isPointInCircle = (x, y, circle) => {
    // Need access to brushWidth if it's dynamic per shape, but currently it's global or stored.
    // Ideally shape has its own width. Code used global brushWidth for hit test which is imperfect if shapes have different widths.
    // For now we use the global state.brushWidth or a default.
    return Math.sqrt((x - circle.centerX) ** 2 + (y - circle.centerY) ** 2) <= circle.radius + state.brushWidth / 2;
};

export const isPointInRect = (x, y, rect) => {
    const rx = rect.width >= 0 ? rect.x : rect.x + rect.width;
    const ry = rect.height >= 0 ? rect.y : rect.y + rect.height;
    const rw = Math.abs(rect.width);
    const rh = Math.abs(rect.height);
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
};

export const isPointInTriangle = (mx, my, tri) => {
    const minX = Math.min(tri.x1, tri.x2, tri.x3);
    const maxX = Math.max(tri.x1, tri.x2, tri.x3);
    const minY = Math.min(tri.y1, tri.y2, tri.y3);
    const maxY = Math.max(tri.y1, tri.y2, tri.y3);
    if (mx < minX || mx > maxX || my < minY || my > maxY) return false;

    const area = 0.5 * (-tri.y2 * tri.x3 + tri.y1 * (-tri.x2 + tri.x3) + tri.x1 * (tri.y2 - tri.y3) + tri.x2 * tri.y3);
    const s = 1 / (2 * area) * (tri.y1 * tri.x3 - tri.x1 * tri.y3 + (tri.y3 - tri.y1) * mx + (tri.x1 - tri.x3) * my);
    const t = 1 / (2 * area) * (tri.x1 * tri.y2 - tri.y1 * tri.x2 + (tri.y1 - tri.y2) * mx + (tri.x2 - tri.x1) * my);
    return s > 0 && t > 0 && 1 - s - t > 0;
};

export const isPointNearStroke = (x, y, stroke) => {
    const threshold = 10;
    for (let i = 0; i < stroke.length - 1; i++) {
        const p1 = stroke[i];
        const p2 = stroke[i + 1];
        const A = x - p1.x;
        const B = y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
    }
    return false;
};

export const findObjectAt = (wx, wy) => {
    for (let i = state.triangles.length - 1; i >= 0; i--) {
        if (isPointInTriangle(wx, wy, state.triangles[i])) return { type: 'triangle', index: i };
    }
    for (let i = state.rectangles.length - 1; i >= 0; i--) {
        if (isPointInRect(wx, wy, state.rectangles[i])) return { type: 'rectangle', index: i };
    }
    for (let i = state.circles.length - 1; i >= 0; i--) {
        if (isPointInCircle(wx, wy, state.circles[i])) return { type: 'circle', index: i };
    }
    for (let i = state.brushStrokes.length - 1; i >= 0; i--) {
        if (isPointNearStroke(wx, wy, state.brushStrokes[i])) return { type: 'brush', index: i };
    }
    return null;
};
