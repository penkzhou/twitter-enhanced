# Code Quality Best Practices

This document outlines code quality guidelines to maintain clean, efficient, and maintainable code.

## Avoid Redundant Code

### Redundant Ternary Operators

Don't use ternary operators when both branches return the same value:

```typescript
// ❌ Bad - both branches return the same value
backgroundColor: isDarkMode
  ? 'rgba(29, 155, 240, 0.1)'
  : 'rgba(29, 155, 240, 0.1)';

// ✅ Good - just use the value directly
backgroundColor: 'rgba(29, 155, 240, 0.1)';
```

### DRY (Don't Repeat Yourself)

Extract repeated code patterns into shared utilities:

#### Theme Utilities

If you have theme-related functions like `getTheme()` duplicated across files, consider:

```typescript
// src/utils/theme.ts
export const getTheme = (isDark: boolean) => ({
  pageBg: isDark ? '#000000' : '#F7F9F9',
  cardBg: isDark ? '#16181C' : '#FFFFFF',
  // ... other theme values
});
```

#### Dark Mode Detection Hook

Create a reusable hook for dark mode detection:

```typescript
// src/hooks/useDarkMode.ts
import { useState, useEffect } from 'react';

export const useDarkMode = (detectFn: () => boolean) => {
  const [isDarkMode, setIsDarkMode] = useState(detectFn);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isDarkMode;
};
```

#### Shared Icon Components

Extract commonly used SVG icons:

```typescript
// src/components/icons/index.tsx
export const CloseIcon = ({ color = 'currentColor', size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05..." />
  </svg>
);
```

## Consistent Styling Approach

### Choose One Approach

This project uses both Tailwind CSS and inline styles. Guidelines:

1. **Tailwind CSS**: Preferred for static styles in popup/options pages
2. **Inline styles**: Necessary for dynamic theme-based styles in content scripts

When using inline styles for theming, use CSS variables where possible:

```typescript
// ❌ Hardcoded colors
color: isDark ? '#E7E9EA' : '#0F1419';

// ✅ Use CSS variables (if available)
color: 'var(--twitter-text)';
```

### CSS Variable Usage

The project defines Twitter-like CSS variables in `src/globals.css`:

```css
:root {
  --twitter-blue: hsl(203 89% 53%);
  --twitter-bg: hsl(200 14% 97%);
  --twitter-card: hsl(0 0% 100%);
  --twitter-text: hsl(213 26% 9%);
  /* ... */
}

.dark {
  --twitter-bg: hsl(0 0% 0%);
  --twitter-card: hsl(218 14% 10%);
  --twitter-text: hsl(195 14% 92%);
  /* ... */
}
```

Use these variables instead of hardcoding colors when styling extension pages.

## Testing Code Quality

### Test All Conditional Branches

Ensure all conditional logic has test coverage:

```typescript
// If your code has dark/light mode branches
const theme = isDarkMode ? darkTheme : lightTheme;

// Both branches need test coverage
it('should apply dark theme when in dark mode', () => { ... });
it('should apply light theme when in light mode', () => { ... });
```

### Mock Browser APIs Completely

When mocking browser APIs, include all required properties:

```typescript
// ✅ Complete mock for getComputedStyle
window.getComputedStyle = jest.fn().mockReturnValue({
  backgroundColor: 'rgb(0, 0, 0)',
  getPropertyValue: jest.fn().mockReturnValue(''),
});

// ✅ Complete mock for matchMedia
window.matchMedia = jest.fn().mockReturnValue({
  matches: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});
```

### Test UI Interactions

Don't forget to test:

- Focus/blur states
- Hover effects (where testable)
- Character counters and live updates
- Conditional rendering (show/hide elements)

## Code Review Checklist

Before submitting code, verify:

- [ ] No redundant ternary operators
- [ ] No duplicated utility functions across files
- [ ] CSS variables used where available
- [ ] All conditional branches have test coverage
- [ ] Browser API mocks are complete
- [ ] UI interactions are tested
