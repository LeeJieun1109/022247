document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('circuit-canvas');
    const gateLayer = document.getElementById('gate-layer');
    const wireLayer = document.getElementById('wire-layer');
    
    let nodes = [];
    let wires = [];
    let inputCount = 1;
    let outputCount = 1;
    let gateCount = 1;
    
    let draggedType = null;
    let activeGate = null, offsetX = 0, offsetY = 0;
    
    // 선 긋기 관련 상태
    let isWiring = false;
    let wireStartPort = null;
    let currentLine = null;

    // 드래그 앤 드롭 세팅
    document.querySelectorAll('.gate-toolbar .gate-item').forEach(item => {
        item.addEventListener('dragstart', (e) => draggedType = e.currentTarget.dataset.type);
    });

    canvas.addEventListener('dragover', e => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedType) return;
        const rect = canvas.getBoundingClientRect();
        createGate(draggedType, e.clientX - rect.left, e.clientY - rect.top);
        draggedType = null;
    });

    function createGate(type, x, y) {
        let id;
        if (type === 'INPUT') id = `x${inputCount++}`;
        else if (type === 'OUTPUT') id = `O${outputCount++}`;
        else id = `${type}_${gateCount++}`;

        const node = new LogicNode(id, type);
        nodes.push({ id, logicNode: node, x, y, type });

        renderCanvas();
    }

    function renderCanvas() {
        gateLayer.innerHTML = '';
        nodes.forEach(n => {
            const el = document.createElement('div');
            el.className = 'canvas-gate';
            el.style.left = `${n.x - 30}px`;
            el.style.top = `${n.y - 20}px`;
            el.innerText = n.type === 'INPUT' || n.type === 'OUTPUT' ? n.id : n.type;
            el.dataset.id = n.id;

            // 포트 생성
            if (n.type !== 'INPUT') {
                const inPort1 = document.createElement('div');
                inPort1.className = 'port port-in';
                inPort1.style.top = n.type === 'NOT' || n.type === 'OUTPUT' ? '14px' : '5px';
                inPort1.dataset.node = n.id;
                el.appendChild(inPort1);
                
                if (n.type !== 'NOT' && n.type !== 'OUTPUT') {
                    const inPort2 = document.createElement('div');
                    inPort2.className = 'port port-in';
                    inPort2.style.top = '25px';
                    inPort2.dataset.node = n.id;
                    el.appendChild(inPort2);
                }
            }
            if (n.type !== 'OUTPUT') {
                const outPort = document.createElement('div');
                outPort.className = 'port port-out';
                outPort.dataset.node = n.id;
                el.appendChild(outPort);
            }

            el.addEventListener('mousedown', onGateMouseDown);
            gateLayer.appendChild(el);
        });

        // 이벤트 위임을 통한 포트 클릭(선 연결)
        document.querySelectorAll('.port').forEach(p => {
            p.addEventListener('mousedown', onPortClick);
        });

        drawWires();
        updateEquation();
    }

    function onGateMouseDown(e) {
        if (e.target.classList.contains('port')) return;
        activeGate = nodes.find(n => n.id === e.currentTarget.dataset.id);
        const rect = e.currentTarget.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        document.addEventListener('mousemove', onGateMouseMove);
        document.addEventListener('mouseup', onGateMouseUp);
    }

    function onGateMouseMove(e) {
        if (!activeGate) return;
        const rect = canvas.getBoundingClientRect();
        activeGate.x = e.clientX - rect.left - offsetX + 30;
        activeGate.y = e.clientY - rect.top - offsetY + 20;
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
            isWiring = true;
            wireStartPort = e.target;
            currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            currentLine.setAttribute('stroke', '#1b263b');
            currentLine.setAttribute('stroke-width', '3');
            wireLayer.appendChild(currentLine);
            document.addEventListener('mousemove', drawTempWire);
            document.addEventListener('mouseup', finishWiring);
        }
    }

    function drawTempWire(e) {
        if (!isWiring) return;
        const rect = canvas.getBoundingClientRect();
        const startRect = wireStartPort.getBoundingClientRect();
        currentLine.setAttribute('x1', startRect.left - rect.left + 6);
        currentLine.setAttribute('y1', startRect.top - rect.top + 6);
        currentLine.setAttribute('x2', e.clientX - rect.left);
        currentLine.setAttribute('y2', e.clientY - rect.top);
    }

    function finishWiring(e) {
        document.removeEventListener('mousemove', drawTempWire);
        document.removeEventListener('mouseup', finishWiring);
        
        let targetPort = document.elementFromPoint(e.clientX, e.clientY);
        if (targetPort && targetPort.classList.contains('port-in')) {
            const fromId = wireStartPort.dataset.node;
            const toId = targetPort.dataset.node;
            wires.push({ from: fromId, to: toId });
            
            // 엔진 연결
            const fromNode = nodes.find(n => n.id === fromId).logicNode;
            const toNode = nodes.find(n => n.id === toId).logicNode;
            toNode.inputs.push(fromNode);
        }
        
        isWiring = false;
        wireStartPort = null;
        if (currentLine) currentLine.remove();
        renderCanvas();
    }

    function drawWires() {
        wireLayer.innerHTML = '';
        const rect = canvas.getBoundingClientRect();
        wires.forEach(w => {
            const outDom = document.querySelector(`.canvas-gate[data-id="${w.from}"] .port-out`);
            const inDoms = document.querySelectorAll(`.canvas-gate[data-id="${w.to}"] .port-in`);
            // 편의상 첫 번째 빈 포트를 찾는 로직 생략하고 단순 렌더링
            const inDom = inDoms[0]; 
            
            if (outDom && inDom) {
                const oRect = outDom.getBoundingClientRect();
                const iRect = inDom.getBoundingClientRect();
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', oRect.left - rect.left + 6);
                line.setAttribute('y1', oRect.top - rect.top + 6);
                line.setAttribute('x2', iRect.left - rect.left + 6);
                line.setAttribute('y2', iRect.top - rect.top + 6);
                line.setAttribute('stroke', '#4a90e2');
                line.setAttribute('stroke-width', '3');
                wireLayer.appendChild(line);
            }
        });
    }

    function updateEquation() {
        const outputs = nodes.filter(n => n.type === 'OUTPUT');
        if (outputs.length > 0) {
            document.getElementById('equation-display').innerText = outputs.map(o => `${o.id} = ${o.logicNode.getExpression()}`).join(' / ');
        } else {
            document.getElementById('equation-display').innerText = '출력(OUTPUT) 게이트를 연결하세요.';
        }
    }

    // 표(Truth Table) 전환 토글
    const toggleBtn = document.getElementById('toggle-view-btn');
    const tableContainer = document.getElementById('table-view-container');
    const truthTable = document.getElementById('truth-table');
    let isTableMode = false;

    toggleBtn.addEventListener('click', () => {
        isTableMode = !isTableMode;
        tableContainer.classList.toggle('hidden', !isTableMode);
        toggleBtn.innerText = isTableMode ? '회로도로 전환' : '표로 전환';
        
        if (isTableMode) {
            const inputs = nodes.filter(n => n.type === 'INPUT').map(n => n.logicNode);
            const outputs = nodes.filter(n => n.type === 'OUTPUT').map(n => n.logicNode);
            
            if (inputs.length === 0 || outputs.length === 0) {
                truthTable.innerHTML = '<tr><td>입력(INPUT)과 출력(OUTPUT) 게이트가 모두 필요합니다.</td></tr>';
                return;
            }
            
            const data = generateTruthTable(inputs, outputs);
            
            // 테이블 헤더
            let html = '<tr>';
            inputs.forEach(i => html += `<th>${i.id}</th>`);
            outputs.forEach(o => html += `<th>${o.id} (결과)</th>`);
            html += '</tr>';
            
            // 테이블 데이터
            data.forEach(row => {
                html += '<tr>';
                inputs.forEach(i => html += `<td>${row[i.id]}</td>`);
                outputs.forEach(o => html += `<td style="font-weight:bold; color:var(--perfect);">${row[o.id]}</td>`);
                html += '</tr>';
            });
            
            truthTable.innerHTML = html;
        }
    });
});
