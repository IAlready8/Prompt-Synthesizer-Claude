/**

- Utility Functions for ChatGPT Q&A Synthesizer
- Provides security, performance, and accessibility utilities
  */

// Debounce function to limit function calls
export function debounce(func, wait, immediate = false) {
let timeout;
return function executedFunction(…args) {
const later = () => {
timeout = null;
if (!immediate) func.apply(this, args);
};
const callNow = immediate && !timeout;
clearTimeout(timeout);
timeout = setTimeout(later, wait);
if (callNow) func.apply(this, args);
};
}

// Throttle function to limit function calls per time period
export function throttle(func, limit) {
let inThrottle;
return function executedFunction(…args) {
if (!inThrottle) {
func.apply(this, args);
inThrottle = true;
setTimeout(() => inThrottle = false, limit);
}
};
}

// Generate unique IDs
export function generateId(prefix = ‘’) {
const timestamp = Date.now().toString(36);
const randomPart = Math.random().toString(36).substr(2, 9);
return `${prefix}${timestamp}_${randomPart}`;
}

// Sanitize HTML content to prevent XSS
export function sanitizeHTML(str) {
const temp = document.createElement(‘div’);
temp.textContent = str;
return temp.innerHTML;
}

// Escape HTML entities
export function escapeHTML(str) {
const div = document.createElement(‘div’);
div.appendChild(document.createTextNode(str));
return div.innerHTML;
}

// Unescape HTML entities
export function unescapeHTML(str) {
const div = document.createElement(‘div’);
div.innerHTML = str;
return div.textContent || div.innerText || ‘’;
}

// Format dates in a user-friendly way
export function formatDate(timestamp, options = {}) {
const date = new Date(timestamp);
const now = new Date();
const diff = now - date;

```
// Less than 1 minute
if (diff < 60000) {
    return 'Just now';
}

// Less than 1 hour
if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
}

// Less than 24 hours
if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

// Less than 7 days
if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Default to formatted date
return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
});
```

}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 100, suffix = ‘…’) {
if (!text || text.length <= maxLength) return text;
return text.substr(0, maxLength).trim() + suffix;
}

// Pluralize words based on count
export function pluralize(word, count, suffix = ‘s’) {
return count === 1 ? word : word + suffix;
}

// Deep clone an object
export function deepClone(obj) {
if (obj === null || typeof obj !== ‘object’) return obj;
if (obj instanceof Date) return new Date(obj.getTime());
if (obj instanceof Array) return obj.map(item => deepClone(item));
if (typeof obj === ‘object’) {
const clonedObj = {};
for (const key in obj) {
if (obj.hasOwnProperty(key)) {
clonedObj[key] = deepClone(obj[key]);
}
}
return clonedObj;
}
}

// Validate JSON string
export function isValidJSON(str) {
try {
JSON.parse(str);
return true;
} catch (e) {
return false;
}
}

// Validate QA data structure
export function validateQAData(data) {
const errors = [];

```
if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { isValid: false, errors };
}

if (!Array.isArray(data.qas)) {
    errors.push('qas must be an array');
} else {
    data.qas.forEach((qa, index) => {
        if (!qa.id) errors.push(`QA ${index}: missing id`);
        if (!qa.question || typeof qa.question !== 'string') {
            errors.push(`QA ${index}: question must be a non-empty string`);
        }
        if (!qa.answer || typeof qa.answer !== 'string') {
            errors.push(`QA ${index}: answer must be a non-empty string`);
        }
        if (!qa.category || typeof qa.category !== 'string') {
            errors.push(`QA ${index}: category must be a non-empty string`);
        }
        if (qa.tags && !Array.isArray(qa.tags)) {
            errors.push(`QA ${index}: tags must be an array`);
        }
        if (qa.rating && (typeof qa.rating !== 'number' || qa.rating < 0 || qa.rating > 5)) {
            errors.push(`QA ${index}: rating must be a number between 0 and 5`);
        }
    });
}

if (data.folders && !Array.isArray(data.folders)) {
    errors.push('folders must be an array');
}

return {
    isValid: errors.length === 0,
    errors
};
```

}

// Copy text to clipboard
export async function copyToClipboard(text) {
try {
if (navigator.clipboard && window.isSecureContext) {
await navigator.clipboard.writeText(text);
return true;
} else {
// Fallback for older browsers
const textArea = document.createElement(‘textarea’);
textArea.value = text;
textArea.style.position = ‘fixed’;
textArea.style.left = ‘-999999px’;
textArea.style.top = ‘-999999px’;
document.body.appendChild(textArea);
textArea.focus();
textArea.select();
const result = document.execCommand(‘copy’);
document.body.removeChild(textArea);
return result;
}
} catch (error) {
console.error(‘Failed to copy to clipboard:’, error);
return false;
}
}

// Share using Web Share API or fallback to clipboard
export async function shareContent(data) {
if (navigator.share && navigator.canShare && navigator.canShare(data)) {
try {
await navigator.share(data);
return { success: true, method: ‘native’ };
} catch (error) {
if (error.name !== ‘AbortError’) {
console.error(‘Native sharing failed:’, error);
}
}
}

```
// Fallback to copying URL to clipboard
const shareText = data.url || `${data.title}\n\n${data.text}`;
const copied = await copyToClipboard(shareText);
return { 
    success: copied, 
    method: 'clipboard',
    message: copied ? 'Link copied to clipboard' : 'Failed to copy link'
};
```

}

// Download data as file
export function downloadData(data, filename, type = ‘application/json’) {
const blob = new Blob([data], { type });
const url = URL.createObjectURL(blob);
const link = document.createElement(‘a’);
link.href = url;
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
}

