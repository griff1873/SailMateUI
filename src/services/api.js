import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    paramsSerializer: (params) => {
        // Custom serializer to handle arrays as 'key=value&key=value' for ASP.NET Core
        const searchParams = new URLSearchParams();
        for (const key in params) {
            const value = params[key];
            if (Array.isArray(value)) {
                value.forEach(val => searchParams.append(key, val));
            } else if (value !== undefined && value !== null) {
                searchParams.append(key, value);
            }
        }
        return searchParams.toString();
    }
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export const auth0Push = {
    createUser: (data) => api.post('/Auth0Push/user', data),
    getUser: (auth0UserId) => api.get(`/Auth0Push/user/${auth0UserId}`),
    updateUser: (auth0UserId, data) => api.put(`/Auth0Push/user/${auth0UserId}`, data),
    deleteUser: (auth0UserId) => api.delete(`/Auth0Push/user/${auth0UserId}`),
    getUsers: (params) => api.get('/Auth0Push/users', { params }), // page, pageSize
};

export const boatCrew = {
    getAll: (params) => api.get('/BoatCrew', { params }), // page, pageSize
    create: (data) => api.post('/BoatCrew', data),
    get: (id) => api.get(`/BoatCrew/${id}`),
    update: (id, data) => api.put(`/BoatCrew/${id}`, data),
    delete: (id) => api.delete(`/BoatCrew/${id}`),
    getByBoat: (boatId) => api.get(`/BoatCrew/by-boat/${boatId}`),
    getByProfile: (profileId) => api.get(`/BoatCrew/by-profile/${profileId}`),
    getPendingRequests: (profileId) => api.get(`/BoatCrew/pending-requests/${profileId}`),
    getAdminsByBoat: (boatId) => api.get(`/BoatCrew/admins/by-boat/${boatId}`),
    getMyCrew: (profileId) => api.get(`/BoatCrew/my-crew/${profileId}`),
    getInvitations: (profileId) => api.get(`/BoatCrew/invitations/${profileId}`),
};

export const boats = {
    test: () => api.get('/Boats/test'),
    getAll: (params) => api.get('/Boats', { params }), // page, pageSize
    create: (data) => api.post('/Boats', data),
    get: (id) => api.get(`/Boats/${id}`),
    update: (id, data) => api.put(`/Boats/${id}`, data),
    delete: (id) => api.delete(`/Boats/${id}`),
    getByProfile: (profileId) => api.get(`/Boats/by-profile/${profileId}`),
    getSchedules: (id) => api.get(`/Boats/${id}/schedules`),
    searchAll: (name, excludeProfileId) =>
        api.get(`/Boats/search-all`, {
            params: {
                name,
                excludeProfileId
            }
        }),
    setCrewColor: (id, data) => api.put(`/Boats/${id}/crew-color`, data),
};

export const events = {
    getAll: (params) => api.get('/Events', { params }), // page, pageSize
    create: (data) => api.post('/Events', data),
    get: (id) => api.get(`/Events/${id}`),
    update: (id, data) => api.put(`/Events/${id}`, data),
    delete: (id) => api.delete(`/Events/${id}`),
    getUpcoming: (params) => api.get('/Events/upcoming', { params }), // days, boatIds[]
    getMyEvents: (params) => api.get('/Events/my-events', { params }), // { profileId, includePast }
    search: (params) => api.get('/Events/search', { params }), // name, location, startDate, endDate
};

export const crewEvent = {
    getByEvent: (eventId) => api.get(`/CrewEvent/by-event/${eventId}`),
    getByProfile: (profileId) => api.get(`/CrewEvent/by-profile/${profileId}`),
    get: (id) => api.get(`/CrewEvent/${id}`),
    create: (data) => api.post('/CrewEvent', data),
    update: (id, data) => api.put(`/CrewEvent/${id}`, data),
    delete: (id) => api.delete(`/CrewEvent/${id}`),
};

export const eventTypes = {
    getAll: () => api.get('/EventTypes'),
    create: (data) => api.post('/EventTypes', data),
    getByProfile: (profileId) => api.get(`/EventTypes/profile/${profileId}`),
    delete: (profileId, eventTypeId) => api.delete(`/EventTypes/profile/${profileId}/eventtype/${eventTypeId}`),
};

export const profile = {
    getAll: (params) => api.get('/Profile', { params }), // page, pageSize
    create: (data) => api.post('/Profile', data),
    get: (id) => api.get(`/Profile/${id}`),
    update: (id, data) => api.put(`/Profile/${id}`, data), // Note: Swagger says PUT /Profile/{id}, but typical pattern might be different. Following Swagger.
    delete: (id) => api.delete(`/Profile/${id}`),
    searchByEmail: (email) => api.get('/Profile/search/by-email', { params: { email } }),
    searchExactEmail: (email) => api.get('/Profile/search/exact-email', { params: { email } }),
    search: (query) => api.get('/Profile/search', { params: { query } }),
    getByEmail: (email) => api.get(`/Profile/by-email/${email}`),
};



export const weatherForecast = {
    get: () => api.get('/WeatherForecast'),
};

export default api;
