# Code Comments Best Practices

This document outlines standards for writing and maintaining code comments.

## Core Principle: Keep Comments Synchronized

When you modify code logic, **always update related comments**. Misleading comments are worse than no comments.

## Comment What Matters

### Comment "Why", Not "What"

The code already shows what it does. Comments should explain why.

#### ❌ Bad - States the obvious

```typescript
// Set the count to 0
setCount(0);

// Loop through records
for (const record of records) {
```

#### ✅ Good - Explains the reasoning

```typescript
// Reset count after successful deletion to refresh the UI
setCount(0);

// Process oldest records first to maintain chronological order
for (const record of records.sort((a, b) => a.date - b.date)) {
```

## Keep Comments Accurate

### Problem: Comments That Don't Match Code

This was an actual issue found in the codebase:

#### ❌ Bad - Misleading comment

```typescript
/**
 * Detect if Twitter/X is currently in dark mode by checking background color
 * Twitter uses: white for light, rgb(21, 32, 43) for dim, black for dark
 */
const detectTwitterDarkMode = (): boolean => {
  // But the code actually uses luminance calculation, not specific color checks!
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};
```

The comment mentions specific RGB values, but the code uses a general luminance formula.

#### ✅ Good - Accurate comment

```typescript
/**
 * Detect if Twitter/X is currently in dark mode by checking background luminance.
 * Uses perceived luminance formula (0.299*R + 0.587*G + 0.114*B) to determine
 * if the background is dark (luminance < 0.5). Falls back to system preference.
 */
const detectTwitterDarkMode = (): boolean => {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};
```

## Function Documentation

### Use JSDoc for Public Functions

```typescript
/**
 * Retrieves video information from a tweet.
 *
 * @param tweetId - The ID of the tweet to fetch video from
 * @param isTwitter - Whether to use twitter.com domain (vs x.com)
 * @returns Array of video info objects, empty array if no videos,
 *          or null if an error occurred
 */
public async getVideoInfo(
  tweetId: string,
  isTwitter: boolean
): Promise<VideoInfo[] | null> {
```

### Document Non-Obvious Return Values

When a function can return different values with different meanings:

```typescript
/**
 * @returns
 *   - VideoInfo[] with data: videos found
 *   - Empty array []: no videos in tweet (not an error)
 *   - null: an error occurred during fetch
 */
```

## Inline Comments

### When to Use Inline Comments

- Complex algorithms that aren't self-explanatory
- Workarounds for bugs or platform-specific behavior
- Magic numbers or values

```typescript
// Twitter's GraphQL endpoint requires this specific query ID
const QUERY_ID = 'zJvfJs3gSbrVhC0MKjt_OQ';

// Wait for DOM to stabilize after Twitter's infinite scroll loads new content
await new Promise((resolve) => setTimeout(resolve, 100));

// Luminance formula: human eye is most sensitive to green, then red, then blue
const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
```

### Avoid Comment Noise

Don't comment obvious code:

```typescript
// ❌ Unnecessary
const user = users.find((u) => u.id === id); // Find user by id

// ✅ No comment needed - code is self-explanatory
const user = users.find((u) => u.id === id);
```

## TODO Comments

### Format TODO Comments Consistently

```typescript
// TODO: Add retry logic for failed API calls
// TODO(username): Investigate performance issue in large lists
// FIXME: This breaks when tweet text contains special characters
```

### Don't Leave Stale TODOs

If you fix something marked TODO, remove the comment. Review TODOs periodically.

## Commented-Out Code

### Remove, Don't Comment Out

Don't leave commented-out code in the codebase. Use version control to recover old code if needed.

#### ❌ Bad

```typescript
// const oldImplementation = () => {
//   // 50 lines of old code...
// };

const newImplementation = () => {
  // new code
};
```

#### ✅ Good

```typescript
const newImplementation = () => {
  // new code
};
// If you need the old code, check git history
```

## Summary Checklist

- [ ] Comments explain "why", not "what"
- [ ] Comments are accurate and match the code
- [ ] JSDoc is used for public functions
- [ ] Non-obvious return values are documented
- [ ] No stale TODO comments
- [ ] No commented-out code blocks
- [ ] Magic numbers have explanatory comments
- [ ] Comments are updated when code changes
