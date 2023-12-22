function main() {
  
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
    var range = sheet.getDataRange()
    var values = range.getValues()
    values.shift()
    
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
    // console.log("Test to get value of Account3, Campaign2");
    // console.log(accountObject["Account3"]["Campaign2"]);
  
    // Load all the accounts in the MCC labelled as test accounts in an iterator
    var accountIterator = AdsManagerApp.accounts().withCondition("LabelNames CONTAINS 'Test Account'").get();
    
    while (accountIterator.hasNext()) {
      console.log("**Account created**");
      // Load a child account and get the account name
      let account = accountIterator.next();
      let accountName = account.getName();
      console.log("......................")
      console.log("Account Name: " + accountName);
      
      // Select account to integrate with AdsApp
      AdsManagerApp.select(account)
      
      // Load campaigns in child account and get campaign name
      var campaignIterator = AdsApp.campaigns().withCondition("campaign.status = ENABLED").get();
      while (campaignIterator.hasNext()) {
        console.log("**Campaign created**");
        let campaign = campaignIterator.next();
        let campaignName = campaign.getName();
        console.log("Campaign Name: " + campaignName);
        
        //Get the budget spent in the current month
        let monthSpend = campaign.getStatsFor("THIS_MONTH").getCost();
        console.log("Month Spend: $" + monthSpend);
        
        // Get the current average daily budget
        let budgetObject = campaign.getBudget();
        let currentBudget = budgetObject.getAmount();
        console.log("Budget: $" + currentBudget + "/day");
        
        // Calculate leftover budget
        var totalBudget = accountObject[accountName][campaignName];
        console.log("Total Budget: $" + totalBudget);
        var leftover = totalBudget - monthSpend;
        console.log("Leftover: $" + leftover);
        var newDailyBudget = decimalBudget(leftover/daysLeft);
        console.log(typeof newDailyBudget);
        console.log("New Average Daily Budget: " + newDailyBudget);
        budgetObject.setAmount(newDailyBudget);
        
        if (budgetObject.getAmount() == newDailyBudget){
          console.log("Budget successfully updated.");
          console.log("New Daily Budget: $" + budgetObject.getAmount());
        }
      }
      console.log("Campaign while loop ended");
    }
    console.log("Account while loop ended");
    console.log("Script completely executed");
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