const { readData, sampleK, writeJSON } = require('../helper');
const { E2LSH } = require('../e2lsh');

const sixW = '../dataset/ColorHistogram.asc';

(async function () {
    const start = new Date().getTime(); // 开始时间
    let { datasetNub: dataSet } = await readData(sixW);
    const e2LSHIns = new E2LSH();

    let indexs = sampleK(0, 60000, 100);

    let res = [[], [], []];
    for (let L = 1; L <= 50; L += 1) {
        let stime = new Date().getTime();
        const { h1RandomLists, h2RandomLists, hashFamilys, hashTables, tableSize } =
            e2LSHIns.generateHashTable(dataSet, 10, L, 0.3, 10);

        let num = 0;

        let notNull = 0;

        for (let i = 0; i < indexs.length; i++) {
            let index = indexs[i];
            q = dataSet[index];
            const searchRes =
                e2LSHIns.search(hashTables, hashFamilys, h1RandomLists, h2RandomLists, tableSize, q, 0.3);
            if (!searchRes.length) {
                continue;
            }
            notNull += 1;

            num += searchRes.length;
        }
        let etime = new Date().getTime();
        console.log('notNull', notNull, 'L', L, 'num', num / notNull, '运行时间', (etime - stime) / 1000 / notNull);
        res[0].push(L);
        res[1].push(num / notNull);
        res[2].push((etime - stime) / 1000 / notNull);
    }
    await writeJSON('./testLRes.json', res);

    const end = new Date().getTime(); // 结束时间
    console.log(`程序耗时${(end - start) / 1000} s`);
})();