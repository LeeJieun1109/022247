class LogicNode {
    constructor(id, type) {
        this.id = id;
        this.type = type; 
        this.inputs = [];
        this.value = 0; // 기본값
    }

    evaluate(visited = new Set()) {
        if (visited.has(this.id)) return 0;
        visited.add(this.id);

        if (this.type === 'VARIABLE') {
            const validInputs = this.inputs.filter(n => n !== undefined && n !== null);
            if (validInputs.length > 0) {
                // 선이 연결된 OUTPUT 변수인 경우 입력받은 값을 그대로 평가
                return validInputs[0].evaluate(new Set(visited));
            }
            // 선이 연결되지 않은 INPUT 변수인 경우 사용자 지정값 반환
            return this.value; 
        }
        
        const validInputs = this.inputs.filter(n => n !== undefined && n !== null);
        const vals = validInputs.map(n => n.evaluate(new Set(visited)));
        
        if (vals.length === 0) return 0;

        switch (this.type) {
            case 'AND':    return vals.reduce((a, b) => a & b, 1);
            case 'OR':     return vals.reduce((a, b) => a | b, 0);
            case 'XOR':    return vals.reduce((a, b) => a ^ b, 0);
            case 'NOT':    return vals[0] === 1 ? 0 : 1;
            case 'NAND':   return (vals.reduce((a, b) => a & b, 1)) === 1 ? 0 : 1;
            case 'NOR':    return (vals.reduce((a, b) => a | b, 0)) === 1 ? 0 : 1;
            case 'XNOR':   return (vals.reduce((a, b) => a ^ b, 0)) === 1 ? 0 : 1;
            case 'Buffer': return vals[0] !== undefined ? vals[0] : 0;
            default: return 0;
        }
    }

    getExpression(visited = new Set()) {
        if (visited.has(this.id)) return '...';
        visited.add(this.id);

        const formatId = (idStr) => {
            const parts = idStr.split('_');
            return `<i>${parts[0]}<sub>${parts[1]}</sub></i>`;
        };

        if (this.type === 'VARIABLE') {
            const validInputs = this.inputs.filter(n => n !== undefined && n !== null);
            if (validInputs.length > 0) {
                return validInputs[0].getExpression(new Set(visited));
            }
            return formatId(this.id);
        }
        
        const validInputs = this.inputs.filter(n => n !== undefined && n !== null);
        if (validInputs.length === 0) return '0';

        const exprs = validInputs.map(n => n.getExpression(new Set(visited)));
        
        switch (this.type) {
            case 'AND':    return `(${exprs.join(' · ')})`;
            case 'OR':     return `(${exprs.join(' + ')})`;
            case 'XOR':    return `(${exprs.join(' ⊕ ')})`;
            case 'NOT':    return `(${exprs[0]}')`;
            case 'NAND':   return `(${exprs.join(' · ')})'`;
            case 'NOR':    return `(${exprs.join(' + ')})'`;
            case 'XNOR':   return `(${exprs.join(' ⊕ ')})'`;
            case 'Buffer': return exprs[0];
            default: return '';
        }
    }
}

// 진리표 생성 시 연결 여부(wires)를 바탕으로 Input/Output 분류
function generateTruthTable(allNodes, wires) {
    const vars = allNodes.filter(n => n.type === 'VARIABLE');
    const inputs = [];
    const outputs = [];

    vars.forEach(v => {
        // 자신을 목적지(to)로 하는 와이어가 있으면 OUTPUT, 없으면 INPUT
        const isOutput = wires.some(w => w.to === v.id);
        if (isOutput) outputs.push(v);
        else inputs.push(v);
    });

    if (inputs.length === 0) return { inputs: [], outputs: [], data: [] };

    const numRows = Math.pow(2, inputs.length);
    const table = [];
    
    // 현재 값 백업
    const originalValues = inputs.map(n => n.logicNode.value);

    for (let i = 0; i < numRows; i++) {
        const row = {};
        inputs.forEach((node, idx) => {
            const bit = (i >> (inputs.length - 1 - idx)) & 1;
            node.logicNode.value = bit;
            row[node.id] = bit;
        });
        
        outputs.forEach(node => {
            row[`${node.id}_out`] = node.logicNode.evaluate();
        });
        table.push(row);
    }

    // 값 복원
    inputs.forEach((node, idx) => node.logicNode.value = originalValues[idx]);
    return { inputs, outputs, data: table };
}

