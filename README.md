# GoogleBudgetManager
This script allows Google Ads script to automate budget management based on a Google Sheet document that contains account budget data.

Before using the program, the user needs to update the following variables:
- spreadsheetURL: This variable specifies the share link of the Google Sheets document that contains the budget and account data. The URL must be a string.

      var spreadsheetURL = "[ADD GOOGLE SHEET URL HERE]";

- sheetName: This variable contains the name of the sheet inside the document where the data is stored. The name must be a string and *exactly* match the name of the sheet in the document (capitals, spaces, etc. must be the same).

      var sheetName = "[ADD SHEET NAME HERE]";

- emails: This javascript object contains the emails of the PPC managers in the team. The object uses a key-value pairing of "managerName:managerEmail".

        var emails = {
              managerNameTag:"[MANAGER EMAIL]"
        }

The script is intended to run at the start of the day. This is the reason why the constant *days*, within the function *daysInMonth()*, adds one day to the difference between the current date and the total days in the month.
  
    function daysInMonth() {
      const base = new Date();
      let currentDay = base.getDate();
      let month = base.getMonth() + 1;
      let year = base.getFullYear();
      const days = new Date(year, month, 0).getDate() - currentDay + 1;
      return days
    }

If the script needs to be run at the end of the day, the *+ 1* needs to be removed to ensure that the daily budget is properly calculated.

For debugging purposes, you can remove the *'//'* before any *console.log()* calls to get more detailed information about script execution.
