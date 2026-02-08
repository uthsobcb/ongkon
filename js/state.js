export const state = {
    isDrawing: false,
    brushWidth: 5,
    selectedTool: "brush",
    selectedColor: "#000",
    isFilled: false,
    viewport: { x: 0, y: 0, zoom: 1 },
    isPanning: false,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    lastMouseX: 0,
    lastMouseY: 0,
    circles: [],
    rectangles: [],
    triangles: [],
    brushStrokes: [],
    currentStroke: [],
    currentShape: null,
    selectedElement: null,
    isGridEnabled: true,
    gridSize: 40,
};

export function setState(newState) {
    Object.assign(state, newState);
}

export function resetState() {
    state.circles = [];
    state.rectangles = [];
    state.triangles = [];
    state.brushStrokes = [];
    state.viewport = { x: 0, y: 0, zoom: 1 };
    state.currentStroke = [];
    state.currentShape = null;
    state.selectedElement = null;
    state.isDrawing = false;
    state.isPanning = false;
    state.isDragging = false;
    state.isResizing = false;
    state.resizeHandle = null;
}

export function loadState(data) {
    state.circles = data.circles || [];
    state.rectangles = data.rectangles || [];
    state.triangles = data.triangles || [];
    state.brushStrokes = data.brushStrokes || [];
    if (data.viewport) state.viewport = data.viewport;
}
