import React from 'react';
import {Avatar, Dropdown, Menu} from 'antd';
import {AntDesignOutlined} from '@ant-design/icons';
import {useService} from '@dapp-agent/sdk';
import {showInputModal} from '../util';

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
    </Menu>;
}

function showPeerModal() {
    showInputModal({
        title: '连接Peer',
        tip: '请输入peer地址',
        async callback(value) {
            await useService('system').connectPeer(value);
        },
    });
}