// Focus management for accessibility
export class FocusManager {
constructor() {
this.focusStack = [];
}

```
push(element) {
    this.focusStack.push(document.activeElement);
    if (element && element.focus) {
        element.focus();
    }
}

pop() {
    const previousElement = this.focusStack.pop();
    if (previousElement && previousElement.focus) {
        previousElement.focus();
    }
}

clear() {
    this.focusStack = [];
}
```

}

// Keyboard navigation helper
export function handleArrowNavigation(event, items, currentIndex, callback) {
const { key } = event;
let newIndex = currentIndex;

```
switch (key) {
    case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
    case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
    case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
    case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    default:
        return false;
}

if (callback) {
    callback(newIndex, items[newIndex]);
}

return true;
```

}

// Create element with attributes and children
export function createElement(tag, attributes = {}, children = []) {
const element = document.createElement(tag);

```
// Set attributes
Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
        element.className = value;
    } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
        });
    } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
        element.setAttribute(key, value);
    }
});

// Add children
children.forEach(child => {
    if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
        element.appendChild(child);
    }
});

return element;
```

}

// Virtual list implementation for performance
export class VirtualList {
constructor(container, itemHeight, renderItem, estimatedItemCount = 1000) {
this.container = container;
this.itemHeight = itemHeight;
this.renderItem = renderItem;
this.estimatedItemCount = estimatedItemCount;
this.items = [];
this.visibleItems = new Map();
this.scrollTop = 0;
this.containerHeight = 0;

```
    this.init();
}

init() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    this.scrollArea = document.createElement('div');
    this.scrollArea.style.position = 'absolute';
    this.scrollArea.style.top = '0';
    this.scrollArea.style.left = '0';
    this.scrollArea.style.width = '100%';
    this.container.appendChild(this.scrollArea);
    
    this.container.addEventListener('scroll', throttle(() => {
        this.handleScroll();
    }, 16)); // 60fps
    
    this.updateContainerHeight();
}

setItems(items) {
    this.items = items;
    this.updateScrollArea();
    this.render();
}

updateContainerHeight() {
    this.containerHeight = this.container.clientHeight;
}

updateScrollArea() {
    const totalHeight = this.items.length * this.itemHeight;
    this.scrollArea.style.height = `${totalHeight}px`;
}

handleScroll() {
    this.scrollTop = this.container.scrollTop;
    this.render();
}

render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
        startIndex + Math.ceil(this.containerHeight / this.itemHeight) + 1,
        this.items.length
    );
    
    // Remove items that are no longer visible
    for (const [index, element] of this.visibleItems) {
        if (index < startIndex || index >= endIndex) {
            element.remove();
            this.visibleItems.delete(index);
        }
    }
    
    // Add items that are now visible
    for (let i = startIndex; i < endIndex; i++) {
        if (!this.visibleItems.has(i) && this.items[i]) {
            const element = this.renderItem(this.items[i], i);
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.width = '100%';
            element.style.height = `${this.itemHeight}px`;
            
            this.scrollArea.appendChild(element);
            this.visibleItems.set(i, element);
        }
    }
}

scrollToIndex(index) {
    const targetScrollTop = index * this.itemHeight;
    this.container.scrollTop = targetScrollTop;
}

destroy() {
    this.visibleItems.clear();
    this.scrollArea.remove();
}
```

}

// Performance monitoring
export class PerformanceMonitor {
constructor() {
this.metrics = new Map();
}

```
start(label) {
    this.metrics.set(label, performance.now());
}

end(label) {
    const startTime = this.metrics.get(label);
    if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`${label}: ${duration.toFixed(2)}ms`);
        this.metrics.delete(label);
        return duration;
    }
    return null;
}

measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
}

async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
}
```

}

// Error handling and logging
export class ErrorHandler {
constructor() {
this.errors = [];
this.maxErrors = 100;
}

```
log(error, context = '') {
    const errorInfo = {
        message: error.message || error,
        stack: error.stack,
        context,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    this.errors.unshift(errorInfo);
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    console.error('Error logged:', errorInfo);
}

getErrors() {
    return [...this.errors];
}

clearErrors() {
    this.errors = [];
}

exportErrors() {
    return JSON.stringify(this.errors, null, 2);
}
```

}

// Local storage wrapper with error handling
export class Storage {
constructor(prefix = ‘qa_synthesizer_’) {
this.prefix = prefix;
}

```
set(key, value) {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(this.prefix + key, serialized);
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

get(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(this.prefix + key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to read from localStorage:', error);
        return defaultValue;
    }
}

remove(key) {
    try {
        localStorage.removeItem(this.prefix + key);
        return true;
    } catch (error) {
        console.error('Failed to remove from localStorage:', error);
        return false;
    }
}

clear() {
    try {
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith(this.prefix)
        );
        keys.forEach(key => localStorage.removeItem(key));
        return true;
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
        return false;
    }
}

size() {
    try {
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith(this.prefix)
        );
        return keys.reduce((total, key) => {
            return total + localStorage.getItem(key).length;
        }, 0);
    } catch (error) {
        console.error('Failed to calculate storage size:', error);
        return 0;
    }
}
```

}

// Initialize global instances
export const focusManager = new FocusManager();
export const performanceMonitor = new PerformanceMonitor();
export const errorHandler = new ErrorHandler();
export const storage = new Storage();

// Global error handler
window.addEventListener(‘error’, (event) => {
errorHandler.log(event.error, ‘Global error handler’);
});

window.addEventListener(‘unhandledrejection’, (event) => {
errorHandler.log(event.reason, ‘Unhandled promise rejection’);
});
