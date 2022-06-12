const { readData, writeJSON, L2Distance } = require('../helper');
const { KnngConstruction } = require('../knng');
const { E2LSH } = require('../e2lsh');
const { AES128 } = require('../aes');
const { key, iv } = require('../clientData/encKeyAndIV')
const { G } = require('../cloud/knng1w.json')

const oneW = '../dataset/10000.asc';
const fiveB = '../dataset/500.asc';


(async function () {
    const start = new Date().getTime(); // 开始时间

    let { datasetNub: dataSet } = await readData(fiveB);

    // KNNG构建
    const G = KnngConstruction(dataSet, 50, 32);
    for (let g of G) {
        g.sort((a, b) => a - b);
    }
    writeJSON('../cloud/knng5b.json', { G });
    console.log('近邻图构造完成--');

    // 加密数据
    const aes = new AES128();
    let encData = {};
    for (let i = 0; i < dataSet.length; i++) {
        let cipher = aes.enc(JSON.stringify(dataSet[i]), key, iv);
        encData[i] = cipher;
    }
    writeJSON('../cloud/encData5b.json', encData);
    console.log('加密完成--');

    // 哈希表构建
    const e2LSHIns = new E2LSH();
    const { h1RandomLists, h2RandomLists, hashFamilys, hashTables, tableSize } =
        e2LSHIns.generateHashTable(dataSet, 10, 30, 0.3, 10);
    writeJSON('../clientData/hashParams5b.json',
        { h1RandomLists, h2RandomLists, hashFamilys, hashTables, tableSize });
    console.log('哈希表构建完成--');

    const end = new Date().getTime(); // 结束时间
    console.log(`程序耗时${(end - start) / 1000}s`);
})();