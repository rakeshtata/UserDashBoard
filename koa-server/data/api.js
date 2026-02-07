/**
 * Centralized data access via axios for the JSON server.
 * Exports: fetchUsers, fetchUserById, fetchActivities, addUser, editUser, deleteUser
 *
 * Uses:
 *   process.env.JSON_SERVER_URL || 'http://172.18.0.1:8000' as base URL.
 */

const axios = require('axios');

const BASE = process.env.JSON_SERVER_URL || 'http://172.18.0.1:8000';

const client = axios.create({
  baseURL: BASE,
  timeout: 5000,
  headers: { 'Connection': 'keep-alive' },
});

/**
 * Fetch all users (GET /data)
 */
async function fetchUsers() {
  const res = await client.get('/data');
  return res.data;
}

/**
 * Fetch a single user by id (GET /data/:id)
 * @param {number|string} id
 */
async function fetchUserById(id) {
  const res = await client.get(`/data/${id}`);
  return res.data;
}

/**
 * Fetch activities for a user (GET /data/:id/activities)
 * @param {number|string} id
 */
async function fetchActivities(id) {
  const res = await client.get(`/data/${id}/activities`);
  return res.data;
}

/**
 * Add a user (POST /data)
 * @param {object} payload
 */
async function addUser(payload) {
  const res = await client.post('/data', payload);
  return res.data;
}

/**
 * Edit a user (PUT /data/:id)
 * @param {number|string} id
 * @param {object} payload
 */
async function editUser(id, payload) {
  const res = await client.put(`/data/${id}`, payload);
  return res.data;
}

/**
 * Delete a user (DELETE /data/:id)
 * @param {number|string} id
 */
async function deleteUser(id) {
  const res = await client.delete(`/data/${id}`);
  return res.data;
}

module.exports = {
  fetchUsers,
  fetchUserById,
  fetchActivities,
  addUser,
  editUser,
  deleteUser,
};
