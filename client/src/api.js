import axios from 'axios';


// Remove trailing /api if present to avoid double api/api prefix
// Fallback to local server for development, though VITE_API_URL is preferred in .env
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
if (API_URL.endsWith('/api')) {
    API_URL = API_URL.slice(0, -4);
}

export const API_BASE_URL = API_URL;

const api = axios.create({
    baseURL: `${API_URL}/api/`,
    withCredentials: true,
});

export const getProxyUrl = (url) => {
    if (!url || url.startsWith('http://localhost') || url.startsWith('https://localhost') || url.startsWith('/') || url.startsWith('data:')) {
        return url || '/podcast-placeholder.png';
    }
    // Using API_BASE_URL (cache busting removed to prevent infinite re-render loops)
    return `${API_BASE_URL}/api/proxy-image/?url=${encodeURIComponent(url)}`;
};

// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Add a request interceptor to include the CSRF token and Auth token
api.interceptors.request.use((config) => {
    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
        const csrftoken = getCookie('csrftoken');
        if (csrftoken) {
            config.headers['X-CSRFToken'] = csrftoken;
        }

        // REMOVED: API keys should NEVER be sent from frontend
        // Backend will handle API keys from UserProfile
        // SECURITY FIX: Removed X-OpenRouter-Key header injection
    }

    // Add Authorization token if available (for Google OAuth users)
    const token = localStorage.getItem('token');
    console.log('[API Interceptor] Token from localStorage:', token ? token.substring(0, 10) + '...' : 'null');
    if (token) {
        config.headers['Authorization'] = `Token ${token}`;
        console.log('[API Interceptor] Added Authorization header for:', config.url);
    }

    return config;
});

// Add response interceptor for auth error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            console.warn('API 401 Unauthorized - dispatching auth event');
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

// Teacher & Classroom API
export const checkTeacherStatus = () => api.get('/teachers/status/');
export const becomeTeacher = (data) => api.post('/teachers/become/', data);
export const getTeacherProfile = () => api.get('/teachers/me/');
export const updateTeacherProfile = (data) => api.put('/teachers/me/update/', data);

export const getMyClassrooms = () => api.get('/classrooms/my_teaching/');
export const createClassroom = (data) => api.post('/classrooms/', data);
export const getClassroom = (id) => api.get(`/classrooms/${id}/`);
export const updateClassroom = (id, data) => api.patch(`/classrooms/${id}/`, data);
export const deleteClassroom = (id) => api.delete(`/classrooms/${id}/`);
export const toggleClassroomActive = (id) => api.post(`/classrooms/${id}/toggle_active/`);
export const regenerateInviteCode = (id) => api.post(`/classrooms/${id}/regenerate_invite/`);

export const getClassroomStudents = (id) => api.get(`/classrooms/${id}/students/`);
export const getPendingRequests = (id) => api.get(`/classrooms/${id}/students/pending/`);
export const approveStudent = (cid, mid) => api.post(`/classrooms/${cid}/students/${mid}/approve/`);
export const rejectStudent = (cid, mid) => api.post(`/classrooms/${cid}/students/${mid}/reject/`);
export const removeStudent = (cid, sid) => api.post(`/classrooms/${cid}/students/${sid}/remove/`);
export const pauseStudent = (cid, sid) => api.post(`/classrooms/${cid}/students/${sid}/pause/`);
export const reactivateStudent = (cid, sid) => api.post(`/classrooms/${cid}/students/${sid}/reactivate/`);
export const getShareLink = (id) => api.get(`/classrooms/${id}/share-link/`);
export const sendInviteEmails = (id, emails) => api.post(`/classrooms/${id}/send-invites/`, { emails });
export const getClassroomPathStats = (id, params) => api.get(`/classrooms/${id}/path_stats/`, { params });

// Student Classroom API
export const getEnrolledClassrooms = () => api.get('/classrooms/my_enrolled/');
export const validateInviteCode = (code) => api.get(`/classrooms/validate/${code}/`);
export const joinClassroom = (code) => api.post('/classrooms/join/', { invite_code: code });
export const leaveClassroom = (id) => api.post(`/classrooms/${id}/leave/`);

