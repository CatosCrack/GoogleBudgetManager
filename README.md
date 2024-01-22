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
# Day Accuracy

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

# Email Error System
The function that handles the mailing system uses an error code system. Here's the explanation:
- Code 1: This means there was a fatal error in the code. The PPC manager of the account that caused the error will be notified.

      if (code == 1) {
        var subject = "Budget Script Error - " + accountName;
        var body = "The budget management script couldn't update the campaign '" + campaignName + "' in your account '" + accountName + "'. Please update the budget manually.";
        MailApp.sendEmail(email, subject, body);
        console.log(">> Email sent. Code 1");
        }
  
- Code 2: This code indicates that the new required daily amount is over 3x the average daily amount. This average daily amount is calculated as Total Budget / 30.4 days.

      else if (code == 2) {
        var subject = "Budget Script Warning - " + accountName;
        var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", more than 3x your average of $" + benchmark + "/day. Please update manually if you want to proceed with this change.";
        MailApp.sendEmail(email, subject, body);
        console.log(">> Email sent. Code 2");
        }

- Code 3: This error means that the new required daily budget is 3x less than than the average amount. This average daily amount is calculated as Total Budget / 30.4 days. 

      else if (code == 3) {
        var subject = "Budget Script Warning - " + accountName;
        var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", 3x lower than your average of $" + benchmark + "/day. Please update manually if you want to proceed with this change.";
        MailApp.sendEmail(email, subject, body);
        console.log(">> Email sent. Code 3");
        }

# Formatting the spreadsheet
You need to format you spreadsheet carefully to avoid errors. Under the "account" column you need to input the account name exactly as it is in Google. The same goes for the each of the campaigns in the account that you need to update with the script. For the budget, do not use any formating or periods or commas.

![Screenshot of Google Sheet](https://github.com/CatosCrack/GoogleBudgetManager/blob/main/resources/im1.png)
