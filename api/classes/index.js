const base = require('./base');
const auth = require('./auth');
const project = require('./project');

let classes = {
    ...base,
    ...auth,
    ...project
}

module.exports = Object.entries(classes).reduce((memo, item) => {
    memo[item[0].toLowerCase()] = item[1];
    
    return memo;
}, {});