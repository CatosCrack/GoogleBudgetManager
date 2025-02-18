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
## Day Accuracy

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

## Email Error System
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

## Formatting the spreadsheet
You need to format you spreadsheet carefully to avoid errors. Under the "account" column you need to input the account name exactly as it is in Google. The same goes for the each of the campaigns in the account that you need to update with the script. For the budget amount, do not use any formating or periods and commas.

![Screenshot of Google Sheet](https://github.com/CatosCrack/GoogleBudgetManager/blob/main/resources/im1.png)

If you pause a campaign, you don't need to take it out of the spreadsheet. However, if you have an active campaign in your Google account and you don't add it, you will cause an error. When an error happens, you will receive an email detailing what account is missing the campaign.

### Branding campaigns
If your budget for the branding campaign is a fixed amount every month, don't add it in the spreadsheet. Simply set the correct amount in Google Ads.

For branding campaigns with specific budgets, add it to the spreadsheet as explained.

### Accounts using shared budgets
If you are using shared budgets for your campaigns, instead of adding the name of an specific campaign, add "Portfolio" in the campaign column. The budget amount will then be applied to the campaigns that are sharing the budget.

If you have campaigns in the same account that are not using the shared budget, simply add them like you would add any other campaign.

## Adding/Excluding accounts from the script
If you want the script to make changes to the account, add the label "Budget Script" at the MCC level. If you don't add a label, the script will simply ignore this account when makign the changes.

Additionally, if you want to include an account but don't want to include all the campaigns, it is as simple as not including the campaign name in the spreadsheet.
