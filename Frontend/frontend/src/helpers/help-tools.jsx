import instance from "./axiosInstance";
// User APIs
export const loginUser = async (email, password) => {
    try {
        const res = await instance.post('/user/userlogin', { email, password });
        if (res.status !== 201) throw new Error('Unable to login');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const signupUser = async (name, email, password, otp) => {
    try {
        const res = await instance.post('/user/usersignup', { name, email, password, otp });
        if (res.status !== 201) throw new Error('Unable to signup');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const checkAuthStatus = async () => {
    try {
        const res = await instance.get('/user/auth-status');
        if (res.status !== 200) throw new Error('Unable to authenticate');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await instance.get('/user/logout');
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

// Driver APIs
export const loginDriver = async (email, password) => {
    try {
        const res = await instance.post('/driver/login', { email, password });
        if (res.status !== 201) throw new Error('Unable to login driver');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const registerDriver = async (driverData) => {
    try {
        const form = new FormData();
        Object.keys(driverData).forEach((key) => {
            form.append(key, driverData[key]);
        });

        const res = await instance.post('/driver/register', form, {
            headers: { 'Accept': 'application/json' }
        });

        if (res.status !== 201) throw new Error('Unable to register driver');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw new Error('Driver registration failed');
    }
};

export const checkDriverAuthStatus = async () => {
    try {
        const res = await instance.get('/driver/auth-status');
        if (res.status !== 200) throw new Error('Unable to authenticate driver');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};
