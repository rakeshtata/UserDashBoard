import React,{useState,useRef} from 'react';
import { Avatar, Button } from 'antd';
import 'antd/dist/antd.css';
import './view1.css';
import { useAtomValue } from "jotai/utils";
import { selectedUserState , modeState} from './../../store'
import { useAddUserApi, useEditUserApi, useDeleteUserApi } from './../../useDataApi';

const View1 = (props) => {
    const user = useAtomValue(selectedUserState);
    const mode = useAtomValue(modeState);
    const [add,setAdd] = useState(false);
    const [edit,setEdit] = useState(false);
    const nameRef = useRef();
    const ageRef = useRef();
    const genderRef = useRef();
    const {mutateAdd} = useAddUserApi();
    const {mutateEdit} = useEditUserApi();
    const {mutateDelete} = useDeleteUserApi();

    const handleSubmit = () => {
      const userval = {
        'name': nameRef.current.value,
        'age': ageRef.current.value,
        'gender': genderRef.current.value
      }
      edit ? mutateEdit(userval) : mutateAdd(userval);
      setAdd(false);
      setEdit(false);
    }

    const handleDelete = () => {
      mutateDelete(user.id);
      setAdd(false);
      setEdit(false);
    }

    return (
        <div id='view1' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>User Profile</div>
            <div>
            {add || edit ?
              <div>
              <div className={mode === "dark"? 'info_dark' : ''}>
                <div>
                    <div>
                      <label for='name'>Name: </label>
                      <input ref={nameRef} id='name' className='txt_field' defaultValue={edit ? user?.name :""}/>
                    </div>
                    <div>
                      <label for='gender'>Gender: </label>
                      <input ref={genderRef} id='gender' className='txt_field' defaultValue={edit ? user?.gender :""}/>
                    </div>
                    <div>
                      <label for='age'>Age: </label>
                      <input ref={ageRef} id='age' className='txt_field' defaultValue={edit ? user?.age :""}/>
                    </div>
                  </div>

                  {add ?
                    <div className='bottom_button'>
                      <Button type="primary" className='right_button' onClick={()=>handleSubmit()}>Save</Button>
                     </div>
                    :<div className='bottom_button_vertical'>
                      <Button  className='left_button' onClick={()=>handleDelete()} danger>Delete</Button>
                      <Button type="primary" className='right_button' onClick={()=>handleSubmit()}>Save</Button>
                    </div>}

                </div>
              </div>
              :<div>
                <div className={'avatar-view'}>
                    <Avatar shape="square" size={120} icon="user" style={mode === "dark"?{backgroundColor: '#144848'}:""}/>
                </div>
                <div className="right-profile-view">
                  <div className={mode === "dark"? 'info-view info_dark' : 'info-view'}>
                      <div>name: {user?.name}</div>
                      <div>gender: {user?.gender}</div>
                      <div>age: {user?.age}</div>
                  </div>
                  <div className='bottom_button'>
                    <Button className='left_button' onClick={()=>setEdit(true)}>Edit</Button>
                    <Button type="primary" className='right_button' onClick={()=>setAdd(true)}>Add</Button>
                  </div>
                </div>
              </div>}

            </div>
        </div>
    )
}

export default View1;
