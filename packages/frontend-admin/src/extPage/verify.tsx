import usePromise from 'react-use-promise';
import React, {useEffect, useMemo, useState} from 'react';
import {useService, ServiceReturn} from '@dapp-agent/sdk';
import {Button, Card, Col, Divider, message, Modal, Row} from 'antd';
import {Simulate} from 'react-dom/test-utils';


const msgTag = 'OAuthResult';

interface Msg {
    type: typeof msgTag,
    body: string
}

export function OAuthVerify() {
    let params = new URLSearchParams(location.search);
    if (opener && (params.has('code') || params.has('error'))) {
        opener!!.postMessage({type: msgTag, body: location.search}, location.origin);
        close();
    }
    let id = params.get('id');
    if (!id || !id.length) return <>BAD Request</>;
    let [txs] = usePromise(() => useService('call').pullTransaction(id!!), [id]);

    return (txs && txs[0]) ? <Impl tx={txs[0]}/> : <>NOT FOUND Transaction</>;
}


function Impl({tx}: { tx: ServiceReturn<'call', 'pullTransaction'>[0] }) {
    const [result, setResult] = useState<URLSearchParams | null>(null);

    function Waiting() {
        useEffect(() => {
            let interval = setInterval(async () => {
                await useService('call').heartbeat(tx.id, tx.token);
            }, 2000);
            return () => clearInterval(interval);
        }, [tx.id]);

        const payload = tx.payload as {
            url: string
        };
        const url = `${payload.url}&redirect_uri=${encodeURI(location.href)}`;
        useEffect(() => {
            let timeout = setTimeout(() => {
                open(url, '_blank');
            }, 3000);

            async function onMessage(e: MessageEvent<Msg>) {
                if (e.data.type != msgTag) return;
                let params = new URLSearchParams(e.data.body);
                if (!result)
                    setResult(params);
            }

            addEventListener('message', onMessage);
            return () => {
                clearTimeout(timeout);
                removeEventListener('message', onMessage);
            };
        }, [tx.id]);

        return <Row justify={'center'}>
            <Col>
                <h2>程序需要登录以继续使用</h2>
                请在新窗口中完成登录<br/>
                请勿关闭本窗口
            </Col>
        </Row>;
    }

    //get result

    useEffect(() => {
        if (!result) return;
        setTimeout(async () => {
            //after result
            if (result.has('code')) {
                await useService('call').respond(tx.id, tx.token, {code: result.get('code')});
                window.close();
            } else if (result.has('error')) {
                await useService('call').respond(tx.id, tx.token, {error: result.get('error')});
                Modal.error({
                    title: 'OAuth登录失败',
                    content: <>
                        <b>{result.get('error_description')}</b><br/>
                        May See <a>{result.get('error_uri')}</a>
                    </>,
                });
            }
        });
    }, [result]);

    if (!result) return <Waiting/>;
    return <>请关闭该窗口
        <pre>{JSON.stringify(result)}</pre>
    </>;
}