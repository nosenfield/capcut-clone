# React Best Practices Guide for Desktop Applications

## Table of Contents
1. [Project Structure](#project-structure)
2. [Component Design](#component-design)
3. [State Management](#state-management)
4. [Code Quality](#code-quality)
5. [Performance Optimization](#performance-optimization)
6. [Security](#security)

---

## Project Structure

### Organize Your Folders Properly

Create a clear, maintainable folder structure:

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── context/        # React Context providers
├── services/       # API calls and external services
├── utils/          # Helper functions and utilities
├── assets/         # Images, fonts, static files
├── config/         # Configuration files
└── styles/         # Global styles and themes
```

**Key Principles:**
- Group related files together (component + styles + tests in same folder)
- Keep test files alongside source files with matching names
- Separate business logic from UI components
- Use absolute imports with path aliases (e.g., `@/components/Button`)

### Create Module-Based Architecture

- Break your app into reusable modules
- Each module should be self-contained and independently testable
- Share common functionality across modules via a `common/` directory

---

## Component Design

### Use Functional Components

Functional components are cleaner, easier to read, and leverage React Hooks effectively:

```jsx
// Good: Functional component
const UserCard = ({ name, email }) => {
  const [isActive, setIsActive] = useState(false);
  
  return (
    <div className="user-card">
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
};
```

### Keep Components Small and Focused

**Single Responsibility Principle:**
- Each component should do one thing well
- Break large components into smaller, focused pieces
- Aim for components under 200 lines of code

```jsx
// Bad: One large component doing everything
const Dashboard = () => {
  // 500 lines of mixed logic...
};

// Good: Split into focused components
const Dashboard = () => {
  return (
    <>
      <DashboardHeader />
      <UserStats />
      <ActivityFeed />
      <SettingsPanel />
    </>
  );
};
```

### Avoid Deep Component Nesting

Over-nesting makes code hard to understand and maintain:

```jsx
// Bad: Deep nesting
<Parent>
  <Child1>
    <Child2>
      <Child3>
        <Child4>Content</Child4>
      </Child3>
    </Child2>
  </Child1>
</Parent>

// Good: Flatten structure
<Parent>
  <Section1 />
  <Section2 />
  <Content />
</Parent>
```

### Name Components Clearly

- **Capitalize component names:** `UserProfile`, not `userProfile`
- Use descriptive names that indicate purpose
- Differentiate components from HTML tags

### Use Children Props and Composition

Enable flexible component composition:

```jsx
const Card = ({ children, title }) => (
  <div className="card">
    <h2>{title}</h2>
    <div className="card-body">{children}</div>
  </div>
);

// Usage
<Card title="Welcome">
  <p>Card content here</p>
</Card>
```

### Leverage Higher-Order Components (HOC)

Reuse component logic across your application:

```jsx
const withAuth = (Component) => {
  return (props) => {
    const isAuthenticated = useAuth();
    return isAuthenticated ? <Component {...props} /> : <Login />;
  };
};
```

---

## State Management

### Choose the Right State Solution

**Local State (useState):**
- Use for component-specific data
- Simple, contained state

**Context API:**
- For sharing data across multiple components
- Avoid creating one massive context—split by concern
- Example: `ThemeContext`, `UserContext`, `SettingsContext`

**Redux/State Library:**
- For complex applications with extensive state
- When multiple components need access to same data
- Provides predictable state updates

```jsx
// Good: Split contexts by concern
<ThemeProvider>
  <UserProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </UserProvider>
</ThemeProvider>
```

### Efficient State Updates

- Only store what needs to be in state
- Avoid unnecessary re-renders with `React.memo`, `useMemo`, `useCallback`
- Use state updater functions for derived state

```jsx
// Good: Prevent unnecessary re-renders
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});
```

### Custom Hooks for Reusable Logic

Extract common logic into custom hooks:

```jsx
// hooks/useDarkMode.js
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  
  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };
  
  return [isDark, toggleTheme];
};

// Usage in component
const App = () => {
  const [isDark, toggleTheme] = useDarkMode();
  // ...
};
```

---

## Code Quality

### Use ESLint for Code Quality

Configure ESLint to catch errors and enforce consistency:
- Detects unused variables, spelling errors
- Enforces coding standards
- Provides real-time feedback

### Follow DRY Principle (Don't Repeat Yourself)

- Extract repeated logic into functions or hooks
- Create reusable components
- Use composition over duplication

### Use Destructuring

Makes code cleaner and more readable:

```jsx
// Bad
const UserCard = (props) => {
  return <div>{props.user.name} - {props.user.email}</div>;
};

// Good
const UserCard = ({ user: { name, email } }) => {
  return <div>{name} - {email}</div>;
};
```

### Minimize Div Usage

Avoid unnecessary wrapper elements:

```jsx
// Bad: Extra divs
<div>
  <div>
    <div>Content</div>
  </div>
</div>

// Good: Use Fragments
<>
  <Header />
  <Content />
  <Footer />
</>
```

### Use ES6 Spread Operator

Pass props efficiently:

```jsx
const parentProps = { title, description, onClick };

// Good: Spread props
<ChildComponent {...parentProps} />
```

### Use Map for Dynamic Rendering

Render lists efficiently with keys:

```jsx
const UserList = ({ users }) => (
  <ul>
    {users.map(user => (
      <li key={user.id}>
        <UserCard user={user} />
      </li>
    ))}
  </ul>
);
```

### Write Testable Code

- Keep logic separate from UI
- Use descriptive test file names matching source files
- Write unit tests for utilities and hooks
- Integration tests for component interactions

---

## Performance Optimization

### Prevent Unnecessary Re-renders

```jsx
// Use React.memo for functional components
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// Use useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);

// Use useCallback for function references
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### Optimize Rendering with Virtual DOM

React's Virtual DOM handles efficient updates automatically:
- Batch state updates when possible
- Avoid direct DOM manipulation
- Let React manage the rendering cycle

### Use Appropriate Lifecycle Methods

Choose the right lifecycle hooks for your needs:
- `useEffect` for side effects and subscriptions
- `useLayoutEffect` for DOM measurements
- Clean up effects to prevent memory leaks

```jsx
useEffect(() => {
  const subscription = api.subscribe();
  
  // Cleanup function
  return () => subscription.unsubscribe();
}, []);
```

### Code Splitting and Lazy Loading

Load components only when needed:

```jsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <HeavyComponent />
  </Suspense>
);
```

---

## Security

### Sanitize User Input

Always sanitize dynamic content:

```jsx
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }) => {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};
```

### Avoid dangerouslySetInnerHTML

Only use when absolutely necessary and always sanitize:

```jsx
// Bad: Direct injection
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// Good: Sanitized
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### Validate URLs

Check for malicious URLs and injection attempts:

```jsx
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
```

### Secure Server-Side Rendering

When using SSR:
- Use `ReactDOMServer.renderToString()` for automatic escaping
- Never concatenate unsanitized strings with render output
- Validate all data before rendering

### Keep Dependencies Updated

- Regularly update React and dependencies
- Monitor security advisories
- Use `npm audit` to check for vulnerabilities

```bash
npm audit
npm update
```

### Protect Against Common Attacks

**XSS Prevention:**
- Sanitize all user input
- Use Content Security Policy headers
- Never use user input directly in `eval()` or `Function()`

**CSRF Protection:**
- Use anti-CSRF tokens
- Validate request origins
- Implement proper authentication

**DDoS Protection:**
- Use rate limiting
- Implement request throttling
- Monitor network traffic patterns

---

## Additional Best Practices

### CSS-in-JS Approach

Consider using CSS-in-JS libraries for maintainability:
- **styled-components**: CSS with component scope
- **Emotion**: Flexible styling solution
- **CSS Modules**: Local scoping by default

```jsx
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  padding: 10px 20px;
  border-radius: 4px;
`;
```

### Comment Sparingly

- Write self-documenting code with clear names
- Comment only when explaining "why," not "what"
- Focus on code clarity over excessive comments

### Use Utils Directory

Create utility functions for common operations:

```javascript
// utils/formatters.js
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Usage
import { formatCurrency } from '@/utils/formatters';
```

---

## Summary

Building quality React desktop applications requires:

1. **Structured organization** - Clear folder structure and separation of concerns
2. **Component discipline** - Small, focused, reusable components
3. **Smart state management** - Choose the right tool for your needs
4. **Clean code** - DRY principles, destructuring, proper naming
5. **Performance focus** - Prevent unnecessary renders, optimize carefully
6. **Security first** - Sanitize inputs, validate data, stay updated

By following these best practices, you'll create React applications that are maintainable, performant, secure, and scalable.
