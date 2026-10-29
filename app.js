document.addEventListener('DOMContentLoaded', () => {
    window.levelStatuses = {};
    for (let i = 1; i <= 12; i++) window.levelStatuses[i] = 'unattempted';
    window.currentActiveLevel = null;

    const pages = document.querySelectorAll('.page');
    function showPageById(targetId) {
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        document.getElementById('side-menu').classList.remove('open');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showPageById(e.currentTarget.dataset.target));
    });

    const sideMenu = document.getElementById('side-menu');
    document.querySelectorAll('.open-menu-btn').forEach(btn => btn.addEventListener('click', () => sideMenu.classList.add('open')));
    document.getElementById('close-menu-btn').addEventListener('click', () => sideMenu.classList.remove('open'));

    // 게이트 사전 렌더링 (카드 클릭 시 팝업 생성 방식 적용)
    const dictGrid = document.getElementById('dict-card-grid');
    const gatePopup = document.getElementById('gate-popup');
    const gatePopupTitle = document.getElementById('gate-popup-title');
    const gatePopupDesc = document.getElementById('gate-popup-desc');
    const gatePopupClose = document.getElementById('gate-popup-close');

    if (dictGrid && typeof GATE_DICTIONARY !== 'undefined') {
        GATE_DICTIONARY.forEach(gate => {
            const card = document.createElement('div');
            card.className = 'gate-card';
            card.innerHTML = `<h3>${gate.type}</h3>`;
            
            card.addEventListener('click', (e) => {
                // 클릭한 카드만 강조
                document.querySelectorAll('.gate-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                // 팝업 내용 업데이트 및 표시 (클릭한 요소 근처 위치 설정)
                gatePopupTitle.innerText = gate.type;
                gatePopupDesc.innerText = gate.exp;
                
                const rect = card.getBoundingClientRect();
                gatePopup.style.top = `${rect.bottom + window.scrollY + 15}px`;
                gatePopup.style.left = `${rect.left + window.scrollX}px`;
                gatePopup.classList.remove('hidden');
            });
            dictGrid.appendChild(card);
        });

        gatePopupClose.addEventListener('click', () => {
            gatePopup.classList.add('hidden');
            document.querySelectorAll('.gate-card').forEach(c => c.classList.remove('selected'));
        });
    }

    // 미션 챌린지 렌더링
    const levelGrid = document.getElementById('level-grid');
    if (levelGrid && typeof MISSIONS !== 'undefined') {
        MISSIONS.forEach(mission => {
            const card = document.createElement('button');
            card.className = `level-card ${window.levelStatuses[mission.level]}`;
            card.dataset.level = mission.level;
            
            card.innerHTML = `<h3 style="margin-bottom:0.8rem;">${mission.title}</h3><p style="font-size:0.95rem; font-weight:normal; line-height:1.4;">${mission.desc}</p>`;
            
            card.addEventListener('click', () => {
                window.currentActiveLevel = mission.level;
                showPageById('page-1');
                
                document.getElementById('circuit-header-title').innerText = `${mission.title} : 회로 설계하기`;
                document.getElementById('toggle-view-btn').classList.add('hidden');
                document.getElementById('submit-btn').classList.remove('hidden');
                document.getElementById('back-to-challenge-btn').classList.remove('hidden');
                document.querySelector('#page-1 .open-menu-btn').classList.add('hidden');
            });
            levelGrid.appendChild(card);
        });
    }

    document.getElementById('back-to-challenge-btn').addEventListener('click', () => {
        window.currentActiveLevel = null;
        showPageById('page-3');
        
        document.getElementById('circuit-header-title').innerText = '회로도 그리기';
        document.getElementById('toggle-view-btn').classList.remove('hidden');
        document.getElementById('submit-btn').classList.add('hidden');
        document.getElementById('back-to-challenge-btn').classList.add('hidden');
        document.querySelector('#page-1 .open-menu-btn').classList.remove('hidden');
    });

    window.updateLevelButtonColors = function() {
        document.querySelectorAll('.level-card').forEach(card => {
            card.className = `level-card ${window.levelStatuses[card.dataset.level]}`;
        });
    };
});
