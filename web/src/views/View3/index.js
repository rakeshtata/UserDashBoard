import React, { useState } from 'react';
import { Slider, Checkbox, Divider } from 'antd';
import './view3.css';
import {  useUpdateAtom } from "jotai/utils";
import { greaterThenAgeState, includedGenderState } from './../../store';

const CheckboxGroup = Checkbox.Group;

const plainOptions = ['Male', 'Female', 'Unknown'];
const defaultCheckedList = ['Male', 'Female', 'Unknown'];

const View3 = (props) =>  {

  const dispatchGender = useUpdateAtom(includedGenderState);
  const dispatchAge = useUpdateAtom(greaterThenAgeState);
  const [checkedList,setCheckedList] = useState(defaultCheckedList);
  const [indeterminate, setIndeterminate] = useState(true);
  const [checkAll, setCheckAll] = useState(false);


    const onChangeCheckbox = chkList => {
      setCheckedList(chkList);
      setIndeterminate(!!chkList.length && chkList.length < plainOptions.length);
      setCheckAll(chkList.length === plainOptions.length);
      dispatchGender(chkList);
    };

    const onCheckAllChange = e => {
        const chkList = e.target.checked ? plainOptions : [];
        setCheckedList(chkList);
        setIndeterminate(false);
        setCheckAll(e.target.checked);
        dispatchGender(chkList);
    };

    const onChangeSilder = value => {
        dispatchAge(value);
    }


    return (
        <div id='view3' className='pane'>
            <div className='header'>Filter</div>
            <h3>Gender</h3>
            <div style={{ width: 275, margin: 5 }}>
                <Checkbox
                    indeterminate={indeterminate}
                    onChange={onCheckAllChange}
                    checked={checkAll}
                >
                    Check all
                </Checkbox>
            </div>
            <br />
            <div style={{ width: 275, margin: 5 }}>
                <CheckboxGroup
                    options={plainOptions}
                    value={checkedList}
                    onChange={onChangeCheckbox}
                />
            </div>
            <Divider />
            <h3>Age</h3>
            <Slider defaultValue={0} onChange={onChangeSilder}/>
        </div>
    )

}

export default View3;
