import { atom } from 'jotai';

// Initialize token from localStorage if present
const initialToken = localStorage.getItem('jwt_token') || null;

export const authAtom = atom(initialToken);
// User info atom can be updated later by parsing the token
export const userAtom = atom(null);

export const loginAtom = atom(
  null,
  (get, set, token) => {
    set(authAtom, token);
    localStorage.setItem('jwt_token', token);
  }
);

export const logoutAtom = atom(
  null,
  (get, set) => {
    set(authAtom, null);
    localStorage.removeItem('jwt_token');
  }
);
