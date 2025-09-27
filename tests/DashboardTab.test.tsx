import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DashboardTab from '../components/tabs/DashboardTab';
import { CaseEntity, Document, GeneratedDocument, Notification } from '../types';

// Mock the child components to simplify testing
vi.mock('../components/ui/charts/SimpleDonutChart', () => ({
    default: () => <div>SimpleDonutChart</div>
}));
vi.mock('../components/ui/charts/SimpleBarChart', () => ({
    default: () => <div>SimpleBarChart</div>
}));
vi.mock('../components/ui/Tooltip', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));
vi.mock('../components/ui/LoadingSpinner', () => ({
    default: () => <div>Loading...</div>
}));

describe('DashboardTab', () => {
  it('should allow uploading the same file multiple times', async () => {
    const user = userEvent.setup();
    const mockOnImportCase = vi.fn();

    const props = {
      documents: [] as Document[],
      generatedDocuments: [] as GeneratedDocument[],
      documentAnalysisResults: {},
      caseDescription: '',
      setCaseDescription: vi.fn(),
      setActiveTab: vi.fn(),
      onResetCase: vi.fn(),
      onExportCase: vi.fn(),
      onImportCase: mockOnImportCase,
      caseSummary: null,
      onPerformOverallAnalysis: vi.fn(),
      isLoading: false,
      loadingSection: '',
      caseEntities: [] as CaseEntity[],
      addNotification: vi.fn() as (message: string, type?: Notification['type'], duration?: number, details?: string) => void,
    };

    render(<DashboardTab {...props} />);

    const file = new File(['(⌐□_□)'], 'chuck-norris.json', { type: 'application/json' });
    const importButton = screen.getByRole('button', { name: /import/i });

    // The file input is hidden, so we target it directly for the upload
    // The user action is clicking the "Import" button which forwards the click
    const fileInput = screen.getByTestId('import-input') as HTMLInputElement;

    // First upload
    await user.upload(fileInput, file);
    expect(mockOnImportCase).toHaveBeenCalledTimes(1);
    expect(mockOnImportCase.mock.calls[0][0]).toBe(file);

    // Second upload of the same file
    await user.upload(fileInput, file);
    expect(mockOnImportCase).toHaveBeenCalledTimes(2);
    expect(mockOnImportCase.mock.calls[1][0]).toBe(file);
  });
});