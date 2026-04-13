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
    if (!url) return [];

    try {
      const response = await fetch(`${url}?action=getLeads`);
      const data = await response.json();
      return data.leads || [];
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      return [];
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
