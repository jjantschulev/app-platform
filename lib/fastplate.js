function fastPlate(text, data) {
    const tokens = tokenise(text);
    const blocks = buildBlocks(tokens);
    const output = evaluate(blocks, data);
    return output;
}

function evaluate(block, ctx) {
    let context = {...ctx};
    let forLoopContext = {};
    let ifContext = true;
    let pIfContext = ifContext;
    let output = '';
    for(let element of block.val) {
        if(element.type === 'block') {
            if(forLoopContext.next) {
                for(let el of forLoopContext.arr) {
                output += evaluate(element, {...context, [forLoopContext.identifier]: el})
            }} else if(ifContext) {
                output += evaluate(element, context)
            }
        } else {
            if(element.val.commandType === 'ins') {
                output += getValueAtPath(context, element.val.commandArgs[0]);
            } else if (element.val.commandType === 'for') {
                forLoopContext = {next: true, arr: getValueAtPath(context, element.val.commandArgs[1]), identifier:element.val.commandArgs[0] }
            } else if (element.val.commandType === 'endBlock') {
                forLoopContext = {};
                ifContext = true;
            } else if (element.val.commandType === 'if') {
                ifContext = getValueAtPath(context, element.val.commandArgs[0])
                pIfContext = ifContext;
            } else if (element.val.commandType === 'else') {
                ifContext = !pIfContext;
            } else {
                output += element.val.text;
            }
        }
    }
    return output;
}

function getValueAtPath(data, path) {
    const elements = path.split('.');
    let v = data;
    for(let el of elements) {
        v = v[el];
    }
    return v;
}

function buildBlocks(tokens) {
    const mainBlock = {type: 'block', val: []};

    let currentBlock = mainBlock;
    for(let i = 0; i < tokens.length; i ++) {
        const token = tokens[i];
        if(['for', 'if'].includes(token.commandType)) {
            const newBlock = {type: 'block', val: [], data: {parent: currentBlock}}
            currentBlock.val.push({type: 'token', val: token});
            currentBlock.val.push(newBlock);
            currentBlock = newBlock;
        } else if(token.commandType === 'else') {
            currentBlock = currentBlock.data.parent;
            currentBlock.val.push({type: 'token', val: token});
            const newBlock = {type: 'block', val: [], data: {parent: currentBlock}}
            currentBlock.val.push(newBlock);
            currentBlock = newBlock;
        } else if(token.commandType === 'endBlock') {
            currentBlock = currentBlock.data.parent;
            currentBlock.val.push({type: 'token', val: token});
        } else {
            currentBlock.val.push({type: 'token', val: token});
        }
    }

    function removeDataFromBlocks(block) {
        return {type: block.type, val: block.type === 'block' ? block.val.map(removeDataFromBlocks) : block.val}
    } 

    return removeDataFromBlocks(mainBlock);

}

function tokenise(text) {
    const regex = /\!\(([a-z]|\.| )+\)|\!\//g;

    let m;
    const commands = [];
    do {
        m = regex.exec(text);
        if(m) commands.push({
            text: m[0],
            index: m.index,
            type: 'command',
        });
    } while (m);

    const tokens = [];
    let textRemaining = text;
    let index = 0;
    for(let i = 0; i < commands.length; i ++){
        const arr = textRemaining.split(commands[i].text);
        tokens.push({
            text: arr[0],
            index,
            type: 'text',
        });
        tokens.push(commands[i])
        index += arr[0].length + commands[i].text.length,
        arr.splice(0, 1);
        textRemaining = arr.join(commands[i].text);
    }

    tokens.push({
        text: textRemaining,
        index,
        type: 'text',
    });
    
    return commandInfo(tokens);

}

function commandInfo(tokens) {
    return tokens.map(token => token.type === 'command' ? parseCommandToken(token) : token );
}

function parseCommandToken (command) {
    const commandTypes = {
        for: /\!\(for ([\w\d])+ in ([\w.\d])+\)/g,
        endBlock: /\!\//g,
        if: /\!\(if ([\w.\d])+\)/g,
        else: /\!\(else\)/g,
        ins: /\!\(([\w.\d])+\)/g,
    }
    let commandType;
    for(let k in commandTypes) {
        if(commandTypes[k].test(command.text)){
            commandType = k;
            break;
        }
    }
    let commandArgs = [];
    const commandText = command.text.substring(2, command.text.length - 1);
    switch (commandType) {
        case 'for':
            let parts = commandText.split(' ');
            commandArgs = [parts [1], parts[3]];
            break;
    
        case 'if':
            commandArgs = [commandText.split(' ')[1]];
            break;

        case 'ins':
            commandArgs = [commandText];
            break;

        default:
            break;
    }
    return {...command, commandType, commandArgs }
}


module.exports = fastPlate;
