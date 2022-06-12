const { readData, L2Distance, sampleK } = require('../helper');
const encData = require('../cloud/encData');
const { G } = require('../cloud/knng1w.json')
const { E2LSH } = require('../e2lsh');
const { AES128 } = require('../aes');
const { key, iv } = require('../clientData/encKeyAndIV');
const { cloneDeep, isEqual } = require('lodash');

const oneW = '../dataset/10000.asc';
const sixW = '../dataset/ColorHistogram.asc';

(async function () {
    const start = new Date().getTime(); // 开始时间
    let { datasetNub: dataSet } = await readData(oneW);
    let { datasetNub: query } = await readData(sixW);
    const aes = new AES128();

    const e2LSHIns = new E2LSH();

    const { h1RandomLists, h2RandomLists, hashFamilys, hashTables, tableSize } =
        e2LSHIns.generateHashTable(dataSet, 10, 30, 0.2, 10);

    let res = 0;

    q = query[sampleK(10001, 60000, 1)[0]];

    // client:计算同一哈希桶内的点
    const searchRes =
        e2LSHIns.search(hashTables, hashFamilys, h1RandomLists, h2RandomLists, tableSize, q, 0.2);

    // cloud:查询并返回相应的候选集
    let responseEncDatas = [];
    let responsePointIndexs = [];
    for (let i of searchRes) {
        responsePointIndexs.push(...G[i]);
    }
    responsePointIndexs = [...new Set(responsePointIndexs)];
    console.log('length', responsePointIndexs.length);
    for (let index of responsePointIndexs) {
        responseEncDatas.push({ index, data: encData[index] });
    }

    let realDists = [];
    for (let i = 0; i < dataSet.length; i++) {
        let d = L2Distance(q, dataSet[i]);
        realDists.push({ index: i, dist: d });
    }
    realDists.sort((a, b) => a.dist - b.dist)
    let dists = [];
    let count = 0;

    let qIndex;

    while (true) {
        let oldDists = cloneDeep(dists);
        if (count !== 0) {
            responseEncDatas = [];
            for (let index of G[qIndex]) {
                responseEncDatas.push({ index, data: encData[index] });
            }
        }
        // client:解密候选集并计算最近邻
        let plainDatas = [];
        for (let responseEncData of responseEncDatas) {
            let plain = aes.dec(responseEncData.data, key, iv);
            let index = responseEncData.index;

            plainDatas.push({ index, plain: JSON.parse(plain) });

        }

        for (let plainData of plainDatas) {
            let flg = false;
            for (let item of dists) {
                if (item.index === plainData.index) {
                    flg = true;
                    break;
                }
            }
            if (!flg) {
                let dist = L2Distance(q, plainData.plain);
                dists.push({ dist, index: plainData.index, visited: false });
            }
        }

        dists.sort((a, b) => a.dist - b.dist);
        if (dists.length > 50) {
            dists.splice(50);
        }


        let sum = 0;
        let n = dists.length;
        for (let i = 0; i < n; i++) {
            if (realDists[i].dist === 0) {
                continue;
            }
            sum = sum + dists[i].dist / realDists[i].dist;
        }
        res = sum / n;
        for (let i = 0; i < dists.length; i++) {
            if (!dists[i].visited) {
                qIndex = i;
                dists[i].visited = true;
                break;
            }
        }
        count++;
        console.log(res);

        if (isEqual(oldDists, dists)) {
            break;
        }
    }

    const end = new Date().getTime(); // 结束时间
    console.log(`程序耗时${(end - start) / 1000} s`);
})();