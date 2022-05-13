import React from 'react';
import {Button, Card, Descriptions, message, Space, Spin} from 'antd';
import usePromise from 'react-use-promise';
import {useService} from '@dapp-agent/sdk';
import DescriptionsItem from 'antd/es/descriptions/Item';
import {showTextAreaModal} from '../util';

export default function Setting() {
    return <>
        <Status/>
        <Actions/>
    </>;
}

function Status() {
    let [status, , state] = usePromise(() => useService('system').status(), []);
    return <Card title={'系统状态'}>
        <Spin spinning={state === 'pending'}>
            <Descriptions bordered column={2}>
                <DescriptionsItem label={'IPFS状态'}>{status?.ipfs ? '运行中' : '未启动'}</DescriptionsItem>
                <DescriptionsItem label={'OrbitDB状态'}>{status?.orbitDB ? '运行中' : '未启动'}</DescriptionsItem>
                <DescriptionsItem label={'节点ID'} span={2}>
                    {status?.id?.id}
                </DescriptionsItem>
                <DescriptionsItem label={'本地IP'} span={2}>
                    {status?.id?.addresses?.map(peer => <>
                        <span key={peer}>{peer}</span><br/>
                    </>)}
                </DescriptionsItem>
                <DescriptionsItem label={'已连接Peer'} span={2}>
                    {status?.peers?.map(peer => <>
                        <span key={peer.addr}>{peer.addr}</span><br/>
                    </>)}
                </DescriptionsItem>
            </Descriptions>
        </Spin>
    </Card>;
}

function Actions() {
    return <Card title={'备份还原'}>
        <Space>
            <Button type={'primary'} onClick={async () => {
                let result = await useService('system', {responseType: 'blob'}).exportKeys();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([result]));
                a.download = 'DappAgent-keys.zip';
                a.click();
                URL.revokeObjectURL(a.href);
            }}>导出所有密钥</Button>
            <Button onClick={importSystemKey}>导入系统密钥</Button><small>(应用密钥请到应用详情页)</small>
        </Space>
    </Card>;
}

async function importSystemKey() {
    showTextAreaModal({
        title: '请选择密钥文件',
        content: <>
            系统密钥(也叫身份密钥)文件名叫'id.json'<br/>
            警告: 导入新系统密钥会导致当前密钥被覆盖<br/>
            建议在导入前，先备份系统密钥
        </>,
        async callback(value) {
            try {
                let obj = JSON.parse(value);
                await useService('system').importPeerKey(obj);
            } catch {
                message.error('错误的Json格式');
                throw '';
            }
        },
    });
}