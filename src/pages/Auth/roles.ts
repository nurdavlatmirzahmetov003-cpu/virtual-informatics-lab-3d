import type { Role } from '@/services/auth/api';

/** Where each role lands after signing in. */
export const homeOf = (role: Role) => (role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student');
