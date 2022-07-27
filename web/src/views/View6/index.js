import React,{useState} from 'react';
import { List } from 'antd';
import './view6.css';
import { useAtomValue, useUpdateAtom } from "jotai/utils";
import { filteredDataState, selectedUserState, modeState } from './../../store'
import { useActivityApi } from './../../useDataApi';

const View6 = (props) => {
     const data = useAtomValue(filteredDataState);
     const dispatchUser = useUpdateAtom(selectedUserState);
     const {mutateActivity} = useActivityApi();
     const [selectedId,setSelectedId] = useState('')
     const mode = useAtomValue(modeState);

    const selectUser = (user) => {
        setSelectedId(user.id);
        dispatchUser(user);
        mutateActivity(user.id);
    }

    return (
        <div id='view6' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
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

export default  View6
