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

export interface StatusConfig {
  label: string;
  color: string; // Hex or Tailwind color class
  textColor: string;
}

export interface ColumnDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  visible: boolean;
  width?: number;
  colorMapping?: Record<string, string>; // For select types
}

export interface AppConfig {
  columns: ColumnDefinition[];
  statuses: StatusConfig[];
  fbWebhookEnabled: boolean;
}

export const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'date', label: 'Date', type: 'date', visible: true, width: 120 },
  { id: 'leadFrom', label: 'Lead From', type: 'select', options: ['Insta', 'FB', 'Direct', 'Referral'], visible: true, width: 120 },
  { id: 'color', label: 'Status', type: 'select', options: ['White', 'Red', 'Dark Green', 'Yellow'], visible: true, width: 120, colorMapping: {
    'White': '#f1f5f9',
    'Red': '#fee2e2',
    'Dark Green': '#d1fae5',
    'Yellow': '#fef9c3'
  }},
  { id: 'clientName', label: 'Client Name', type: 'text', visible: true, width: 200 },
  { id: 'number', label: 'Number', type: 'text', visible: true, width: 150 },
  { id: 'weddingDate', label: 'Wedding Date', type: 'text', visible: true, width: 150 },
  { id: 'month', label: 'Month', type: 'select', options: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Not Fixed'], visible: true, width: 100 },
  { id: 'designatedTo', label: 'Designated to', type: 'text', visible: true, width: 150 },
  { id: 'location', label: 'Location', type: 'text', visible: true, width: 150 },
  { id: 'budget', label: 'Budget', type: 'text', visible: true, width: 120 },
  { id: 'function', label: 'Function', type: 'select', options: ['wedding', 'pre-wedding', 'engagement', 'other'], visible: true, width: 150 },
];
