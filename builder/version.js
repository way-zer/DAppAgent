const num = process.env.RUN_NUM || '0-dev';
const date = new Date();

const year = (date.getFullYear() - 2000);
const month = (date.getUTCMonth() + 1);
const version = `${year}.${month}.${num}`;
console.log('::set-output name=build-version::' + version);

module.exports = version;