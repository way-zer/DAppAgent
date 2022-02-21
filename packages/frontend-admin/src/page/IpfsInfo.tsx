import {Descriptions} from 'antd';
import React from 'react';
import 'antd/dist/antd.css';
import {useService} from '@dapp-agent/sdk';
import usePromise from 'react-use-promise';

export default function IpfsInfo() {
  const [status] = usePromise(() => useService('system').status(), []);
  return (
    <Descriptions title="System Info" bordered={true} column={{lg: 2, sm: 1, xs: 1}}>
      <Descriptions.Item label="IPFS Running">{status?.ipfs + ''}</Descriptions.Item>
      <Descriptions.Item label="OrbitDB Running">{status?.orbitDB + ''}</Descriptions.Item>
      <Descriptions.Item label="Bandwidth">
        {status?.bandwidth?.map((dataItem) => (
          <Descriptions layout="vertical" bordered column={{xs: 1, sm: 2, md: 2, lg: 4}}>
            <Descriptions.Item label="rateIn">{dataItem.rateIn}</Descriptions.Item>
            <Descriptions.Item label="rateOut">{dataItem.rateOut}</Descriptions.Item>
            <Descriptions.Item label="totalIn">{dataItem.totalIn}</Descriptions.Item>
            <Descriptions.Item label="totalOut">{dataItem.totalOut}</Descriptions.Item>
          </Descriptions>
        ))}
      </Descriptions.Item>
      <Descriptions.Item label="peers">
        {status?.peers?.map((dataItem) => (
          <div>{JSON.stringify(dataItem)}<br/></div>
        ))}</Descriptions.Item>
    </Descriptions>
  );
}
