import axios from 'axios';

export const loginUser = async (email, password) => {
    try {
        const res = await axios.post('http://localhost:3000/api/user/userlogin', { email, password }, { withCredentials: true });
        if (res.status !== 201){ throw new Error('Unable to login');}
        return res.data;  // This should return the full response with `user` and `token`
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const signupUser = async (name, email, password, otp) => {
    try {
        const res = await axios.post('http://localhost:3000/api/user/usersignup', { name, email, password, otp }, { withCredentials: true });
        if (res.status !== 201) throw new Error('Unable to signup');
        return res.data;  // This should return the full response with `user` and `token`
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const checkAuthStatus = async () => {
    try {
        const res = await axios.get('http://localhost:3000/api/user/auth-status', { withCredentials: true });
        if (res.status !== 200) throw new Error('Unable to authenticate');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const logoutUser = async () => {
    await fetch("http://localhost:3000/api/user/logout", {
      method: "GET",
      credentials: "include", // This ensures cookies are sent
    });
  };
  


export const loginDriver = async (email, password) => {
    try {
        const res = await axios.post('http://localhost:3000/api/driver/login', { email, password }, { withCredentials: true });
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

        const res = await axios.post('http://localhost:3000/api/driver/register', form, {
            headers: { 'Accept': 'application/json' },
            withCredentials: true,
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
        const res = await axios.get('http://localhost:3000/api/driver/auth-status', { withCredentials: true });
        if (res.status !== 200) throw new Error('Unable to authenticate driver');
        return res.data;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};


