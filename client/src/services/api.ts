import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
};

export const chatApi = {
    getConversations: () => api.get('/chat/conversations'),
    getMessages: (conversationId: string) => api.get(`/chat/conversations/${conversationId}/messages`),
    startConversation: (participantId: string) => api.post('/chat/conversations', { participantId }),
    uploadImage: (formData: FormData) => api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteMessage: (messageId: string, type: 'me' | 'everyone') => api.delete(`/chat/messages/${messageId}`, { params: { type } }),
};

export const userApi = {
    getContacts: () => api.get('/users/contacts'),
    addContact: (identifier: string) => api.post('/users/contacts', { identifier }),
    getUser: (id: string) => api.get(`/users/${id}`),
    updateProfile: (data: any) => api.put('/users/profile', data),
};

export default api;
