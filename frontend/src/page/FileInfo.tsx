import { CaretDownOutlined, DownCircleTwoTone, HomeOutlined } from "@ant-design/icons";
import { createDirectory, deleteFile, fileInfo, copyFile } from "@api/file";
import { Input, Button, message, Modal, Table, Space, Dropdown, Menu, Breadcrumb, Row, Col, Divider } from "antd";
import React, { useEffect, useState } from "react"
import FileUpload from "./FileUpload";

function FileInfo() {
    const [refresh, setRefresh] = useState<boolean>(false);
    const [path, setPath] = useState<string>('/');
    const [data, setData] = useState<any>();
    useEffect(() => {
        fileInfo(path).then(res => setData(res));
        console.log("set");
    }, [path, refresh]);

    const Refresh = () => {
        setRefresh(!refresh);
    }

    const ActionMenu = (record: any) => {
        if (record.type === 'directory')
            return (
                <Menu>
                    <Menu.Item key='openDirectory' onClick={() => { setPath(path + record.name + '/') }}>
                        打开文件夹
                    </Menu.Item>
                    <Menu.Item key='deleteDirectory' onClick={() => { deleteFile(path + record.name + '/'); Refresh(); }}>
                        删除文件夹
                    </Menu.Item>
                </Menu>
            )
        else
            return (
                <Menu>
                    <Menu.Item key='delete' onClick={() => { deleteFile(path + record.name); Refresh() }}>
                        删除
                    </Menu.Item>
                    <Menu.Item key='copy' onClick={() => { setCopyVisible(true); setFromPath(path + record.name) }}>
                        复制到
                    </Menu.Item>
                </Menu>
            )
    }

    const columns = [
        {
            title: 'cid',
            dataIndex: 'cid',
            key: 'cid',
            responsive: ['sm'],
        },
        {
            title: 'name',
            dataIndex: 'name',
            key: 'name',
            defaultSortOrder: 'descend',
            sorter: {
                compare: (a: any, b: any) => {
                    if (a.name > b.name)
                        return 1;
                    if (a.name === b.name)
                        return 0;
                    return -1;
                },
                multiple: 2,
            },
            showSorterTooltip: false,
        },
        {
            title: 'mode',
            dataIndex: 'mode',
            key: 'mode',
            responsive: ['md'],
        },
        {
            title: 'size',
            dataIndex: 'size',
            key: 'size',
            sorter: {
                compare: (a: any, b: any) => {
                    if (a.size > b.size)
                        return 1;
                    if (a.size === b.size)
                        return 0;
                    return -1;
                },
                multiple: 3,
            },
            showSorterTooltip: false,
        },
        {
            title: 'type',
            dataIndex: 'type',
            key: 'type',
            sorter: {
                compare: (a: any, b: any) => {
                    if (a.type > b.type)
                        return 1;
                    if (a.type === b.type)
                        return 0;
                    return -1;
                },
                multiple: 10,
            },
            showSorterTooltip: false,
        },
        {
            title: 'action',
            key: 'action',
            render: (record: any) =>
            (
                <Dropdown overlay={ActionMenu(record)} placement="bottomCenter">
                    <DownCircleTwoTone />
                </Dropdown>
            )
        }
    ]

    const GenBreadcrumb = () => {
        if (path === '/')
            return (<Breadcrumb>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
            </Breadcrumb>)
        let nowPath = '/';
        return (
            <Breadcrumb>
                <Breadcrumb.Item key={nowPath} onClick={(e) => { console.log(e); setPath('/'); console.log(nowPath) }}>  <a><HomeOutlined /></a> </Breadcrumb.Item>
                {path.split('/').filter(i => i).map((dataItem) => {
                    let thisPath = nowPath += dataItem + '/';
                    return (<Breadcrumb.Item key={thisPath}><a onClick={() => setPath(thisPath)}>{dataItem}</a></Breadcrumb.Item>)
                })}
            </Breadcrumb>
        )
    }

    const [visible, setVisible] = useState<boolean>(false);
    const [directoryName, setDirectoryName] = useState<string>('');
    const [uploading, setUploading] = useState<boolean>(false);
    const handleCreate = () => {
        setUploading(true);
        createDirectory(path, directoryName).then(() => {
            setUploading(false);
            setVisible(false);
            Refresh();
        })
    }
    const handleChange = (e: any) => {
        setDirectoryName(e.target.value);
    }

    const [fromPath, setFromPath] = useState('');
    const [copyVisible, setCopyVisible] = useState(false);
    const [copyPath, setCopyPath] = useState('');
    const handleCopy = () => {
        copyFile(copyPath, fromPath).then(() => {
            setCopyPath('');
            setFromPath('');
            setCopyVisible(false);
        })
    }
    const handleCopyChange = (e: any) => {
        setCopyPath(e.target.value);
    }

    return (
        <>
            <Row gutter={[0, 8]}>
                <Col span={24}>
                    <GenBreadcrumb />
                </Col>
                <Col span={2}><FileUpload refresh={Refresh} /></Col>
                <Col><Button onClick={() => setVisible(true)}>新建文件夹</Button></Col>
                <Modal
                    title="新建文件夹"
                    visible={visible}
                    confirmLoading={uploading}
                    onOk={handleCreate}
                    onCancel={() => setVisible(false)}
                    okButtonProps={{ disabled: (directoryName === '') }}
                    okText="创建"
                    cancelText="取消"
                >
                    <p>新建文件夹</p>
                    <Input placeholder="请输入文件夹名" onChange={handleChange} />
                </Modal>
                <Modal
                    title="复制到"
                    visible={copyVisible}
                    confirmLoading={uploading}
                    onOk={handleCopy}
                    onCancel={() => { setCopyVisible(false); setFromPath('') }}
                    okButtonProps={{ disabled: (copyPath === '' || fromPath === '') }}
                    okText="确认"
                    cancelText="取消"
                >
                    <Input placeholder="请输入目标文件夹" onChange={handleCopyChange} />
                </Modal>
                <Col span={24}>
                    <Table columns={columns} dataSource={data} defaultExpandAllRows={true}
                        pagination={{ defaultPageSize: 20 }}
                    />
                </Col>
            </Row>
        </>
    )
}

export default FileInfo;