// Parking CMS Designer JavaScript - Canva-like Design Interface

// Global variables
let selectedTool = 'select';
let selectedElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let canvasZoom = 1;
let canvasPan = { x: 0, y: 0 };
let gridEnabled = true;
let snapEnabled = true;
let alignEnabled = true;
let darkMode = false;
let undoStack = [];
let redoStack = [];
let elements = [];
let elementCounter = 0;
let currentStationId = null;
let authToken = null;

// Canvas settings
let canvasWidth = 1200;
let canvasHeight = 800;
let gridSize = 20;

// Initialize authentication
function initializeAuth() {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token) {
    alert('Please login first');
    window.location.href = '../station_adminlogin.html';
    return false;
  }

  authToken = token;
  currentStationId = user.stationId;

  return true;
}

// Initialize canvas and design interface
function initCanvas() {
  const canvas = document.getElementById('designCanvas');
  const container = document.getElementById('canvasContainer');
  const transform = document.getElementById('canvasTransform');

  // Set initial canvas size
  updateCanvasSize();

  // Initialize grid
  drawGrid();

  // Load existing layout
  loadExistingLayout();

  // Initialize event listeners
  initEventListeners();
}

// Update canvas size
function updateCanvasSize() {
  const canvas = document.getElementById('designCanvas');
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';

  const container = document.getElementById('canvasContainer');
  container.style.width = canvasWidth + 'px';
  container.style.height = canvasHeight + 'px';

  drawGrid();
}

// Draw grid overlay
function drawGrid() {
  const canvas = document.getElementById('gridOverlay');
  const ctx = canvas.getContext('2d');

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gridEnabled) return;

  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;

  // Draw vertical lines
  for (let x = 0; x <= canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y <= canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

// Initialize event listeners
function initEventListeners() {
  const canvas = document.getElementById('designCanvas');

  // Mouse events
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);

  // Toolbar events
  initToolbarEvents();

  // Palette drag and drop
  initPaletteEvents();

  // Keyboard events
  document.addEventListener('keydown', handleKeyDown);
}

// Initialize toolbar event listeners
function initToolbarEvents() {
  document.getElementById('selectTool').addEventListener('click', () => setTool('select'));
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('gridToggle').addEventListener('click', toggleGrid);
  document.getElementById('snapToggle').addEventListener('click', toggleSnap);
  document.getElementById('toggleDarkMode').addEventListener('click', toggleDarkMode);
  document.getElementById('saveLayout').addEventListener('click', saveLayout);
  document.getElementById('exportLayout').addEventListener('click', exportLayout);
  document.getElementById('exportJSON').addEventListener('click', exportJSON);
  document.getElementById('exportImage').addEventListener('click', exportImage);
  document.getElementById('exportPDF').addEventListener('click', exportPDF);
}

// Initialize palette drag and drop
function initPaletteEvents() {
  const paletteItems = document.querySelectorAll('.palette-item');

  paletteItems.forEach(item => {
    item.setAttribute('draggable', true);
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  const canvas = document.getElementById('designCanvas');
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', handleCanvasDrop);
}

// Set active tool
function setTool(tool) {
  selectedTool = tool;
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  if (tool === 'select') {
    document.getElementById('selectTool').classList.add('active');
  }
  deselectElement();
}

// Handle mouse down on canvas
function handleMouseDown(e) {
  const point = getCanvasPoint(e);
  if (selectedTool === 'select') {
    const element = getElementAtPoint(point);
    if (element) {
      selectElement(element);
      isDragging = true;
      dragOffset.x = point.x - element.x;
      dragOffset.y = point.y - element.y;
    } else {
      deselectElement();
    }
  }
}

// Handle mouse move on canvas
function handleMouseMove(e) {
  if (!isDragging || !selectedElement) return;
  const point = getCanvasPoint(e);
  let newX = point.x - dragOffset.x;
  let newY = point.y - dragOffset.y;

  if (snapEnabled) {
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
  }

  selectedElement.x = newX;
  selectedElement.y = newY;
  updateElementPosition(selectedElement);
}

// Handle mouse up on canvas
function handleMouseUp(e) {
  if (isDragging) {
    isDragging = false;
    saveState();
  }
}

// Get canvas point from mouse event
function getCanvasPoint(e) {
  const canvas = document.getElementById('designCanvas');
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left),
    y: (e.clientY - rect.top)
  };
}

// Get element at point
function getElementAtPoint(point) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (point.x >= el.x && point.x <= el.x + el.width &&
        point.y >= el.y && point.y <= el.y + el.height) {
      return el;
    }
  }
  return null;
}

// Select element
function selectElement(element) {
  deselectElement();
  selectedElement = element;
  element.selected = true;
  updateElementSelection(element);
  updatePropertiesPanel(element);
}

// Deselect element
function deselectElement() {
  if (selectedElement) {
    selectedElement.selected = false;
    updateElementSelection(selectedElement);
    selectedElement = null;
  }
  updatePropertiesPanel(null);
}

