import React, { useEffect, lazy, Suspense, useRef } from 'react';
import { Layout, Button, Spin } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import './styles/dashboard.css';
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import { dataState, selectedUserState, modeState } from './store'
import { logoutAtom } from './store/authStore';
import { useUserApi, useActivityApi } from './hooks/useDataApi';

const UserProfile = lazy(() => import('./pages/UserProfile'));
const GenderChart = lazy(() => import('./pages/GenderChart'));
const Filters = lazy(() => import('./pages/Filters'));
const UserActivities = lazy(() => import('./pages/UserActivities'));
const AgeChart = lazy(() => import('./pages/AgeChart'));
const UserList = lazy(() => import('./pages/UserList'));

const { Sider, Content, Header } = Layout;

const Dashboard = ({props}) => {
  const [data] = useAtom(dataState);
  const [selectedUser, dispatchUser] = useAtom(selectedUserState);
  const {mutateUser} = useUserApi();
  const {mutateActivity} = useActivityApi();
  const mode = useAtomValue(modeState);
  const setLogout = useSetAtom(logoutAtom);
  const mainContentRef = useRef(null);

  useEffect(() => {
        mutateUser()
    },[])

  useEffect(() => {
    if(data && data.length > 0){
      dispatchUser(data[0]);
      mutateActivity(data[0].id);
    }
  }, [data])

  useEffect(() => {
    if (selectedUser && mainContentRef.current) {
        mainContentRef.current.focus();
    }
  }, [selectedUser]);

    return (
        <Layout style={{ minHeight: '100vh' }} role="none">
            <Header style={{ background: '#001529', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} role="banner">
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Dashboard Analytics</div>
                <Button danger icon={<LogoutOutlined />} onClick={() => setLogout()} aria-label="Logout">
                  Logout
                </Button>
            </Header>
            <Layout role="none">
                <Sider width={300} className='sider_dark' role="complementary" aria-label="User Profile and Filters">
                    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }} aria-busy="true" aria-live="polite"><Spin /></div>}>
                        <Content style={{ height: 200 }} role="none">
                            <UserProfile/>
                        </Content>
                        <Content style={{ height: 300 }} role="none">
                            <GenderChart />
                        </Content>
                        <Content style={{ height: 400 }} role="none">
                            <Filters/>
                        </Content>
                    </Suspense>
                </Sider>
                <Layout role="main" tabIndex="-1" ref={mainContentRef} style={{ outline: 'none' }}>
                    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }} aria-busy="true" aria-live="polite"><Spin size="large" /></div>}>
                        <Content style={{ height: 300}} className='sider_dark' role="region" aria-label="User Activities">
                            <UserActivities />
                        </Content>
                        <Layout style={{ height: 600}} className='sider_dark' role="none">
                            <Content role="region" aria-label="Age Distribution Chart">
                                <AgeChart/>
                            </Content>
                            <Sider width={300} className='sider_dark' role="region" aria-label="User List">
                                <UserList/>
                            </Sider>
                        </Layout>
                    </Suspense>
                </Layout>
            </Layout>
        </Layout>
    )
}

export default Dashboard;
