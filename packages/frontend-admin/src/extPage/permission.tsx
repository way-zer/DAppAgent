import {Services, useService} from '@dapp-agent/sdk';
import React, {useEffect, useMemo} from 'react';
import usePromise from 'react-use-promise';
import {Button, Card, Checkbox, Col, Divider, Row} from 'antd';
import Meta from 'antd/es/card/Meta';

interface Permission {
    node: string,
    desc: string,
    optional: boolean,
}

export function PermissionRequest() {
    let id = new URLSearchParams(location.search).get('id');
    if (!id || !id.length) return <>BAD Request</>;
    let [txs] = usePromise(() => useService('call').pullTransaction(id!!), [id]);

    return (txs && txs[0]) ? <Impl tx={txs[0]}/> : <>NOT FOUND Transaction</>;
}

function Impl({tx}: { tx: Awaited<ReturnType<Services['call']['pullTransaction']>>[0] }) {
    useEffect(() => {
        let interval = setInterval(async () => {
            await useService('call').heartbeat(tx.id, tx.token);
        }, 2000);
        return () => clearInterval(interval);
    }, [tx.id]);

    let [appInfo] = usePromise(() => useService('apps').info(tx.from), [tx.from]);
    let permissions = tx.payload['permissions'] as Permission[];
    let checkState = useMemo(() => new Map<string, boolean>(), []);
    useEffect(() => {
        checkState.clear();
        permissions.forEach(it => checkState.set(it.node, true));
    }, [permissions]);

    async function choose(grant: boolean) {
        if (grant) {
            let granted = permissions.map(it => it.node).filter(it => checkState.get(it));
            console.log(granted);
            await useService('apps').grantPermission(tx.from, granted);
        }
        await useService('call').respond(tx.id, tx.token, {granted: grant});
        close();
    }

    return <Row justify={'center'}>
        <Col>
            <Card title={'权限请求'}>
                <Meta title={
                    <span>
                        {appInfo?.name}<br/>
                        <small style={{color: 'gray'}}>{appInfo?.id}</small>
                    </span>
                } description={appInfo?.desc} avatar={appInfo?.icon}/>
                <Divider/>
                授权后，该应用将获得如下权限<br/>
                {permissions.map(permission => <Row gutter={8} key={permission.node}>
                    <Col>
                        <Checkbox checked={checkState.get(permission.node)} disabled={!permission.optional}
                                  onChange={e => checkState.set(permission.node, e.target.checked)}/>
                    </Col>
                    <Col>
                        <b>{permission.node}</b><br/>
                        {permission.desc}
                    </Col>
                </Row>)}
                <Row justify={'center'} gutter={16}>
                    <Col>
                        <Button onClick={() => choose(true)}>同意</Button>
                    </Col>
                    <Col>
                        <Button onClick={() => choose(false)}>拒绝</Button>
                    </Col>
                </Row>
            </Card>
        </Col>
    </Row>;
}