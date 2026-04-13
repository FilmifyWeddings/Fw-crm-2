/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, Note, AppConfig, StatusConfig } from "../types";

// This service handles communication with a Google Apps Script Web App
// The user needs to deploy an Apps Script with doGet and doPost handlers.

class GoogleSheetsService {
  private webAppUrl: string = "";

  setWebAppUrl(url: string) {
    this.webAppUrl = url;
    localStorage.setItem("LENSFLOW_WEBAPP_URL", url);
  }

  getWebAppUrl() {
    if (!this.webAppUrl) {
      this.webAppUrl = localStorage.getItem("LENSFLOW_WEBAPP_URL") || "";
    }
    return this.webAppUrl;
  }

  async fetchConfig(): Promise<AppConfig | null> {
    const url = this.getWebAppUrl();
    if (!url) return null;

    try {
      const response = await fetch(`${url}?action=getConfig`);
      const data = await response.json();
      return data.config || null;
    } catch (error) {
      console.error("Failed to fetch config:", error);
      return null;
    }
  }

  async saveConfig(config: AppConfig): Promise<boolean> {
    const url = this.getWebAppUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "saveConfig", config }),
      });
      return true;
    } catch (error) {
      console.error("Failed to save config:", error);
      return false;
    }
  }

  async fetchLeads(): Promise<Lead[]> {
    const url = this.getWebAppUrl();
    
    // 1. Try to return cached data immediately
    const cachedData = localStorage.getItem("LENSFLOW_CACHED_LEADS");
    let initialLeads: Lead[] = [];
    if (cachedData) {
      try {
        initialLeads = JSON.parse(cachedData);
      } catch (e) {
        console.error("Failed to parse cached leads");
      }
    }

    if (!url) return initialLeads;

    try {
      const response = await fetch(`${url}?action=getLeads`);
      const data = await response.json();
      const rawLeads = data.leads || [];
      
      // 2. Normalize data (handle common column name variations and lowercase keys)
      const normalizedLeads = rawLeads.map((lead: any) => {
        const normalized: any = { ...lead };
        
        // Map common variations to our expected keys (camelCase)
        // We are more specific here to avoid "Date" overwriting "Wedding Date"
        const mappings: Record<string, string[]> = {
          clientName: ['clientname', 'Client Name', 'Customer Name', 'client_name'],
          number: ['number', 'Phone', 'Mobile', 'Contact', 'phone_number'],
          weddingDate: ['weddingdate', 'Wedding Date', 'Event Date', 'wedding_date'],
          location: ['location', 'City', 'Place', 'Venue'],
          budget: ['budget', 'Price', 'Amount', 'Cost'],
          leadFrom: ['leadfrom', 'Source', 'Lead From', 'Platform'],
          designatedTo: ['designatedto', 'Assignee', 'Team', 'Staff'],
          afterQuote: ['afterquote'],
          wpAutomation: ['wpautomation'],
          mailId: ['mailid'],
          aiScore: ['aiscore'],
          aiSummary: ['aisummary'],
          date: ['date', 'Entry Date', 'Created At']
        };

        Object.entries(mappings).forEach(([targetKey, variations]) => {
          // If the target key is missing or empty, try to find it in variations
          if (!normalized[targetKey]) {
            const foundKey = Object.keys(lead).find(k => 
              variations.some(v => v.toLowerCase() === k.toLowerCase())
            );
            if (foundKey) {
              normalized[targetKey] = lead[foundKey];
            }
          }
        });

        // Ensure notes is always an array
        if (typeof normalized.notes === 'string') {
          try {
            normalized.notes = JSON.parse(normalized.notes);
          } catch (e) {
            normalized.notes = [];
          }
        }
        if (!Array.isArray(normalized.notes)) {
          normalized.notes = [];
        }

        return normalized as Lead;
      });

      // 3. Update cache
      localStorage.setItem("LENSFLOW_CACHED_LEADS", JSON.stringify(normalizedLeads));
      
      return normalizedLeads;
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      return initialLeads;
    }
  }

  async saveLead(lead: Lead): Promise<boolean> {
    const url = this.getWebAppUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "saveLead", lead }),
      });
      return true;
    } catch (error) {
      console.error("Failed to save lead:", error);
      return false;
    }
  }

  async updateLead(lead: Lead): Promise<boolean> {
    const url = this.getWebAppUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "updateLead", lead }),
      });
      return true;
    } catch (error) {
      console.error("Failed to update lead:", error);
      return false;
    }
  }

  async deleteLead(id: string): Promise<boolean> {
    const url = this.getWebAppUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "deleteLead", id }),
      });
      return true;
    } catch (error) {
      console.error("Failed to delete lead:", error);
      return false;
    }
  }
}

