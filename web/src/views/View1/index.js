import React from 'react';
import { Avatar } from 'antd';
import './view1.css';
import { useAtomValue } from "jotai/utils";
import { selectedUserState } from './../../store'

const View1 = (props) => {
    const user = useAtomValue(selectedUserState);

    return (
        <div id='view1' className='pane'>
            <div className='header'>User Profile</div>
            <div>
                <div className={'avatar-view'}>
                    <Avatar shape="square" size={120} icon="user" />
                </div>
                <div className={'info-view'}>
                    <div>name: {user?.name}</div>
                    <div>gender: {user?.gender}</div>
                    <div>age: {user?.age}</div>
                </div>
            </div>
        </div>
    )
}

export default View1;
