import React, { useState, useMemo } from 'react';
import { TechnologySelectorProps, TechnologyCategory } from '../../types';

// Predefined technologies as specified in requirements 4.11
const PREDEFINED_TECHNOLOGIES = [
  // Languages
  { id: 'javascript', name: 'JavaScript', category: TechnologyCategory.LANGUAGE },
  { id: 'typescript', name: 'TypeScript', category: TechnologyCategory.LANGUAGE },
  { id: 'python', name: 'Python', category: TechnologyCategory.LANGUAGE },
  { id: 'java', name: 'Java', category: TechnologyCategory.LANGUAGE },
  { id: 'csharp', name: 'C#', category: TechnologyCategory.LANGUAGE },
  { id: 'cpp', name: 'C++', category: TechnologyCategory.LANGUAGE },
  { id: 'go', name: 'Go', category: TechnologyCategory.LANGUAGE },
  { id: 'rust', name: 'Rust', category: TechnologyCategory.LANGUAGE },
  { id: 'php', name: 'PHP', category: TechnologyCategory.LANGUAGE },
  { id: 'ruby', name: 'Ruby', category: TechnologyCategory.LANGUAGE },
  
  // Frameworks
  { id: 'react', name: 'React', category: TechnologyCategory.FRAMEWORK },
  { id: 'vue', name: 'Vue.js', category: TechnologyCategory.FRAMEWORK },
  { id: 'angular', name: 'Angular', category: TechnologyCategory.FRAMEWORK },
  { id: 'nodejs', name: 'Node.js', category: TechnologyCategory.FRAMEWORK },
  { id: 'express', name: 'Express', category: TechnologyCategory.FRAMEWORK },
  { id: 'nextjs', name: 'Next.js', category: TechnologyCategory.FRAMEWORK },
  { id: 'django', name: 'Django', category: TechnologyCategory.FRAMEWORK },
  { id: 'flask', name: 'Flask', category: TechnologyCategory.FRAMEWORK },
  { id: 'spring', name: 'Spring Boot', category: TechnologyCategory.FRAMEWORK },
  { id: 'dotnet', name: '.NET', category: TechnologyCategory.FRAMEWORK },
  
  // Databases
  { id: 'mongodb', name: 'MongoDB', category: TechnologyCategory.DATABASE },
  { id: 'postgresql', name: 'PostgreSQL', category: TechnologyCategory.DATABASE },
  { id: 'mysql', name: 'MySQL', category: TechnologyCategory.DATABASE },
  { id: 'redis', name: 'Redis', category: TechnologyCategory.DATABASE },
  { id: 'sqlite', name: 'SQLite', category: TechnologyCategory.DATABASE },
  { id: 'firebase', name: 'Firebase', category: TechnologyCategory.DATABASE },
  
  // Tools
  { id: 'git', name: 'Git', category: TechnologyCategory.TOOL },
  { id: 'docker', name: 'Docker', category: TechnologyCategory.TOOL },
  { id: 'kubernetes', name: 'Kubernetes', category: TechnologyCategory.TOOL },
  { id: 'webpack', name: 'Webpack', category: TechnologyCategory.TOOL },
  { id: 'vite', name: 'Vite', category: TechnologyCategory.TOOL },
  { id: 'jest', name: 'Jest', category: TechnologyCategory.TOOL },
  { id: 'cypress', name: 'Cypress', category: TechnologyCategory.TOOL },
  
  // Cloud
  { id: 'aws', name: 'AWS', category: TechnologyCategory.CLOUD },
  { id: 'azure', name: 'Azure', category: TechnologyCategory.CLOUD },
  { id: 'gcp', name: 'Google Cloud', category: TechnologyCategory.CLOUD },
  { id: 'vercel', name: 'Vercel', category: TechnologyCategory.CLOUD },
  { id: 'netlify', name: 'Netlify', category: TechnologyCategory.CLOUD },
  { id: 'heroku', name: 'Heroku', category: TechnologyCategory.CLOUD },
];

