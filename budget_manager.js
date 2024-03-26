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
  var spreadsheetURL = "https://docs.google.com/spreadsheets/d/12IQoVEHDiN2as9V5qFStalUGDBk_MQOBoeOUZkT79bo/edit?usp=sharing";
  var sheetName = "Budgets";
    
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

        // Created an object with base experiment campaigns and their cost
    experimentObject = {}
      
    // Load campaigns in child account and get campaign name
    var campaignIterator = AdsApp.campaigns().withCondition("campaign.status = ENABLED").get();

    var nonSharedSpend = 0;
    var brandingSpend = 0;
    var campaignCount = 0;
    while (campaignIterator.hasNext()) {
      const campaignCheck = campaignIterator.next();
      if (!campaignCheck.getBudget().isExplicitlyShared()) {
        nonSharedSpend = nonSharedSpend + campaignCheck.getStatsFor("THIS_MONTH").getCost();
      }
      if (campaignCheck.getName().includes("Branding") || campaignCheck.getName().includes("branding")) {
        brandingSpend = brandingSpend + campaignCheck.getStatsFor("THIS_MONTH").getCost();
      } else if (campaignCheck.isExperimentCampaign()) {
        let value = decimalBudget(campaignCheck.getStatsFor("THIS_MONTH").getCost(), false)
        experimentObject[campaignCheck.getName()] = value
      } else {
        campaignCount = campaignCount + 1;
      }
    }
    nonSharedSpend = decimalBudget(nonSharedSpend - brandingSpend, false);
    brandingSpend = decimalBudget(brandingSpend/campaignCount, false);
    
    var experimentIterator = AdsApp.experiments().get();
    
    while (experimentIterator.hasNext()){
      console.log("==== Creating Experiment ====");
      experiment = experimentIterator.next();
      if (experiment.getType() != "AD_VARIATION") {
        console.log("Type: " + experiment.getType());
        let experimentSuffix = experiment.getSuffix();
        console.log("Suffix: " + experimentSuffix);
        let experimentBase = experiment.getBaseCampaign().getName();
        console.log("Experiment base: " + experimentBase);
        key1 = experimentBase + " " + experimentSuffix;
        key2 = experimentBase + experimentSuffix;
        console.log(Object.keys(experimentObject).includes(key1) || Object.keys(experimentObject).includes(key2))
        try {
          if (Object.keys(experimentObject).includes(key1)){
            experimentObject[experimentBase] = experimentObject[key1];
            delete experimentObject[key1];
          } else if (Object.keys(experimentObject).includes(key2)) {
            experimentObject[experimentBase] = experimentObject[key2];
            delete experimentObject[key2];
          }
        } catch {
          //None
        }
      } else {
        //None
      }
    }
    
    console.log(">> Experiment Costs: ")
    console.log(experimentObject)
    

    var campaignIterator = AdsApp.campaigns().withCondition("campaign.status = ENABLED").get();

    while (campaignIterator.hasNext()) {
      console.log("**Campaign created**");
      let campaign = campaignIterator.next();
      let campaignName = campaign.getName();
      console.log(">> Campaign Name: " + campaignName);

      // Get the budget spent in the current month
      let monthSpend = campaign.getStatsFor("THIS_MONTH").getCost();
      let monthAccountSpend = account.getStatsFor("THIS_MONTH").getCost();
      console.log(">> Current Campaign Spend: $" + monthSpend);
      console.log(">> Current Account Spend: $" + monthAccountSpend);
      console.log(">> Current Non-Shared Spend: $" + nonSharedSpend);
      console.log(">> Current Branding Spend: $" + brandingSpend);
      
      // Get the current average daily budget
      let budgetObject = campaign.getBudget();
      let currentBudget = budgetObject.getAmount();
      console.log(">> Current Daily Budget: $" + currentBudget + "/day");

      // Checks if the program needs to update the branding budget or not.
      // First checks if the current campaign is a branding campaign. Then checks if there is budget information in the spreadsheet
      // If no branding information was specified, the program skips the campaign and lets the budget unchanged. Otherwise, the normal process applies.
      if (campaignName.includes("Branding") && !Object.keys(accountObject[accountName]).includes(campaignName) || campaignName.includes("branding") && !Object.keys(accountObject[accountName]).includes(campaignName)) {
        console.log("Branding campaign not included in spreadsheet. Budget unchanged.");
      } else if (campaign.isExperimentCampaign()) {
        console.log("This campaign is an experiment. Ignoring from the script calculations.")
      } else if (budgetObject.isExplicitlyShared()) {
        console.log(">> Portfolio budget in use");
        // Calculate leftover budget and calculate the daily spending benchmark
        var totalBudget = accountObject[accountName]["Portfolio"];
        var leftover = totalBudget - monthAccountSpend + nonSharedSpend;
        var newDailyBudget = decimalBudget(leftover/daysLeft);
        var budgetBenchmark = decimalBudget(totalBudget/30.4);
        console.log(">> Total Budget: $" + totalBudget);
        console.log(">> Leftover: $" + leftover);

        try {
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
            console.log(">> Required Daily Budget: $" + newDailyBudget);
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

      } else {
        // Calculate leftover budget and calculate the daily spending benchmark
        if (campaignName.includes("Branding") || campaignName.includes("branding")) {
          var totalBudget = accountObject[accountName][campaignName];
        } else if (Object.keys(experimentObject) == campaignName) {
          var experimentSpend = experimentObject[campaignName]
          var totalBudget = accountObject[accountName][campaignName] - brandingSpend - experimentSpend;
          console.log(">> This campaign is a base campaign for an active experiment campaign. Total budget adjusted")
        } else {
          var totalBudget = accountObject[accountName][campaignName] - brandingSpend;
        }
        var leftover = totalBudget - monthSpend;
        var newDailyBudget = decimalBudget(leftover/daysLeft);
        var budgetBenchmark = decimalBudget(totalBudget/30.4);
        console.log(">> Total Budget: $" + totalBudget);
        console.log(">> Leftover: $" + leftover);

        try {
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
            console.log(">> Required Daily Budget: $" + newDailyBudget);
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
  
function decimalBudget(amount, update=true){    
  // Sets amount to 1 if amount = 0
  if (amount == 0 && update == true) {
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
    var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", more than 3x your average daily of $" + benchmark + ". Please update manually if you want to proceed with this change.";
    MailApp.sendEmail(email, subject, body);
    console.log(">> Email sent. Code 2");
  } else if (code == 3) {
    var subject = "Budget Warning - " + accountName;
    var body = "Based on your current spending, the daily budget for '" + campaignName + "' should be $" + budget + ", 3x lower than your average daily of $" + benchmark + ". Please update manually if you want to proceed with this change.";
    MailApp.sendEmail(email, subject, body);
    console.log(">> Email sent. Code 3");
  }
}

function checkFirstDay() {
  const base = new Date();
  let currentDay = base.getDate();
  if (currentDay == 1) {
    return true
  } else {
    return false
  }
}
