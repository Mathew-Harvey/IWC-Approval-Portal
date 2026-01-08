/**
 * API Client Service
 * Handles all communication with the backend API
 * Works with Clerk authentication
 */

const API = {
    baseUrl: '/api',
    
    // ============================================
    // Core Request Methods
    // ============================================
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Add Clerk session token if available
        if (typeof Clerk !== 'undefined' && Clerk.session) {
            try {
                const token = await Clerk.session.getToken();
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (e) {
                console.warn('Could not get Clerk token:', e);
            }
        }
        
        // Convert body to JSON if it's an object
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            
            // Handle 401 - only redirect to login if NOT already signed in
            if (response.status === 401) {
                // Check if user is already signed in
                const isSignedIn = typeof Clerk !== 'undefined' && Clerk.user;
                
                if (!isSignedIn) {
                    if (typeof Clerk !== 'undefined') {
                        try {
                            Clerk.openSignIn();
                        } catch (e) {
                            // Ignore errors from trying to open sign-in
                            console.warn('Could not open sign-in modal:', e.message);
                        }
                    } else {
                        window.location.href = '/login.html';
                    }
                }
                throw new Error('Authentication required');
            }
            
            // Parse response
            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }
            
            return data;
            
        } catch (error) {
            // Don't log auth-related errors that are expected
            if (!error.message?.includes('Authentication required')) {
                console.error(`API Error [${endpoint}]:`, error);
            }
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post(endpoint, data) {
        return this.request(endpoint, { method: 'POST', body: data });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, { method: 'PUT', body: data });
    },
    
    patch(endpoint, data) {
        return this.request(endpoint, { method: 'PATCH', body: data });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // ============================================
    // Auth Endpoints
    // ============================================
    
    auth: {
        async getUser() {
            return API.get('/auth/me');
        },
        
        async status() {
            return API.get('/auth/status');
        },
        
        async sync() {
            return API.post('/auth/sync');
        }
    },
    
    // ============================================
    // Jobs Endpoints
    // ============================================
    
    jobs: {
        async list(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.get(`/jobs${query ? '?' + query : ''}`);
        },
        
        async get(id) {
            return API.get(`/jobs/${id}`);
        },
        
        async create(data) {
            return API.post('/jobs', data);
        },
        
        async update(id, data) {
            return API.put(`/jobs/${id}`, data);
        },
        
        async updateStatus(id, status) {
            return API.patch(`/jobs/${id}/status`, { status });
        },
        
        async delete(id) {
            return API.delete(`/jobs/${id}`);
        },
        
        async autosave(id, formDataSnapshot) {
            return API.post(`/jobs/${id}/autosave`, { formDataSnapshot });
        }
    },
    
    // ============================================
    // Crew Endpoints
    // ============================================
    
    crew: {
        async list(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.get(`/crew${query ? '?' + query : ''}`);
        },
        
        async get(id) {
            return API.get(`/crew/${id}`);
        },
        
        async create(data) {
            return API.post('/crew', data);
        },
        
        async update(id, data) {
            return API.put(`/crew/${id}`, data);
        },
        
        async delete(id) {
            return API.delete(`/crew/${id}`);
        },
        
        async bulkSave(members) {
            return API.post('/crew/bulk', { members });
        },
        
        async getExpiring(days = 30) {
            return API.get(`/crew/check/expiring?days=${days}`);
        }
    },
    
    // ============================================
    // Vessels Endpoints
    // ============================================
    
    vessels: {
        async list(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.get(`/vessels${query ? '?' + query : ''}`);
        },
        
        async get(id) {
            return API.get(`/vessels/${id}`);
        },
        
        async getByImo(imo) {
            return API.get(`/vessels/imo/${imo}`);
        },
        
        async create(data) {
            return API.post('/vessels', data);
        },
        
        async update(id, data) {
            return API.put(`/vessels/${id}`, data);
        },
        
        async delete(id) {
            return API.delete(`/vessels/${id}`);
        },
        
        async lookup(params) {
            return API.post('/vessels/lookup', params);
        }
    },
    
    // ============================================
    // User/Settings Endpoints
    // ============================================
    
    user: {
        async getProfile() {
            return API.get('/users/profile');
        },
        
        async updateProfile(data) {
            return API.put('/users/profile', data);
        },
        
        async getSettings() {
            return API.get('/users/settings');
        },
        
        async updateSettings(data) {
            return API.put('/users/settings', data);
        },
        
        async getDashboard() {
            return API.get('/users/dashboard');
        }
    },
    
    // ============================================
    // Health Check
    // ============================================
    
    async health() {
        return this.get('/health');
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.API = API;
}
