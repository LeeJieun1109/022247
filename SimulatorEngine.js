// SimulatorEngine.js: 게이트 논리 연산 및 회로 상태 관리 담당
class SimulatorEngine {
    constructor() {
        // 수정 11: 8가지 게이트 데이터 정의
        this.gateData = [
            { name: 'AND', formula: 'F = A·B', exp: '모든 입력이 1일 때만 1을 출력합니다.' },
            { name: 'OR', formula: 'F = A+B', exp: '입력 중 하나라도 1이면 1을 출력합니다.' },
            { name: 'NOT', formula: 'F = A\'', exp: '입력을 반전하여 출력합니다.' }, // 수정 10: 'NOT:' 접두사 삭제
            { name: 'NAND', formula: 'F = (A·B)\'', exp: 'AND 게이트의 출력을 반전합니다.' },
            { name: 'NOR', formula: 'F = (A+B)\'', exp: 'OR 게이트의 출력을 반전합니다.' },
            { name: 'XOR', formula: 'F = A⊕B', exp: '두 입력이 서로 다를 때만 1을 출력합니다.' },
            { name: 'XNOR', formula: 'F = (A⊕B)\'', exp: '두 입력이 서로 같을 때만 1을 출력합니다.' },
            { name: 'Buffer', formula: 'F = A', exp: '입력을 그대로 출력합니다 (신호 지연/증폭용).' }
        ];
    }

    getGateDictionary() {
        return this.gateData;
    }

    // 수정 13: 미션 채점 로직 (현재는 UI 노드 개수 기반 간단한 예시 구현)
    evaluateCircuit(nodes) {
        // 실제 구현에서는 노드들의 연결 그래프(Graph)를 탐색하여 진리표를 계산해야 합니다.
        // 현재는 시연을 위해 노드가 2개 이상 배치되었는지 여부로 채점합니다.
        return nodes.length >= 2;
    }
}
