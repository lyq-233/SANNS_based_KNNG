
const gaussian = require('gaussian');
const { dotProduct, generateRandomList } = require('./helper');

const gaussDistribution = gaussian(0, 1);

function TableNode(index) {
    this.index = index;
    this.buckets = new Map();
}

/**
* @class 封装了基于2-stable的LSH方法
* @description 外部通过调用generateHashTable方法得到  hashFamilys, hashTable, h1RandomList, h2RandomList，tableSize，这些参数需要传给信任的user通过search方法进行近邻查询
*/
class E2LSH {
    constructor() {
        this.c = 2 ** 32 - 5;
        this.h1 = this.h1.bind(this);
        this.h2 = this.h2.bind(this);
        this.generateHashFamily = this.generateHashFamily.bind(this);
        this.generateHashTable = this.generateHashTable.bind(this);
        this.generateHashTable = this.generateHashTable.bind(this);
        this.search = this.search.bind(this);
    }

    // 生成参数a，b，d：维度，w：宽度，a：由高斯分布生成的随机向量
    generateAB(d, w) {
        const a = gaussDistribution.random(d);
        const b = Math.random() * w;
        return { a, b };
    }

    // 生成哈希函数族,每个函数族包含k个函数
    generateHashFamily(d, k, w) {
        let hashFamily = [];
        for (let i = 0; i < k; i++) {
            hashFamily.push(this.generateAB(d, w));
        }
        return hashFamily;
    }

    // 通过哈希函数族生成一个k维的向量，之后用于定位哈希桶
    generateHashVals(hashFamily, v, w) {
        let hashVals = [];
        for (let hashFunc of hashFamily) {
            const { a, b } = hashFunc;
            const hashVal = Math.floor((dotProduct(v, a) + b) / w);
            hashVals.push(hashVal);
        }
        return hashVals;
    }

    // 定位哈希表下标
    h1(hashVals, h1RandomList, tableSize) {
        let index = Math.round(dotProduct(hashVals, h1RandomList)) % this.c % tableSize;
        if (index < 0) {
            index += tableSize;
        }
        return index;
    }

    // 获取向量(x1, x2, ..., xk)的指纹，用于定位哈希桶
    h2(hashVals, h2RandomList) {
        let fingerprint = Math.round(dotProduct(hashVals, h2RandomList)) % this.c;
        return fingerprint;
    }

    /**
    * @method 生成L个哈希表
    * @param dataSet {Array} 数据集
    * @param k {number} 每个哈希函数族包含的哈希函数个数k
    * @param L {number} 哈希函数族的个数L
    * @param w {number} 划分宽度
    * @param tableSize {number} 哈希表长度
    * @return Object
    */
    generateHashTable(dataSet, k, L, w, tableSize) {
        let hashTables = [];
        let h1RandomLists = [];
        let h2RandomLists = [];
        // hashFamilys 包含L个哈希函数族，每个函数族包含k个哈希函数
        const hashFamilys = [];
        const d = dataSet[0].length;

        for (let i = 0; i < L; i++) {
            let hashTable = [];
            for (let i = 0; i < tableSize; i++) {
                hashTable.push({});
            }
            hashTables.push(hashTable);
            const h1RandomList = generateRandomList(k);
            h1RandomLists.push(h1RandomList);
            const h2RandomList = generateRandomList(k);
            h2RandomLists.push(h2RandomList);
            // 生成哈希函数族，包含k个哈希函数
            const hashFamily = this.generateHashFamily(d, k, w);
            hashFamilys.push(hashFamily);
            // 对所有点计算指纹并放入对应的哈希桶
            for (let pointIndex in dataSet) {
                const point = dataSet[pointIndex];
                const hashVals = this.generateHashVals(hashFamily, point, w);
                const tableIndex = this.h1(hashVals, h1RandomList, tableSize);
                const fingerprint = this.h2(hashVals, h2RandomList);
                const buckets = hashTable[tableIndex];
                let targetBucket = buckets[fingerprint];
                if (!targetBucket) {
                    targetBucket = [pointIndex]
                } else {
                    targetBucket.push(pointIndex);
                }
                buckets[fingerprint] = targetBucket;
            }
        }
        return { hashFamilys, hashTables, h1RandomLists, h2RandomLists, tableSize };
    }

    /**
    * @method 近邻查询
    * @param hashTable {TableNode[]} 哈希表
    * @param hashFamilys {Array} L个哈希函数族
    * @param h1RandomList {Array} 计算哈希表下标函数要用到的随机向量
    * @param h2RandomList {Array} 计算指纹函数要用到的随机向量
    * @param tableSize {number} 哈希表长度
    * @param query {Array} 查询点
    * @param w {number} 划分宽度
    * @return Array 包含所有近邻点的下标
    */
    search(hashTables, hashFamilys, h1RandomLists, h2RandomLists, tableSize, query, w) {
        let pointsRes = [];
        let L = hashTables.length;
        for (let i = 0; i < L; i++) {
            let hashTable = hashTables[i];
            let h2RandomList = h2RandomLists[i];
            let h1RandomList = h1RandomLists[i];
            let hashFamily = hashFamilys[i];
            const qHashVals = this.generateHashVals(hashFamily, query, w);
            const qIndex = this.h1(qHashVals, h1RandomList, tableSize);
            const qFingerPrint = this.h2(qHashVals, h2RandomList);
            const buckets = hashTable[qIndex];
            // console.log('bu', buckets)
            const targetBucket = buckets[qFingerPrint];
            if (targetBucket) {
                pointsRes = [...pointsRes, ...targetBucket];
            }
        }
        return [...new Set(pointsRes)];
    }
}

module.exports = { E2LSH };