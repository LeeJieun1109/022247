// app.js: 시스템 초기화, 페이지 라우팅, 전체 이벤트 핸들링 
document.addEventListener('DOMContentLoaded', () => {
    const engine = new SimulatorEngine();
    const ui = new SimulatorUI(engine);

    // 전역 상태
    let currentLevel = 0;
    // 수정 15: 레벨 상태 객체
    let levelResults = { 1: 'unattempted', 2: 'unattempted', 3: 'unattempted' };

    // 메뉴 제어
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('side-menu');

    menuBtn.addEventListener('click', () => sideMenu.classList.remove('hidden'));
    closeMenuBtn.addEventListener('click', () => sideMenu.classList.add('hidden'));

    // 페이지 라우팅
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pageId = e.target.getAttribute('data-page');
            showPage(pageId);
        });
    });

    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${pageId}`).classList.add('active');
        sideMenu.classList.add('hidden');

        if (pageId === 'circuit') {
            document.getElementById('challenge-header').classList.add('hidden');
        }
    }

    // 툴바 노드 추가
    document.querySelectorAll('.tool-btn[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            ui.addNode(btn.dataset.type);
        });
    });

    // 게이트 사전 초기화
    ui.renderDictionary();

    // 수정 9: 전체 삭제 모달
    const trashBtn = document.getElementById('trash-btn');
    const deleteModal = document.getElementById('delete-modal-overlay');
    
    trashBtn.addEventListener('click', () => deleteModal.classList.remove('hidden'));
    document.getElementById('cancel-delete').addEventListener('click', () => deleteModal.classList.add('hidden'));
    document.getElementById('confirm-delete').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        ui.clearCanvas();
    });

    // 수정 13, 14: 챌린지 시작 및 UI 제어
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentLevel = parseInt(e.target.getAttribute('data-level'));
            showPage('circuit');
            
            const header = document.getElementById('challenge-header');
            header.classList.remove('hidden');
            document.getElementById('challenge-title').innerText = `Level ${currentLevel} : 회로 설계하기`;
            ui.clearCanvas();
        });
    });

    document.getElementById('back-to-challenge-btn').addEventListener('click', () => showPage('challenge'));

    // 수정 13: 채점 모달
    const submitBtn = document.getElementById('submit-btn');
    const resultModal = document.getElementById('result-modal-overlay');
    const resultText = document.getElementById('result-text');

    submitBtn.addEventListener('click', () => {
        const nodes = ui.getNodes();
        const isSuccess = engine.evaluateCircuit(nodes); // 엔진을 통한 채점
        
        if (isSuccess) {
            resultText.innerText = '성공';
            levelResults[currentLevel] = 'success';
        } else {
            resultText.innerText = '실패';
            levelResults[currentLevel] = 'failure';
        }
        
        resultModal.classList.remove('hidden');
        updateLevelButtons();
    });

    document.getElementById('close-result-btn').addEventListener('click', () => {
        resultModal.classList.add('hidden');
    });

    // 수정 15: 상태별 색상 반영 함수
    function updateLevelButtons() {
        document.querySelectorAll('.level-btn').forEach((btn) => {
            const lvl = btn.getAttribute('data-level');
            btn.className = `level-btn ${levelResults[lvl]}`; 
        });
    }
});
