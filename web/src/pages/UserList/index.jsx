import React,{useState} from 'react';
import { List } from 'antd';
import './userList.css';
import { useAtomValue, useSetAtom } from "jotai";
import { filteredDataState, selectedUserState, modeState } from '../../store'
import { useActivityApi } from '../../hooks/useDataApi';

const UserList = (props) => {
     const data = useAtomValue(filteredDataState);
     const dispatchUser = useSetAtom(selectedUserState);
     const {mutateActivity} = useActivityApi();
     const [selectedId,setSelectedId] = useState('')
     const mode = useAtomValue(modeState);

    const selectUser = (user) => {
        setSelectedId(user.id);
        dispatchUser(user);
        mutateActivity(user.id);
    }

    return (
        <div id='userList' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>User List</div>
            <List
                size="small"
                bordered
                style={mode==='dark' ?{color: "steelblue" , 'border-color': "black"}:{}}
                dataSource={data}
                renderItem={user => <List.Item onClick = {() => selectUser(user)}>
                    <div style={selectedId===user.id?{'font-weight':'bolder','font-size': 'large'}:{'font-weight':'lighter'}}>
                        {user.name + ':' + user.age}
                    </div>
                </List.Item>}
            />
        </div>
    )

}

export default  UserList
