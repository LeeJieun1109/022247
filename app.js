document.addEventListener('DOMContentLoaded', () => {
    // 1. 상태 관리 (Level 1~12)
    window.levelStatuses = {};
    for (let i = 1; i <= 12; i++) window.levelStatuses[i] = 'unattempted';
    window.currentActiveLevel = null;

    // 2. SPA 라우팅
    const pages = document.querySelectorAll('.page');
    function showPageById(targetId) {
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        document.getElementById('side-menu').classList.remove('open');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showPageById(e.currentTarget.dataset.target));
    });

    // 3. 사이드 메뉴 토글
    const sideMenu = document.getElementById('side-menu');
    document.querySelectorAll('.open-menu-btn').forEach(btn => btn.addEventListener('click', () => sideMenu.classList.add('open')));
    document.getElementById('close-menu-btn').addEventListener('click', () => sideMenu.classList.remove('open'));

    // 4. 게이트 사전 렌더링
    const dictGrid = document.getElementById('dict-card-grid');
    const dictOverlay = document.getElementById('dict-dim-overlay');

    if (dictGrid && typeof GATE_DICTIONARY !== 'undefined') {
        GATE_DICTIONARY.forEach(gate => {
            const card = document.createElement('div');
            card.className = 'gate-card';
            card.innerHTML = `<h3>${gate.type}</h3><div class="desc-box">${gate.exp}</div>`;
            
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

    // 5. 미션 챌린지 렌더링
    const levelGrid = document.getElementById('level-grid');
    if (levelGrid) {
        for (let i = 1; i <= 12; i++) {
            const card = document.createElement('button');
            card.className = `level-card ${window.levelStatuses[i]}`;
            card.dataset.level = i;
            card.innerHTML = `<h3>Level ${i}</h3>`;
            
            card.addEventListener('click', () => {
                window.currentActiveLevel = i;
                showPageById('page-1');
                
                // 챌린지 모드 UI 세팅
                document.getElementById('circuit-header-title').innerText = `Level ${i} : 회로 설계하기`;
                document.getElementById('toggle-view-btn').classList.add('hidden');
                document.getElementById('submit-btn').classList.remove('hidden');
                document.getElementById('back-to-challenge-btn').classList.remove('hidden');
                document.querySelector('#page-1 .open-menu-btn').classList.add('hidden');
            });
            levelGrid.appendChild(card);
        }
    }

    // 6. 챌린지 모드 뒤로가기
    document.getElementById('back-to-challenge-btn').addEventListener('click', () => {
        window.currentActiveLevel = null;
        showPageById('page-3');
        
        // 일반 모드 UI 복구
        document.getElementById('circuit-header-title').innerText = '회로도 그리기';
        document.getElementById('toggle-view-btn').classList.remove('hidden');
        document.getElementById('submit-btn').classList.add('hidden');
        document.getElementById('back-to-challenge-btn').classList.add('hidden');
        document.querySelector('#page-1 .open-menu-btn').classList.remove('hidden');
    });

    // 7. 색상 업데이트 헬퍼
    window.updateLevelButtonColors = function() {
        document.querySelectorAll('.level-card').forEach(card => {
            card.className = `level-card ${window.levelStatuses[card.dataset.level]}`;
        });
    };
});
