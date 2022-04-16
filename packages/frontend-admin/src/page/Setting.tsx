import React from 'react';
import {Card, Descriptions} from 'antd';
import usePromise from 'react-use-promise';
import {useService} from '@dapp-agent/sdk';
import DescriptionsItem from 'antd/es/descriptions/Item';

export default function Setting() {
    return <>
        <Status/>
    </>;
}

function Status() {
    let [status] = usePromise(() => useService('system').status(), []);
    return <Card title={'系统状态'}>
        <Descriptions bordered column={2}>
            <DescriptionsItem label={'IPFS状态'}>{status?.ipfs ? '运行中' : '未启动'}</DescriptionsItem>
            <DescriptionsItem label={'OrbitDB状态'}>{status?.orbitDB ? '运行中' : '未启动'}</DescriptionsItem>
            <DescriptionsItem label={'已连接Peer'} span={2}>
                {status?.peers?.map(peer => <>
                    <span>{peer.addr}</span><br/>
                </>)}
            </DescriptionsItem>
        </Descriptions>
    </Card>;
}