const { isEqual } = require('lodash');
const { randInt, sampleK, composeVector, dotProduct, kDotVector, shuffle, L2Distance } = require('./helper');
/**
 * @function boostKMeans 供TwoMeans调用
 * @param dataSet {Array} 数据集
 * @param k {number} 要生成的聚类个数
 * @return cLabel划分好的k个簇
 */
function boostKMeans(dataSet, k) {
    const n = dataSet.length;
    let cLabel = new Array(n);
    let SMap = new Map();

    for (let i = 0; i < n; i++) {
        const randomLabel = randInt(0, k - 1);
        cLabel[i] = randomLabel;

        const cLabelI = SMap.get(randomLabel);
        if (cLabelI === undefined) {
            SMap.set(randomLabel, [dataSet[i]]);
        } else {
            SMap.set(randomLabel, [...cLabelI, dataSet[i]]);
        }
    }
    let itertime = 0;
    while (true) {
        itertime++;
        const oldCLabel = cLabel.slice();
        let randomOrder = [...new Array(n).keys()];
        shuffle(randomOrder);
        for (let index of randomOrder) {
            let xi = dataSet[index];
            const u = cLabel[index];
            const vectorsU = SMap.get(u);
            const Du = composeVector(vectorsU);
            const nu = vectorsU.length;
            let maxDeltaI1 = -Infinity;
            let maxDeltaI1SIndex;
            for (let v = 0; v < k; v++) {
                if (v !== u) {
                    const vectorsV = SMap.get(v);
                    const Dv = composeVector(vectorsV);
                    const nv = vectorsV.length;
                    const DvPlusXi = composeVector([Dv, xi]);
                    const DuSubxi = composeVector([Du, kDotVector(-1, xi)]);
                    const deltaI1 = dotProduct(DvPlusXi, DvPlusXi) / (nv + 1) + dotProduct(DuSubxi, DuSubxi) / (nu - 1) - dotProduct(Dv, Dv) / nv - dotProduct(Du, Du) / nu;

                    if (deltaI1 > maxDeltaI1) {
                        maxDeltaI1 = deltaI1;
                        maxDeltaI1SIndex = v;
                    }
                }
            }
            if (maxDeltaI1 > 0) {
                const newArr = SMap.get(cLabel[index]).filter(e => {
                    return e !== dataSet[index];
                })
                SMap.set(cLabel[index], newArr);

                cLabel[index] = maxDeltaI1SIndex;
                const newArr1 = SMap.get(maxDeltaI1SIndex);
                SMap.set(maxDeltaI1SIndex, [...newArr1, dataSet[index]]);
            }
        }

        if (isEqual(oldCLabel, cLabel) || itertime > 100) {
            break;
        }
    }
    return cLabel;
}

/**
 * @function TwoMeans 生成k个聚类,调用boost k-means实现
 * @param dataSet {Array} 数据集
 * @param k {number} 要生成的聚类个数
 * @return cLabel划分好的k个簇
 */
function TwoMeans(dataSet, k) {
    let t = 1;
    const n = dataSet.length;
    let cLabel = new Array(n).fill(0);

    while (t < k) {
        // console.log(`twomeans第${t}轮`);
        let S = [];
        for (let i = 0; i < k; i++) {
            S.push([]);
        }
        let sSize = new Array(k).fill(0)
        for (let i = 0; i < n; i++) {
            S[cLabel[i]].push(dataSet[i]);
            sSize[cLabel[i]] += 1;
        }
        let maxSIndex = sSize.indexOf(Math.max(...sSize));
        let newClabel = boostKMeans(S[maxSIndex], 2);

        let j = 0;
        for (let i = 0; i < n; i++) {
            if (cLabel[i] === maxSIndex) {
                if (newClabel[j] === 1) {
                    cLabel[i] = maxSIndex + 1;
                } else {
                    cLabel[i] = 0;
                }
                j += 1;
            } else {
                cLabel[i] += 1;
            }
        }
        t += 1
    }
    return cLabel;
}

/**
 * @function GKMeans 与knng构造过程相互促进
 * @param dataSet {Array} 数据集
 * @param k {number} 要生成的聚的个数
 * @param G {Array} 近邻图
 * @return cLabel划分好的k个簇
 */
