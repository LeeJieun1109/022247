class LogicNode {
    constructor(id, type) {
        this.id = id;
        this.type = type; 
        this.inputs = [];
        this.value = 0; // VARIABLE 기본값
    }

    evaluate(visited = new Set()) {
        if (visited.has(this.id)) return 0;
        visited.add(this.id);

        if (this.type === 'VARIABLE') return this.value;
        
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

        if (this.type === 'VARIABLE') return formatId(this.id);
        
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

function generateTruthTable(inputNodes) {
    if (inputNodes.length === 0) return [];
    const numRows = Math.pow(2, inputNodes.length);
    const table = [];
    
    // 현재 값 백업
    const originalValues = inputNodes.map(n => n.value);

    for (let i = 0; i < numRows; i++) {
        const row = {};
        inputNodes.forEach((node, idx) => {
            const bit = (i >> (inputNodes.length - 1 - idx)) & 1;
            node.value = bit;
            row[node.id] = bit;
        });
        // 모든 변수의 현재 상태를 기반으로 결과 계산
        inputNodes.forEach(node => {
            row[`${node.id}_out`] = node.evaluate();
        });
        table.push(row);
    }

    // 값 복원
    inputNodes.forEach((node, idx) => node.value = originalValues[idx]);
    return table;
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
