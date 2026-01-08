/**
 * Authentication State Management with Clerk
 * https://clerk.com/docs
 */

const AuthState = {
    user: null,
    clerkUser: null,
    initialized: false,
    listeners: [],
    
    // ============================================
    // Initialization
    // ============================================
    
    async init() {
        if (this.initialized) return this.user;
        
        // Wait for Clerk to load
        if (typeof Clerk === 'undefined') {
            console.warn('Clerk not loaded - running in unauthenticated mode');
            this.initialized = true;
            return null;
        }
        
        try {
            // Wait for Clerk to be ready
            await Clerk.load();
            
            // Get current user from Clerk
            this.clerkUser = Clerk.user;
            
            if (this.clerkUser) {
                // Sync with our backend
                try {
                    const response = await API.auth.getUser();
                    if (response.authenticated && response.user) {
                        this.setUser(response.user);
                    } else {
                        // Sync user to backend
                        await API.auth.sync().catch(() => {});
                        const syncResponse = await API.auth.getUser().catch(() => ({}));
                        if (syncResponse.user) {
                            this.setUser(syncResponse.user);
                        }
                    }
                } catch (e) {
                    // Ignore auth errors - use Clerk user info as fallback
                    // Still set basic user info from Clerk
                    this.setUser({
                        email: this.clerkUser.emailAddresses[0]?.emailAddress,
                        name: this.clerkUser.fullName,
                        picture: this.clerkUser.imageUrl
                    });
                }
            }
            
            // Listen for Clerk auth changes
            Clerk.addListener(({ user }) => {
                if (user) {
                    this.clerkUser = user;
                    // Silently try to sync - don't break if it fails
                    API.auth.sync()
                        .then(() => API.auth.getUser())
                        .then(response => {
                            if (response?.user) {
                                this.setUser(response.user);
                            }
                        })
                        .catch(() => {
                            // Use Clerk user info as fallback
                            this.setUser({
                                email: user.emailAddresses?.[0]?.emailAddress,
                                name: user.fullName,
                                picture: user.imageUrl
                            });
                        });
                } else {
                    this.setUser(null);
                    this.clerkUser = null;
                }
            });
            
        } catch (error) {
            console.error('Auth init error:', error);
        }
        
        this.initialized = true;
        this.updateUI();
        return this.user;
    },
    
    // ============================================
    // State Management
    // ============================================
    
    setUser(user) {
        this.user = user;
        this.notifyListeners();
        this.updateUI();
    },
    
    getUser() {
        return this.user;
    },
    
    isAuthenticated() {
        return !!this.clerkUser || !!this.user;
    },
    
    hasRole(role) {
        return this.user?.role === role;
    },
    
    isAdmin() {
        return this.hasRole('ADMIN');
    },
    
    // ============================================
    // Listeners
    // ============================================
    
    onChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    },
    
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.user));
    },
    
    // ============================================
    // Actions (using Clerk)
    // ============================================
    
    async signIn() {
        try {
            if (typeof Clerk !== 'undefined') {
                // Ensure Clerk is loaded before opening sign in
                if (!Clerk.loaded) {
                    await Clerk.load();
                }
                await Clerk.openSignIn({
                    redirectUrl: window.location.href
                });
            } else {
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Sign in error:', error);
            window.location.href = '/login.html';
        }
    },
    
    async signUp() {
        try {
            if (typeof Clerk !== 'undefined') {
                // Ensure Clerk is loaded before opening sign up
                if (!Clerk.loaded) {
                    await Clerk.load();
                }
                await Clerk.openSignUp({
                    redirectUrl: window.location.href
                });
            } else {
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Sign up error:', error);
            window.location.href = '/login.html';
        }
    },
    
    async signOut() {
        try {
            if (typeof Clerk !== 'undefined') {
                await Clerk.signOut();
            }
            this.setUser(null);
            this.clerkUser = null;
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out error:', error);
            window.location.href = '/';
        }
    },
    
    openUserProfile() {
        if (typeof Clerk !== 'undefined') {
            Clerk.openUserProfile();
        }
    },
    
    // ============================================
    // UI Updates
    // ============================================
    
    updateUI() {
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');
        const userAvatarLargeEl = document.getElementById('userAvatarLarge');
        const userNameFullEl = document.getElementById('userNameFull');
        const authContainerEl = document.getElementById('authContainer');
        const loginBtnEl = document.getElementById('loginBtn');
        const userMenuEl = document.getElementById('userMenu');
        
        const displayUser = this.user || (this.clerkUser ? {
            email: this.clerkUser.emailAddresses?.[0]?.emailAddress,
            name: this.clerkUser.fullName || this.clerkUser.firstName,
            picture: this.clerkUser.imageUrl
        } : null);
        
        if (displayUser) {
            // Show user info
            if (userNameEl) userNameEl.textContent = displayUser.name || 'User';
            if (userEmailEl) userEmailEl.textContent = displayUser.email || '';
            if (userNameFullEl) userNameFullEl.textContent = displayUser.name || 'User';
            if (userAvatarEl) {
                userAvatarEl.src = displayUser.picture || '/img/default-avatar.png';
                userAvatarEl.alt = displayUser.name || 'User';
            }
            if (userAvatarLargeEl) {
                userAvatarLargeEl.src = displayUser.picture || '/img/default-avatar.png';
            }
            
            // Show/hide elements
            if (loginBtnEl) loginBtnEl.style.display = 'none';
            if (userMenuEl) userMenuEl.style.display = 'flex';
            if (authContainerEl) authContainerEl.classList.add('authenticated');
            
        } else {
            // Clear user info
            if (userNameEl) userNameEl.textContent = '';
            if (userEmailEl) userEmailEl.textContent = '';
            if (userAvatarEl) userAvatarEl.src = '/img/default-avatar.png';
            
            // Show/hide elements
            if (loginBtnEl) loginBtnEl.style.display = 'block';
            if (userMenuEl) userMenuEl.style.display = 'none';
            if (authContainerEl) authContainerEl.classList.remove('authenticated');
        }
    },
    
    // ============================================
    // Route Protection
    // ============================================
    
    requireAuth() {
        if (!this.initialized) {
            console.warn('AuthState not initialized yet');
            return false;
        }
        
        if (!this.isAuthenticated()) {
            sessionStorage.setItem('returnUrl', window.location.href);
            this.signIn();
            return false;
        }
        
        return true;
    },
    
    getReturnUrl() {
        return sessionStorage.getItem('returnUrl') || '/';
    },
    
    clearReturnUrl() {
        sessionStorage.removeItem('returnUrl');
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AuthState = AuthState;
}

