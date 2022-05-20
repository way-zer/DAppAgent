export default {
    'port': 0,//random port
    'homeUrl': 'https://admin.sys.dapp',
    'app': {
        'updateInterval': 3600,
        'integrate': {
            'publicKey': 'CAESIKKbtJ7RkGQ9XDwTk68mQO/+EU1aiUw4cym25rPKDpYR',
            'privateKey': null,
            'oAuth': {
                'id': 'github',//用于硬更换OAuth时，进行区分
                'authUrl': 'https://hub.fastgit.xyz/login/oauth/authorize?client_id=62ccdb4997af5ee104e7&scoop=',
                'verifyUrl': null,
            },
        },
    },
    'ipfs': {
        'bootstrap': [
            //暂时在主网测试
            '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
        ],
    },
    'sysApp': {
        'admin': 'ipfs:bafyreigydrb7qrtm4o27ighuc4b2tg6einghrn2l6uytj45lwbhya623g4',
    },
};
