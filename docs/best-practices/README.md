# Best Practices Documentation

This directory contains coding guidelines and best practices for the Twitter Enhanced extension.

## Documents

| Document                                 | Description                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| [error-handling.md](./error-handling.md) | Error handling patterns for Chrome APIs, IndexedDB, and async operations      |
| [accessibility.md](./accessibility.md)   | Accessibility requirements including ARIA labels and keyboard navigation      |
| [code-comments.md](./code-comments.md)   | Standards for writing and maintaining code comments                           |
| [code-quality.md](./code-quality.md)     | Code quality guidelines: DRY principle, avoiding redundancy, testing coverage |

## Quick Reference

### Error Handling

```typescript
// Always check Chrome API errors
chrome.storage.sync.set({ key: value }, () => {
  if (chrome.runtime.lastError) {
    console.error('Error:', chrome.runtime.lastError);
    return;
  }
});

// Wrap database operations in try-catch
try {
  await db.remove(id);
} catch (error) {
  console.error('Failed:', error);
}
```

### Accessibility

```tsx
// Icon-only buttons need aria-label
<button aria-label={chrome.i18n.getMessage('delete')}>
  <TrashIcon />
</button>
```

### Comments

```typescript
// Comment "why", not "what"
// ❌ Bad: Set count to zero
// ✅ Good: Reset after deletion to refresh UI state
setCount(0);
```

## Contributing

When adding new best practices:

1. Create a new markdown file in this directory
2. Add it to the table in this README
3. Reference it in `CLAUDE.md` under the "Best Practices Documentation" section
