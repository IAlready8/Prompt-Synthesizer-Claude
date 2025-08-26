/**

- Database Management Class for ChatGPT Q&A Synthesizer
- Handles data persistence, validation, and CRUD operations
  */

import {
generateId,
validateQAData,
deepClone,
storage,
errorHandler,
performanceMonitor
} from ‘./utils.js’;

export class QADatabase {
constructor() {
this.data = {
qas: [],
folders: [‘all’, ‘favorites’, ‘archive’, ‘default’],
categories: [
‘general’, ‘coding’, ‘business’, ‘marketing’, ‘design’,
‘productivity’, ‘ai’, ‘career’, ‘education’, ‘finance’,
‘health’, ‘lifestyle’
],
settings: {
currentFolder: ‘all’,
currentCategory: ‘’,
sortBy: ‘newest’,
searchTerm: ‘’,
viewMode: ‘grid’
},
metadata: {
version: ‘2.0’,
createdAt: Date.now(),
lastModified: Date.now()
}
};

```
    this.observers = new Map();
    this.isLoading = false;
    this.isDirty = false;
    this.autoSaveTimeout = null;
    
    this.categoryKeywords = {
        coding: [
            'code', 'programming', 'javascript', 'python', 'react', 'html', 'css',
            'function', 'api', 'database', 'algorithm', 'debug', 'git', 'nodejs',
            'typescript', 'vue', 'angular', 'php', 'java', 'c++', 'sql', 'github'
        ],
        business: [
            'business', 'strategy', 'company', 'startup', 'management', 'leadership',
            'enterprise', 'profit', 'revenue', 'growth', 'operations', 'team',
            'project', 'planning', 'goals', 'kpi', 'metrics', 'roi', 'budget'
        ],
        marketing: [
            'marketing', 'advertising', 'brand', 'customer', 'social media', 'campaign',
            'content', 'seo', 'conversion', 'funnel', 'analytics', 'engagement',
            'influencer', 'email', 'copywriting', 'cta', 'landing page', 'traffic'
        ],
        design: [
            'design', 'ui', 'ux', 'layout', 'visual', 'color', 'typography',
            'interface', 'wireframe', 'prototype', 'figma', 'photoshop', 'branding',
            'logo', 'illustration', 'graphic', 'user experience', 'usability'
        ],
        productivity: [
            'productivity', 'time management', 'organization', 'efficiency', 'workflow',
            'task', 'planning', 'goals', 'focus', 'habits', 'automation', 'tools',
            'calendar', 'todo', 'getting things done', 'pomodoro', 'optimization'
        ],
        ai: [
            'ai', 'artificial intelligence', 'machine learning', 'neural', 'model',
            'gpt', 'chatbot', 'automation', 'nlp', 'deep learning', 'tensorflow',
            'pytorch', 'data science', 'algorithm', 'computer vision', 'robotics'
        ],
        career: [
            'career', 'job', 'interview', 'resume', 'professional', 'skill',
            'workplace', 'promotion', 'networking', 'linkedin', 'salary',
            'development', 'training', 'certification', 'portfolio', 'cv'
        ],
        education: [
            'education', 'learning', 'study', 'teach', 'course', 'training',
            'knowledge', 'university', 'research', 'academic', 'curriculum',
            'online learning', 'mooc', 'tutorial', 'certification', 'degree'
        ],
        finance: [
            'finance', 'money', 'investment', 'budget', 'financial', 'economy',
            'market', 'trading', 'crypto', 'stock', 'portfolio', 'banking',
            'loan', 'debt', 'savings', 'retirement', 'tax', 'insurance'
        ],
        health: [
            'health', 'wellness', 'fitness', 'medical', 'mental health', 'exercise',
            'nutrition', 'diet', 'sleep', 'stress', 'meditation', 'yoga',
            'therapy', 'doctor', 'medicine', 'healthcare', 'wellbeing'
        ],
        lifestyle: [
            'lifestyle', 'life', 'personal', 'habit', 'routine', 'balance',
            'self-improvement', 'motivation', 'happiness', 'relationships',
            'family', 'home', 'travel', 'hobbies', 'entertainment', 'leisure'
        ]
    };

    this.init();
}

// Initialize the database
async init() {
    this.isLoading = true;
    
    try {
        await this.loadData();
        this.validateData();
        this.setupAutoSave();
        
        // Add sample data if empty
        if (this.data.qas.length === 0) {
            this.addSampleData();
        }
        
        this.emit('initialized', this.data);
    } catch (error) {
        errorHandler.log(error, 'Database initialization');
        this.addSampleData(); // Fallback to sample data
    } finally {
        this.isLoading = false;
    }
}

// Event system for reactive updates
on(event, callback) {
    if (!this.observers.has(event)) {
        this.observers.set(event, new Set());
    }
    this.observers.get(event).add(callback);
}

off(event, callback) {
    if (this.observers.has(event)) {
        this.observers.get(event).delete(callback);
    }
}

emit(event, data) {
    if (this.observers.has(event)) {
        this.observers.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                errorHandler.log(error, `Event callback for ${event}`);
            }
        });
    }
}

// Load data from localStorage
async loadData() {
    return performanceMonitor.measure('loadData', () => {
        const savedData = storage.get('data');
        
        if (savedData) {
            // Validate and merge saved data
            const validation = validateQAData(savedData);
            if (validation.isValid) {
                this.data = { ...this.data, ...savedData };
                this.data.metadata.lastModified = Date.now();
            } else {
                console.warn('Invalid saved data:', validation.errors);
                // Keep default data
            }
        }
        
        return this.data;
    });
}

// Save data to localStorage
async saveData(force = false) {
    if (!this.isDirty && !force) return true;

    return performanceMonitor.measure('saveData', () => {
        try {
            this.data.metadata.lastModified = Date.now();
            const success = storage.set('data', this.data);
            
            if (success) {
                this.isDirty = false;
                this.emit('saved', this.data);
                return true;
            } else {
                throw new Error('Failed to save to localStorage');
            }
        } catch (error) {
            errorHandler.log(error, 'saveData');
            this.emit('saveError', error);
            return false;
        }
    });
}

// Setup auto-save functionality
setupAutoSave() {
    const autoSave = () => {
        if (this.isDirty) {
            this.saveData();
        }
    };

    // Auto-save every 30 seconds if dirty
    setInterval(autoSave, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
        if (this.isDirty) {
            this.saveData();
        }
    });
}

// Mark data as dirty and schedule auto-save
markDirty() {
    this.isDirty = true;
    
    // Debounced save - save after 2 seconds of inactivity
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
        this.saveData();
    }, 2000);
}

// Validate data integrity
validateData() {
    const validation = validateQAData(this.data);
    if (!validation.isValid) {
        console.warn('Data validation issues:', validation.errors);
        // Could implement auto-repair logic here
    }
    return validation;
}

// Categorize a prompt based on keywords
categorizePrompt(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    let maxMatches = 0;
    let bestCategory = 'general';

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
        const matches = keywords.filter(keyword => 
            lowerPrompt.includes(keyword.toLowerCase())
        ).length;
        
        if (matches > maxMatches) {
            maxMatches = matches;
            bestCategory = category;
        }
    }

    return bestCategory;
}

// Generate tags from prompt text
generateTags(prompt, category) {
    const words = prompt.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5);

    const categoryKeywords = this.categoryKeywords[category] || [];
    const relevantKeywords = categoryKeywords.filter(keyword => 
        prompt.toLowerCase().includes(keyword)
    ).slice(0, 3);

    return [...new Set([category, ...relevantKeywords, ...words])];
}

// Add a new prompt
addPrompt(question, answer = null, options = {}) {
    return performanceMonitor.measure('addPrompt', () => {
        const category = options.category || this.categorizePrompt(question);
        const tags = options.tags || this.generateTags(question, category);
        
        const generatedAnswer = answer || this.generateAnswer(question, category);
        
        const newQA = {
            id: generateId('qa_'),
            question: question.trim(),
            answer: generatedAnswer,
            category,
            tags: [...new Set(tags)],
            folder: options.folder || 'default',
            rating: options.rating || 0,
            views: 0,
            score: options.score || Math.floor(Math.random() * 3) + 7, // 7-10
            timestamp: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.data.qas.unshift(newQA);
        this.markDirty();
        this.emit('promptAdded', newQA);
        
        return newQA;
    });
}

// Generate a contextual answer based on question and category
generateAnswer(question, category) {
    const templates = {
        coding: `Here's a comprehensive solution for "${question}":\n\n**Approach:**\n1. Analyze the requirements\n2. Choose the appropriate technology/method\n3. Implement the solution\n4. Test and optimize\n\n**Code Example:**\n\`\`\`javascript\n// Implementation would go here\n// This is a placeholder for the actual solution\n\`\`\`\n\n**Best Practices:**\n- Follow coding standards\n- Add proper error handling\n- Include comprehensive tests\n- Document your code\n\n**Additional Resources:**\n- Official documentation\n- Community best practices\n- Testing frameworks`,
        
        business: `Strategic response to "${question}":\n\n**Analysis:**\nThis question touches on key business fundamentals that require both strategic thinking and practical implementation.\n\n**Key Considerations:**\n• Market dynamics and competitive landscape\n• Resource allocation and ROI\n• Risk assessment and mitigation\n• Stakeholder alignment and communication\n\n**Recommended Approach:**\n1. Conduct thorough analysis\n2. Develop strategic options\n3. Create implementation roadmap\n4. Monitor and adjust\n\n**Success Metrics:**\n- Define clear KPIs\n- Regular progress reviews\n- Stakeholder feedback loops`,
        
        marketing: `Marketing strategy for "${question}":\n\n**Campaign Framework:**\n\n**Target Audience:**\n- Demographics and psychographics\n- Pain points and motivations\n- Preferred channels and touchpoints\n\n**Messaging Strategy:**\n- Core value proposition\n- Key benefits and differentiators\n- Call-to-action optimization\n\n**Channel Mix:**\n• Digital: SEO, SEM, Social Media, Email\n• Traditional: PR, Events, Partnerships\n• Content: Blog, Video, Podcasts, Webinars\n\n**Measurement & Optimization:**\n- Conversion tracking\n- A/B testing\n- ROI analysis\n- Campaign iteration`,
        
        design: `Design solution for "${question}":\n\n**Design Process:**\n\n**1. Research & Discovery**\n- User research and personas\n- Competitive analysis\n- Requirements gathering\n\n**2. Ideation & Concepts**\n- Brainstorming sessions\n- Sketching and wireframes\n- Concept validation\n\n**3. Design & Prototyping**\n- Visual design\n- Interactive prototypes\n- Design system integration\n\n**4. Testing & Iteration**\n- User testing\n- Stakeholder feedback\n- Design refinement\n\n**Design Principles:**\n- User-centered approach\n- Accessibility compliance\n- Scalable and maintainable\n- Brand alignment`,
        
        default: `Comprehensive response to "${question}":\n\n**Overview:**\nThis is an important question that requires careful consideration of multiple factors and approaches.\n\n**Key Points:**\n• Context and background analysis\n• Multiple solution approaches\n• Implementation considerations\n• Potential challenges and solutions\n\n**Recommended Steps:**\n1. Gather all relevant information\n2. Evaluate different options\n3. Choose the best approach\n4. Create an action plan\n5. Execute and monitor progress\n\n**Additional Considerations:**\n- Resource requirements\n- Timeline and milestones\n- Success metrics\n- Risk management\n\nThis answer provides a structured approach while acknowledging that specific details would depend on your particular situation and constraints.`
    };

