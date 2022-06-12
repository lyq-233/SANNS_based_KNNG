const { cloneDeep } = require('lodash');

function GFMul2(s) {
    let result = s << 1;
    let a7 = result & 0x00000100;
    if (a7 !== 0) {
        result = result & 0x000000ff;
        result = result ^ 0x1b;
    }
    return result;
}

function GFMul3(s) {
    return GFMul2(s) ^ s;
}

function GFMul4(s) {
    return GFMul2(GFMul2(s));
}

function GFMul8(s) {
    return GFMul2(GFMul4(s));
}

function GFMul9(s) {
    return GFMul8(s) ^ s;
}

function GFMul11(s) {
    return GFMul9(s) ^ GFMul2(s);
}

function GFMul12(s) {
    return GFMul8(s) ^ GFMul4(s);
}

function GFMul13(s) {
    return GFMul12(s) ^ s;
}

function GFMul14(s) {
    return GFMul12(s) ^ GFMul2(s);
}

class AES128 {
    constructor() {
        this.W = new Array(44);
    }
    // S盒
    static Sbox = [
        [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76],
        [0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0],
        [0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15],
        [0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75],
        [0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84],
        [0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf],
        [0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8],
        [0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2],
        [0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73],
        [0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb],
        [0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79],
        [0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08],
        [0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a],
        [0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e],
        [0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf],
        [0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16]
    ];
    // 逆S盒
    static revSbox = [
        [0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb],
        [0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb],
        [0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e],
        [0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25],
        [0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92],
        [0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84],
        [0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06],
        [0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b],
        [0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73],
        [0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e],
        [0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b],
        [0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4],
        [0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f],
        [0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef],
        [0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61],
        [0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d]
    ];
    // 常量轮值表 （T函数要用）
    static Rcon = [
        0x01000000, 0x02000000,
        0x04000000, 0x08000000,
        0x10000000, 0x20000000,
        0x40000000, 0x80000000,
        0x1b000000, 0x36000000
    ];
    // 矩阵乘法要用到的矩阵 
    static colM = [
        [2, 3, 1, 1],
        [1, 2, 3, 1],
        [1, 1, 2, 3],
        [3, 1, 1, 2]
    ];
    // 逆矩阵乘法要用的矩阵 
    static revColM = [
        [0xe, 0xb, 0xd, 0x9],
        [0x9, 0xe, 0xb, 0xd],
        [0xd, 0x9, 0xe, 0xb],
        [0xb, 0xd, 0x9, 0xe]
    ];

    // 查找S盒，进行替换
    getNumFromSbox(index) {
        let row = index & 0x000000f0;	 //取高四位作为行值 
        row >>= 4;
        let col = index & 0x0000000f;	 //取低四位作为列值 
        return AES128.Sbox[row][col];
    }

    // 查找逆S-盒，进行替换 
    getNumFromRevSbox(index) {
        let row = index & 0x000000f0;	 //取高四位作为行值 
        row >>= 4;
        let col = index & 0x0000000f;	 //取低四位作为列值 
        return AES128.revSbox[row][col];
    }

    // 把字符型数据转成整型
    convertCharToInt32(c) {
        let result = new Uint32Array(1);
        result[0] = c.charCodeAt(0);
        return result[0] & 0x000000ff;
    }