function GKMeans(dataSet, k, G) {
    let cLabel = TwoMeans(dataSet, k);
    let Q = [];
    const n = dataSet.length;
    let itertime = 0;
    while (true) {
        itertime++;
        // console.log(`GKMeans进行至第${itertime}轮`)
        let oldClabel = cLabel.slice();
        let clusters = [];
        for (let i = 0; i < k; i++) {
            clusters.push([]);
        }
        for (let i = 0; i < n; i++) {
            let index = cLabel[i];
            clusters[index].push(dataSet[i]);
        }
        for (let i = 0; i < n; i++) {
            let xi = dataSet[i];
            const u = cLabel[i];
            const vectorsU = clusters[u];
            const Du = composeVector(vectorsU);
            const nu = vectorsU.length;
            if (nu === 1 || nu === 0) {
                continue;
            }

            for (let j = 0; j < G[0].length; j++) {
                let b = G[i][j];
                Q.push(cLabel[b]);
            }
            Q = [...new Set(Q)];

            let maxDeltaI1 = -Infinity;
            let maxDeltaI1SIndex;
            for (let v of Q) {
                if (v !== u) {
                    const vectorsV = clusters[v];
                    const Dv = composeVector(vectorsV);
                    const nv = vectorsV.length;
                    if (nv == 0) {
                        continue;
                    }
                    const DvPlusXi = composeVector([Dv, xi]);
                    const DuSubxi = composeVector([Du, kDotVector(-1, xi)]);
                    const deltaI1 = dotProduct(DvPlusXi, DvPlusXi) / (nv + 1) + dotProduct(DuSubxi, DuSubxi) / (nu - 1) - dotProduct(Dv, Dv) / nv - dotProduct(Du, Du) / nu;

                    if (deltaI1 > maxDeltaI1) {
                        maxDeltaI1 = deltaI1;
                        maxDeltaI1SIndex = v;
                    }
                }
            }
            if (maxDeltaI1 > 0) {
                cLabel[i] = maxDeltaI1SIndex;
            }
            Q = [];
        }
        if (isEqual(oldClabel, cLabel) || itertime > 100) {
            break;
        }
    }
    return cLabel;
}

/**
 * @function updateG 更新近邻图
 * @param dataSet {Array} 数据集
 * @param G {Array} 近邻图
 * @param i {Number} 更新第i个点的近邻
 * @param j {Number} 同 i
 * @return 更新后的近邻图G
 */
function updateG(dataSet, G, i, j) {
    let k = G[0].length;
    let l2dist = L2Distance(dataSet[i], dataSet[j]);
    let GWithDistI = [];
    let GWithDistJ = [];
    for (let p = 0; p < k; p++) {
        GWithDistI.push(L2Distance(dataSet[i], dataSet[G[i][p]]));
        GWithDistJ.push(L2Distance(dataSet[j], dataSet[G[j][p]]));
    }
    let maxI = Math.max(...GWithDistI)
    let maxIindex = GWithDistI.indexOf(maxI)
    let maxJ = Math.max(...GWithDistJ)
    let maxJindex = GWithDistJ.indexOf(maxJ)
    if (l2dist < maxI && !G[i].includes(j)) {
        G[i][maxIindex] = j;

    }
    if (l2dist < maxJ && !G[i].includes(i)) {
        G[j][maxJindex] = i;
    }
    return G
}

/**
 * @function  KnngConstruction 构造k-近邻图，与GK-means相互促进
 * @param dataSet {Array} 数据集
 * @param k {Number} 近邻数量
 * @param T {Number} 迭代次数
 * @return 近邻图G
 */
function KnngConstruction(dataSet, k = 50, T = 32) {
    let t = 0;
    const clusterSize = 50;
    const n = dataSet.length;
    let k0 = Math.floor(n / clusterSize);
    let G = [];
    for (let i = 0; i < n; i++) {
        let randomList = sampleK(0, n - 1, k);
        G.push(randomList);
    }
    while (t < T) {
        console.log(`正在进行第${t + 1}轮knng构造`);
        let cLabel = GKMeans(dataSet, k0, G);
        let clusters = [];
        for (let i = 0; i < k0; i++) {
            clusters.push([]);
        }
        for (let i = 0; i < n; i++) {
            let index = cLabel[i];
            clusters[index].push(i);
        }
        for (let cluster of clusters) {
            for (let i = 0; i < cluster.length; i++) {
                for (let j = i; j < cluster.length; j++) {
                    G = updateG(dataSet, G, cluster[i], cluster[j]);
                }
            }
        }
        t += 1;
    }
    return G;
}

module.exports = { KnngConstruction };