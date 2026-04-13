# Google Apps Script Setup for LensFlow CRM

To connect your Google Sheet as a backend, follow these steps:

1. Create a new **Google Sheet**.
2. Name the first sheet tab as `Leads`.
3. Set up the header row (Row 1) with these columns:
   `ID, Date, Lead From, Color, Client Name, Number, Wedding Date, Month, Designated to, After Quote, WP Automation, Location, Budget, Function, Mail ID, Notes, AI Score, AI Summary`
4. Go to **Extensions > Apps Script**.
5. Delete any existing code and paste the code below.
6. Click **Deploy > New Deployment**.
7. Select **Web App**.
8. Set **Execute as** to `Me`.
9. Set **Who has access** to `Anyone`.
10. Click **Deploy**, authorize the permissions, and copy the **Web App URL**.
11. Paste this URL into the **Settings** tab of the LensFlow CRM app.

## Apps Script Code

> **IMPORTANT:** Do NOT copy the ` ```javascript ` or ` ``` ` lines. Only copy the code starting from `function doGet(e)`.

```javascript
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
      // Special handling for Notes which is stored as JSON string
      if (headers[j] == 'Notes') {
        try {
          lead.notes = JSON.parse(data[i][j] || '[]');
        } catch(e) {
          lead.notes = [];
        }
      } else {
        lead[key] = data[i][j];
      }
    }
    leads.push(lead);
  }
  return leads;
}

function saveLeadToSheet(lead) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');
    sheet.appendRow(['ID', 'Date', 'Lead From', 'Color', 'Client Name', 'Number', 'Wedding Date', 'Month', 'Designated to', 'After Quote', 'WP Automation', 'Location', 'Budget', 'Function', 'Mail ID', 'Notes', 'AI Score', 'AI Summary']);
  }
  
  sheet.appendRow([
    lead.id,
    lead.date,
    lead.leadFrom,
    lead.color,
    lead.clientName,
    lead.number,
    lead.weddingDate,
    lead.month,
    lead.designatedTo,
    lead.afterQuote,
    lead.wpAutomation,
    lead.location,
    lead.budget,
    lead.function,
    lead.mailId,
    JSON.stringify(lead.notes || []),
    lead.aiScore || '',
    lead.aiSummary || ''
  ]);
}

function updateLeadInSheet(lead) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == lead.id) {
      sheet.getRange(i + 1, 1, 1, 18).setValues([[
        lead.id,
        lead.date,
        lead.leadFrom,
        lead.color,
        lead.clientName,
        lead.number,
        lead.weddingDate,
        lead.month,
        lead.designatedTo,
        lead.afterQuote,
        lead.wpAutomation,
        lead.location,
        lead.budget,
        lead.function,
        lead.mailId,
        JSON.stringify(lead.notes || []),
        lead.aiScore || '',
        lead.aiSummary || ''
      ]]);
      break;
    }
  }
}

function deleteLeadFromSheet(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}
```
