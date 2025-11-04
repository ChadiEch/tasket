// API configuration for Node.js backend
// Use relative URLs when using proxy, absolute URLs in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  // Add some debugging to see if token is being retrieved properly
  if (!token) {
    console.warn('No auth token found in localStorage');
  }
  return token;
}; 

// Set auth token in localStorage
const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// API request helper with authentication and progress tracking
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const config = {
    ...options,
  };

  // Set Authorization header if token exists
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }

  // Don't stringify body if it's FormData
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // Log the request for debugging
  console.log('API Request:', {
    url: `${API_BASE_URL}${endpoint}`,
    hasToken: !!token,
    headers: config.headers,
    body: config.body instanceof FormData ? 'FormData' : config.body
  });

  // For progress tracking, we need to use XMLHttpRequest instead of fetch
  if (config.onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          config.onUploadProgress(percentComplete);
        }
      });
      
      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `HTTP error! status: ${xhr.status}`));
          } catch (e) {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });
      
      // Open and send request
      xhr.open(config.method || 'GET', `${API_BASE_URL}${endpoint}`);
      
      // Set headers
      if (config.headers) {
        Object.keys(config.headers).forEach(key => {
          xhr.setRequestHeader(key, config.headers[key]);
        });
      }
      
      xhr.send(config.body);
    });
  } else {
    // Use fetch for requests without progress tracking
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Log the response for debugging
    console.log('API Response:', {
      url: `${API_BASE_URL}${endpoint}`,
      status: response.status,
      ok: response.ok
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      
      // Log the error for debugging
      console.error('API Error:', {
        url: `${API_BASE_URL}${endpoint}`,
        status: response.status,
        error: error
      });
      
      // Handle validation errors from express-validator
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(e => e.msg || e.message).join(', ');
        throw new Error(errorMessages);
      }
      
      // Handle single error message
      if (error.message) {
        throw new Error(error.message);
      }
      
      // Handle generic "invalid value" errors
      if (response.status === 400) {
        throw new Error('Invalid value provided for one or more fields. Please check your input and try again.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: { email, password },
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  register: async (email, password, name, position, department_id, phone) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: { email, password, name, position, department_id, phone },
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (profileData) => {
    // Check if we have a file to upload
    if (profileData.photo && profileData.photo instanceof File) {
      // Handle file upload with FormData
      const formData = new FormData();
      
      // Append all profile data as JSON string
      const { photo, ...otherData } = profileData;
      formData.append('data', JSON.stringify(otherData));
      formData.append('photo', photo);
      
      // For FormData requests, we don't set Content-Type header
      // Browser will set it with boundary automatically
      return apiRequest('/auth/profile', {
        method: 'PUT',
        body: formData,
      });
    } else {
      // Regular JSON request
      return apiRequest('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: profileData,
      });
    }
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiRequest(`/tasks?${queryParams}`);
  },

  getTask: async (id) => {
    return apiRequest(`/tasks/${id}`);
  },

  createTask: async (taskData) => {
    return apiRequest('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: taskData,
    });
  },

  updateTask: async (id, taskData) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: taskData,
    });
  },

  deleteTask: async (id) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

// Departments API
export const departmentsAPI = {
  getDepartments: async () => {
    return apiRequest('/departments');
  },

  getDepartment: async (id) => {
    return apiRequest(`/departments/${id}`);
  },

  createDepartment: async (departmentData) => {
    return apiRequest('/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: departmentData,
    });
  },

  updateDepartment: async (id, departmentData) => {
    return apiRequest(`/departments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: departmentData,
    });
  },

  deleteDepartment: async (id) => {
    return apiRequest(`/departments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Employees API
export const employeesAPI = {
  getEmployees: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiRequest(`/employees?${queryParams}`);
  },

  getEmployee: async (id) => {
    return apiRequest(`/employees/${id}`);
  },

  createEmployee: async (employeeData) => {
    return apiRequest('/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: employeeData,
    });
  },

  updateEmployee: async (id, employeeData) => {
    return apiRequest(`/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: employeeData,
    });
  },

  deleteEmployee: async (id) => {
    return apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    });
  },
};

// Projects API
export const projectsAPI = {
  getProjects: async () => {
    return apiRequest('/projects');
  },

  getProject: async (id) => {
    return apiRequest(`/projects/${id}`);
  },

  getProjectTasks: async (id, params = {}) => {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest(`/projects/${id}/tasks${queryString}`);
  },

  createProject: async (projectData) => {
    return apiRequest('/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: projectData,
    });
  },

  updateProject: async (id, projectData) => {
    return apiRequest(`/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: projectData,
    });
  },

  deleteProject: async (id) => {
    return apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiRequest(`/notifications?${queryParams}`);
  },

  markAsRead: async (id) => {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return apiRequest(`/notifications/read-all`, {
      method: 'PUT',
    });
  },

  deleteNotification: async (id) => {
    return apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper functions
export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const getCurrentUser = async () => {
  if (!isAuthenticated()) {
    return null;
  }
  
  try {
    const response = await authAPI.getProfile();
    return response.employee;
  } catch (error) {
    console.error('Error getting current user:', error);
    removeAuthToken();
    return null;
  }
};