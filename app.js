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

    // 사이드 메뉴 토글
    const sideMenu = document.getElementById('side-menu');
    document.querySelectorAll('.open-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => sideMenu.classList.add('open'));
    });
    document.getElementById('close-menu-btn').addEventListener('click', () => sideMenu.classList.remove('open'));

    // 게이트 사전 카드 클릭 (아코디언 방식)
    document.querySelectorAll('.gate-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('open');
        });
    });

    // 레벨 챌린지 생성
    const levelGrid = document.getElementById('level-grid');
    for(let i=1; i<=12; i++) {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `<h3>Level ${i}</h3><div class="desc-box">준비 중입니다.</div>`;
        card.addEventListener('click', () => card.classList.toggle('open'));
        levelGrid.appendChild(card);
    }
});
