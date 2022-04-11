import React, {createRef} from 'react';
import {Avatar, Dropdown, Input, Menu, Modal} from 'antd';
import {AntDesignOutlined} from '@ant-design/icons';
import {useService} from '@dapp-agent/sdk';
import {useNavigate} from 'react-router-dom';

export default function UserAvatar() {
    return (
        <Dropdown overlay={UserPopover}>
            <Avatar
                size={40}
                icon={<AntDesignOutlined/>}
            />
        </Dropdown>
    );
}

function UserPopover() {
    return <Menu>
        <Menu.Item onClick={showPeerModal}>连接Peer</Menu.Item>
        <Menu.Item onClick={showCloneModal}>Clone应用</Menu.Item>
    </Menu>;
}

function showPeerModal() {
    let input = createRef<Input>();
    Modal.confirm({
        title: '连接Peer',
        content: <Input placeholder="请输入peer地址" ref={input}/>,
        async onOk() {
            await useService('system').connectPeer(input.current!!.state.value);
        },
    });
}

function showCloneModal() {
    let input = createRef<Input>();
    Modal.confirm({
        title: 'Clone应用',
        content: <Input placeholder="请输入应用地址" ref={input}/>,
        async onOk() {
            await useService('apps').clone(input.current!!.state.value);
            useNavigate()(0);
        },
    });
}