// Assignment API
export const getClassroomAssignments = (cid) => api.get(`/assignments/?classroom=${cid}`);
export const createAssignment = (data) => api.post('/assignments/', data);
export const updateAssignment = (id, data) => api.patch(`/assignments/${id}/`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}/`);
export const getAssignment = (id) => api.get(`/assignments/${id}/`);
export const startAssignment = (id) => api.post(`/assignments/${id}/start/`);
export const submitAssignment = (id, data) => api.post(`/assignments/${id}/submit/`, data);
export const getMyAssignments = () => api.get('/assignments/');
export const getMyAssignmentProgress = (id) => api.get(`/assignments/${id}/my_progress/`);

// Teacher Dashboard API
export const getDashboardOverview = () => api.get('/teacher/dashboard/');
export const getClassroomStats = (id) => api.get(`/teacher/classrooms/${id}/stats/`);
export const getRecentActivity = () => api.get('/teacher/activity/');
export const getStudentPerformance = (cid, sid) => api.get(`/teacher/classrooms/${cid}/students/${sid}/performance/`);


// AI & Skills Discovery API
export const getMySkills = () => api.get('/skills/mine/');
export const getCoachInsights = () => api.post('/agent/insights/');
export const getMyRecommendations = () => api.get('/recommendations/');
export const generateVocabList = (data) => api.post('/ai/generate-vocab/', data);
export const generateQuiz = (data) => api.post('/ai/generate-quiz/', data);

// Learning Paths
export const getPaths = () => api.get('/paths/');
export const getPathDetail = (id) => api.get(`/paths/${id}/`);
export const createPath = (data) => api.post('/paths/', data);
export const updatePath = (id, data) => api.put(`/paths/${id}/`, data);
export const enrollInPath = (id) => api.post(`/paths/${id}/enroll/`);
export const getMyPathProgress = (id) => api.get(`/paths/${id}/my_progress/`);

// Exams
export const createExam = (data) => api.post('/exams/', data);
export const getExams = () => api.get('/exams/');
export const getExam = (id) => api.get(`/exams/${id}/`);

// AI Content & Generation
export const listGeneratedContent = (params) => api.get('/ai/generated-content/', { params });
export const getGeneratedContent = (id) => api.get(`/ai/generated-content/${id}/`);
export const updateGeneratedContent = (id, data) => api.patch(`/ai/generated-content/${id}/update/`, data);
export const deleteGeneratedContent = (id) => api.delete(`/ai/generated-content/${id}/delete/`);
export const toggleGeneratedFavorite = (id) => api.post(`/ai/generated-content/${id}/favorite/`);

// Learning Paths V2 (Curriculum)
export const getLearningPaths = (params) => api.get('/paths/', { params });
// Path Nodes
export const getPathNodes = (pathId) => api.get(`/path-nodes/?path=${pathId}`);
export const createPathNode = (data) => api.post('/path-nodes/', data);
export const updatePathNode = (id, data) => api.put(`/path-nodes/${id}/`, data);
export const deletePathNode = (id) => api.delete(`/path-nodes/${id}/`);
export const startPathNode = (id) => api.post(`/path-nodes/${id}/start/`);
export const completePathNode = (id, data) => api.post(`/path-nodes/${id}/complete/`, data);
export const reorderPathNodes = (data) => api.put('/path-nodes/reorder/', data);
export const refreshWeaknessAnalysis = () => api.post('/weakness/refresh/');
export const getWeaknessList = () => api.get('/weakness/');

// Live Sessions
export const getSessions = (params) => api.get('/sessions/', { params });
export const getSessionDetail = (id) => api.get(`/sessions/${id}/`);
export const createSession = (data) => api.post('/sessions/', data);
export const updateSession = (id, data) => api.put(`/sessions/${id}/`, data);
export const getUpcomingSessions = () => api.get('/sessions/upcoming/');
export const joinSession = (id) => api.post(`/sessions/${id}/join/`);
export const leaveSession = (id) => api.post(`/sessions/${id}/leave/`);
export const startSession = (id) => api.post(`/sessions/${id}/start/`);
export const evaluateSession = (sessionId, data) => api.post(`/sessions/${sessionId}/evaluate/`, data);
export const endSession = (id) => api.post(`/sessions/${id}/end/`);
export const getSessionToken = (id) => api.get(`/sessions/${id}/get_token/`);
export const getSessionAttendance = (id) => api.get(`/sessions/${id}/attendance_report/`);

// Class-Level Path Progress (Classroom curriculum)
export const getClassPathProgress = (classroomId) => api.get(`/classrooms/${classroomId}/class_path_progress/`);
export const updateStepProgress = (classroomId, nodeId, data) => api.patch(`/classrooms/${classroomId}/steps/${nodeId}/`, data);
export const getStudentRemediations = (classroomId) => api.get(`/classrooms/${classroomId}/remediations/`);


// Game Sessions
export const createGameSession = (data) => api.post('/game-sessions/', data);
export const createGameFromAssignment = (assignmentId) => api.post('/game-sessions/create_from_assignment/', { assignment_id: assignmentId });
export const getGameSession = (id) => api.get(`/game-sessions/${id}/`);
export const joinGameSession = (code) => api.post('/games/join/', { code });


// Organizations
export const getOrganizations = () => api.get('/organizations/');
export const getOrgBySlug = (slug) => api.get(`/organizations/${slug}/`);
export const getOrgDashboard = (slug) => api.get(`/organizations/${slug}/dashboard/`);
export const getOrgMembers = (slug) => api.get(`/organizations/${slug}/members/`);
export const inviteOrgMember = (slug, data) => api.post(`/organizations/${slug}/invite/`, data);
export const removeOrgMember = (slug, memberId) => api.delete(`/organizations/${slug}/members/${memberId}/`);
export const getOrgClassrooms = (slug) => api.get(`/organizations/${slug}/classrooms/`);

// Notifications
export const getNotifications = () => api.get('/notifications/list/');
export const getUnreadCount = () => api.get('/notifications/unread-count/');
export const markNotificationRead = (id) => api.post('/notifications/list/', { id });
export const markAllNotificationsRead = () => api.post('/notifications/list/', { mark_all_read: true });


export default api;

