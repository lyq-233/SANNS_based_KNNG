# SANNS based on KNNG
  此代码是基于近邻图的安全最近邻查询方法的一种实现，采用近邻图对数据集进行划分，局部敏感哈希算法对候选集进行定位，同时使用CBC模式的AES-128算法进行加解密。

## 启动方式
  1. 在项目根目录下使用npm install 或者 yarn命令下载依赖，本项目主要用到gaussian库生成符合高斯分布的随机变量
  2. 如果要进行近邻查询，先进入dataowner目录运行 npm start 命令或者直接运行目录下的index.js脚本文件，进行预处理，（包括加解密、近邻图构造以及哈希表构造)，然后进入query目录下运行npm start 命令或者直接运行目录下的index.js脚本文件
  3. 关于query目录下其他文件的详细说明见目录结构
  
## 目录结构

```
    ├─clientData          // 存放客户端与数据拥有者共享的密钥以及哈希表等参数
    ├─cloud               // 云端，存放knn图以及加密后的数据
    ├─dataowner           // 数据拥有者预处理，包括加密、近邻图构造、哈希表构造
    ├─dataset             // 用到的数据集
    ├─draw-matlab         // matlab脚本，用于绘图
    └─query               // 客户端
        |-index.js        // 客户端进行查询
        |-scheme2.js      // 多次与云端交互的方案
        |-varyK.js        // 固定W，改变K得到的实验数据，实验数据放在json文件里
        |-varyKRes.json
        |-varyW.js        // 固定K，改变W得到实验数据，实验数据放在json文件里
        |-varyWRes.json
    |-aes.js              // AES-128加解密算法
    │-e2lsh.js            // p-stable局部敏感哈希
    │-helper.js           // 定义一些工具函数
    │-knng.js             // knn图构建
```