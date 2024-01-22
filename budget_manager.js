// This object contains an object using a key-value pair of manager name - email address
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

    // Checks who is the manager of the account based on the account labels and fetches the email from the emails object
    for (const manager in emails) {
      if (accountLabels.includes(manager)) {
        var currentManagerEmail = emails[manager];
        console.log("Manager: "  + manager + " | Manager email: " + currentManagerEmail);
      }
    }
      
    // Select account to integrate with AdsApp
    AdsManagerApp.select(account);
      
    // Load campaigns in child account and get campaign name
    var campaignIterator = AdsApp.campaigns().withCondition("campaign.status = ENABLED").get();
    while (campaignIterator.hasNext()) {
      console.log("**Campaign created**");
      let campaign = campaignIterator.next();
      let campaignName = campaign.getName();
      console.log(">> Campaign Name: " + campaignName);

<<<<<<< HEAD
      if (campaignName.includes("Branding") || campaignName.includes("branding") && !Object.keys(accountObject[accountName]).includes(campaignName)) {
        // pass
      } else {
        try {
          // Get the budget spent in the current month
          let monthSpend = campaign.getStatsFor("THIS_MONTH").getCost();
          console.log(">> Current Spend: $" + monthSpend);
          
          // Get the current average daily budget
          let budgetObject = campaign.getBudget();
          let currentBudget = budgetObject.getAmount();
          console.log(">> Current Daily Budget: $" + currentBudget + "/day");
          
          // Calculate leftover budget and calculate the daily spending benchmark
          var totalBudget = accountObject[accountName][campaignName];
          var leftover = totalBudget - monthSpend;
          var newDailyBudget = decimalBudget(leftover/daysLeft);
          var budgetBenchmark = decimalBudget(totalBudget/30.4);
          // console.log("Total Budget: $" + totalBudget);
          // console.log("Leftover: $" + leftover);
  
          // Sends an email to the manager if new daily budget is 3x or more higher than the benchmark
          // Sends an email to the manager in new daily budget is 3x or more less than the benchmark
          // Updates the budget if no errors are found
          if (newDailyBudget > 3*budgetBenchmark) {
            console.log(">> Error Code: 2. New required budget is too high!");
            console.log(">> Required Daily Budget: $" + newDailyBudget + " | Benchmark: $" + budgetBenchmark);
            sendErrorEmail(accountName, campaignName, currentManagerEmail, 2, newDailyBudget, budgetBenchmark);
          } else if (newDailyBudget < 0.4*budgetBenchmark) {
            console.log(">> Error Code: 3. New required budget is too low!");
            console.log(">> Required Daily Budget: $" + newDailyBudget + " | Benchmark: $" + budgetBenchmark);
            sendErrorEmail(accountName, campaignName, currentManagerEmail, 3, newDailyBudget, budgetBenchmark);
          } else {
            console.log(">> Required Daily Budget: " + newDailyBudget);
            budgetObject.setAmount(newDailyBudget);
            
            if (budgetObject.getAmount() == newDailyBudget){
              console.log(">> Budget successfully updated.");
              console.log(">> New Daily Budget: $" + budgetObject.getAmount());
            } 
          }
        }
  
        // If the budget cannot be updated causing a fatal error, sends the corresponding PPC manager an email
        catch {
          sendErrorEmail(accountName, campaignName, currentManagerEmail, 1);
        }
        console.log("**Campaign processed**");
      } 
=======
      try {
        // Get the budget spent in the current month
        let monthSpend = campaign.getStatsFor("THIS_MONTH").getCost();
        console.log(">> Current Spend: $" + monthSpend);
        
        // Get the current average daily budget
        let budgetObject = campaign.getBudget();
        let currentBudget = budgetObject.getAmount();
        console.log(">> Budget: $" + currentBudget + "/day");
        
        // Calculate leftover budget and calculate the daily spending benchmark
        var totalBudget = accountObject[accountName][campaignName];
        var leftover = totalBudget - monthSpend;
        var newDailyBudget = decimalBudget(leftover/daysLeft);
        var budgetBenchmark = decimalBudget(totalBudget/30.4);
        // console.log("Total Budget: $" + totalBudget);
        // console.log("Leftover: $" + leftover);

        // Sends an email to the manager if new daily budget is 3x or more higher than the benchmark
        // Sends an email to the manager in new daily budget is 3x or more less than the benchmark
        // Updates the budget if no errors are found
        if (newDailyBudget > 3*budgetBenchmark) {
          console.log(">> Error Code: 2. New required budget is too high!");
          console.log(">> Required Daily Budget: $" + newDailyBudget + " | Benchmark: $" + budgetBenchmark);
          sendErrorEmail(accountName, campaignName, currentManagerEmail, 2, newDailyBudget, budgetBenchmark);
        } else if (newDailyBudget < 0.4*budgetBenchmark) {
          console.log(">> Error Code: 3. New required budget is too low!");
          console.log(">> Required Daily Budget: $" + newDailyBudget + " | Benchmark: $" + budgetBenchmark);
          sendErrorEmail(accountName, campaignName, currentManagerEmail, 3, newDailyBudget, budgetBenchmark);
        } else {
          console.log(">> Required Daily Budget: " + newDailyBudget);
          budgetObject.setAmount(newDailyBudget);
          
          if (budgetObject.getAmount() == newDailyBudget){
            console.log(">> Budget successfully updated.");
            console.log(">> New Daily Budget: $" + budgetObject.getAmount());
          } 
        }
      }

      // If the budget cannot be updated causing a fatal error, sends the corresponding PPC manager an email
      catch {
        sendErrorEmail(accountName, campaignName, currentManagerEmail, 1);
      }
      console.log("**Campaign processed**");
>>>>>>> 61cf138b39395369420ca1bd5e1be4ae1d11c97e
    }
  }
  console.log("Account processed");
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

function sendErrorEmail(accountName, campaignName, email, code, budget, benchmark){
  if (code == 1) {
    var subject = "Budget Error - " + accountName;
    var body = "The budget management script couldn't update the campaign '" + campaignName + "' in your account '" + accountName + "'. Please update the budget manually.";
    MailApp.sendEmail(email, subject, body);
    console.log(">> Email sent. Code 1");
  } else if (code == 2) {
    var subject = "Budget Warning - " + accountName;
<<<<<<< HEAD
    var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", more than 3x your average daily of $" + benchmark + ". Please update manually if you want to proceed with this change.";
=======
    var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", more than 3x your average monthly of $" + benchmark + ". Please update manually if you want to proceed with this change.";
>>>>>>> 61cf138b39395369420ca1bd5e1be4ae1d11c97e
    MailApp.sendEmail(email, subject, body);
    console.log(">> Email sent. Code 2");
  } else if (code == 3) {
    var subject = "Budget Warning - " + accountName;
<<<<<<< HEAD
    var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", 3x lower than your average daily of $" + benchmark + ". Please update manually if you want to proceed with this change.";
=======
    var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", 3x lower than your average monthly of $" + benchmark + ". Please update manually if you want to proceed with this change.";
>>>>>>> 61cf138b39395369420ca1bd5e1be4ae1d11c97e
    MailApp.sendEmail(email, subject, body);
    console.log(">> Email sent. Code 3");
  }
}

function checkFirstDay() {
  const base = new Date();
  let currentDay = base.getDay();
  if (currentDay == 1) {
    return true
  } else {
    return false
  }
}