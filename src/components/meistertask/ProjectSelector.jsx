import React from 'react';

const ProjectSelector = ({ projects, selectedProject, onProjectSelect }) => {
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
          const project = projects.find(p => p.id === projectId) || null;
          onProjectSelect(project);
        }}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="">All Projects</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProjectSelector;