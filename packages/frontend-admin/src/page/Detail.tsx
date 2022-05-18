import usePromise from 'react-use-promise';
import {Alert, Avatar, Button, Form, Input, InputRef, message, Modal, Popconfirm, Space} from 'antd';
import ProDescriptions from '@ant-design/pro-descriptions';
import React, {createRef, ReactNode, useState} from 'react';
import {ipfsUploadFile, ServiceReturn, useService} from '@dapp-agent/sdk';
import {useNavigate, useParams} from 'react-router-dom';
import {SelectOutlined} from '@ant-design/icons';
import {selectFile, showInputModal, showTextAreaModal, useRefreshAble} from '../util';
import {appsR} from './Home';

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

    function importKey() {
        showTextAreaModal({
            title: '请选择密钥文件',
            tip: '密钥由设置中的备份功能导出，请选择对应应用的json文件',
            async callback(value) {
                try {
                    let obj = JSON.parse(value);
                    await useService('apps').importKey(id, obj);
                    infoR.refresh();
                } catch {
                    message.error('错误的Json格式');
                    throw '';
                }
            },
        });
    }

    function doFork() {
        showInputModal({
            title: 'fork当前应用',
            content: <>
                Fork会将当前应用的程序复制成一个新的本地应用<br/>
                你将成为新应用的所有者，但不包含旧应用的任何数据<br/>
                例如，fork一个博客应用，可以新建一个自己的博客
            </>,
            tip: '请输入新应用Id',
            async callback(value) {
                if (!value.length || !value.match(/[-a-z]+/)) {
                    message.error('应用Id仅支持\'-\'和小写字母');
                    throw '';
                }
                await useService('apps').fork(value, id);
                appsR.refresh();
                back();
            },
        });
    }

    const program = info?.program;

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
            <ProDescriptions.Item label={'程序信息'} span={3}>
                <ProDescriptions bordered column={3}>
                    <ProDescriptions.Item label={'名字'} span={2}>{program?.name}</ProDescriptions.Item>
                    <ProDescriptions.Item label={'图标'} valueType={'avatar'}>{program?.icon}</ProDescriptions.Item>
                    <ProDescriptions.Item label={'作者'}>{program?.author}</ProDescriptions.Item>
                    <ProDescriptions.Item label={'CID'} span={2}>{program?.cid}</ProDescriptions.Item>
                    <ProDescriptions.Item label={'描述'} span={3}>{info?.desc}</ProDescriptions.Item>
                    <ProDescriptions.Item label={'权限'} span={3}>
                        <div>
                            <ul>{program?.permissions?.map(({node, desc, optional}) =>
                                <li key={node}>
                                    {node}: {desc}
                                    {optional && <small style={{color: 'gray'}}> 可选</small>}
                                </li>,
                            )}</ul>
                        </div>
                    </ProDescriptions.Item>
                    <ProDescriptions.Item label={'公开服务'} span={3}>
                        <div>
                            <ul>{Object.entries(program?.services || {}).map(([name, {url}]) =>
                                <li key={name}>{name}: {url}</li>,
                            )}</ul>
                        </div>
                    </ProDescriptions.Item>
                </ProDescriptions>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={'其他ID'} span={3}>
                <div>
                    <ul>{info?.publicIds?.map(it => <li key={it}>{it}</li>)}</ul>
                    {info?.recordSign ? '' : <Alert type={'warning'} description={'应用未发布，无法分享'}/>}
                </div>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={'已授予权限'} span={3}>
                <div>
                    <ul>{Object.entries(info?.localData?.permissions || {}).map(([node, info]) =>
                        <li key={node}>
                            {node}
                            <small style={{color: 'gray'}}> granted
                                on {new Date(info.time).toLocaleString()}</small>
                        </li>,
                    )}</ul>
                </div>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={'操作'} span={3}>
                <Space>
                    <Button onClick={() => useService('apps').checkUpdate(id)}>检查更新</Button>
                    {info?.modifiable ? <>
                        <EditButton info={info} refresh={infoR.refresh}>更新信息</EditButton>
                        <Button onClick={updateProgram}>更新代码</Button>
                        <Button onClick={publish}>发布应用</Button>
                    </> : <>
                        <Button onClick={importKey}>导入私钥</Button>
                    </>}
                    <Button onClick={doFork}>Fork当前应用</Button>
                    <Popconfirm title={'是否确认删除?个人所有应用删除后，密钥将不可找回.'} onConfirm={async () => {
                        await useService('apps').delete(id);
                        appsR.refresh();
                        back();
                    }}>
                        <Button danger>删除应用</Button>
                    </Popconfirm>
                </Space>
            </ProDescriptions.Item>
        </ProDescriptions>
    </Modal>;
}

function EditButton({info, children, refresh}: {
    info: ServiceReturn<'apps', 'info'>, children: ReactNode, refresh: () => void
}) {
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();

    const [icon, setIcon] = useState(info.icon);

    async function onSubmit(value: any) {
        value.icon = icon;
        console.log(value);
        await useService('apps').updateDesc(info.id, value);
        refresh();
        setVisible(false);
    }

    return <>
        <Button onClick={() => setVisible(true)}>{children}</Button>
        <Modal visible={visible}
               onOk={() => form.submit()} onCancel={() => setVisible(false)}>
            <Form form={form} onFinish={onSubmit}>
                <Form.Item name="name" label={'名字'} initialValue={info.name}>
                    <Input placeholder={info.name}></Input>
                </Form.Item>
                <Form.Item name="desc" label={'描述'} initialValue={info.desc}>
                    <Input placeholder={info.desc}></Input>
                </Form.Item>
                <Form.Item label={'图标'}>
                    <Input.Group compact>
                        <Input placeholder={info.icon}
                               value={icon} onChange={(e) => setIcon(e.target.value)}/>
                        <Button onClick={async () => {
                            const file = await selectFile('image/*');
                            const url = await ipfsUploadFile(file);
                            setIcon(url);
                        }}>选择文件</Button>
                        <span><Avatar src={icon}/></span>
                    </Input.Group>
                </Form.Item>
            </Form>
        </Modal>
    </>;
}