    return templates[category] || templates.default;
}

// Update an existing prompt
updatePrompt(id, updates) {
    return performanceMonitor.measure('updatePrompt', () => {
        const index = this.data.qas.findIndex(qa => qa.id === id);
        if (index === -1) {
            throw new Error(`Prompt with id ${id} not found`);
        }

        const existingQA = this.data.qas[index];
        const updatedQA = {
            ...existingQA,
            ...updates,
            updatedAt: Date.now()
        };

        // Re-categorize if question changed
        if (updates.question && updates.question !== existingQA.question) {
            updatedQA.category = updates.category || this.categorizePrompt(updates.question);
            updatedQA.tags = updates.tags || this.generateTags(updates.question, updatedQA.category);
        }

        this.data.qas[index] = updatedQA;
        this.markDirty();
        this.emit('promptUpdated', updatedQA);
        
        return updatedQA;
    });
}

// Delete a prompt
deletePrompt(id) {
    return performanceMonitor.measure('deletePrompt', () => {
        const index = this.data.qas.findIndex(qa => qa.id === id);
        if (index === -1) {
            throw new Error(`Prompt with id ${id} not found`);
        }

        const deletedQA = this.data.qas.splice(index, 1)[0];
        this.markDirty();
        this.emit('promptDeleted', deletedQA);
        
        return deletedQA;
    });
}

