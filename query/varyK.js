const { readData, L2Distance, sampleK, writeJSON } = require('../helper');
const encData = require('../cloud/encData');
const { G } = require('../cloud/knng1w.json')
const { E2LSH } = require('../e2lsh');
const { AES128 } = require('../aes');
const { key, iv } = require('../clientData/encKeyAndIV');

const oneW = '../dataset/10000.asc';
const sixW = '../dataset/ColorHistogram.asc';

(async function () {
    const start = new Date().getTime(); // 开始时间
    let { datasetNub: dataSet } = await readData(oneW);
    let { datasetNub: querys } = await readData(sixW);
    const aes = new AES128();

    // 哈希表构建
    const e2LSHIns = new E2LSH();

    let res = [[], [], [], []];
    // 测试不同哈希函数个数下的结果，固定桶宽0.3
    for (let K = 20; K > 5; K -= 1) {
        let stime = new Date().getTime();
        const { h1RandomLists, h2RandomLists, hashFamilys, hashTables, tableSize } =
            e2LSHIns.generateHashTable(dataSet, K, 30, 0.3, 10);

        let accur = 0;
        let candiNum = 0;
        // 随机从10001 - 60000中选择100个样本点作为查询点进行试验
        let indexs = sampleK(10001, 60000, 100);
        let notNull = 0;

        for (let i = 0; i < indexs.length; i++) {
            let index = indexs[i];
            q = querys[index];
            // client:计算同一哈希桶内的点
            const searchRes =
                e2LSHIns.search(hashTables, hashFamilys, h1RandomLists, h2RandomLists, tableSize, q, 0.3);
            if (!searchRes.length) {
                continue;
            }
            notNull += 1;

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

            let dists = [];
            for (let plainData of plainDatas) {
                let dist = L2Distance(q, plainData.plain);
                dists.push({ dist, index: plainData.index });
            }

            dists.sort((a, b) => a.dist - b.dist);


            let realDists = [];
            for (let i = 0; i < dataSet.length; i++) {
                let d = L2Distance(q, dataSet[i]);
                realDists.push({ index: i, dist: d });
            }
            realDists.sort((a, b) => a.dist - b.dist)
            let sum = 0;
            let n = 50;
            for (let i = 0; i < n; i++) {
                if (realDists[i].dist === 0) {
                    continue;
                }
                sum = sum + dists[i].dist / realDists[i].dist;
            }
            avr = sum / n;
            accur += avr;
            candiNum += plainDatas.length;
        }
        let etime = new Date().getTime();
        console.log('notNull', notNull, 'k', K, '精确度', accur / notNull, '候选集数量', candiNum / notNull, '运行时间', (etime - stime) / 1000 / notNull);
        res[0].push(K);
        res[1].push(accur / notNull);
        res[2].push(candiNum / notNull);
        res[3].push((etime - stime) / 1000 / notNull);
    }
    await writeJSON('./varyKRes.json', res);

    const end = new Date().getTime(); // 结束时间
    console.log(`程序耗时${(end - start) / 1000} s`);
})();