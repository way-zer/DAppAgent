import { fileInfo } from "@api/file";
import { Input, Button, message, Modal, Table } from "antd";
import React, { useState } from "react"

function FileInfo() {
    const [path, setPath] = useState('');
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPath(event.target.value);
    }

    const columns = [
        {
            title: 'cid',
            dataIndex: 'cid',
            key:'cid',
        },
        {
            title: 'name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'mode',
            dataIndex: 'mode',
            key: 'mode',
        },
        {
            title: 'size',
            dataIndex: 'size',
            key: 'size',
        },
        {
            title: 'type',
            dataIndex: 'type',
            key: 'type'
        }
    ]

    const handleClick = () => {
        fileInfo(path)
        .then((res) => {
            console.log(res);
            Modal.info({
                title: "文件信息",
                content: (
                    <Table columns={columns} dataSource={res} />
                ),
                width: 1000,
            })
        })
        .catch((res) => {
            message.error("查询失败");
            console.log(res);
        })
    }

    return (
    <>
        <Input onChange={handleChange} />
        <Button disabled={path === ''} onClick={handleClick}>
            查询
        </Button>
    </>
    )
}

export default FileInfo;