// Get a single prompt by ID
getPrompt(id) {
    return this.data.qas.find(qa => qa.id === id);
}

// Get filtered and sorted prompts
getPrompts(filters = {}) {
    return performanceMonitor.measure('getPrompts', () => {
        let filtered = [...this.data.qas];

        // Apply filters
        if (filters.folder && filters.folder !== 'all') {
            filtered = filtered.filter(qa => qa.folder === filters.folder);
        }

        if (filters.category) {
            filtered = filtered.filter(qa => qa.category === filters.category);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(qa => 
                qa.question.toLowerCase().includes(searchTerm) ||
                qa.answer.toLowerCase().includes(searchTerm) ||
                qa.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        if (filters.rating) {
            filtered = filtered.filter(qa => qa.rating >= filters.rating);
        }

        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            filtered = filtered.filter(qa => 
                qa.timestamp >= start && qa.timestamp <= end
            );
        }

        // Apply sorting
        const sortBy = filters.sortBy || 'newest';
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return b.timestamp - a.timestamp;
                case 'oldest':
                    return a.timestamp - b.timestamp;
                case 'mostViewed':
                    return b.views - a.views;
                case 'rating':
                    return b.rating - a.rating;
                case 'alphabetical':
                    return a.question.localeCompare(b.question);
                default:
                    return 0;
            }
        });

        return filtered;
    });
}