export const sheetsService = new GoogleSheetsService();

// APPS SCRIPT TEMPLATE (For the user to copy-paste into Google Apps Script)
export const APPS_SCRIPT_TEMPLATE = `
function doGet(e) {
  // Facebook Webhook Verification
  if (e.parameter['hub.mode'] == 'subscribe' && e.parameter['hub.verify_token']) {
    return ContentService.createTextOutput(e.parameter['hub.challenge']);
  }

  var action = e.parameter.action;
  if (action == 'getLeads') {
    return ContentService.createTextOutput(JSON.stringify({ leads: getLeadsFromSheet() }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action == 'getConfig') {
    return ContentService.createTextOutput(JSON.stringify({ config: getConfigFromSheet() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    // Handle form-encoded or other formats if necessary
  }
  
  var action = data.action || e.parameter.action;
  
  // Facebook Webhook Support
  if (action == 'webhook' || (!action && e.postData.contents)) {
    handleWebhook(e.postData.contents);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action == 'saveLead') {
    saveLeadToSheet(data.lead);
  } else if (action == 'updateLead') {
    updateLeadInSheet(data.lead);
  } else if (action == 'deleteLead') {
    deleteLeadFromSheet(data.id);
  } else if (action == 'saveConfig') {
    saveConfigToSheet(data.config);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getLeadsFromSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var leads = [];
  for (var i = 1; i < data.length; i++) {
    var lead = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].toString().toLowerCase().replace(/ /g, '');
      lead[key] = data[i][j];
    }
    leads.push(lead);
  }
  return leads;
}

function getConfigFromSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sheet) return null;
  var data = sheet.getRange(1, 1).getValue();
  return data ? JSON.parse(data) : null;
}

function saveConfigToSheet(config) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Config');
  sheet.getRange(1, 1).setValue(JSON.stringify(config));
}

function handleWebhook(contents) {
  try {
    var data = JSON.parse(contents);
    // Basic FB Lead Ads mapping (customize based on your form fields)
    var lead = {
      id: 'fb_' + (data.leadgen_id || Date.now()),
      date: new Date().toISOString().split('T')[0],
      clientName: data.full_name || data.name || 'New FB Lead',
      number: data.phone_number || '',
      leadFrom: 'Facebook Ads',
      color: 'White',
      notes: JSON.stringify([{
        id: 'note_' + Date.now(),
        text: 'Lead received from Facebook Ads.',
        timestamp: new Date().toISOString()
      }])
    };
    saveLeadToSheet(lead);
  } catch (e) {
    Logger.log('Webhook Error: ' + e.message);
  }
}

function saveLeadToSheet(lead) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');
    sheet.appendRow(['ID', 'Date', 'Lead From', 'Color', 'Client Name', 'Number', 'Wedding Date', 'Month', 'Designated to', 'After Quote', 'WP Automation', 'Location', 'Budget', 'Function', 'Mail ID', 'Notes', 'AI Score', 'AI Summary']);
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    var key = h.toString().toLowerCase().replace(/ /g, '');
    var value = lead[key] || lead[h] || findKeyCaseInsensitive(lead, key) || '';
    if (key === 'notes' && typeof value !== 'string') return JSON.stringify(value || []);
    return value;
  });
  sheet.appendRow(row);
}

function updateLeadInSheet(lead) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == lead.id) {
      var row = headers.map(function(h) {
        var key = h.toString().toLowerCase().replace(/ /g, '');
        var value = lead[key] || lead[h] || findKeyCaseInsensitive(lead, key) || '';
        if (key === 'notes' && typeof value !== 'string') return JSON.stringify(value || []);
        return value;
      });
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      break;
    }
  }
}

function deleteLeadFromSheet(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function findKeyCaseInsensitive(obj, key) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === key.toLowerCase()) {
      return obj[keys[i]];
    }
  }
  return null;
}
`;
