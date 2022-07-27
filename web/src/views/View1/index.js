import React from 'react';
import { Avatar } from 'antd';
import './view1.css';
import { useAtomValue } from "jotai/utils";
import { selectedUserState , modeState} from './../../store'

const View1 = (props) => {
    const user = useAtomValue(selectedUserState);
    const mode = useAtomValue(modeState);

    return (
        <div id='view1' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>User Profile</div>
            <div>
                <div className={'avatar-view'}>
                    <Avatar shape="square" size={120} icon="user" style={mode === "dark"?{backgroundColor: '#144848'}:""}/>
                </div>
                <div className={mode === "dark"? 'info-view info_dark' : 'info-view'}>
                    <div>name: {user?.name}</div>
                    <div>gender: {user?.gender}</div>
                    <div>age: {user?.age}</div>
                </div>
            </div>
        </div>
    )
}

export default View1;