    // 把字符串转成4×4的数组，按从上到下，从左到右的次序依次存储
    convertStrToIntArray(str) {
        let pa = [];
        for (let i = 0; i < 4; i++) {
            pa.push(new Array(4));
        }
        let k = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                pa[j][i] = this.convertCharToInt32(str[k]);
                k++;
            }
        }
        return pa;
    }

    // 把十六进制字符串转成4×4的数组，按从上到下，从左到右的次序依次存储
    convertHexStrToIntArray(str) {
        let pa = [];
        for (let i = 0; i < 4; i++) {
            pa.push(new Array(4));
        }
        let k = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let hexNumStr = '0x' + str.substring(k, k + 2);
                pa[j][i] = Number(hexNumStr);
                k += 2;
            }
        }
        return pa;
    }

    // 把4个连续字符转成一个4字节的整型数据 
    convertDbStrToInt32(str) {
        let one = this.convertCharToInt32(str[0]);
        one = one << 24;
        let two = this.convertCharToInt32(str[1]);
        two = two << 16;
        let three = this.convertCharToInt32(str[2]);
        three = three << 8;
        let four = this.convertCharToInt32(str[3]);
        return one | two | three | four; //按位或操作 
    }

    // 把一个4字节的整型数据中的四个字节按序取出并存入一个一维整型数组 
    splitIntToArray(num) {
        let array = [];
        let one = num >> 24;
        array[0] = one & 0x000000ff;
        let two = num >> 16;
        array[1] = two & 0x000000ff;
        let three = num >> 8;
        array[2] = three & 0x000000ff;
        array[3] = num & 0x000000ff;
        return array;
    }

    // 将数组中的元素循环左移step次 
    RolOfArray(array, step) {
        let index = step % 4;
        for (let i = 0; i < index; i++) {
            let t = array.shift();
            array.push(t);
        }
    }

    // 将数组中的元素循环右移step次 
    RorOfArray(array, step) {
        let index = step % 4;
        for (let i = 0; i < index; i++) {
            let t = array.pop();
            array.unshift(t);
        }
    }

    // 把数组中的四个元素合并为一个4字节整型数据，四个元素分别作为这个整型数据的第一、二、三、四字节 ,用于密钥派生 
    mergeArrayToInt(array) {
        let one = array[0] << 24;
        let two = array[1] << 16;
        let three = array[2] << 8;
        let four = array[3];
        return one | two | three | four;
    }

    // 用于密钥派生的T函数 
    T(num, round) {
        let numArray = this.splitIntToArray(num);
        //置换 
        this.RolOfArray(numArray, 1);
        //S-盒替换 
        for (let i = 0; i < 4; i++) {
            numArray[i] = this.getNumFromSbox(numArray[i]);
        }
        //将数组合并为一个32位整型数据 
        let result = this.mergeArrayToInt(numArray);
        return result ^ AES128.Rcon[round];
    }

    // 密钥派生，根据初始密钥得出每轮运算需要的密钥（加上初始密匙总共11组，每轮消耗4个） 
    extendKey(key) {
        for (let i = 0; i < 4; i++) {
            let str = key.substring(i * 4, (i + 1) * 4);
            this.W[i] = this.convertDbStrToInt32(str);
        }

        for (let i = 4, j = 0; i < 44; i++) {
            if (i % 4 == 0) {
                this.W[i] = this.W[i - 4] ^ this.T(this.W[i - 1], j);
                j++;
            } else {
                this.W[i] = this.W[i - 4] ^ this.W[i - 1];
            }
        }
    }

    // GF上的二元运算 
    GFMul(n, s) {
        switch (n) {
            case 1: {
                return s;
            }
            case 2: {
                return GFMul2(s);
            }
            case 3: {
                return GFMul3(s);
            }
            case 0x9: {
                return GFMul9(s);
            }
            case 0xb: {
                return GFMul11(s);
            }
            case 0xd: {
                return GFMul13(s);
            }
            case 0xe: {
                return GFMul14(s);
            }
        }
    }

    // S-盒替换 
    subBytes(array) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                array[i][j] = this.getNumFromSbox(array[i][j]);
            }
        }
    }

    // 逆S-盒替换 
    revSubBytes(array) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                array[i][j] = this.getNumFromRevSbox(array[i][j]);
            }
        }
    }

    // 置换
    shiftRows(array) {
        let rowTwo = array[1];
        let rowThree = array[2];
        let rowFour = array[3];
        this.RolOfArray(rowTwo, 1);		//第二行左移1个字节 
        this.RolOfArray(rowThree, 2);	//第三行左移2个字节 
        this.RolOfArray(rowFour, 3);		//第四行左移3个字节 
    }

    // 逆置换 
    revShiftRows(array) {
        let rowTwo = array[1];
        let rowThree = array[2];
        let rowFour = array[3];
        this.RorOfArray(rowTwo, 1);		//第二行右移1个字节 
        this.RorOfArray(rowThree, 2);	//第三行右移2个字节 
        this.RorOfArray(rowFour, 3);		//第四行右移3个字节 
    }

    // 矩阵乘法
    mixColumns(array) {
        let tempArray = cloneDeep(array);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                array[i][j] = this.GFMul(AES128.colM[i][0], tempArray[0][j]) ^ this.GFMul(AES128.colM[i][1], tempArray[1][j])
                    ^ this.GFMul(AES128.colM[i][2], tempArray[2][j]) ^ this.GFMul(AES128.colM[i][3], tempArray[3][j]);
            }
        }
    }

    //逆矩阵乘法 
    revMixColumns(array) {
        let tempArray = cloneDeep(array);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                array[i][j] = this.GFMul(AES128.revColM[i][0], tempArray[0][j]) ^ this.GFMul(AES128.revColM[i][1], tempArray[1][j])
                    ^ this.GFMul(AES128.revColM[i][2], tempArray[2][j]) ^ this.GFMul(AES128.revColM[i][3], tempArray[3][j]);
            }
        }
    }

    //把两个4X4数组进行异或
    addRoundTowArray(aArray, bArray) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                aArray[i][j] = aArray[i][j] ^ bArray[i][j];
            }
        }
    }

    //将派生密钥中的一组（4个） 转成4×4数组，用于逆矩阵乘法 
    getArrayFrom4W(i) {
        let index = i * 4;
        let array = [[], [], [], []];
        let colOne = this.splitIntToArray(this.W[index]);
        let colTwo = this.splitIntToArray(this.W[index + 1]);
        let colThree = this.splitIntToArray(this.W[index + 2]);
        let colFour = this.splitIntToArray(this.W[index + 3]);

        for (let j = 0; j < 4; j++) {
            array[j][0] = colOne[j];
            array[j][1] = colTwo[j];
            array[j][2] = colThree[j];
            array[j][3] = colFour[j];
        }

        return array;
    }

    //轮密钥加 
    addRoundKey(array, round) {
        for (let i = 0; i < 4; i++) {
            let warray = this.splitIntToArray(this.W[round * 4 + i]);
            for (let j = 0; j < 4; j++) {
                array[j][i] = array[j][i] ^ warray[j];
            }
        }
    }

    // 把4×4的整型数组转回字符串 
    convertArrayToStr(array) {
        let strlist = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let c = String.fromCharCode(array[j][i]);
                strlist.push(c);
            }
        }
        return strlist.join("");
    }

    // 把4×4的整型数组转成十六进制字符串
    convertArrayToHexStr(array) {
        let strlist = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let c = array[j][i].toString(16);
                if (c.length === 1) {
                    c = '0' + c;
                }
                strlist.push(c);
            }
        }
        return strlist.join("");
    }

    // 向量V与明文/密文的异或
    xorVAndText(vArray, textArray) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                textArray[j][i] = textArray[j][i] ^ vArray[j][i];
            }
        }
    }

    // 16进制打印矩阵
    printArrayHex(array) {
        let t = cloneDeep(array);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                t[i][j] = '0x' + t[i][j].toString(16)
            }
        }
        return t;
    }

    /**
     * @method enc 加密函数
     * @param  plainText {string} 明文
     * @param key {string} 密钥
     * @param iv {string} 初始化向量
     * @return 密文
     */
    enc(plainText, key, iv) {
        let plen = plainText.length;
        if (key.length !== 16 || iv.length !== 16) {
            throw Error('param error: length of key and iv must be 16 chars!')
        }
        if (plen % 16 !== 0) {
            //最后一组填补够16字节 
            let zeronum = 16 - (plen % 16);
            for (let j = 0; j < zeronum; j++) {
                plainText = plainText + '#';
            }
        }
        let vArray = this.convertStrToIntArray(iv);
        let ciperArrays = [];
        let ciperTexts = [];
        this.extendKey(key);//密钥派生 
        // 按组加密，16个字节（128bit）为一组 
        for (let k = 0; k < plen; k += 16) {
            //将当前要加密的明文组转为二维数组 
            let pArray = this.convertStrToIntArray(plainText.substring(k, k + 16));

            //每一组在运算之前都与向量进行异或 
            if (k == 0) {
                this.xorVAndText(vArray, pArray);
            } else {
                this.xorVAndText(ciperArrays[Math.floor(k / 16) - 1], pArray);
            }

            this.addRoundKey(pArray, 0);//一开始的轮密钥加

            for (let i = 1; i < 10; i++) {
                this.subBytes(pArray);//S-盒替换 
                this.shiftRows(pArray);//置换 
                this.mixColumns(pArray);//矩阵乘法 
                this.addRoundKey(pArray, i);//轮密钥加 
            }

            //最后一轮没有MixColumns步骤 
            this.subBytes(pArray);//S-盒替换 
            this.shiftRows(pArray);//置换
            this.addRoundKey(pArray, 10);//轮密钥加 

            let cArray = cloneDeep(pArray);
            let cipertext = this.convertArrayToHexStr(cArray);

            ciperArrays.push(cArray);
            ciperTexts.push(cipertext);
        }
        return ciperTexts.join("");
    }

    /**
    * @method dec 解密函数
    * @param  cipherText {string} 密文
    * @param key {string} 密钥
    * @param iv {string} 初始化向量
    * @return 明文
    */
    dec(cipherText, key, iv) {
        let clen = cipherText.length;
        if (key.length !== 16 || iv.length !== 16) {
            throw Error('param error: length of key and iv must be 16 chars!')
        }

        let vArray = this.convertStrToIntArray(iv);
        let cipherArrays = [];
        let plainTexts = [];
        this.extendKey(key);//密钥派生 
        // 按组解密，16个字节（128bit）为一组 
        for (let k = 0; k < clen; k += 32) {
            let cArray = this.convertHexStrToIntArray(cipherText.substring(k, k + 32));
            cipherArrays.push(cloneDeep(cArray));

            this.addRoundKey(cArray, 10);

            for (let i = 9; i >= 1; i--) {
                this.revSubBytes(cArray);
                this.revShiftRows(cArray);
                this.revMixColumns(cArray);

                let wArray = this.getArrayFrom4W(i);
                this.revMixColumns(wArray);

                this.addRoundTowArray(cArray, wArray);
            }

            this.revSubBytes(cArray);
            this.revShiftRows(cArray);
            this.addRoundKey(cArray, 0);

            // 每一组解密完成都与向量进行异或得到对应明文 
            if (k == 0) {
                this.xorVAndText(vArray, cArray);
            } else {
                this.xorVAndText(cipherArrays[Math.floor(k / 32) - 1], cArray);
            }

            let pArray = cloneDeep(cArray);
            let plaintext = this.convertArrayToStr(pArray);

            plainTexts.push(plaintext);
        }

        let plainStr = plainTexts.join("");
        let plainStrList = plainStr.split("");
        while (plainStrList[plainStrList.length - 1] === '#') {
            plainStrList.pop();
        }
        return plainStrList.join("");
    }
}

module.exports = { AES128 };