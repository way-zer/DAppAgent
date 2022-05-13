import React, {createRef, ReactNode, useState} from 'react';
import {Button, Input, InputRef, Modal} from 'antd';
import TextArea, {TextAreaRef} from 'antd/es/input/TextArea';

export function useRefreshAble(): { key: unknown, refresh(): void } {
    const [key, refresh] = useState(Math.random);
    return {
        key,
        refresh() {
            refresh(Math.random);
        },
    };
}

export function showInputModal(param: { title: string, tip?: string, content?: ReactNode, callback: (value: string) => void }) {
    const {title, content, tip, callback} = param;
    let input = createRef<InputRef>();
    Modal.confirm({
        title,
        content: <>
            {content}
            <Input placeholder={tip} ref={input}/>
        </>,
        async onOk() {
            let value = input.current!!.input!!.value;
            await callback(value);
        },
    });
}

export function showTextAreaModal(param: { title: string, tip?: string, content?: ReactNode, callback: (value: string) => void }) {
    const {title, content, tip, callback} = param;
    let input = createRef<TextAreaRef>();
    Modal.confirm({
        title,
        content: <>
            {content}
            <TextArea placeholder={tip} ref={input} allowClear autoSize={{minRows: 3}}/>
            <Button onClick={async () => {
                let file = await selectFile('.json');
                input.current!!.resizableTextArea!!.textArea.value = await file.text();
            }}>选择文件</Button>
        </>,
        async onOk() {
            await callback(input.current!!.resizableTextArea!!.textArea.value);
        },
    });
}

export function selectFile(accept: string) {
    const inputObj = document.createElement('input');
    inputObj.setAttribute('type', 'file');
    inputObj.setAttribute('style', 'visibility:hidden');
    inputObj.setAttribute('accept', accept);
    inputObj.click();
    return new Promise<File>(resolve => {
        inputObj.oninput = () => {
            resolve(inputObj.files!![0]);
        };
    });
}