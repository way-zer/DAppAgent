export default {
    'port': 7001,
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
            //TO Fill
        ],
    },
    'sysApp': {
        'admin': 'ipfs:bafyreigydrb7qrtm4o27ighuc4b2tg6einghrn2l6uytj45lwbhya623g4',
    },
};
