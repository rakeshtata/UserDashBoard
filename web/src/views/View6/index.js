import React from 'react';
import { List } from 'antd';
import './view6.css';
import { useAtomValue, useUpdateAtom } from "jotai/utils";
import { filteredDataState, selectedUserState } from './../../store'
import { useActivityApi } from './../../useDataApi';

const View6 = (props) => {
     const data = useAtomValue(filteredDataState);
     const dispatchUser = useUpdateAtom(selectedUserState);
     const {mutateActivity} = useActivityApi();

    const selectUser = (user) => {
        dispatchUser(user);
        mutateActivity(user.id);
    }

    return (
        <div id='view6' className='pane'>
            <div className='header'>User List</div>
            <List
                size="small"
                bordered
                dataSource={data}
                renderItem={user => <List.Item onClick = {() => selectUser(user)}>
                    <div>
                        {user.name + ':' + user.age}
                    </div>
                </List.Item>}
            />
        </div>
    )

}

export default  View6
