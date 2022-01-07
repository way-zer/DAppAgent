import React from 'react';
import {Divider, message, Popconfirm as PopConfirm, Table} from 'antd';
import {useService} from 'sdk';
import usePromise from 'react-use-promise';

const apps = useService('apps');

export default function AppInfo() {
  const [data] = usePromise(() => apps.listPrivate().then(data =>
    Object.entries(data).map(([name, value]) => ({name, ...value})),
  ), []);

  return (
    <div>
      <Table rowKey={record => record.name} dataSource={data} loading={data === undefined} columns={[
        {
          title: 'name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'cid',
          dataIndex: 'cid',
          key: 'cid',
        },
        {
          title: 'prod',
          dataIndex: 'prod',
          key: 'prod',
        },
        {
          title: 'action',
          key: 'action',
          render: (_, record) => (
            <>
              <a href={record.url} target="_blank">Open</a>
              <Divider type={'vertical'}/>
              <PopConfirm title="Sure to publish?" onConfirm={async () => {
                await apps.publish(record.name);
                await message.success('发布成功');
              }}>
                <a>Publish</a>
              </PopConfirm>
            </>
          ),
        },
      ]}/>
    </div>
  );
}
