import React, { useEffect, useState } from 'react';
import { useService } from '@dapp-agent/sdk';
import { Descriptions, Image, Row, Col } from 'antd';
import { useParams } from 'react-router-dom';
import usePromise from 'react-use-promise';

export default function AppInfo(){

    const { appId } = useParams();
    const [info] = usePromise(() => useService('apps').info(appId), [appId]);
    
    return (
        <>
            
            <Row gutter={16} style={{margin: '16px'}}>
                <Col span={5}>
                    <Image src={info?.icon} />
                </Col>

                <Col span={13}>
                    <Descriptions title={info?.name} bordered column={1}>
                        <Descriptions.Item label="App ID">{info?.id}</Descriptions.Item>
                        <Descriptions.Item label="App Name">{info?.name}</Descriptions.Item>
                        <Descriptions.Item label="App URL">{info?.url}</Descriptions.Item>
                        {/* <Descriptions.Item label="App Description">{info?.description}</Descriptions.Item> */}
                    </Descriptions>
                </Col>
            </Row>
        </>
    )
}