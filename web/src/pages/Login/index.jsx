import React, { useState } from 'react';
import { Form, Icon, Input, Button, Card, message } from 'antd';
import { useUpdateAtom } from 'jotai/utils';
import { loginAtom } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const Login = ({ form }) => {
  const [loading, setLoading] = useState(false);
  const setToken = useUpdateAtom(loginAtom);
  const navigate = useNavigate();

  const handleSubmit = e => {
    e.preventDefault();
    form.validateFields(async (err, values) => {
      if (!err) {
        setLoading(true);
        try {
          const res = await fetch('http://localhost/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          
          if (!res.ok) {
            throw new Error('Invalid credentials');
          }
          
          const data = await res.json();
          setToken(data.access_token);
          message.success('Login successful!');
          navigate('/');
        } catch (error) {
          message.error('Login failed! Please check your credentials.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const { getFieldDecorator } = form;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card hoverable style={{ width: 400, borderRadius: 8, padding: 30 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 30, fontSize: 32, fontWeight: 600, color: '#1890ff' }}>Dashboard Log In</h2>
        <Form onSubmit={handleSubmit} className="login-form">
          <Form.Item>
            {getFieldDecorator('username', {
              rules: [{ required: true, message: 'Please input your username!' }],
            })(
              <Input
                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="Username (Admin)"
                size="large"
              />,
            )}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: 'Please input your Password!' }],
            })(
              <Input
                prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                type="password"
                placeholder="Password (password)"
                size="large"
              />,
            )}
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button" style={{ width: '100%', marginTop: 10 }} size="large" loading={loading}>
              Secure Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Form.create({ name: 'normal_login' })(Login);
