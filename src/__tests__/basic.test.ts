describe('Basic Test Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have Jest environment set up', () => {
    expect(typeof jest).toBe('object');
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should have Chrome extension mocks available', () => {
    expect(typeof chrome).toBe('object');
    expect(typeof chrome.runtime).toBe('object');
    expect(typeof chrome.storage).toBe('object');
  });
});