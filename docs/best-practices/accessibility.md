# Accessibility Best Practices

This document outlines accessibility requirements for the Twitter Enhanced extension.

## Why Accessibility Matters

- Screen reader users need proper labels to understand UI elements
- Keyboard users need all interactive elements to be accessible
- Good accessibility improves usability for everyone

## Button Labels

### Icon-Only Buttons Must Have aria-label

When a button contains only an icon (no visible text), screen readers cannot communicate its purpose. Always add `aria-label`.

#### ❌ Bad - No accessible name

```tsx
<button onClick={handleDelete}>
  <TrashIcon />
</button>
```

Screen reader announces: "button" (no context about what it does)

#### ✅ Good - With aria-label

```tsx
<button onClick={handleDelete} aria-label={chrome.i18n.getMessage('delete')}>
  <TrashIcon />
</button>
```

Screen reader announces: "Delete, button"

### Use i18n Messages for Labels

Always use localized messages for aria-labels to support users in different languages:

```tsx
// Good - supports all languages
aria-label={chrome.i18n.getMessage('cancel')}

// Bad - English only
aria-label="Cancel"
```

## Common UI Patterns

### Close Buttons

Dialog close buttons are often icon-only:

```tsx
<button
  onClick={onClose}
  aria-label={chrome.i18n.getMessage('cancel')}
  className="close-button"
>
  <CloseIcon />
</button>
```

### Action Buttons in Tables/Lists

When showing actions like delete, edit, etc. in a row:

```tsx
<button
  onClick={() => handleEdit(item.id)}
  aria-label={chrome.i18n.getMessage('edit')}
>
  <EditIcon />
</button>

<button
  onClick={() => handleDelete(item.id)}
  aria-label={chrome.i18n.getMessage('delete')}
>
  <TrashIcon />
</button>
```

### Toggle Switches

Toggle switches should use proper ARIA roles:

```tsx
<button
  role="switch"
  aria-checked={isEnabled}
  onClick={() => setIsEnabled(!isEnabled)}
>
  <span className="toggle-thumb" />
</button>
```

## Keyboard Navigation

### All Interactive Elements Must Be Keyboard Accessible

- Use native `<button>` elements for clickable items (not `<div onclick>`)
- Ensure focus is visible (don't remove focus outlines without providing alternatives)
- Support Enter/Space for button activation
- Support Escape to close dialogs

### Focus Management in Dialogs

```tsx
useEffect(() => {
  if (isOpen) {
    // Focus first focusable element when dialog opens
    inputRef.current?.focus();
  }
}, [isOpen]);
```

## Semantic HTML

### Use Appropriate Elements

| Purpose          | Use                   | Don't Use               |
| ---------------- | --------------------- | ----------------------- |
| Clickable action | `<button>`            | `<div onClick>`         |
| Navigation       | `<a href>`            | `<span onClick>`        |
| Form input       | `<input>`, `<select>` | `<div contenteditable>` |
| Headings         | `<h1>` - `<h6>`       | `<div class="heading">` |

### Labels for Form Controls

```tsx
// Good - associated label
<label htmlFor="download-dir">Download Directory</label>
<input id="download-dir" type="text" />

// Also good - label wraps input
<label>
  Download Directory
  <input type="text" />
</label>
```

## Testing Accessibility

### Manual Testing

1. Navigate the UI using only keyboard (Tab, Enter, Escape)
2. Test with a screen reader (VoiceOver on Mac, NVDA on Windows)
3. Check that all interactive elements have accessible names

### Automated Testing

Use testing-library queries that enforce accessibility:

```typescript
// Good - requires accessible name
const deleteButton = screen.getByRole('button', { name: /delete/i });

// Less good - doesn't verify accessibility
const deleteButton = screen.getByTestId('delete-btn');
```

## Checklist

Before submitting a PR, verify:

- [ ] All icon-only buttons have `aria-label`
- [ ] Labels use i18n messages for localization
- [ ] Interactive elements use semantic HTML (`<button>`, `<a>`, etc.)
- [ ] Form inputs have associated labels
- [ ] Dialogs manage focus appropriately
- [ ] UI can be navigated with keyboard only
