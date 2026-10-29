document.addEventListener('DOMContentLoaded', () => {
    /* 수정 15: 각 레벨 도전 상태 저장 (unattempted, success, failure) */
    window.levelStatuses = {};
    for (let i = 1; i <= 12; i++) window.levelStatuses[i] = 'unattempted';
    window.currentActiveLevel = null;

    // SPA 라우팅
    const pages = document.querySelectorAll('.page');
    
    function showPageById(targetId) {
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        document.getElementById('side-menu').classList.remove('open');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            showPageById(targetId);
        });
    });

    // 사이드 메뉴 토글
    const sideMenu = document.getElementById('side-menu');
    document.querySelectorAll('.open-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => sideMenu.classList.add('open'));
    });
    document.getElementById('close-menu-btn').addEventListener('click', () => sideMenu.classList.remove('open'));

    /* 수정 10, 11: 게이트 사전 생성 및 클릭 인터랙션 */
    const dictGrid = document.getElementById('dict-card-grid');
    const dictOverlay = document.getElementById('dict-dim-overlay');

    if (dictGrid && typeof GATE_DICTIONARY !== 'undefined') {
        dictGrid.innerHTML = '';
        GATE_DICTIONARY.forEach(gate => {
            const card = document.createElement('div');
            card.className = 'gate-card';
            card.innerHTML = `
                <h3>${gate.type}</h3>
                <div class="desc-box">${gate.exp}</div>
            `;
            
            card.addEventListener('click', () => {
                if (card.classList.contains('open')) {
                    card.classList.remove('open');
                    dictOverlay.classList.remove('active');
                } else {
                    document.querySelectorAll('.gate-card').forEach(c => c.classList.remove('open'));
                    card.classList.add('open');
                    dictOverlay.classList.add('active');
                }
            });
            dictGrid.appendChild(card);
        });

        dictOverlay.addEventListener('click', () => {
            document.querySelectorAll('.gate-card').forEach(c => c.classList.remove('open'));
            dictOverlay.classList.remove('active');
        });
    }

    /* 수정 13, 14, 15: 레벨 챌린지 생성 및 화면 전환 */
    const levelGrid = document.getElementById('level-grid');
    if (levelGrid) {
        levelGrid.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const card = document.createElement('button');
            card.className = `level-card ${window.levelStatuses[i]}`;
            card.dataset.level = i;
            card.innerHTML = `<h3>Level ${i}</h3>`;
            
            /* 수정 13: 각 레벨 클릭 시 회로도 그리기 창을 띄움 */
            card.addEventListener('click', () => {
                window.currentActiveLevel = i;
                showPageById('page-1');
                
                // 수정 13: 레벨 진입 시 헤더 제목 및 채점 버튼 표시
                document.getElementById('circuit-header-title').innerText = `Level ${i} : 회로 설계하기`;
                document.getElementById('toggle-view-btn').classList.add('hidden');
                document.getElementById('submit-btn').classList.remove('hidden');
                document.getElementById('back-to-challenge-btn').classList.remove('hidden');
                document.querySelector('.open-menu-btn').classList.add('hidden');
            });
            levelGrid.appendChild(card);
        }
    }

    /* 수정 14: 레벨 페이지에서 화살표(<-) 클릭 시 레벨 챌린지 페이지로 돌아감 */
    document.getElementById('back-to-challenge-btn').addEventListener('click', () => {
        window.currentActiveLevel = null;
        showPageById('page-3');
        
        document.getElementById('circuit-header-title').innerText = '회로도 그리기';
        document.getElementById('toggle-view-btn').classList.remove('hidden');
        document.getElementById('submit-btn').classList.add('hidden');
        document.getElementById('back-to-challenge-btn').classList.add('hidden');
        document.querySelector('.open-menu-btn').classList.remove('hidden');
    });

    /* 수정 15: 결과에 따라 레벨 버튼 색상 업데이트 함수 */
    window.updateLevelButtonColors = function() {
        document.querySelectorAll('.level-card').forEach(card => {
            const lvl = card.dataset.level;
            card.className = `level-card ${window.levelStatuses[lvl]}`;
        });
    };
});
