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
      
      expect(screen.getByText('Add Remark')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter remark for this user')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<RemarkDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Add Remark')).not.toBeInTheDocument();
    });

    it('should show "Edit Remark" title when existingRemark is provided', () => {
      render(<RemarkDialog {...defaultProps} existingRemark="Existing remark" />);
      
      expect(screen.getByText('Edit Remark')).toBeInTheDocument();
    });

    it('should show "Add Remark" title when no existingRemark is provided', () => {
      render(<RemarkDialog {...defaultProps} />);
      
      expect(screen.getByText('Add Remark')).toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    it('should pre-populate input with existing remark', () => {
      const existingRemark = 'Test existing remark';
      render(<RemarkDialog {...defaultProps} existingRemark={existingRemark} />);
      
      const input = screen.getByDisplayValue(existingRemark);
      expect(input).toBeInTheDocument();
    });

    it('should have empty input when no existing remark', () => {
      render(<RemarkDialog {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      expect(input).toHaveValue('');
    });

    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      await user.type(input, 'New remark');
      
      expect(input).toHaveValue('New remark');
    });

    it('should focus input automatically', () => {
      render(<RemarkDialog {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      expect(input).toHaveFocus();
    });
  });

  describe('Button Interactions', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      const onCancel = jest.fn();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when Save button is clicked', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onSave={onSave} />);
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      await user.type(input, 'Test remark');
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith('testuser', 'Test remark');
    });

    it('should trim whitespace when saving', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onSave={onSave} />);
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      await user.type(input, '  Test remark with spaces  ');
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith('testuser', 'Test remark with spaces');
    });
  });

  describe('Keyboard Interactions', () => {
    it('should call onSave when Enter key is pressed', async () => {
      const onSave = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onSave={onSave} />);
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      await user.type(input, 'Test remark');
      await user.keyboard('{Enter}');
      
      expect(onSave).toHaveBeenCalledWith('testuser', 'Test remark');
    });

    it('should call onCancel when Escape key is pressed', async () => {
      const onCancel = jest.fn();
      const user = userEvent.setup();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      input.focus();
      await user.keyboard('{Escape}');
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Background Click', () => {
    it('should call onCancel when background overlay is clicked', () => {
      const onCancel = jest.fn();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);
      
      // Find the overlay by its className
      const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      fireEvent.click(overlay!);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when dialog content is clicked', () => {
      const onCancel = jest.fn();
      render(<RemarkDialog {...defaultProps} onCancel={onCancel} />);
      
      // Click on the dialog content (the white/gray background div)
      const dialogContent = document.querySelector('.bg-white.dark\\:bg-gray-800');
      fireEvent.click(dialogContent!);
      
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('State Updates', () => {
    it('should update input when existingRemark prop changes', () => {
      const { rerender } = render(<RemarkDialog {...defaultProps} existingRemark="Initial" />);
      
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
      rerender(<RemarkDialog {...defaultProps} isOpen={true} existingRemark="Test" />);
      
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });
  });

  describe('Chrome i18n Integration', () => {
    it('should use chrome.i18n.getMessage for all text', () => {
      render(<RemarkDialog {...defaultProps} existingRemark="test" />);
      
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('editRemark');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('enterRemark');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('cancel');
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
      render(<RemarkDialog {...defaultProps} onSave={onSave} existingRemark="Initial" />);
      
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
      
      const input = screen.getByPlaceholderText('Enter remark for this user');
      await user.type(input, '   ');
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith('testuser', '');
    });
  });
});