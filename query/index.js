const { readData, L2Distance, sampleK } = require('../helper');
const encData = require('../cloud/encData');
const { G } = require('../cloud/knng1w.json')
const { E2LSH } = require('../e2lsh');
const { AES128 } = require('../aes');
const { key, iv } = require('../clientData/encKeyAndIV');
const { hashTables, hashFamilys, h1RandomLists, h2RandomLists, tableSize } = require('../clientData/hashParams.json');

const oneW = '../dataset/10000.asc';
const sixW = '../dataset/ColorHistogram.asc';

(async function () {
    const start = new Date().getTime(); // 开始时间
    let { datasetNub: dataSet } = await readData(oneW);
    let { datasetNub: querys } = await readData(sixW);
    const aes = new AES128();

    // 哈希表构建
    const e2LSHIns = new E2LSH();

    let qIndex = sampleK(10001, 60000, 1)[0];
    q = querys[qIndex];

    // client:计算同一哈希桶内的点
    const searchRes =
        e2LSHIns.search(hashTables, hashFamilys, h1RandomLists, h2RandomLists, tableSize, q, 0.3);

    console.log('查询点q:', qIndex, ':', q, `与查询点q处于同一哈希桶的点有：${searchRes.length}个`);

    // cloud:查询并返回相应的候选集
    let responseEncDatas = [];
    let responsePointIndexs = [];
    for (let i of searchRes) {
        responsePointIndexs.push(...G[i]);
    }
    // 过滤重复点
    responsePointIndexs = [...new Set(responsePointIndexs)];
    for (let index of responsePointIndexs) {
        responseEncDatas.push({ index, data: encData[index] });
    }

    // client:解密候选集并计算最近邻
    let plainDatas = [];
    for (let responseEncData of responseEncDatas) {
        let plain = aes.dec(responseEncData.data, key, iv);
        let index = responseEncData.index;
        plainDatas.push({ index, plain: JSON.parse(plain) });
    }
    console.log('client收到的近邻点个数:', plainDatas.length)

    let dists = [];
    for (let plainData of plainDatas) {
        let dist = L2Distance(q, plainData.plain);
        dists.push({ dist, index: plainData.index });
    }

    dists.sort((a, b) => a.dist - b.dist);

    console.log('查询到的最近邻:', dists[0].index, `与查询点q的L2距离为${dists[0].dist}`);
    // console.log('所有近邻点与查询点的L2距离:', dists)

    let realDists = [];
    for (let i = 0; i < dataSet.length; i++) {
        let d = L2Distance(q, dataSet[i]);
        realDists.push({ index: i, dist: d });
    }
    realDists.sort((a, b) => a.dist - b.dist)
    console.log('真实的最近邻:', realDists[0].index, `与查询点q的L2距离为${realDists[0].dist}`);
    console.log('结果距离与真实距离比值为:', dists[0].dist / realDists[0].dist);

    const end = new Date().getTime(); // 结束时间
    console.log(`程序耗时${(end - start) / 1000} s`);
})();