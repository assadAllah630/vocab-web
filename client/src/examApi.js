import api from './api';

// Exam API endpoints - Extracted to separate file to resolve build issues
export const createExam = (data) => api.post('/exams/', data);
export const getExams = () => api.get('/exams/');
export const getExam = (id) => api.get(`/exams/${id}/`);
export const updateExam = (id, data) => api.put(`/exams/${id}/`, data);
export const deleteExam = (id) => api.delete(`/exams/${id}/`);
export const submitExam = (id, data) => api.post(`/exams/${id}/submit/`, data);