const CATEGORY_LABELS = {
  [TechnologyCategory.LANGUAGE]: 'Languages',
  [TechnologyCategory.FRAMEWORK]: 'Frameworks',
  [TechnologyCategory.DATABASE]: 'Databases',
  [TechnologyCategory.TOOL]: 'Tools',
  [TechnologyCategory.CLOUD]: 'Cloud',
  [TechnologyCategory.OTHER]: 'Other',
};

const TechnologySelector: React.FC<TechnologySelectorProps> = ({
  selectedTechnologies,
  onSelectionChange,
  availableTechnologies: _availableTechnologies, // Use predefined list instead
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TechnologyCategory | 'all'>('all');

  // Use predefined technologies instead of prop
  const technologies = PREDEFINED_TECHNOLOGIES;

  // Filter technologies based on search term and category
  const filteredTechnologies = useMemo(() => {
    return technologies.filter(tech => {
      const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tech.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, technologies]);

  // Group technologies by category
  const technologiesByCategory = useMemo(() => {
    const grouped: Record<TechnologyCategory, typeof technologies> = {
      [TechnologyCategory.LANGUAGE]: [],
      [TechnologyCategory.FRAMEWORK]: [],
      [TechnologyCategory.DATABASE]: [],
      [TechnologyCategory.TOOL]: [],
      [TechnologyCategory.CLOUD]: [],
      [TechnologyCategory.OTHER]: [],
    };

    filteredTechnologies.forEach(tech => {
      grouped[tech.category].push(tech);
    });

    return grouped;
  }, [filteredTechnologies]);

  const handleTechnologyToggle = (technologyId: string) => {
    const isSelected = selectedTechnologies.includes(technologyId);
    
    if (isSelected) {
      onSelectionChange(selectedTechnologies.filter(id => id !== technologyId));
    } else {
      onSelectionChange([...selectedTechnologies, technologyId]);
    }
  };

  const clearAllSelections = () => {
    onSelectionChange([]);
  };

  const getSelectedTechnologyNames = () => {
    return selectedTechnologies
      .map(id => technologies.find(tech => tech.id === id)?.name)
      .filter(Boolean);
  };

  return (
    <fieldset className="space-y-4">
      <div className="flex items-center justify-between">
        <legend className="text-lg font-medium text-gray-900">Technology Skills</legend>
        {selectedTechnologies.length > 0 && (
          <button
            type="button"
            onClick={clearAllSelections}
            className="text-sm text-indigo-600 hover:text-indigo-500"
            aria-label={`Clear all ${selectedTechnologies.length} selected technologies`}
          >
            Clear all ({selectedTechnologies.length})
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-600">
        Select the technologies you're familiar with or interested in learning.
      </p>

      {/* Search and Filter Controls */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search technologies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            aria-label="Search technologies"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter technologies by category">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={selectedCategory === 'all'}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category as TechnologyCategory)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedCategory === category}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Technologies Summary */}
      {selectedTechnologies.length > 0 && (
        <div className="bg-indigo-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-indigo-900 mb-2">
            Selected Technologies ({selectedTechnologies.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {getSelectedTechnologyNames().map((name, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technology Grid by Category */}
      <div className="space-y-6">
        {Object.entries(technologiesByCategory).map(([category, techs]) => {
          if (techs.length === 0) return null;
          
          return (
            <div key={category}>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                {CATEGORY_LABELS[category as TechnologyCategory]}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {techs.map((tech) => {
                  const isSelected = selectedTechnologies.includes(tech.id);
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => handleTechnologyToggle(tech.id)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Remove' : 'Add'} ${tech.name} technology skill`}
                    >
                      <div className="flex items-center justify-center">
                        {isSelected && (
                          <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{tech.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results Message */}
      {filteredTechnologies.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20.5a7.962 7.962 0 01-5.207-1.209m0 0L9 12m0 0L6.828 9.828M9 12l8.485 8.485" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No technologies found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </fieldset>
  );
};

export default TechnologySelector;