// Increment view count
incrementViews(id) {
    const qa = this.getPrompt(id);
    if (qa) {
        qa.views++;
        qa.updatedAt = Date.now();
        this.markDirty();
        this.emit('viewsIncremented', qa);
    }
}

// Update rating
updateRating(id, rating) {
    const qa = this.getPrompt(id);
    if (qa) {
        qa.rating = Math.max(0, Math.min(5, rating));
        qa.updatedAt = Date.now();
        this.markDirty();
        this.emit('ratingUpdated', qa);
    }
}

// Folder management
addFolder(name) {
    if (!this.data.folders.includes(name)) {
        this.data.folders.push(name);
        this.markDirty();
        this.emit('folderAdded', name);
        return true;
    }
    return false;
}

deleteFolder(name) {
    if (['all', 'favorites', 'archive', 'default'].includes(name)) {
        throw new Error('Cannot delete system folders');
    }

    const index = this.data.folders.indexOf(name);
    if (index > -1) {
        // Move all prompts from this folder to default
        this.data.qas.forEach(qa => {
            if (qa.folder === name) {
                qa.folder = 'default';
            }
        });

        this.data.folders.splice(index, 1);
        this.markDirty();
        this.emit('folderDeleted', name);
        return true;
    }
    return false;
}

// Move prompts to folder
moveToFolder(ids, folder) {
    const movedPrompts = [];
    ids.forEach(id => {
        const qa = this.getPrompt(id);
        if (qa) {
            qa.folder = folder;
            qa.updatedAt = Date.now();
            movedPrompts.push(qa);
        }
    });

    if (movedPrompts.length > 0) {
        this.markDirty();
        this.emit('promptsMoved', { prompts: movedPrompts, folder });
    }

    return movedPrompts;
}

// Batch operations
batchDelete(ids) {
    const deletedPrompts = [];
    ids.forEach(id => {
        try {
            const deleted = this.deletePrompt(id);
            deletedPrompts.push(deleted);
        } catch (error) {
            errorHandler.log(error, `Batch delete prompt ${id}`);
        }
    });

    this.emit('batchDeleted', deletedPrompts);
    return deletedPrompts;
}