const GATE_DICTIONARY = [
    { type: 'AND', exp: '모든 입력이 참(1)일 때만 결과가 참(1)이 됩니다.' },
    { type: 'OR', exp: '입력 중 하나라도 참(1)이면 결과가 참(1)이 됩니다.' },
    { type: 'NOT', exp: '입력을 반전합니다. 입력이 1이면 0, 0이면 1이 됩니다.' },
    { type: 'NAND', exp: 'AND 연산의 결과를 반전합니다.' },
    { type: 'NOR', exp: 'OR 연산의 결과를 반전합니다.' },
    { type: 'XOR', exp: '입력값이 서로 다를 때만 참(1)을 출력합니다.' },
    { type: 'XNOR', exp: '입력값이 서로 같을 때만 참(1)을 출력합니다.' },
    { type: 'Buffer', exp: '입력값을 변형 없이 그대로 출력합니다.' }
];

const MISSIONS = [
    { level: 1, title: 'Level 1', desc: '두 입력 변수가 모두 1일 때에만 1을 출력하는 회로를 설계하세요.' },
    { level: 2, title: 'Level 2', desc: '두 입력 변수 중 하나라도 1이면 1을 출력하는 회로를 설계하세요.' },
    { level: 3, title: 'Level 3', desc: '입력 변수가 0이면 1을, 1이면 0을 출력하는 회로를 설계하세요.' },
    { level: 4, title: 'Level 4', desc: '두 입력 변수의 값이 서로 다를 때에만 1을 출력하는 회로를 설계하세요.' },
    { level: 5, title: 'Level 5', desc: 'AND, OR, NOT 게이트만을 사용하여, 두 입력 변수의 값이 서로 다를 때에만 1을 출력하는 회로를 설계하세요.' },
    { level: 6, title: 'Level 6', desc: '3개의 입력 변수 중 값이 1인 변수가 2개 이상일 때 1을 출력하는 회로를 설계하세요.' },
    { level: 7, title: 'Level 7', desc: '두 입력 변수를 더하여, \'합(Sum)\'과 \'자리올림(Carry)\'을 각각 출력하는 회로를 설계하세요. (출력 변수 2개 필요)' },
    { level: 8, title: 'Level 8', desc: '3개의 입력 변수(A, B, S)에 대하여, S가 0일 때는 A의 값을, S가 1일 때는 B의 값을 그대로 출력하는 회로를 설계하세요.' },
    { level: 9, title: 'Level 9', desc: '3개의 입력 변수(비트 2개, 자리올림수 1개)를 더하여, 최종 \'합(Sum)\'과 \'자리올림(Carry)\'을 각각 출력하는 회로를 설계하세요. (출력 변수 2개 필요)' },
    { level: 10, title: 'Level 10', desc: '4개의 입력 변수에 대하여, 2비트 값 묶음 (A1, A0)와 (B1, B0)의 값이 완벽히 일치할 때에만 1을 출력하는 회로를 설계하세요.' },
    { level: 11, title: 'Level 11', desc: '3개의 입력 변수 중 값이 1인 변수의 개수가 짝수(0개, 2개)일 때 1을, 홀수(1개, 3개)일 때 0을 출력하는 회로를 설계하세요.' },
    { level: 12, title: 'Level 12', desc: '2개의 입력 변수 값 조합(00, 01, 10, 11)에 따라, 4개의 출력 변수 중 단 1개만 1이 되도록 신호를 분배하는 회로를 설계하세요. (출력 변수 4개 필요)' }
];
