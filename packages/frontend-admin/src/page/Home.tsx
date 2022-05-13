import React from 'react';
import usePromise from 'react-use-promise';
import {useService} from '@dapp-agent/sdk';
import {Avatar, Button, Card, Col, message, Row, Space} from 'antd';
import {Link, Outlet} from 'react-router-dom';
import {showInputModal, useRefreshAble} from '../util';

export default function Home() {
    return <>
        <AppList/>
        <Outlet/>
    </>;
}

export let appsR: { key: any; refresh: () => void; };

function AppList() {
    appsR = useRefreshAble();
    let [apps] = usePromise(() => useService('apps').list(), [appsR.key]);
    return <Card title={'我的应用'} extra={<Space>
        <Button onClick={showCreateModal}>新建应用</Button>,
        <Button type={'primary'} onClick={showCloneModal}>克隆应用</Button>
    </Space>}>
        <Row gutter={16}>
            {apps?.map(app =>
                <Col span={6} style={{textAlign: 'center'}} key={app.id}>
                    <AppCube id={app.id}/>
                </Col>)}
        </Row>
    </Card>;
}

function AppCube({id}: { id: string }) {
    const [info] = usePromise(() => useService('apps').info(id), [id]);

    return <Card actions={[
        <Button type={'link'} target={'_blank'} href={info?.url}>打开App</Button>,
        <Link to={'detail/' + info?.id}><Button type={'link'}>查看详情</Button></Link>,
    ]}>
        <Avatar size={64} src={info?.icon}>{info?.name}</Avatar>
        <div>{info?.name}</div>
    </Card>;
}

function showCloneModal() {
    showInputModal({
        title: 'Clone应用',
        tip: '请输入应用地址',
        async callback(value) {
            await useService('apps').clone(value);
            appsR.refresh();
        },
    });
}

function showCreateModal() {
    showInputModal({
        title: '新建应用',
        content: <>
            新建一个本地应用，以供开发<br/>
            应用开发教程: xxxx(待补充)
        </>,
        tip: '请输入新应用Id',
        async callback(value) {
            if (!value.length || !value.match(/[-a-z]+/)) {
                message.error('应用Id仅支持\'-\'和小写字母');
                throw '';
            }
            await useService('apps').create(value);
            appsR.refresh();
        },
    });
}