// Analytics
getAnalytics() {
    return performanceMonitor.measure('getAnalytics', () => {
        const qas = this.data.qas;
        const totalPrompts = qas.length;
        const totalViews = qas.reduce((sum, qa) => sum + qa.views, 0);
        const averageScore = totalPrompts > 0 ? 
            qas.reduce((sum, qa) => sum + qa.score, 0) / totalPrompts : 0;
        const averageRating = totalPrompts > 0 ? 
            qas.reduce((sum, qa) => sum + qa.rating, 0) / totalPrompts : 0;

        // Category distribution
        const categoryStats = {};
        qas.forEach(qa => {
            categoryStats[qa.category] = (categoryStats[qa.category] || 0) + 1;
        });

        // Folder distribution
        const folderStats = {};
        qas.forEach(qa => {
            folderStats[qa.folder] = (folderStats[qa.folder] || 0) + 1;
        });

        // Top categories by average score
        const categoryScores = {};
        qas.forEach(qa => {
            if (!categoryScores[qa.category]) {
                categoryScores[qa.category] = { total: 0, count: 0 };
            }
            categoryScores[qa.category].total += qa.score;
            categoryScores[qa.category].count++;
        });

        const topCategories = Object.entries(categoryScores)
            .map(([category, stats]) => ({
                category,
                averageScore: stats.total / stats.count,
                count: stats.count
            }))
            .sort((a, b) => b.averageScore - a.averageScore);

        // Recent activity (last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentPrompts = qas.filter(qa => qa.timestamp > thirtyDaysAgo);

        return {
            totalPrompts,
            totalViews,
            averageScore: Math.round(averageScore * 10) / 10,
            averageRating: Math.round(averageRating * 10) / 10,
            categoryStats,
            folderStats,
            topCategories,
            recentActivity: {
                count: recentPrompts.length,
                percentage: totalPrompts > 0 ? (recentPrompts.length / totalPrompts) * 100 : 0
            },
            storageSize: storage.size()
        };
    });
}

// Export data
exportData() {
    const exportData = {
        ...deepClone(this.data),
        exportedAt: Date.now(),
        exportVersion: '2.0'
    };

    return JSON.stringify(exportData, null, 2);
}

// Import data
async importData(jsonData, merge = false) {
    return performanceMonitor.measureAsync('importData', async () => {
        try {
            const importedData = JSON.parse(jsonData);
            const validation = validateQAData(importedData);

            if (!validation.isValid) {
                throw new Error(`Invalid data format: ${validation.errors.join(', ')}`);
            }

            if (merge) {
                // Merge imported data with existing data
                const existingIds = new Set(this.data.qas.map(qa => qa.id));
                const newQAs = importedData.qas.filter(qa => !existingIds.has(qa.id));
                
                this.data.qas.push(...newQAs);
                this.data.folders = [...new Set([...this.data.folders, ...importedData.folders])];
            } else {
                // Replace all data
                this.data = {
                    ...this.data,
                    ...importedData,
                    metadata: {
                        ...this.data.metadata,
                        lastModified: Date.now()
                    }
                };
            }

            this.markDirty();
            await this.saveData(true);
            this.emit('dataImported', this.data);

            return {
                success: true,
                imported: merge ? newQAs.length : importedData.qas.length,
                total: this.data.qas.length
            };
        } catch (error) {
            errorHandler.log(error, 'importData');
            throw error;
        }
    });
}

// Clear all data
clearData() {
    this.data = {
        qas: [],
        folders: ['all', 'favorites', 'archive', 'default'],
        categories: [...this.data.categories],
        settings: { ...this.data.settings },
        metadata: {
            version: '2.0',
            createdAt: Date.now(),
            lastModified: Date.now()
        }
    };

    this.markDirty();
    this.emit('dataCleared');
}

