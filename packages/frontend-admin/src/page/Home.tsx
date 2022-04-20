import React from 'react';
import usePromise from 'react-use-promise';
import {useService} from '@dapp-agent/sdk';
import {Avatar, Button, Card, Col, Row} from 'antd';
import {Link, Outlet} from 'react-router-dom';

export default function Home() {
    return <>
        <AppList/>
        <Outlet/>
    </>;
}

function AppList() {
    let [apps] = usePromise(() => useService('apps').list(), []);
    return <Card title={'我的应用'}>
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