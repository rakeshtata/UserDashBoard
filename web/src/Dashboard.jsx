import React, { useEffect } from 'react';
import { Layout, Button } from 'antd';
import UserProfile from './pages/UserProfile';
import GenderChart from './pages/GenderChart';
import Filters from './pages/Filters';
import UserActivities from './pages/UserActivities';
import AgeChart from './pages/AgeChart';
import UserList from './pages/UserList';
import './styles/dashboard.css';
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import { dataState, selectedUserState, modeState } from './store'
import { logoutAtom } from './store/authStore';
import { useUserApi, useActivityApi } from './hooks/useDataApi';

const { Sider, Content, Header } = Layout;

const Dashboard = ({props}) => {
  const [data] = useAtom(dataState);
  const dispatchUser = useSetAtom(selectedUserState);
  const {mutateUser} = useUserApi();
  const {mutateActivity} = useActivityApi();
  const mode = useAtomValue(modeState);
  const setLogout = useSetAtom(logoutAtom);

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
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ background: '#001529', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Dashboard Analytics</div>
                <Button type="danger" icon="logout" onClick={() => setLogout()}>
                  Logout
                </Button>
            </Header>
            <Layout>
                <Sider width={300} className='sider_dark'>
                    <Content style={{ height: 200 }}>
                        <UserProfile/>
                    </Content>
                    <Content style={{ height: 300 }}>
                        <GenderChart />
                    </Content>
                    <Content style={{ height: 400 }}>
                        <Filters/>
                    </Content>
                </Sider>
                <Layout>
                    <Content style={{ height: 300}} className='sider_dark'>
                        <UserActivities />
                    </Content>
                    <Layout style={{ height: 600}} className='sider_dark'>
                        <Content>
                            <AgeChart/>
                        </Content>
                        <Sider width={300} className='sider_dark'>
                            <UserList/>
                        </Sider>
                    </Layout>
                </Layout>
            </Layout>
        </Layout>
    )
}

export default Dashboard;
