import React from 'react';

const ProjectSelector = ({ projects, selectedProject, onProjectSelect }) => {
  // Ensure projects is an array to prevent errors
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="project-select" className="text-sm font-medium text-gray-700">
        Project:
      </label>
      <select
        id="project-select"
        value={selectedProject?.id || ''}
        onChange={(e) => {
          const projectId = e.target.value;
          const project = safeProjects.find(p => p.id === projectId) || null;
          onProjectSelect(project);
        }}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="">All Projects</option>
        {safeProjects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title} {/* Changed from project.name to project.title */}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProjectSelector;