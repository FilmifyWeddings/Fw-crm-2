/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, Note } from "../types";

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
        const mappings: Record<string, string[]> = {
          clientName: ['clientname', 'Name', 'Client', 'Customer Name', 'client_name'],
          number: ['number', 'Phone', 'Mobile', 'Contact', 'phone_number'],
          weddingDate: ['weddingdate', 'Date', 'Wedding Date', 'Event Date', 'wedding_date'],
          location: ['location', 'City', 'Place', 'Venue'],
          budget: ['budget', 'Price', 'Amount', 'Cost'],
          leadFrom: ['leadfrom', 'Source', 'Lead From', 'Platform'],
          designatedTo: ['designatedto', 'Assignee', 'Team', 'Staff'],
          afterQuote: ['afterquote'],
          wpAutomation: ['wpautomation'],
          mailId: ['mailid'],
          aiScore: ['aiscore'],
          aiSummary: ['aisummary']
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
      const response = await fetch(url, {
        method: "POST",
        mode: "no-cors", // Apps Script often requires no-cors for simple POSTs
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "saveLead", lead }),
      });
      return true; // no-cors doesn't allow reading response, but we assume success if no error thrown
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
  var action = e.parameter.action;
  if (action == 'getLeads') {
    return ContentService.createTextOutput(JSON.stringify({ leads: getLeadsFromSheet() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action;
  
  if (action == 'saveLead') {
    saveLeadToSheet(data.lead);
  } else if (action == 'updateLead') {
    updateLeadInSheet(data.lead);
  } else if (action == 'deleteLead') {
    deleteLeadFromSheet(data.id);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper functions to interact with SpreadsheetApp...
// (I will provide a more detailed version in the UI)
`;
