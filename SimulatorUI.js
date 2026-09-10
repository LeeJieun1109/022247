document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('circuit-canvas');
    const canvasInner = document.getElementById('canvas-inner');
    const gateLayer = document.getElementById('gate-layer');
    const wireLayer = document.getElementById('wire-layer');
    const trashCan = document.getElementById('trash-can');
    
    let nodes = [], wires = [];
    let inputCount = 1, outputCount = 1, gateCount = 1;
    let draggedType = null, activeGate = null;
    let isWiring = false, wireStartPort = null, currentLine = null;
    
    // 확대/축소 및 이동(Panning) 변수
    let currentZoom = 1;
    let isPanning = false;
    let panX = 0, panY = 0;
    let startMouseX = 0, startMouseY = 0;

    function applyTransform() {
        canvasInner.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
    }

    // --- 패닝(Panning) 이벤트 처리 ---
    canvas.addEventListener('mousedown', (e) => {
        if (e.target.closest('.canvas-gate') || 
            e.target.classList.contains('port') || 
            e.target.closest('.zoom-controls') || 
            e.target.closest('.trash-can')) return;
        
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

    window.addEventListener('mouseup', () => { isPanning = false; });

    // 드래그 앤 드롭으로 신규 게이트 생성
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
    document.getElementById('zoom-in').addEventListener('click', () => { currentZoom = Math.min(2, currentZoom + 0.1); zoomSlider.value = currentZoom; applyTransform(); });
    document.getElementById('zoom-out').addEventListener('click', () => { currentZoom = Math.max(0.5, currentZoom - 0.1); zoomSlider.value = currentZoom; applyTransform(); });
    zoomSlider.addEventListener('input', (e) => { currentZoom = parseFloat(e.target.value); applyTransform(); });

    // SVG 게이트 반환
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
            el.style.left = `${n.x - 30}px`; 
            el.style.top = `${n.y - 20}px`;
            el.dataset.id = n.id;

            if (n.type === 'INPUT' || n.type === 'OUTPUT') {
                el.classList.add('gate-text');
                const parts = n.id.split('_');
                const valDisplay = n.type === 'INPUT' 
                    ? ` <span class="val-badge" title="클릭하여 값 변경">${n.logicNode.value}</span>` 
                    : '';
                el.innerHTML = `<i>${parts[0]}<sub>${parts[1]}</sub></i>${valDisplay}`;
                
                if (n.type === 'INPUT') {
                    const badge = el.querySelector('.val-badge');
                    if (badge) {
                        badge.addEventListener('click', (e) => {
                            e.stopPropagation();
                            n.logicNode.value = n.logicNode.value === 0 ? 1 : 0;
                            renderCanvas();
                        });
                    }
                }
            } else {
                el.innerHTML = getGateSVG(n.type);
            }

            // 포트 배치 및 포트 인덱스 추가
            if (n.type !== 'INPUT') {
                const p1 = document.createElement('div'); 
                p1.className = 'port port-in'; 
                p1.dataset.node = n.id;
                p1.dataset.portIndex = '0';
                p1.style.top = (n.type === 'NOT' || n.type === 'OUTPUT') ? '15px' : '8px';
                el.appendChild(p1);

                if (n.type !== 'NOT' && n.type !== 'OUTPUT') {
                    const p2 = document.createElement('div'); 
                    p2.className = 'port port-in'; 
                    p2.dataset.node = n.id;
                    p2.dataset.portIndex = '1';
                    p2.style.top = '23px';
                    el.appendChild(p2);
                }
            }
            if (n.type !== 'OUTPUT') {
                const po = document.createElement('div'); 
                po.className = 'port port-out'; 
                po.dataset.node = n.id;
                po.style.top = '15px';
                el.appendChild(po);
            }

            // 게이트 드래그 이동 및 삭제 감지
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

    function isOverTrashCan(e) {
        const rect = trashCan.getBoundingClientRect();
        return (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        );
    }

    function onGateMouseMove(e) {
        if (!activeGate) return;
        activeGate.x += e.movementX / currentZoom;
        activeGate.y += e.movementY / currentZoom;

        if (isOverTrashCan(e)) {
            trashCan.classList.add('active');
        } else {
            trashCan.classList.remove('active');
        }

        renderCanvas();
    }

    function onGateMouseUp(e) {
        if (activeGate && isOverTrashCan(e)) {
            deleteGate(activeGate.id);
        }
        trashCan.classList.remove('active');
        activeGate = null;
        document.removeEventListener('mousemove', onGateMouseMove);
        document.removeEventListener('mouseup', onGateMouseUp);
    }

    function deleteGate(id) {
        nodes = nodes.filter(n => n.id !== id);
        wires = wires.filter(w => w.from !== id && w.to !== id);
        nodes.forEach(n => {
            n.logicNode.inputs = n.logicNode.inputs.filter(inNode => inNode && inNode.id !== id);
        });
        renderCanvas();
    }

    function getPortCenter(portEl) {
        const portRect = portEl.getBoundingClientRect();
        const canvasRect = canvasInner.getBoundingClientRect();
        return {
            x: (portRect.left + portRect.width / 2 - canvasRect.left) / currentZoom,
            y: (portRect.top + portRect.height / 2 - canvasRect.top) / currentZoom
        };
    }

    // 선 연결 로직
    function onPortClick(e) {
        e.stopPropagation();
        if (!isWiring && e.target.classList.contains('port-out')) {
            isWiring = true; 
            wireStartPort = e.target;
            currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            currentLine.setAttribute('stroke', '#1b263b'); 
            currentLine.setAttribute('stroke-width', '2');
            currentLine.style.pointerEvents = 'none'; // 포트 감지 간섭 방지
            wireLayer.appendChild(currentLine);
            document.addEventListener('mousemove', drawTempWire);
            document.addEventListener('mouseup', finishWiring);
        }
    }

    function drawTempWire(e) {
        if (!isWiring || !currentLine) return;
        const startPos = getPortCenter(wireStartPort);
        const canvasRect = canvasInner.getBoundingClientRect();
        currentLine.setAttribute('x1', startPos.x);
        currentLine.setAttribute('y1', startPos.y);
        currentLine.setAttribute('x2', (e.clientX - canvasRect.left) / currentZoom);
        currentLine.setAttribute('y2', (e.clientY - canvasRect.top) / currentZoom);
    }

    function finishWiring(e) {
        document.removeEventListener('mousemove', drawTempWire); 
        document.removeEventListener('mouseup', finishWiring);
        
        let targetPort = document.elementFromPoint(e.clientX, e.clientY);
        if (targetPort && targetPort.classList.contains('port-in')) {
            const fromId = wireStartPort.dataset.node;
            const toId = targetPort.dataset.node;
            const toPortIndex = parseInt(targetPort.dataset.portIndex || '0', 10);
            
            // 동일 대상 포트 연결 대체
            wires = wires.filter(w => !(w.to === toId && w.toPortIndex === toPortIndex));
            wires.push({ from: fromId, to: toId, toPortIndex });
            
            const fromNode = nodes.find(n => n.id === fromId).logicNode;
            const toNode = nodes.find(n => n.id === toId).logicNode;
            
            toNode.inputs[toPortIndex] = fromNode;
        }
        isWiring = false; 
        wireStartPort = null; 
        if (currentLine) currentLine.remove();
        renderCanvas();
    }

    function drawWires() {
        wireLayer.innerHTML = '';
        
        wires.forEach((w) => {
            const outDom = document.querySelector(`.canvas-gate[data-id="${w.from}"] .port-out`);
            const inDoms = document.querySelectorAll(`.canvas-gate[data-id="${w.to}"] .port-in`);
            const inDom = inDoms[w.toPortIndex || 0] || inDoms[0]; 
            
            if (outDom && inDom) {
                const startPos = getPortCenter(outDom);
                const endPos = getPortCenter(inDom);
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'wire-line');
                line.setAttribute('x1', startPos.x);
                line.setAttribute('y1', startPos.y);
                line.setAttribute('x2', endPos.x);
                line.setAttribute('y2', endPos.y);
                line.setAttribute('stroke', '#415a77'); 
                line.setAttribute('stroke-width', '2.5');
                
                line.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteWire(w);
                });

                wireLayer.appendChild(line);
            }
        });
    }

    function deleteWire(wireToDelete) {
        wires = wires.filter(w => !(w.from === wireToDelete.from && w.to === wireToDelete.to && w.toPortIndex === wireToDelete.toPortIndex));
        const toNode = nodes.find(n => n.id === wireToDelete.to);
        if (toNode) {
            delete toNode.logicNode.inputs[wireToDelete.toPortIndex];
            toNode.logicNode.inputs = toNode.logicNode.inputs.filter(Boolean);
        }
        renderCanvas();
    }

    function updateEquation() {
        const outputs = nodes.filter(n => n.type === 'OUTPUT');
        const eqSpan = document.getElementById('equation-display');
        if (outputs.length > 0) {
            eqSpan.innerHTML = outputs.map(o => {
                const parts = o.id.split('_');
                const expr = o.logicNode.getExpression();
                const evalVal = o.logicNode.evaluate();
                return `<i>${parts[0]}<sub>${parts[1]}</sub></i> = ${expr} (현재 값: ${evalVal})`;
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
            let html = '<tr>' + 
                inputs.map(i => {
                    const parts = i.id.split('_');
                    return `<th>${parts[0]}<sub>${parts[1]}</sub></th>`;
                }).join('') + 
                outputs.map(o => {
                    const parts = o.id.split('_');
                    return `<th>${parts[0]}<sub>${parts[1]}</sub> (결과)</th>`;
                }).join('') + '</tr>';
            
            data.forEach(row => {
                html += '<tr>' + 
                    inputs.map(i => `<td>${row[i.id]}</td>`).join('') + 
                    outputs.map(o => `<td style="font-weight:bold;">${row[o.id]}</td>`).join('') + 
                    '</tr>';
            });
            truthTable.innerHTML = html;
        }
    });
});
