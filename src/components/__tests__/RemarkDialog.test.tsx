import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RemarkDialog, { RemarkDialogProps } from '../RemarkDialog';

// Mock chrome i18n API
const mockChromeI18n = {
  getMessage: jest.fn((key: string) => {
    const messages: { [key: string]: string } = {
      addRemark: 'Add Remark',
      editRemark: 'Edit Remark',
      enterRemark: 'Enter remark for this user',
      cancel: 'Cancel',
      save: 'Save',
    };
    return messages[key] || key;
  }),
};

Object.defineProperty(global, 'chrome', {
  value: {
    i18n: mockChromeI18n,
  },
  writable: true,
});

// Mock ReactDOM.createPortal to render directly for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// Helper to find the remark input field
const getRemarkInput = () => {
  return screen.getByRole('textbox');
};

describe('RemarkDialog', () => {
  const defaultProps: RemarkDialogProps = {
    onSave: jest.fn(),
    onCancel: jest.fn(),
    username: 'testuser',
    isOpen: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<RemarkDialog {...defaultProps} />);

      // Title appears in header (h2)
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Add Remark'
      );
      expect(getRemarkInput()).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<RemarkDialog {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByRole('heading', { level: 2 })
      ).not.toBeInTheDocument();
    });

    it('should show "Edit Remark" title when existingRemark is provided', () => {
      render(
        <RemarkDialog {...defaultProps} existingRemark="Existing remark" />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Edit Remark'
      );
    });

    it('should show "Add Remark" title when no existingRemark is provided', () => {
      render(<RemarkDialog {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Add Remark'
      );
    });

    it('should display username with @ prefix', () => {
      render(<RemarkDialog {...defaultProps} />);

      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    it('should pre-populate input with existing remark', () => {
      const existingRemark = 'Test existing remark';
      render(
        <RemarkDialog {...defaultProps} existingRemark={existingRemark} />
      );

      const input = screen.getByDisplayValue(existingRemark);
      expect(input).toBeInTheDocument();
    });

    it('should have empty input when no existing remark', () => {
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      expect(input).toHaveValue('');
    });

    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      await user.type(input, 'New remark');

      expect(input).toHaveValue('New remark');
    });

    it('should focus input automatically', () => {
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      expect(input).toHaveFocus();
    });
  });

  describe('Button Interactions', () => {
    it('should call onCancel when close button is clicked', () => {
      const onCancel = jest.fn();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);

      // The close button (X icon) in the header
      const closeButtons = document.querySelectorAll('button');
      const closeButton = closeButtons[0]; // First button is the close button
      fireEvent.click(closeButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when Save button is clicked', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onSave={onSave} />);

      const input = getRemarkInput();
      await user.type(input, 'Test remark');

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith('testuser', 'Test remark');
    });

    it('should trim whitespace when saving', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onSave={onSave} />);

      const input = getRemarkInput();
      await user.type(input, '  Test remark with spaces  ');

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        'testuser',
        'Test remark with spaces'
      );
    });
  });

  describe('Keyboard Interactions', () => {
    it('should call onSave when Enter key is pressed', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onSave={onSave} />);

      const input = getRemarkInput();
      await user.type(input, 'Test remark');
      await user.keyboard('{Enter}');

      expect(onSave).toHaveBeenCalledWith('testuser', 'Test remark');
    });

    it('should call onCancel when Escape key is pressed', async () => {
      const onCancel = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);

      const input = getRemarkInput();
      input.focus();
      await user.keyboard('{Escape}');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Background Click', () => {
    it('should call onCancel when background overlay is clicked', () => {
      const onCancel = jest.fn();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);

      // Find the overlay (the outer fixed div)
      const overlay = document.querySelector('[style*="position: fixed"]');
      fireEvent.click(overlay!);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when dialog content is clicked', () => {
      const onCancel = jest.fn();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);

      // Click on the dialog content (the card)
      const dialogContent = document.querySelector(
        '[style*="border-radius: 16px"]'
      );
      fireEvent.click(dialogContent!);

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('State Updates', () => {
    it('should update input when existingRemark prop changes', () => {
      const { rerender } = render(
        <RemarkDialog {...defaultProps} existingRemark="Initial" />
      );

      expect(screen.getByDisplayValue('Initial')).toBeInTheDocument();

      rerender(<RemarkDialog {...defaultProps} existingRemark="Updated" />);

      expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
    });

    it('should reset input when dialog is reopened', () => {
      const { rerender } = render(
        <RemarkDialog {...defaultProps} isOpen={false} existingRemark="Test" />
      );

      // Dialog closed, no input should be present
      expect(screen.queryByDisplayValue('Test')).not.toBeInTheDocument();

      // Open dialog
      rerender(
        <RemarkDialog {...defaultProps} isOpen={true} existingRemark="Test" />
      );

      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });
  });

  describe('Chrome i18n Integration', () => {
    it('should use chrome.i18n.getMessage for all text', () => {
      render(<RemarkDialog {...defaultProps} existingRemark="test" />);

      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('editRemark');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('enterRemark');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('save');
    });

    it('should call chrome.i18n.getMessage with addRemark for new remarks', () => {
      render(<RemarkDialog {...defaultProps} />);

      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('addRemark');
    });
  });

  describe('Empty Remark Handling', () => {
    it('should save empty string when input is cleared', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(
        <RemarkDialog
          {...defaultProps}
          onSave={onSave}
          existingRemark="Initial"
        />
      );

      const input = screen.getByDisplayValue('Initial');
      await user.clear(input);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith('testuser', '');
    });

    it('should handle whitespace-only input correctly', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onSave={onSave} />);

      const input = getRemarkInput();
      await user.type(input, '   ');

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith('testuser', '');
    });
  });

  describe('Dark Mode Detection', () => {
    const originalGetComputedStyle = window.getComputedStyle;
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      // Ensure we start with original implementations
      window.getComputedStyle = originalGetComputedStyle;
      window.matchMedia = originalMatchMedia;
    });

    afterEach(() => {
      // Restore original implementations
      window.getComputedStyle = originalGetComputedStyle;
      window.matchMedia = originalMatchMedia;
    });

    it('should detect dark mode from dark background color', () => {
      // Mock getComputedStyle to return dark background for detectTwitterDarkMode
      const mockGetComputedStyle = jest.fn().mockReturnValue({
        backgroundColor: 'rgb(0, 0, 0)',
        getPropertyValue: jest.fn().mockReturnValue(''),
      });
      window.getComputedStyle = mockGetComputedStyle;

      render(<RemarkDialog {...defaultProps} />);

      // Verify getComputedStyle was called with document.body
      expect(mockGetComputedStyle).toHaveBeenCalledWith(document.body);

      // When dark mode is detected, backdrop should have the dark mode color
      const overlay = document.querySelector(
        '[style*="position: fixed"]'
      ) as HTMLElement;
      expect(overlay?.style.backgroundColor).toBe('rgba(91, 112, 131, 0.4)');
    });

    it('should detect light mode from light background color', () => {
      // Mock getComputedStyle to return light background
      const mockGetComputedStyle = jest.fn().mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
        getPropertyValue: jest.fn().mockReturnValue(''),
      });
      window.getComputedStyle = mockGetComputedStyle;

      render(<RemarkDialog {...defaultProps} />);

      // When light mode is detected, backdrop should have the light mode color
      const overlay = document.querySelector(
        '[style*="position: fixed"]'
      ) as HTMLElement;
      expect(overlay?.style.backgroundColor).toBe('rgba(0, 0, 0, 0.4)');
    });

    it('should fallback to system preference when background parsing fails', () => {
      // Mock getComputedStyle to return invalid background
      const mockGetComputedStyle = jest.fn().mockReturnValue({
        backgroundColor: 'invalid-color',
        getPropertyValue: jest.fn().mockReturnValue(''),
      });
      window.getComputedStyle = mockGetComputedStyle;

      // Mock matchMedia to return dark preference
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      render(<RemarkDialog {...defaultProps} />);

      const overlay = document.querySelector(
        '[style*="position: fixed"]'
      ) as HTMLElement;
      expect(overlay?.style.backgroundColor).toBe('rgba(91, 112, 131, 0.4)');
    });

    it('should fallback to system preference when getComputedStyle throws', () => {
      // Track calls to know when to throw vs return normally
      let callCount = 0;
      const mockGetComputedStyle = jest
        .fn()
        .mockImplementation((element: Element) => {
          callCount++;
          // First call is from detectTwitterDarkMode, throw error
          if (callCount === 1 && element === document.body) {
            throw new Error('getComputedStyle error');
          }
          // Subsequent calls for style assertions should work
          return {
            backgroundColor: '',
            getPropertyValue: jest.fn().mockReturnValue(''),
          };
        });
      window.getComputedStyle = mockGetComputedStyle;

      // Mock matchMedia to return light preference
      window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      render(<RemarkDialog {...defaultProps} />);

      const overlay = document.querySelector(
        '[style*="position: fixed"]'
      ) as HTMLElement;
      expect(overlay?.style.backgroundColor).toBe('rgba(0, 0, 0, 0.4)');
    });

    it('should handle rgba background colors', () => {
      // Mock getComputedStyle to return rgba dark background
      const mockGetComputedStyle = jest.fn().mockReturnValue({
        backgroundColor: 'rgba(20, 20, 20, 1)',
        getPropertyValue: jest.fn().mockReturnValue(''),
      });
      window.getComputedStyle = mockGetComputedStyle;

      render(<RemarkDialog {...defaultProps} />);

      const overlay = document.querySelector(
        '[style*="position: fixed"]'
      ) as HTMLElement;
      expect(overlay?.style.backgroundColor).toBe('rgba(91, 112, 131, 0.4)');
    });
  });

  describe('Character Count Display', () => {
    it('should not display character count when input is empty', () => {
      render(<RemarkDialog {...defaultProps} />);

      // Look for any element containing just a number (character count)
      const characterCountElements = screen.queryAllByText(/^\d+$/);
      expect(characterCountElements.length).toBe(0);
    });

    it('should display character count when input has content', async () => {
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      await user.type(input, 'Hello');

      // Character count should show "5"
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      await user.type(input, 'Hi');

      expect(screen.getByText('2')).toBeInTheDocument();

      await user.type(input, ' there');

      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should hide character count when input is cleared', async () => {
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} existingRemark="Test" />);

      // Initially should show character count
      expect(screen.getByText('4')).toBeInTheDocument();

      const input = getRemarkInput();
      await user.clear(input);

      // Character count should be hidden
      const characterCountElements = screen.queryAllByText(/^\d+$/);
      expect(characterCountElements.length).toBe(0);
    });
  });

  describe('Focus/Blur State (Floating Label)', () => {
    it('should update label style when input is focused', () => {
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      const label = screen.getByText('Enter remark for this user');

      // Focus the input
      fireEvent.focus(input);

      // When focused, label should have the focus color (Twitter blue)
      expect(label).toHaveStyle({
        color: '#1D9BF0',
      });
    });

    it('should update label style when input is blurred with no value', () => {
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      const label = screen.getByText('Enter remark for this user');

      // Focus then blur without typing
      fireEvent.focus(input);
      fireEvent.blur(input);

      // When blurred with no value, label should return to placeholder color
      // In light mode this is #71767B or #536471
      expect(label).not.toHaveStyle({
        color: '#1D9BF0',
      });
    });

    it('should keep label in floated position when input has value', async () => {
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      const label = screen.getByText('Enter remark for this user');

      // Type something and blur
      await user.type(input, 'Test');
      fireEvent.blur(input);

      // Label should remain in floated position (smaller font size)
      expect(label).toHaveStyle({
        fontSize: '12px',
      });
    });

    it('should show input border focus state', () => {
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();

      // Find the input container (parent div with border)
      const inputContainer = input.parentElement;

      // Focus the input
      fireEvent.focus(input);

      // Container should have the focus border color
      expect(inputContainer).toHaveStyle({
        borderColor: '#1D9BF0',
      });
    });

    it('should remove input border focus state on blur', async () => {
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} />);

      const input = getRemarkInput();
      const inputContainer = input.parentElement;

      // Focus then blur
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Give time for state to update
      await user.click(document.body);

      // Container should not have the focus border color
      expect(inputContainer).not.toHaveStyle({
        borderColor: '#1D9BF0',
      });
    });
  });
});
