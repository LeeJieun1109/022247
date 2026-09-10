class LogicNode {
    constructor(id, type) {
        this.id = id;
        this.type = type; 
        this.inputs = [];
        this.value = 0;
    }

    evaluate(visited = new Set()) {
        if (visited.has(this.id)) return 0; // 순환 회로 연결 시 무한 재귀 방지
        visited.add(this.id);

        if (this.type === 'INPUT') return this.value;
        
        const vals = this.inputs.filter(Boolean).map(n => n.evaluate(new Set(visited)));
        if (vals.length === 0) return 0;

        switch (this.type) {
            case 'AND': return vals.reduce((a, b) => a & b, 1);
            case 'OR':  return vals.reduce((a, b) => a | b, 0);
            case 'XOR': return vals.reduce((a, b) => a ^ b, 0);
            case 'NOT': return vals[0] === 1 ? 0 : 1;
            case 'OUTPUT': return vals[0] || 0;
            default: return 0;
        }
    }

    getExpression(visited = new Set()) {
        if (visited.has(this.id)) return '...'; // 순환 회로 연결 시 무한 재귀 방지
        visited.add(this.id);

        const formatId = (idStr) => {
            const parts = idStr.split('_');
            return `<i>${parts[0]}<sub>${parts[1]}</sub></i>`;
        };

        if (this.type === 'INPUT') return formatId(this.id);
        const validInputs = this.inputs.filter(Boolean);
        if (validInputs.length === 0) return '0';

        const exprs = validInputs.map(n => n.getExpression(new Set(visited)));
        switch (this.type) {
            case 'AND': return `(${exprs.join(' · ')})`;
            case 'OR':  return `(${exprs.join(' + ')})`;
            case 'XOR': return `(${exprs.join(' ⊕ ')})`;
            case 'NOT': return `(${exprs[0]}')`;
            case 'OUTPUT': return exprs[0];
            default: return '';
        }
    }
}

function generateTruthTable(inputNodes, outputNodes) {
    if (inputNodes.length === 0) return [];
    const numRows = Math.pow(2, inputNodes.length);
    const table = [];
    for (let i = 0; i < numRows; i++) {
        const row = {};
        inputNodes.forEach((node, idx) => {
            const bit = (i >> (inputNodes.length - 1 - idx)) & 1;
            node.value = bit;
            row[node.id] = bit;
        });
        outputNodes.forEach(node => {
            row[node.id] = node.evaluate();
        });
        table.push(row);
    }
    return table;
}
