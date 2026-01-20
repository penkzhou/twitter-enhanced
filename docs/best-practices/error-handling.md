# Error Handling Best Practices

This document outlines error handling patterns for the Twitter Enhanced extension.

## Chrome Extension APIs

### Storage API

Chrome's storage API uses callback patterns where errors are reported via `chrome.runtime.lastError`. Always check for errors in callbacks.

#### ❌ Bad - Silent failure

```typescript
chrome.storage.sync.set({ key: value }, () => {
  console.log('Saved!'); // May show success even when it failed
});
```

#### ✅ Good - Proper error handling

```typescript
chrome.storage.sync.set({ key: value }, () => {
  if (chrome.runtime.lastError) {
    console.error('Failed to save:', chrome.runtime.lastError);
    // Show error to user or handle appropriately
    return;
  }
  console.log('Saved successfully');
});
```

### Why This Matters

- Chrome storage can fail due to quota limits, sync issues, or extension state
- Without checking `lastError`, users may think their settings were saved when they weren't
- This leads to confusing behavior and poor user experience

## Database Operations (IndexedDB)

### Always Use Try-Catch

IndexedDB operations can fail for various reasons (storage full, database corruption, etc.).

#### ❌ Bad - Unhandled promise rejection

```typescript
const confirmDelete = async () => {
  await db.remove(recordId);
  await loadRecords();
  closeDialog();
};
```

#### ✅ Good - Wrapped in try-catch

```typescript
const confirmDelete = async () => {
  try {
    await db.remove(recordId);
    await loadRecords();
    closeDialog();
  } catch (error) {
    console.error('Failed to delete record:', error);
    closeDialog();
    // Could show an error toast/message to user
  }
};
```

### Database Initialization

Database initialization is especially important to handle since it happens on page load:

```typescript
const initializeRecords = async () => {
  try {
    const allRecords = await db.getAll();
    setRecords(allRecords);
  } catch (error) {
    console.error('Failed to initialize records:', error);
    setRecords([]); // Provide fallback empty state
    // Could show error banner to user
  }
};
```

## API Design Principles

### Distinguish "No Data" from "Error"

When designing functions that fetch data, use different return values to indicate different states:

| Return Value       | Meaning                    |
| ------------------ | -------------------------- |
| `[]` (empty array) | Success, but no data found |
| `null`             | An error occurred          |
| `[...data]`        | Success with data          |

#### Example

```typescript
public async getVideoInfo(tweetId: string): Promise<VideoInfo[] | null> {
  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    const videos = extractVideos(data);

    if (videos.length > 0) {
      return videos; // Success with data
    }

    return []; // Success but no videos found (not an error)

  } catch (error) {
    console.error('Error fetching video info:', error);
    return null; // Indicates an error occurred
  }
}
```

#### Caller Can Then Handle Appropriately

```typescript
const videos = await api.getVideoInfo(tweetId);

if (videos === null) {
  showError('Failed to fetch video information');
} else if (videos.length === 0) {
  showMessage('This tweet has no videos');
} else {
  showVideoSelector(videos);
}
```

## FileReader Error Handling

When using FileReader, always set the `onerror` handler:

#### ❌ Bad - Missing error handler

```typescript
const reader = new FileReader();
reader.onload = (e) => {
  // Handle loaded data
};
reader.readAsText(file);
```

#### ✅ Good - With error handler

```typescript
const reader = new FileReader();
reader.onload = (e) => {
  try {
    const data = JSON.parse(e.target?.result as string);
    // Process data
  } catch {
    alert('Invalid file format');
  }
};
reader.onerror = () => {
  console.error('Failed to read file:', reader.error);
  alert('Failed to read file');
};
reader.readAsText(file);
```

## Summary

1. **Always check `chrome.runtime.lastError`** in Chrome API callbacks
2. **Wrap async database operations** in try-catch blocks
3. **Distinguish between "no data" and "error"** in API return values
4. **Set error handlers** for FileReader and similar async APIs
5. **Provide user feedback** when errors occur - don't fail silently