// Add sample data for demonstration
addSampleData() {
    const sampleQAs = [
        {
            question: "How do I implement a binary search algorithm in Python?",
            answer: "Here's a comprehensive guide to implementing binary search in Python:\n\n**Iterative Approach:**\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        \n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    \n    return -1\n```\n\n**Recursive Approach:**\n```python\ndef binary_search_recursive(arr, target, left=0, right=None):\n    if right is None:\n        right = len(arr) - 1\n    \n    if left > right:\n        return -1\n    \n    mid = (left + right) // 2\n    \n    if arr[mid] == target:\n        return mid\n    elif arr[mid] < target:\n        return binary_search_recursive(arr, target, mid + 1, right)\n    else:\n        return binary_search_recursive(arr, target, left, mid - 1)\n```\n\n**Time Complexity:** O(log n)\n**Space Complexity:** O(1) for iterative, O(log n) for recursive\n\n**Key Points:**\n- Array must be sorted\n- Excellent for large datasets\n- Much faster than linear search for sorted data",
            category: "coding",
            folder: "default"
        },
        {
            question: "What are the key principles of effective marketing strategy?",
            answer: "Effective marketing strategy is built on several fundamental principles:\n\n**1. Customer-Centric Approach**\n- Deep understanding of target audience\n- Customer journey mapping\n- Persona development and validation\n\n**2. Clear Value Proposition**\n- Unique selling proposition (USP)\n- Competitive differentiation\n- Benefit-focused messaging\n\n**3. Multi-Channel Integration**\n- Consistent brand experience\n- Channel optimization\n- Cross-platform synergy\n\n**4. Data-Driven Decision Making**\n- Analytics and metrics tracking\n- A/B testing and optimization\n- ROI measurement\n\n**5. Continuous Innovation**\n- Market trend analysis\n- Competitive intelligence\n- Agile strategy adaptation\n\n**Implementation Framework:**\n1. Market research and analysis\n2. Goal setting and KPI definition\n3. Strategy development\n4. Tactical execution\n5. Performance monitoring\n6. Optimization and iteration\n\n**Success Metrics:**\n- Brand awareness and recall\n- Lead generation and conversion\n- Customer acquisition cost (CAC)\n- Customer lifetime value (CLV)\n- Return on marketing investment (ROMI)",
            category: "marketing",
            folder: "favorites"
        },
        {
            question: "How can I improve my productivity while working remotely?",
            answer: "Remote work productivity requires intentional strategies and discipline:\n\n**Environment Setup:**\n• Dedicated workspace with proper ergonomics\n• Minimize distractions and interruptions\n• Optimal lighting and temperature\n• Reliable technology and internet connection\n\n**Time Management:**\n• Establish consistent daily routines\n• Use time-blocking for focused work sessions\n• Implement the Pomodoro Technique (25-min focused work + 5-min breaks)\n• Set clear boundaries between work and personal time\n\n**Communication & Collaboration:**\n• Overcommunicate with team members\n• Use collaborative tools effectively (Slack, Zoom, Asana)\n• Schedule regular check-ins and meetings\n• Be responsive and accessible during work hours\n\n**Health & Wellness:**\n• Take regular breaks and move around\n• Maintain social connections with colleagues\n• Practice stress management techniques\n• Separate work and living spaces when possible\n\n**Productivity Tools:**\n- Task management: Todoist, Notion, Trello\n- Time tracking: RescueTime, Toggl\n- Focus apps: Freedom, Cold Turkey\n- Communication: Slack, Microsoft Teams\n\n**Daily Habits:**\n1. Start with a morning routine\n2. Plan your day the night before\n3. Tackle most important tasks first\n4. Batch similar activities together\n5. End with a shutdown ritual\n\nRemember: Remote work success is about creating systems that work for your specific situation and consistently following them.",
            category: "productivity",
            folder: "default"
        }
    ];

    sampleQAs.forEach((sample, index) => {
        const qa = {
            id: generateId('sample_'),
            question: sample.question,
            answer: sample.answer,
            category: sample.category,
            tags: this.generateTags(sample.question, sample.category),
            folder: sample.folder,
            rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
            views: Math.floor(Math.random() * 50) + 10, // 10-60 views
            score: Math.floor(Math.random() * 3) + 7, // 7-10 score
            timestamp: Date.now() - (index * 86400000), // Spread over several days
            createdAt: Date.now() - (index * 86400000),
            updatedAt: Date.now() - (index * 86400000)
        };

        this.data.qas.push(qa);
    });

    this.markDirty();
    this.emit('sampleDataAdded', this.data.qas);
}

// Get current state
getState() {
    return {
        data: deepClone(this.data),
        isLoading: this.isLoading,
        isDirty: this.isDirty
    };
}

// Destroy and cleanup
destroy() {
    // Save any pending changes
    if (this.isDirty) {
        this.saveData();
    }

    // Clear timers
    clearTimeout(this.autoSaveTimeout);

    // Clear observers
    this.observers.clear();
}
```

}
