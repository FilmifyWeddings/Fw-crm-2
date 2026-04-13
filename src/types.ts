/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Note {
  id: string;
  text: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  date: string;
  leadFrom: string;
  color: string;
  clientName: string;
  number: string;
  weddingDate: string;
  month: string;
  designatedTo: string;
  afterQuote: string;
  wpAutomation: boolean;
  location: string;
  budget: string;
  function: string;
  mailId: string;
  notes: Note[];
  aiScore?: number;
  aiSummary?: string;
  [key: string]: any; // For dynamic columns
}

export interface ColumnDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  visible: boolean;
}

export const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'date', label: 'Date', type: 'date', visible: true },
  { id: 'leadFrom', label: 'Lead From', type: 'select', options: ['Insta', 'FB', 'Direct', 'Referral'], visible: true },
  { id: 'color', label: 'Color', type: 'select', options: ['White', 'Red', 'Dark Green', 'Yellow'], visible: true },
  { id: 'clientName', label: 'Client Name', type: 'text', visible: true },
  { id: 'number', label: 'Number', type: 'text', visible: true },
  { id: 'weddingDate', label: 'Wedding Date', type: 'text', visible: true },
  { id: 'month', label: 'Month', type: 'select', options: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Not Fixed'], visible: true },
  { id: 'designatedTo', label: 'Designated to', type: 'text', visible: true },
  { id: 'afterQuote', label: 'After Quote', type: 'text', visible: true },
  { id: 'wpAutomation', label: 'WP Automation', type: 'boolean', visible: true },
  { id: 'location', label: 'Location', type: 'text', visible: true },
  { id: 'budget', label: 'Budget', type: 'text', visible: true },
  { id: 'function', label: 'Function', type: 'select', options: ['wedding', 'pre-wedding', 'engagement', 'other'], visible: true },
  { id: 'mailId', label: 'Mail ID', type: 'text', visible: true },
];
