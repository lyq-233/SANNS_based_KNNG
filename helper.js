const fs = require('fs');

const { readFile, constants, access } = fs;


// 读取文件夹数据
async function readData(filePath) {
    let datasetStrs = [];
    let datasetNub = [];
    const dataP = new Promise((resolve, reject) => {
        access(filePath, constants.F_OK, (err) => {
            if (err) {
                reject(err);
            };
            if (!err) {
                readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    };
                    resolve(data);
                });
            }
        });
    });
    const data = await dataP;
    datasetStrs = data.split('\n');
    for (let dataStr of datasetStrs) {
        let tempArr = dataStr.split(' ');
        tempArr.shift();
        tempArr = tempArr.map((item) => {
            return Number(item);
        });
        datasetNub.push(tempArr);
    }
    return { datasetStrs, datasetNub }
}

async function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data));
}

// 向量点积
function dotProduct(a, b) {
    let res = 0;
    for (let i = 0; i < a.length; i++) {
        res += a[i] * b[i];
    }
    return res;
}

// 生成[a,b]范围内的随机整数
function randInt(a, b) {
    if (a > b) {
        throw Error('ranint error: params error');
    }
    return parseInt(Math.random() * (b - a + 1) + a);
}

// 生成包含k个[start,end]内随机数(不重复)的数组
function sampleK(start, end, k) {
    if (k > end - start + 1) {
        throw Error('sampleK error: require smaller k');
    }
    let sample = [];
    while (sample.length !== k) {
        let t = randInt(start, end);
        if (!sample.includes(t)) {
            sample.push(t);
        }
    }
    return sample;
}

// 生成k维随机向量
function generateRandomList(k) {
    let randomList = [];
    for (let i = 0; i < k; i++) {
        randomList.push(randInt(-1000, 1000));
    }
    return randomList;
}

// 一组向量加
function composeVector(vectors) {
    let res = new Array(vectors[0].length).fill(0);
    for (let i = 0; i < vectors[0].length; i++) {
        for (let j = 0; j < vectors.length; j++) {
            res[i] += vectors[j][i];
        }
    }
    return res;
}

// 数乘向量
function kDotVector(k, vector) {
    let res = [];
    for (let vi of vector) {
        res.push(k * vi);
    }
    return res;
}

//打乱数组
function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

//L2距离
function L2Distance(a, b) {
    let res = 0;
    for (let i = 0; i < a.length; i++) {
        res += (a[i] - b[i]) ** 2;
    }
    res = Math.sqrt(res);
    return res;
}

module.exports = {
    readData, writeJSON, dotProduct, generateRandomList, randInt, sampleK, composeVector, kDotVector,
    shuffle, L2Distance
};

