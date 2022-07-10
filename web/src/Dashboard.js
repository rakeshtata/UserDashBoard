import React, { useEffect } from 'react';
import { Layout } from 'antd';
import View1 from './views/View1';
import View2 from './views/View2';
import View3 from './views/View3';
import View4 from './views/View4';
import View5 from './views/View5';
import View6 from './views/View6';
import './dashboard.css';
import { useAtom } from 'jotai'
import {  useUpdateAtom } from "jotai/utils";
import { dataState, selectedUserState } from './store'
import { useUserApi,useActivityApi } from './useDataApi';

const { Sider, Content } = Layout;

const Dashboard = ({props}) => {
  const [data] = useAtom(dataState);
  const dispatchUser = useUpdateAtom(selectedUserState);
  const {mutateUser} = useUserApi();
  const {mutateActivity} = useActivityApi();

  useEffect(() => {
        mutateUser()
    },[])

  useEffect(() => {
    if(data && data.length > 0){
      dispatchUser(data[0]);
      mutateActivity(data[0].id);
    }
  }, [data])


    return (
        <div>
            <Layout style={{ height: 920 }}>
                <Sider width={300} style={{backgroundColor:'#eee'}}>
                    <Content style={{ height: 200 }}>
                        <View1/>
                    </Content>
                    <Content style={{ height: 300 }}>
                        <View2 />
                    </Content>
                    <Content style={{ height: 400 }}>
                        <View3/>
                    </Content>
                </Sider>
                <Layout>
                    <Content style={{ height: 300 }}>
                        <View4 />
                    </Content>
                    <Layout style={{ height: 600 }}>
                        <Content>
                            <View5/>
                        </Content>
                        <Sider width={300} style={{backgroundColor:'#eee'}}>
                            <View6/>
                        </Sider>
                    </Layout>
                </Layout>
            </Layout>
        </div>
    )

}

export default Dashboard;
