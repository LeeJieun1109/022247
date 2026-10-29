document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('circuit-canvas');
    const canvasInner = document.getElementById('canvas-inner');
    const gateLayer = document.getElementById('gate-layer');
    const wireLayer = document.getElementById('wire-layer');
    const trashCan = document.getElementById('trash-can');
    const eqSpan = document.getElementById('equation-display');
    const eqContainer = document.querySelector('.boolean-equation');
    
    let nodes = [], wires = [];
    let varCount = 1, gateCount = 1;
    let draggedType = null, activeGate = null;
    let isWiring = false, wireStartPort = null, currentLine = null;
    
    let currentZoom = 1;
    let isPanning = false, panX = 0, panY = 0, startMouseX = 0, startMouseY = 0;

    function applyTransform() {
        canvasInner.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.target.closest('.canvas-gate') || e.target.classList.contains('port') || e.target.closest('.trash-can')) return;
        isPanning = true;
        startMouseX = e.clientX - panX;
        startMouseY = e.clientY - panY;
    });
    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = e.clientX - startMouseX;
        panY = e.clientY - startMouseY;
        applyTransform();
    });
    window.addEventListener('mouseup', () => isPanning = false);

    const zoomSlider = document.getElementById('zoom-slider');
    document.getElementById('zoom-in').addEventListener('click', () => { currentZoom = Math.min(2, currentZoom + 0.1); zoomSlider.value = currentZoom; applyTransform(); });
    document.getElementById('zoom-out').addEventListener('click', () => { currentZoom = Math.max(0.5, currentZoom - 0.1); zoomSlider.value = currentZoom; applyTransform(); });
    zoomSlider.addEventListener('input', (e) => { currentZoom = parseFloat(e.target.value); applyTransform(); });

    document.querySelectorAll('.gate-toolbar .gate-item').forEach(item => {
        item.addEventListener('dragstart', (e) => { draggedType = e.currentTarget.dataset.type; });
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

    // 툴팁(툴바 설명창)
    const dimOverlay = document.getElementById('dim-overlay');
    const tooltipBox = document.getElementById('tooltip-box');
    const tooltipDesc = document.getElementById('tooltip-desc');
    
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            tooltipDesc.innerHTML = e.currentTarget.dataset.info;
            tooltipBox.style.top = `${e.currentTarget.parentElement.offsetTop}px`;
            tooltipBox.classList.remove('hidden');
            dimOverlay.classList.add('active');
        });
    });
    const closeTooltip = () => { tooltipBox.classList.add('hidden'); dimOverlay.classList.remove('active'); };
    document.getElementById('close-tooltip-btn').addEventListener('click', closeTooltip);
    dimOverlay.addEventListener('click', closeTooltip);

    function getGateSVG(type) {
        const svgs = {
            'AND': `<path d="M5,5 L35,5 A15,15 0 0,1 35,35 L5,35 Z" fill="white" stroke="black" stroke-width="2"/>`,
            'OR': `<path d="M5,5 Q25,5 45,20 Q25,35 5,35 Q15,20 5,5 Z" fill="white" stroke="black" stroke-width="2"/>`,
            'XOR': `<path d="M10,5 Q30,5 50,20 Q30,35 10,35 Q20,20 10,5 Z" fill="white" stroke="black" stroke-width="2"/><path d="M3,5 Q13,20 3,35" fill="none" stroke="black" stroke-width="2"/>`,
            'NOT': `<path d="M10,10 L35,20 L10,30 Z" fill="white" stroke="black" stroke-width="2"/><circle cx="42" cy="20" r="4" fill="white" stroke="black" stroke-width="2"/>`,
            'NAND': `<path d="M5,5 L35,5 A15,15 0 0,1 35,35 L5,35 Z" fill="white" stroke="black" stroke-width="2"/><circle cx="53" cy="20" r="3" fill="white" stroke="black" stroke-width="2"/>`,
            'NOR': `<path d="M5,5 Q25,5 45,20 Q25,35 5,35 Q15,20 5,5 Z" fill="white" stroke="black" stroke-width="2"/><circle cx="50" cy="20" r="3" fill="white" stroke="black" stroke-width="2"/>`,
            'XNOR': `<path d="M10,5 Q30,5 50,20 Q30,35 10,35 Q20,20 10,5 Z" fill="white" stroke="black" stroke-width="2"/><path d="M3,5 Q13,20 3,35" fill="none" stroke="black" stroke-width="2"/><circle cx="55" cy="20" r="3" fill="white" stroke="black" stroke-width="2"/>`,
            'Buffer': `<path d="M10,10 L45,20 L10,30 Z" fill="white" stroke="black" stroke-width="2"/>`
        };
        return `<svg class="gate-svg" viewBox="0 0 60 40">${svgs[type]}</svg>`;
    }

    function createGate(type, x, y) {
        const isVar = (type === 'VARIABLE');
        const id = isVar ? `V_${varCount++}` : `${type}_${gateCount++}`;
        nodes.push({ id, logicNode: new LogicNode(id, type), x, y, type });
        renderCanvas();
    }

    function renderCanvas() {
        gateLayer.innerHTML = '';
        
        nodes.forEach(n => {
            const el = document.createElement('div');
            el.className = 'canvas-gate';
            el.style.left = `${n.x - 30}px`; 
            el.style.top = `${n.y - 20}px`;
            el.dataset.id = n.id;

            if (n.type === 'VARIABLE') {
                el.classList.add('gate-text');
                const hasInputWire = wires.some(w => w.to === n.id);
                // 입력 선이 있으면 값이 동적으로 변함 (OUTPUT), 없으면 수동 조작 (INPUT)
                const displayVal = hasInputWire ? n.logicNode.evaluate() : n.logicNode.value;
                
                el.innerHTML = `<i>${n.id.split('_')[0]}<sub>${n.id.split('_')[1]}</sub></i> <span class="val-badge ${hasInputWire ? 'locked' : ''}">${displayVal}</span>`;
                
                el.querySelector('.val-badge').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!hasInputWire) {
                        n.logicNode.value = n.logicNode.value === 0 ? 1 : 0;
                        renderCanvas();
                    }
                });
            } else {
                el.innerHTML = getGateSVG(n.type);
            }

            const isSingleInput = ['NOT', 'Buffer', 'VARIABLE'].includes(n.type);
            const pIn1 = document.createElement('div'); 
            pIn1.className = 'port port-in'; pIn1.dataset.node = n.id; pIn1.dataset.portIndex = '0';
            pIn1.style.top = isSingleInput ? '15px' : '8px';
            el.appendChild(pIn1);

            if (!isSingleInput) {
                const pIn2 = document.createElement('div'); 
                pIn2.className = 'port port-in'; pIn2.dataset.node = n.id; pIn2.dataset.portIndex = '1';
                pIn2.style.top = '23px';
                el.appendChild(pIn2);
            }

            const pOut = document.createElement('div'); 
            pOut.className = 'port port-out'; pOut.dataset.node = n.id;
            pOut.style.top = '15px';
            el.appendChild(pOut);

            el.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('port') || e.target.classList.contains('val-badge')) return;
                activeGate = n;
                document.addEventListener('mousemove', onGateMouseMove);
                document.addEventListener('mouseup', onGateMouseUp);
            });
            gateLayer.appendChild(el);
        });

        document.querySelectorAll('.port').forEach(p => p.addEventListener('mousedown', onPortClick));
        drawWires(); 
        updateEquation();
    }

    function onGateMouseMove(e) {
        if (!activeGate) return;
        activeGate.x += e.movementX / currentZoom;
        activeGate.y += e.movementY / currentZoom;
        trashCan.classList.toggle('active', isOverTrashCan(e));
        renderCanvas();
    }

    function onGateMouseUp(e) {
        if (activeGate && isOverTrashCan(e)) deleteGate(activeGate.id);
        trashCan.classList.remove('active');
        activeGate = null;
        document.removeEventListener('mousemove', onGateMouseMove);
        document.removeEventListener('mouseup', onGateMouseUp);
    }

    function isOverTrashCan(e) {
        const rect = trashCan.getBoundingClientRect();
        return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    }

    function getPortCenter(portEl) {
        const r = portEl.getBoundingClientRect();
        const c = canvasInner.getBoundingClientRect();
        return { x: (r.left + r.width/2 - c.left) / currentZoom, y: (r.top + r.height/2 - c.top) / currentZoom };
    }

    function onPortClick(e) {
        e.stopPropagation();
        if (!isWiring && e.target.classList.contains('port-out')) {
            isWiring = true; 
            wireStartPort = e.target;
            currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            currentLine.setAttribute('stroke', '#1b263b'); currentLine.setAttribute('stroke-width', '2');
            currentLine.style.pointerEvents = 'none'; 
            wireLayer.appendChild(currentLine);
            document.addEventListener('mousemove', drawTempWire);
            document.addEventListener('mouseup', finishWiring);
        }
    }

    function drawTempWire(e) {
        if (!isWiring) return;
        const startPos = getPortCenter(wireStartPort);
        const c = canvasInner.getBoundingClientRect();
        currentLine.setAttribute('x1', startPos.x); currentLine.setAttribute('y1', startPos.y);
        currentLine.setAttribute('x2', (e.clientX - c.left) / currentZoom); currentLine.setAttribute('y2', (e.clientY - c.top) / currentZoom);
    }

    function finishWiring(e) {
        document.removeEventListener('mousemove', drawTempWire); 
        document.removeEventListener('mouseup', finishWiring);
        
        let target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('port-in')) {
            const fromId = wireStartPort.dataset.node;
            const toId = target.dataset.node;
            const toIdx = parseInt(target.dataset.portIndex || '0', 10);
            
            if (fromId !== toId) {
                wires = wires.filter(w => !(w.to === toId && w.toPortIndex === toIdx));
                wires.push({ from: fromId, to: toId, toPortIndex: toIdx });
                nodes.find(n => n.id === toId).logicNode.inputs[toIdx] = nodes.find(n => n.id === fromId).logicNode;
            }
        }
        isWiring = false; wireStartPort = null; if (currentLine) currentLine.remove();
        renderCanvas();
    }

    function drawWires() {
        wireLayer.innerHTML = '';
        wires.forEach(w => {
            const outDom = document.querySelector(`.canvas-gate[data-id="${w.from}"] .port-out`);
            const inDoms = document.querySelectorAll(`.canvas-gate[data-id="${w.to}"] .port-in`);
            const inDom = inDoms[w.toPortIndex || 0] || inDoms[0]; 
            
            if (outDom && inDom) {
                const s = getPortCenter(outDom), e = getPortCenter(inDom);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'wire-line');
                line.setAttribute('x1', s.x); line.setAttribute('y1', s.y);
                line.setAttribute('x2', e.x); line.setAttribute('y2', e.y);
                line.setAttribute('stroke', '#415a77'); line.setAttribute('stroke-width', '2.5');
                line.addEventListener('click', (ev) => { ev.stopPropagation(); deleteWire(w); });
                wireLayer.appendChild(line);
            }
        });
    }

    function deleteWire(w) {
        wires = wires.filter(wire => wire !== w);
        const toNode = nodes.find(n => n.id === w.to);
        if (toNode) delete toNode.logicNode.inputs[w.toPortIndex];
        renderCanvas();
    }

    function deleteGate(id) {
        nodes = nodes.filter(n => n.id !== id);
        wires = wires.filter(w => w.from !== id && w.to !== id);
        nodes.forEach(n => { n.logicNode.inputs = n.logicNode.inputs.map(inNode => (inNode && inNode.id === id) ? null : inNode); });
        renderCanvas();
    }

    // 결과창: 아무것도 없을 땐 숨김 처리 / OUTPUT 변수만 추출하여 표시
    function updateEquation() {
        const outVars = nodes.filter(n => n.type === 'VARIABLE' && wires.some(w => w.to === n.id));
        
        if (outVars.length > 0) {
            eqContainer.style.display = 'block';
            eqSpan.innerHTML = outVars.map(o => {
                const parts = o.id.split('_');
                return `<i>${parts[0]}<sub>${parts[1]}</sub>(Out)</i> = ${o.logicNode.getExpression()} (결과: <b>${o.logicNode.evaluate()}</b>)`;
            }).join(' &nbsp;|&nbsp; ');
        } else {
            eqContainer.style.display = 'none';
            eqSpan.innerHTML = '';
        }
    }

    trashCan.addEventListener('click', () => document.getElementById('delete-modal-overlay').classList.remove('hidden'));
    document.getElementById('cancel-delete-btn').addEventListener('click', () => document.getElementById('delete-modal-overlay').classList.add('hidden'));
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        nodes = []; wires = []; renderCanvas();
        document.getElementById('delete-modal-overlay').classList.add('hidden');
    });

    const toggleBtn = document.getElementById('toggle-view-btn');
    const tableContainer = document.getElementById('table-view-container');
    const truthTable = document.getElementById('truth-table');
    let isTableMode = false;

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isTableMode = !isTableMode;
            tableContainer.classList.toggle('hidden', !isTableMode);
            toggleBtn.innerText = isTableMode ? '회로도' : '진리표';
            
            if (isTableMode) {
                const { inputs, outputs, data } = generateTruthTable(nodes, wires);
                
                if (inputs.length === 0) { 
                    truthTable.innerHTML = '<tr><td>입력 변수가 필요합니다.</td></tr>'; 
                    return; 
                }
                
                // (In) / (Out) 헤더 분리
                let html = '<tr>' + 
                           inputs.map(i => `<th>${i.id.split('_')[0]}<sub>${i.id.split('_')[1]}</sub> (In)</th>`).join('') + 
                           outputs.map(i => `<th>${i.id.split('_')[0]}<sub>${i.id.split('_')[1]}</sub> (Out)</th>`).join('') + 
                           '</tr>';
                
                data.forEach(row => {
                    html += '<tr>' + 
                            inputs.map(i => `<td>${row[i.id]}</td>`).join('') + 
                            outputs.map(i => `<td>${row[`${i.id}_out`]}</td>`).join('') + 
                            '</tr>';
                });
                truthTable.innerHTML = html;
            }
        });
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const isSuccess = nodes.length >= 2 && wires.length >= 1; 
            const resultModal = document.getElementById('result-modal-overlay');
            const resultText = document.getElementById('result-modal-text');

            if (isSuccess) {
                resultText.innerText = '성공'; resultText.className = 'success-text';
                if (window.currentActiveLevel) window.levelStatuses[window.currentActiveLevel] = 'success';
            } else {
                resultText.innerText = '실패'; resultText.className = 'failure-text';
                if (window.currentActiveLevel) window.levelStatuses[window.currentActiveLevel] = 'failure';
            }
            resultModal.classList.remove('hidden');
            if (window.updateLevelButtonColors) window.updateLevelButtonColors();
        });
    }

    document.getElementById('close-result-modal-btn').addEventListener('click', () => {
        document.getElementById('result-modal-overlay').classList.add('hidden');
    });
});
