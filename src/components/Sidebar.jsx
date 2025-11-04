import React from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { currentView, navigateTo } = useApp()
  const { employee, isAdmin, signOut } = useAuth()

  const adminMenuItems = [
    { 
      name: 'Dashboard', 
      key: 'dashboard',
      icon: 'chart-square-bar', 
      onClick: () => navigateTo('dashboard')
    },
    { 
      name: 'Projects', 
      key: 'projects',
      icon: 'folder', 
      onClick: () => navigateTo('projects')
    },
    { 
      name: 'Departments', 
      key: 'departments',
      icon: 'office-building', 
      onClick: () => navigateTo('departments')
    },
    { 
      name: 'Employees', 
      key: 'employees',
      icon: 'users', 
      onClick: () => navigateTo('employees')
    },
    { 
      name: 'Enhanced Calendar', 
      key: 'calendar',
      icon: 'calendar', 
      onClick: () => navigateTo('calendar')
    },
    { 
      name: 'My Tasks', 
      key: 'my-tasks',
      icon: 'clipboard-list', 
      onClick: () => navigateTo('my-tasks')
    },
    { 
      name: 'Notifications', 
      key: 'notifications',
      icon: 'bell', 
      onClick: () => navigateTo('notifications')
    },
    { 
      name: 'Reports', 
      key: 'reports',
      icon: 'chart-bar', 
      onClick: () => navigateTo('reports')
    },
    { 
      name: 'Trash', 
      key: 'trash',
      icon: 'trash', 
      onClick: () => navigateTo('trash')
    }
  ]

  const employeeMenuItems = [
    { 
      name: 'My Tasks', 
      key: 'calendar',
      icon: 'clipboard-list', 
      onClick: () => navigateTo('calendar')
    },
    { 
      name: 'Projects', 
      key: 'projects',
      icon: 'folder', 
      onClick: () => navigateTo('projects')
    },
    { 
      name: 'Notifications', 
      key: 'notifications',
      icon: 'bell', 
      onClick: () => navigateTo('notifications')
    },
    { 
      name: 'Profile', 
      key: 'profile',
      icon: 'user', 
      onClick: () => navigateTo('profile')
    },
    { 
      name: 'Trash', 
      key: 'trash',
      icon: 'trash', 
      onClick: () => navigateTo('trash')
    }
  ]

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
          <div>
            <div className="font-medium text-gray-900">{employee?.name || 'User'}</div>
            <div className="text-sm text-gray-500 capitalize">{employee?.role || 'employee'}</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={item.onClick}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  currentView === item.key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">
                  {item.icon === 'chart-square-bar' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {item.icon === 'folder' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                  {item.icon === 'office-building' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {item.icon === 'users' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {item.icon === 'calendar' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {item.icon === 'clipboard-list' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                  {item.icon === 'bell' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )}
                  {item.icon === 'chart-bar' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {item.icon === 'user' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {item.icon === 'trash' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </span>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default Sidebar