// Update element visual selection
function updateElementSelection(element) {
  const elDiv = document.getElementById(`element-${element.id}`);
  if (element.selected) {
    elDiv.classList.add('selected');
  } else {
    elDiv.classList.remove('selected');
  }
}

// Update element position visually
function updateElementPosition(element) {
  const elDiv = document.getElementById(`element-${element.id}`);
  elDiv.style.left = element.x + 'px';
  elDiv.style.top = element.y + 'px';
}

// Handle canvas drop event
function handleCanvasDrop(e) {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/plain');
  const point = getCanvasPoint(e);

  let x = point.x;
  let y = point.y;

  if (snapEnabled) {
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;
  }

  addElementToCanvas(type, x, y);
}

// Add element to canvas
function addElementToCanvas(type, x, y) {
  const element = createElement(type, x, y);
  elements.push(element);
  renderElement(element);
  saveState();
}

// Create element object
function createElement(type, x, y) {
  elementCounter++;
  const base = {
    id: elementCounter,
    type: type,
    x: x,
    y: y,
    width: 40,
    height: 20,
    rotation: 0,
    selected: false,
    properties: {}
  };

  switch (type) {
    case 'entry':
      base.width = 24;
      base.height = 24;
      base.properties.label = 'IN';
      break;
    case 'exit':
      base.width = 24;
      base.height = 24;
      base.properties.label = 'OUT';
      break;
    case 'slot-car':
      base.properties.label = `C${elementCounter}`;
      break;
    case 'slot-car-ev':
      base.properties.label = `CE${elementCounter}`;
      break;
    case 'slot-bike':
      base.width = 30;
      base.height = 15;
      base.properties.label = `B${elementCounter}`;
      break;
    case 'slot-bike-ev':
      base.width = 30;
      base.height = 15;
      base.properties.label = `BE${elementCounter}`;
      break;
    case 'slot-van':
      base.width = 50;
      base.height = 25;
      base.properties.label = `V${elementCounter}`;
      break;
    case 'slot-van-ev':
      base.width = 50;
      base.height = 25;
      base.properties.label = `VE${elementCounter}`;
      break;
    case 'road':
      base.width = 100;
      base.height = 8;
      break;
    case 'wall':
      base.width = 100;
      base.height = 4;
      break;
  }

  return base;
}

// Render element to canvas
function renderElement(element) {
  const transform = document.getElementById('canvasTransform');
  const elDiv = document.createElement('div');

  elDiv.id = `element-${element.id}`;
  elDiv.className = 'design-element';
  elDiv.style.position = 'absolute';
  elDiv.style.left = element.x + 'px';
  elDiv.style.top = element.y + 'px';
  elDiv.style.width = element.width + 'px';
  elDiv.style.height = element.height + 'px';
  elDiv.style.transform = `rotate(${element.rotation}deg)`;
  elDiv.style.cursor = 'move';

  switch (element.type) {
    case 'entry':
      elDiv.innerHTML = `<div class="entry-element">${element.properties.label}</div>`;
      break;
    case 'exit':
      elDiv.innerHTML = `<div class="exit-element">${element.properties.label}</div>`;
      break;
    case 'slot-car':
      elDiv.innerHTML = `<div class="slot-element">${element.properties.label}</div>`;
      break;
    case 'slot-car-ev':
      elDiv.innerHTML = `<div class="slot-element ev">${element.properties.label}</div>`;
      break;
    case 'slot-bike':
      elDiv.innerHTML = `<div class="slot-element bike">${element.properties.label}</div>`;
      break;
    case 'slot-bike-ev':
      elDiv.innerHTML = `<div class="slot-element bike ev">${element.properties.label}</div>`;
      break;
    case 'slot-van':
      elDiv.innerHTML = `<div class="slot-element van">${element.properties.label}</div>`;
      break;
    case 'slot-van-ev':
      elDiv.innerHTML = `<div class="slot-element van ev">${element.properties.label}</div>`;
      break;
    case 'road':
      elDiv.innerHTML = `<div class="road-element"></div>`;
      break;
    case 'wall':
      elDiv.innerHTML = `<div class="wall-element"></div>`;
      break;
  }

  elDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    selectElement(element);
  });

  transform.appendChild(elDiv);
}

