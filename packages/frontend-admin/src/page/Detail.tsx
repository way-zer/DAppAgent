import usePromise from 'react-use-promise';
import {Alert, Button, Input, InputRef, Modal, Popconfirm, Space} from 'antd';
import ProDescriptions from '@ant-design/pro-descriptions';
import React, {createRef} from 'react';
import {useService} from '@dapp-agent/sdk';
import {useNavigate, useParams} from 'react-router-dom';
import {SelectOutlined} from '@ant-design/icons';
import {useRefreshAble} from '../util';

export default function AppDetail() {
    let navigate = useNavigate();
    let back = () => navigate('/');

    const id: string = useParams<'id'>().id as any;
    if (!id) {
        back();
        return <></>;
    }

    const infoR = useRefreshAble();
    const [info, , state] = usePromise(() => useService('apps').info(id), [id, infoR.key]);

    function updateProgram() {
        let input = createRef<InputRef>();
        Modal.confirm({
            title: '选择程序根路径',
            content: <div>
                一般选择dist目录，包含app.json文件
                <Input ref={input} defaultValue={info?.localData.lastLocalProgramDir}/>
                <Button icon={<SelectOutlined/>} onClick={async () => {
                    let ret = await useService('system').selectDir();
                    if (ret) input.current!!.input!!.value = ret;
                }}>选择目录</Button>
            </div>,
            async onOk() {
                let value = input.current!!.input!!.value;
                await useService('apps').syncProgram(id, value);
                infoR.refresh();
            },
        });
    }

    async function publish() {
        await useService('apps').publish(id);
        infoR.refresh();
    }

    return <Modal visible width={'100%'} footer={null} onCancel={back}>
        <ProDescriptions loading={state === 'pending'} title={'App详情'}>
            <ProDescriptions.Item label={'ID'} span={3}>
                <a href={info?.url} target={'_blank'}>{info?.id}</a>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={'名字'} span={2}>{info?.name}</ProDescriptions.Item>
            <ProDescriptions.Item label={'图标'} valueType={'avatar'}>{info?.icon}</ProDescriptions.Item>
            <ProDescriptions.Item label={'所有者'} span={2}>{info?.creator}</ProDescriptions.Item>
            <ProDescriptions.Item label={'最后更新'} valueType={'dateTime'}>{info?.updated}</ProDescriptions.Item>
            <ProDescriptions.Item label={'描述'} span={3}>{info?.desc}</ProDescriptions.Item>
            <ProDescriptions.Item label={'其他ID'} span={3}>
                <div>
                    <ul>{info?.publicIds?.map(it => <li key={it}>{it}</li>)}</ul>
                    {info?.recordSign || <Alert type={'warning'} description={'应用未发布，无法分享'}/>}
                </div>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={'已授予权限'} span={3}>
                <div>
                    <ul>{Object.entries(info?.localData?.permissions || {}).map(([node, info]) =>
                        <li key={node}>
                            {node}
                            <small style={{color: 'gray'}}> granted on {new Date(info.time).toLocaleString()}</small>
                        </li>,
                    )}</ul>
                </div>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={'操作'} span={3}>
                <Space>
                    <Button onClick={() => useService('apps').checkUpdate(id)}>检查更新</Button>
                    {info?.modifiable && <>
                        <Button onClick={updateProgram}>更新代码</Button>
                        <Button onClick={publish}>发布应用</Button>
                    </>}
                    <Popconfirm title={'是否确认删除?个人所有应用删除后，密钥将不可找回.'} onConfirm={async () => {
                        await useService('apps').delete(id);
                        back();
                    }}>
                        <Button danger>删除应用</Button>
                    </Popconfirm>
                </Space>
            </ProDescriptions.Item>
        </ProDescriptions>
    </Modal>;
}