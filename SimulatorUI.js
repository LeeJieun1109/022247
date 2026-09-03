document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('circuit-canvas');
    const canvasInner = document.getElementById('canvas-inner');
    const gateLayer = document.getElementById('gate-layer');
    const wireLayer = document.getElementById('wire-layer');
    
    let nodes = [], wires = [];
    let inputCount = 1, outputCount = 1, gateCount = 1;
    let draggedType = null, activeGate = null;
    let isWiring = false, wireStartPort = null, currentLine = null;
    let currentZoom = 1;

    // 드래그 앤 드롭
    document.querySelectorAll('.gate-toolbar .gate-item').forEach(item => {
        item.addEventListener('dragstart', (e) => draggedType = e.currentTarget.dataset.type);
    });
    canvas.addEventListener('dragover', e => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedType) return;
        const rect = canvasInner.getBoundingClientRect();
        const x = (e.clientX - rect.left) / currentZoom;
        const y = (e.clientY - rect.top) / currentZoom;
        createGate(draggedType, x, y);
        draggedType = null;
    });

    // 툴팁 동작
    const dimOverlay = document.getElementById('dim-overlay');
    const tooltipBox = document.getElementById('tooltip-box');
    const tooltipDesc = document.getElementById('tooltip-desc');
    
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const parentItem = e.currentTarget.parentElement;
            document.querySelectorAll('.gate-item').forEach(i => i.classList.remove('highlighted'));
            parentItem.classList.add('highlighted');
            
            tooltipDesc.innerHTML = e.currentTarget.dataset.info;
            tooltipBox.style.top = `${parentItem.offsetTop}px`;
            tooltipBox.classList.remove('hidden');
            dimOverlay.classList.add('active');
        });
    });

    function closeTooltip() {
        tooltipBox.classList.add('hidden');
        dimOverlay.classList.remove('active');
        document.querySelectorAll('.gate-item').forEach(i => i.classList.remove('highlighted'));
    }
    document.getElementById('close-tooltip-btn').addEventListener('click', closeTooltip);
    dimOverlay.addEventListener('click', closeTooltip);

    // 줌 기능
    const zoomSlider = document.getElementById('zoom-slider');
    function applyZoom() {
        canvasInner.style.transform = `scale(${currentZoom})`;
    }
    document.getElementById('zoom-in').addEventListener('click', () => { currentZoom = Math.min(2, currentZoom + 0.1); zoomSlider.value = currentZoom; applyZoom(); });
    document.getElementById('zoom-out').addEventListener('click', () => { currentZoom = Math.max(0.5, currentZoom - 0.1); zoomSlider.value = currentZoom; applyZoom(); });
    zoomSlider.addEventListener('input', (e) => { currentZoom = parseFloat(e.target.value); applyZoom(); });

    // SVG 게이트 반환 함수 (아웃라인만, 내부 흰색)
    function getGateSVG(type) {
        if(type === 'AND') return `<svg class="gate-svg" viewBox="0 0 60 40"><path d="M5,5 L35,5 A15,15 0 0,1 35,35 L5,35 Z" fill="white" stroke="black" stroke-width="2"/></svg>`;
        if(type === 'OR') return `<svg class="gate-svg" viewBox="0 0 60 40"><path d="M5,5 Q25,5 45,20 Q25,35 5,35 Q15,20 5,5 Z" fill="white" stroke="black" stroke-width="2"/></svg>`;
        if(type === 'XOR') return `<svg class="gate-svg" viewBox="0 0 60 40"><path d="M10,5 Q30,5 50,20 Q30,35 10,35 Q20,20 10,5 Z" fill="white" stroke="black" stroke-width="2"/><path d="M3,5 Q13,20 3,35" fill="none" stroke="black" stroke-width="2"/></svg>`;
        if(type === 'NOT') return `<svg class="gate-svg" viewBox="0 0 60 40"><path d="M10,10 L35,20 L10,30 Z" fill="white" stroke="black" stroke-width="2"/><circle cx="42" cy="20" r="4" fill="white" stroke="black" stroke-width="2"/></svg>`;
        return '';
    }

    function createGate(type, x, y) {
        let id = type === 'INPUT' ? `X_${inputCount++}` : type === 'OUTPUT' ? `Y_${outputCount++}` : `${type}_${gateCount++}`;
        nodes.push({ id, logicNode: new LogicNode(id, type), x, y, type });
        renderCanvas();
    }

    function renderCanvas() {
        gateLayer.innerHTML = '';
        nodes.forEach(n => {
            const el = document.createElement('div');
            el.className = 'canvas-gate';
            el.style.left = `${n.x - 30}px`; el.style.top = `${n.y - 20}px`;
            el.dataset.id = n.id;

            if (n.type === 'INPUT' || n.type === 'OUTPUT') {
                el.classList.add('gate-text');
                const parts = n.id.split('_');
                el.innerHTML = `<i>${parts[0]}<sub>${parts[1]}</sub></i>`;
            } else {
                el.innerHTML = getGateSVG(n.type);
            }

            // 포트 추가 (SVG 60x40 기준)
            if (n.type !== 'INPUT') {
                const p1 = document.createElement('div'); p1.className = 'port port-in'; p1.dataset.node = n.id;
                p1.style.top = n.type === 'NOT' || n.type === 'OUTPUT' ? '16px' : '8px';
                el.appendChild(p1);
                if (n.type !== 'NOT' && n.type !== 'OUTPUT') {
                    const p2 = document.createElement('div'); p2.className = 'port port-in'; p2.dataset.node = n.id;
                    p2.style.top = '24px';
                    el.appendChild(p2);
                }
            }
            if (n.type !== 'OUTPUT') {
                const po = document.createElement('div'); po.className = 'port port-out'; po.dataset.node = n.id;
                po.style.top = '16px';
                el.appendChild(po);
            }

            el.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('port')) return;
                activeGate = n;
                document.addEventListener('mousemove', onGateMouseMove);
                document.addEventListener('mouseup', onGateMouseUp);
            });
            gateLayer.appendChild(el);
        });
        document.querySelectorAll('.port').forEach(p => p.addEventListener('mousedown', onPortClick));
        drawWires(); updateEquation();
    }

    function onGateMouseMove(e) {
        if (!activeGate) return;
        activeGate.x += e.movementX / currentZoom;
        activeGate.y += e.movementY / currentZoom;
        renderCanvas();
    }
    function onGateMouseUp() {
        activeGate = null;
        document.removeEventListener('mousemove', onGateMouseMove);
        document.removeEventListener('mouseup', onGateMouseUp);
    }

    // 선 연결 로직
    function onPortClick(e) {
        e.stopPropagation();
        if (!isWiring && e.target.classList.contains('port-out')) {
            isWiring = true; wireStartPort = e.target;
            currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            currentLine.setAttribute('stroke', '#1b263b'); currentLine.setAttribute('stroke-width', '2');
            wireLayer.appendChild(currentLine);
            document.addEventListener('mousemove', drawTempWire);
            document.addEventListener('mouseup', finishWiring);
        }
    }
    function drawTempWire(e) {
        if (!isWiring) return;
        const startRect = wireStartPort.getBoundingClientRect();
        const canvasRect = canvasInner.getBoundingClientRect();
        currentLine.setAttribute('x1', (startRect.left - canvasRect.left + 4) / currentZoom);
        currentLine.setAttribute('y1', (startRect.top - canvasRect.top + 4) / currentZoom);
        currentLine.setAttribute('x2', (e.clientX - canvasRect.left) / currentZoom);
        currentLine.setAttribute('y2', (e.clientY - canvasRect.top) / currentZoom);
    }
    function finishWiring(e) {
        document.removeEventListener('mousemove', drawTempWire); document.removeEventListener('mouseup', finishWiring);
        let targetPort = document.elementFromPoint(e.clientX, e.clientY);
        if (targetPort && targetPort.classList.contains('port-in')) {
            wires.push({ from: wireStartPort.dataset.node, to: targetPort.dataset.node });
            const fromNode = nodes.find(n => n.id === wireStartPort.dataset.node).logicNode;
            const toNode = nodes.find(n => n.id === targetPort.dataset.node).logicNode;
            toNode.inputs.push(fromNode);
        }
        isWiring = false; wireStartPort = null; if (currentLine) currentLine.remove();
        renderCanvas();
    }
    function drawWires() {
        wireLayer.innerHTML = '';
        const canvasRect = canvasInner.getBoundingClientRect();
        wires.forEach(w => {
            const outDom = document.querySelector(`.canvas-gate[data-id="${w.from}"] .port-out`);
            const inDoms = document.querySelectorAll(`.canvas-gate[data-id="${w.to}"] .port-in`);
            const inDom = inDoms[0]; 
            if (outDom && inDom) {
                const oRect = outDom.getBoundingClientRect();
                const iRect = inDom.getBoundingClientRect();
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', (oRect.left - canvasRect.left + 4) / currentZoom);
                line.setAttribute('y1', (oRect.top - canvasRect.top + 4) / currentZoom);
                line.setAttribute('x2', (iRect.left - canvasRect.left + 4) / currentZoom);
                line.setAttribute('y2', (iRect.top - canvasRect.top + 4) / currentZoom);
                line.setAttribute('stroke', '#415a77'); line.setAttribute('stroke-width', '2');
                wireLayer.appendChild(line);
            }
        });
    }

    function updateEquation() {
        const outputs = nodes.filter(n => n.type === 'OUTPUT');
        const eqSpan = document.getElementById('equation-display');
        if (outputs.length > 0) {
            eqSpan.innerHTML = outputs.map(o => {
                const parts = o.id.split('_');
                return `<i>${parts[0]}<sub>${parts[1]}</sub></i> = ${o.logicNode.getExpression()}`;
            }).join(' / ');
        } else {
            eqSpan.innerText = '출력(OUTPUT) 게이트를 연결하세요.';
        }
    }

    // 진리표 토글
    const toggleBtn = document.getElementById('toggle-view-btn');
    const tableContainer = document.getElementById('table-view-container');
    const truthTable = document.getElementById('truth-table');
    let isTableMode = false;
    toggleBtn.addEventListener('click', () => {
        isTableMode = !isTableMode;
        tableContainer.classList.toggle('hidden', !isTableMode);
        toggleBtn.innerText = isTableMode ? '회로도' : '진리표';
        if (isTableMode) {
            const inputs = nodes.filter(n => n.type === 'INPUT').map(n => n.logicNode);
            const outputs = nodes.filter(n => n.type === 'OUTPUT').map(n => n.logicNode);
            if (inputs.length === 0 || outputs.length === 0) {
                truthTable.innerHTML = '<tr><td>입력과 출력이 모두 필요합니다.</td></tr>'; return;
            }
            const data = generateTruthTable(inputs, outputs);
            let html = '<tr>' + inputs.map(i => `<th>${i.id.replace('_', '<sub>')}</sub></th>`).join('') + outputs.map(o => `<th>${o.id.replace('_', '<sub>')}</sub> (결과)</th>`).join('') + '</tr>';
            data.forEach(row => {
                html += '<tr>' + inputs.map(i => `<td>${row[i.id]}</td>`).join('') + outputs.map(o => `<td style="font-weight:bold;">${row[o.id]}</td>`).join('') + '</tr>';
            });
            truthTable.innerHTML = html;
        }
    });
});