// Update properties panel
function updatePropertiesPanel(element) {
  const content = document.getElementById('propertiesContent');

  if (!element) {
    content.innerHTML = '<p class="text-gray-500 text-sm">Select an element to edit its properties</p>';
    return;
  }

  let html = '<div class="space-y-3">';

  html += `
    <div class="property-group">
      <label>Position</label>
      <div class="grid grid-cols-2 gap-2">
        <input type="number" id="propX" value="${element.x}" step="1">
        <input type="number" id="propY" value="${element.y}" step="1">
      </div>
    </div>
  `;

  html += `
    <div class="property-group">
      <label>Size</label>
      <div class="grid grid-cols-2 gap-2">
        <input type="number" id="propWidth" value="${element.width}" min="10" step="1">
        <input type="number" id="propHeight" value="${element.height}" min="5" step="1">
      </div>
    </div>
  `;

  html += `
    <div class="property-group">
      <label>Rotation (degrees)</label>
      <input type="number" id="propRotation" value="${element.rotation}" step="15">
    </div>
  `;

  if (element.properties.label) {
    html += `
      <div class="property-group">
        <label>Label</label>
        <input type="text" id="propLabel" value="${element.properties.label}">
      </div>
    `;
  }

  html += '</div>';
  content.innerHTML = html;

  document.getElementById('propX').addEventListener('input', (e) => {
    element.x = parseFloat(e.target.value) || 0;
    updateElementPosition(element);
  });
  document.getElementById('propY').addEventListener('input', (e) => {
    element.y = parseFloat(e.target.value) || 0;
    updateElementPosition(element);
  });
  document.getElementById('propWidth').addEventListener('input', (e) => {
    element.width = parseFloat(e.target.value) || 10;
    document.getElementById(`element-${element.id}`).style.width = element.width + 'px';
  });
  document.getElementById('propHeight').addEventListener('input', (e) => {
    element.height = parseFloat(e.target.value) || 5;
    document.getElementById(`element-${element.id}`).style.height = element.height + 'px';
  });
  document.getElementById('propRotation').addEventListener('input', (e) => {
    element.rotation = parseFloat(e.target.value) || 0;
    updateElementPosition(element);
  });
  if (document.getElementById('propLabel')) {
    document.getElementById('propLabel').addEventListener('input', (e) => {
      element.properties.label = e.target.value;
      const labelElement = document.querySelector(`#element-${element.id} div`);
      if (labelElement) labelElement.textContent = e.target.value;
    });
  }
}

// Delete element
function deleteElement(element) {
  const index = elements.indexOf(element);
  if (index > -1) {
    elements.splice(index, 1);
    const elDiv = document.getElementById(`element-${element.id}`);
    if (elDiv) elDiv.remove();
    deselectElement();
    saveState();
  }
}

// Save current state for undo
function saveState() {
  const state = {
    elements: JSON.parse(JSON.stringify(elements)),
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    gridSize: gridSize
  };
  undoStack.push(state);
  redoStack = [];
  updateUndoRedoButtons();
}

// Undo last action
function undo() {
  if (undoStack.length > 1) {
    const current = undoStack.pop();
    redoStack.push(current);
    const previous = undoStack[undoStack.length - 1];
    loadState(previous);
    updateUndoRedoButtons();
  }
}

// Redo last undone action
function redo() {
  if (redoStack.length > 0) {
    const next = redoStack.pop();
    undoStack.push(next);
    loadState(next);
    updateUndoRedoButtons();
  }
}

// Load state
function loadState(state) {
  elements.forEach(el => {
    const elDiv = document.getElementById(`element-${el.id}`);
    if (elDiv) elDiv.remove();
  });

  elements = JSON.parse(JSON.stringify(state.elements));
  canvasWidth = state.canvasWidth;
  canvasHeight = state.canvasHeight;
  gridSize = state.gridSize;

  updateCanvasSize();

  elements.forEach(el => {
    renderElement(el);
  });

  deselectElement();
}

// Update Undo/Redo buttons state
function updateUndoRedoButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length <= 1;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

// Load existing layout from backend
async function loadExistingLayout() {
  try {
    const response = await fetch(`/api/stations/${currentStationId}/layout`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.layout) {
        loadLayout(data.layout);
      }
    }
  } catch (error) {
    console.error('Error loading existing layout:', error);
  }
}

// Load layout from data
function loadLayout(layoutData) {
  if (layoutData.elements) {
    layoutData.elements.forEach(elementData => {
      const element = createElement(elementData.type, elementData.x, elementData.y);
      Object.assign(element, elementData);
      elements.push(element);
      renderElement(element);
    });
  }

  if (layoutData.canvasWidth) canvasWidth = layoutData.canvasWidth;
  if (layoutData.canvasHeight) canvasHeight = layoutData.canvasHeight;
  if (layoutData.gridSize) gridSize = layoutData.gridSize;

  updateCanvasSize();
}

// Save layout to backend
async function saveLayout() {
  const layoutData = {
    elements: elements,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    gridSize: gridSize
  };

  try {
    const response = await fetch(`/api/stations/${currentStationId}/layout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ layout: layoutData })
    });

    if (response.ok) {
      alert('Layout saved successfully!');
    } else {
      alert('Failed to save layout');
    }
  } catch (error) {
    console.error('Error saving layout:', error);
    alert('Error saving layout');
  }
}

// Export layout (show modal)
function exportLayout() {
  document.getElementById('exportModal').classList.remove('hidden');
}

// Close modal by id
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Export as JSON
function exportJSON() {
  const layoutData = {
    elements: elements,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    gridSize: gridSize
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layoutData, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "parking_layout.json");
  dlAnchorElem.click();
  closeModal('exportModal');
}

// Export as Image (PNG)
function exportImage() {
  alert('Image export feature would be implemented with html2canvas library');
  closeModal('exportModal');
}

// Export as PDF
function exportPDF() {
  alert('PDF export feature would be implemented with jsPDF library');
  closeModal('exportModal');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  if (initializeAuth()) {
    initCanvas();
    saveState();
  }
});
