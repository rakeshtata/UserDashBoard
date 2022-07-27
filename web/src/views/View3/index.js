import React, { useState } from 'react';
import { Slider, Checkbox, Divider, Switch } from 'antd';
import './view3.css';
import {  useUpdateAtom, useAtomValue } from "jotai/utils";
import { greaterThenAgeState, includedGenderState, modeState } from './../../store';

const CheckboxGroup = Checkbox.Group;

const plainOptions = ['Male', 'Female', 'Unknown'];
const defaultCheckedList = ['Male', 'Female', 'Unknown'];

const View3 = (props) =>  {

  const dispatchGender = useUpdateAtom(includedGenderState);
  const dispatchAge = useUpdateAtom(greaterThenAgeState);
  const [checkedList,setCheckedList] = useState(defaultCheckedList);
  const [indeterminate, setIndeterminate] = useState(true);
  const [checkAll, setCheckAll] = useState(false);
  const [mode_l, setMode_l] = useState("Light")
  const dispatchMode = useUpdateAtom(modeState);
  const mode = useAtomValue(modeState);


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

    const onChange = mode => {
      if(!mode){
        setMode_l("Dark")
        dispatchMode("light")
      } else {
        setMode_l("Light")
        dispatchMode("dark")
      }
    }


    return (
        <div id='view3' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>Filter</div>
            <h3>Gender</h3>
            <div style={{ width: 275, margin: 5 }}>
                <Checkbox
                    indeterminate={indeterminate}
                    onChange={onCheckAllChange}
                    checked={checkAll}
                >
                    <div style={{color: "steelblue" }}>Check all</div>
                </Checkbox>
            </div>
            <br />
            <div style={{ width: 275, margin: 5}}>
                <CheckboxGroup
                    options={plainOptions}
                    value={checkedList}
                    onChange={onChangeCheckbox}
                />
            </div>
            <Divider />
            <h3>Age</h3>
            <Slider defaultValue={0} onChange={onChangeSilder}/>
            <Divider />
            <h3>Switch mode to {mode_l}</h3>
            <Switch defaultChecked onChange={onChange} />

        </div>
    )

}

export default View3;
