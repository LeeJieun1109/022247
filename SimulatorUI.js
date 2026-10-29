// SimulatorUI.js: DOM 조작, 캔버스 드래그, UI 이벤트 담당
class SimulatorUI {
    constructor(engine) {
        this.engine = engine;
        this.canvas = document.getElementById('canvas-container');
    }

    // 수정 4, 7, 8: 캔버스에 노드(게이트/변수) 추가
    addNode(type) {
        const node = document.createElement('div');
        node.className = 'circuit-node';
        node.style.left = '80px';
        node.style.top = '80px';
        
        // 게이트별 핀 렌더링
        if (type === 'variable') {
            // 수정 4: 통합 '변수'
            node.innerHTML = `
                <span>변수</span>
                <span class="var-value">0</span>
                <div class="connection-point input"></div>
                <div class="connection-point output"></div>
            `;
        } else if (type === 'not' || type === 'buffer') {
            node.innerHTML = `
                <span>${type.toUpperCase()}</span>
                <div class="connection-point input"></div>
                <div class="connection-point output"></div>
            `;
        } else {
            node.innerHTML = `
                <span>${type.toUpperCase()}</span>
                <div class="connection-point input-1"></div>
                <div class="connection-point input-2"></div>
                <div class="connection-point output"></div>
            `;
        }

        this.canvas.appendChild(node);
        this.enableDrag(node);

        // 수정 6: 변수 노드 클릭 이벤트 및 잠금 처리
        if (type === 'variable') {
            const varValue = node.querySelector('.var-value');
            varValue.addEventListener('click', (e) => {
                if (!node.hasAttribute('data-left-connected')) {
                    varValue.innerText = varValue.innerText === '0' ? '1' : '0';
                }
            });
            // 임의의 선 연결 이벤트 리스너 시뮬레이션용
            node.addEventListener('leftConnectionMade', () => {
                node.setAttribute('data-left-connected', 'true');
                varValue.classList.add('locked');
            });
        }
    }

    enableDrag(node) {
        let isDragging = false;
        let offsetX, offsetY;

        node.addEventListener('mousedown', (e) => {
            // 연결점이나 변수 값을 누를 때는 드래그 방지
            if (e.target.classList.contains('connection-point') || e.target.classList.contains('var-value')) return;
            isDragging = true;
            offsetX = e.clientX - node.offsetLeft;
            offsetY = e.clientY - node.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                node.style.left = `${e.clientX - offsetX}px`;
                node.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    clearCanvas() {
        this.canvas.querySelectorAll('.circuit-node').forEach(node => node.remove());
    }

    getNodes() {
        return this.canvas.querySelectorAll('.circuit-node');
    }

    // 수정 10, 11: 게이트 사전 UI 렌더링
    renderDictionary() {
        const dictGrid = document.getElementById('gate-dict-grid');
        const dictOverlay = document.getElementById('dict-overlay');
        const data = this.engine.getGateDictionary();

        data.forEach(gate => {
            const card = document.createElement('div');
            card.className = 'gate-card';
            card.innerHTML = `
                <h3>${gate.name}</h3>
                <div class="gate-desc">
                    <strong>논리식:</strong> ${gate.formula}<br><br>
                    ${gate.exp}
                </div>
            `;
            
            card.addEventListener('click', () => {
                if (card.classList.contains('active')) {
                    card.classList.remove('active');
                    dictOverlay.classList.add('hidden');
                    card.style.zIndex = '11';
                } else {
                    document.querySelectorAll('.gate-card').forEach(c => {
                        c.classList.remove('active');
                        c.style.zIndex = '11';
                    });
                    card.classList.add('active');
                    card.style.zIndex = '20'; 
                    dictOverlay.classList.remove('hidden');
                }
            });
            dictGrid.appendChild(card);
        });

        dictOverlay.addEventListener('click', () => {
            document.querySelectorAll('.gate-card').forEach(c => c.classList.remove('active'));
            dictOverlay.classList.add('hidden');
        });
    }
}
