import basicAuth from 'express-basic-auth';


const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '12341234';

export const adminAuthMiddleware = basicAuth({
    users: { [ADMIN_USERNAME]: ADMIN_PASSWORD },
    challenge: true, 
    unauthorizedResponse: 'Unauthorized access to the admin dashboard.',
});
