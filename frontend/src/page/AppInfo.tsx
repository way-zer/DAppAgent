import { list, publish } from "@api/apps";
import React from "react";
import { Table, message, Popconfirm } from 'antd';


export default class AppInfo extends React.Component {
    state = {
        data: [],
    }

    componentDidMount() {
        list().then((res) => {
            this.setState({
                data: Object.keys(res).map((appname) => {
                    return{
                        name: appname, 
                        cid:  res[appname].cid,
                        prod: res[appname].prod,
                    }
                }
                )}) 
        })
    }

    handlePublish = (name: string) => {
        publish(name).then((res)=>{
            if(res?.error==='NOT FOUND')
                message.error('NOT FOUND');
            else
                message.success('发布成功')
        })
    }

    render() {
        const columns= [
            {
                title: 'name',
                dataIndex: 'name',
                key: 'name'
            },
            {
                title: 'cid',
                dataIndex: 'cid',
                key: 'cid'
            },
            {
                title: 'prod',
                dataIndex: 'prod',
                key: 'prod'
            },
            {
                title: 'action',
                key: 'action',
                render: (_, record) => (
                    <Popconfirm title="Sure to publish?" onConfirm={() => this.handlePublish(record.name)}>
                    <a>Publish</a>
                    </Popconfirm>
                  ),
            }
        ]

        return (
            <div>
                <Table rowKey={record => record.name} dataSource={this.state.data} columns={columns} />
            </div>
        )
    }
}