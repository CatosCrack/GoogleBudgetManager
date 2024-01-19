var emails = {
  managerNameTag:"[MANAGER EMAIL]"
}

function main() {
  update_budgets();
  console.log("Script completely executed");
}

/* Use this block instead if this is the script that runs daily
function main() {
  if (checkFirstDay()){
    console.log("First day of month. Updating budgets");
    update_budgets();
  }
  else {
    console.log("Not first date. Budgets unchanged");
  }
  console.log("Script completely executed");
}
*/

function update_budgets() {
  // Gets days left in the current month
  var daysLeft = daysInMonth();
  console.log("Days left this month: " + daysLeft);
    
  // Define the spreadsheet containing budget data
  var spreadsheetURL = "[ADD GOOGLE SHEET URL HERE]";
  var sheetName = "[ADD SHEET NAME HERE]";
    
  // Open spreadsheet
  var spreadsheet = SpreadsheetApp.openByUrl(spreadsheetURL);
  var sheet = spreadsheet.getSheetByName(sheetName);
    
  // Get spreadsheet data and ignore table headers
  var range = sheet.getDataRange();
  var values = range.getValues();
  values.shift();
    
  // Test that values are properly imported
  // console.log("Values:")
  // console.log(values)
    
  // Convert value array to nested object
  var accountObject = {};
    
  for (var index = 0; index < values.length; index++) {
    let accountObjectName = values[index][0];
    let campaignObjectName = values[index][1];
    let budget = values[index][2];
          
    if (accountObjectName in accountObject) {
      accountObject[accountObjectName][campaignObjectName] = budget;
    } else {
      accountObject[accountObjectName] = {};
      accountObject[accountObjectName][campaignObjectName] = budget;
    }
  }
    
  // Test that object was properly formatted
  // console.log("Object");
  // console.log(accountObject);
  // console.log("Test to get value of Account1, Campaign2");
  // console.log(accountObject["Account1"]["Campaign2"]);
  
  // Load all the accounts in the MCC labelled as test accounts in an iterator
  var accountIterator = AdsManagerApp.accounts().withCondition("LabelNames CONTAINS 'Test Account'").get();
    
  while (accountIterator.hasNext()) {
    console.log("**Account created**");
    // Load a child account and get the account name
    let account = accountIterator.next();
    let accountName = account.getName();

    // Create an iterator with all labels applied to the child account and gets their names
    var accountLabelsIterator = account.labels().get();
    var accountLabels = [];
    while (accountLabelsIterator.hasNext()) {
      accountLabels.push(accountLabelsIterator.next().getName());
    }
    console.log("......................");
    console.log("Account Name: " + accountName);
      
    // Select account to integrate with AdsApp
    AdsManagerApp.select(account);
      
    // Load campaigns in child account and get campaign name
    var campaignIterator = AdsApp.campaigns().withCondition("campaign.status = ENABLED").get();
    while (campaignIterator.hasNext()) {
      console.log("**Campaign created**");
      let campaign = campaignIterator.next();
      let campaignName = campaign.getName();
      console.log("Campaign Name: " + campaignName);

      try {
        //Get the budget spent in the current month
        let monthSpend = campaign.getStatsFor("THIS_MONTH").getCost();
        console.log("Month Spend: $" + monthSpend);
        
        // Get the current average daily budget
        let budgetObject = campaign.getBudget();
        let currentBudget = budgetObject.getAmount();
        console.log("Budget: $" + currentBudget + "/day");
        
        // Calculate leftover budget
        var totalBudget = accountObject[accountName][campaignName];
        // console.log("Total Budget: $" + totalBudget);
        var leftover = totalBudget - monthSpend;
        // console.log("Leftover: $" + leftover);
        var newDailyBudget = decimalBudget(leftover/daysLeft);
        console.log("New Average Daily Budget: " + newDailyBudget);
        budgetObject.setAmount(newDailyBudget);
        
        if (budgetObject.getAmount() == newDailyBudget){
          console.log("Budget successfully updated.");
          console.log("New Daily Budget: $" + budgetObject.getAmount());
        }
      }

      // If the budget cannot be updated for whatever reason, send the corresponding PPC manager an email
      catch {
        if (accountLabels.includes("[MANAGER EMAIL]")) {
          console.log(emails["[MANAGER EMAIL]"]);
          sendErrorEmail(accountName, campaignName, emails["[MANAGER EMAIL]"]);
         }
      }
    }
    console.log("Campaign while loop ended");
  }
  console.log("Account while loop ended");
}
  
function daysInMonth() {
  const base = new Date();
  let currentDay = base.getDate();
  let month = base.getMonth() + 1;
  let year = base.getFullYear();
  const days = new Date(year, month, 0).getDate() - currentDay + 1;
  return days
}
  
function decimalBudget(amount){    
  // Sets amount to 1 if amount = 0
  if (amount == 0) {
    amount = 1;
  }

  let numToString = amount.toFixed(2);
  return numToString * 1;
}

function sendErrorEmail(accountName, campaignName, email){
  var subject = "Budget Error - " + accountName;
  var body = "The budget management script couldn't update the campaign {" + campaignName + "} in your account {" + accountName + "}. Please update the budget manually.";
  MailApp.sendEmail(email, subject, body);
}

function checkFirstDay() {
  const base = new Date();
  let currentDay = base.getDay();
  if (currentDay == 1) {
    return true
  }
  
  else {
    return false
  }
}