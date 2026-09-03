document.addEventListener('DOMContentLoaded', () => {
    // SPA 라우팅
    const pages = document.querySelectorAll('.page');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('side-menu').classList.remove('open');
            const targetId = e.currentTarget.dataset.target;
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 메뉴 토글
    const sideMenu = document.getElementById('side-menu');
    document.querySelectorAll('.open-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => sideMenu.classList.add('open'));
    });
    document.getElementById('close-menu-btn').addEventListener('click', () => sideMenu.classList.remove('open'));

    // 모달 제어
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const resultEl = document.getElementById('level-result-display');
    
    function openModal(title, desc, isLevel = false) {
        titleEl.textContent = title;
        descEl.textContent = desc;
        resultEl.classList.toggle('hidden', !isLevel);
        modal.classList.add('active');
    }
    
    document.getElementById('close-modal-btn').addEventListener('click', () => modal.classList.remove('active'));
    
    document.querySelectorAll('.info-btn, .info-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal('게이트 설명', e.currentTarget.dataset.info);
        });
    });

    // 레벨 챌린지 생성
    const levelGrid = document.getElementById('level-grid');
    const levelData = Array.from({length: 12}, (_, i) => ({
        id: i + 1, 
        status: i === 0 ? 'perfect' : i === 1 ? 'good' : i === 2 ? 'bad' : 'none'
    }));

    levelData.forEach(lvl => {
        const card = document.createElement('div');
        card.className = 'level-card';
        const sClass = `status-${lvl.status}`;
        const sText = lvl.status === 'none' ? 'Not done' : lvl.status.toUpperCase();
        
        card.innerHTML = `<h3>Level ${lvl.id}</h3><span class="level-status ${sClass}">${sText}</span>`;
        card.addEventListener('click', () => {
            openModal(`Level ${lvl.id} 목표`, `최소한의 게이트로 타이머 안에 회로를 구성하세요!`, true);
            if(lvl.status !== 'none') {
                resultEl.textContent = sText;
                resultEl.style.color = getComputedStyle(document.documentElement).getPropertyValue(`--${lvl.status}`);
            } else {
                resultEl.textContent = '';
            }
        });
        levelGrid.appendChild(card);
    });
});
