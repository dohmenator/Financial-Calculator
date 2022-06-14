/* 
https://www.thebalance.com/loan-payment-calculations-315564

 I ended up using this formula: M = (P*J) / [1-(1+J)^-N] 
 where P = loan amount, J = periodic int rate N = total number of payments

 */
function calcMonthlyPayment()
{
    const loanForm = document.querySelector("#frmCalculator");
    let dblLoanAmount = parseFloat(loanForm.txtLoanAmount.value);
    let intYears = parseInt(loanForm.txtYears.value);
    let intMonths = parseInt(loanForm.txtMonths.value);
    let dblRate = parseFloat(loanForm.txtRate.value)/100; //convert % to decimal
    let strCompound = loanForm.selectCompound.options[loanForm.selectCompound.selectedIndex].text;
    let strPayBack = loanForm.selectPayBack.options[loanForm.selectPayBack.selectedIndex].text;
    
    //Get Periodic Interest Rate which is rate/how often rate is compounded
    let periodicIntRate = getPeriodicRate(strCompound, dblRate);
    console.log(`Periodic Int Rate: ${periodicIntRate}`);
    
    //need to get to total number of payment periods
    let totalNumPayments = getTotalNumPayments(intYears, intMonths, strPayBack);
    console.log(`Total Num Payments: ${totalNumPayments}`);    
    
    //Get monthly payment using formula:
    let monthlyPayment = getMonthlyPayment(dblLoanAmount, periodicIntRate, totalNumPayments);
    console.log(`Monthly Payment: ${monthlyPayment}`);
    
    getAmortizedPayments(periodicIntRate, dblLoanAmount, totalNumPayments, monthlyPayment);
    
    
//    console.log(`
//        Loan Amount: ${dblLoanAmount}
//        Num Years: ${intYears}
//        Num Months: ${intMonths}
//        Rate: ${dblRate}
//        Compounded: ${strCompound}
//        PayBack: ${strPayBack}
//        `);
}//END calcMonthlyPayment method

/**
 * Period rate is the APR / some scalar depending on how ofter the rate
 *  is compounded
 * @param {type} strCompounded
 * @param {type} rate
 * @returns {Number|undefined}
 */
function getPeriodicRate(strCompounded, rate){
    if(isNaN(rate) || !rate || rate<=0){
        alert("Please enter a valid interest rate");
        document.querySelector("#txtRate").focus();
        return;
    }
    switch (strCompounded){
        case "Annually(APY)":
            return rate;
            break;
        case "Semi-Annually":
            return rate/2;
            break;
        case "Quarterly":
            return rate/4;
            break;
        case "Monthly(APR)":
            return rate/12;
            break;   
        case "Semi-Monthly":
            return rate/24;
            break;   
        case "Biweekly":
            return rate/26;
            break;   
        case "Weekly":
            return rate/52;
            break;   
        case "Daily":
            return rate/365.25;
            break; 
        default:
            //e^r - 1 (here e=exponential constant(Euler's number)
            return Math.E**rate - 1;    
    }   
}

/**
 * Helper function to getTotalNumPayments
 * @param {type} someValue
 * @returns {Boolean}frue if someValue is a number; false otherwise
 */
function haveNumber(someValue)
{
    if (isNaN(someValue) && !someValue)
        return false; //don't have a number
    else if(someValue<=0)//? dont need b/c I set input's min attribute to one
        return false;
    else
        return true;//have a number
}

/**
 * Monthly payment depends on the total amount of payments and how often
 *  those payments will be made. 
 *  First get total time in years. Then depending how often the paybacks will
 *  be you multiply the totalYears by some scalar value
 *  NOTE: This function uses haveNumber as a helper function
 * @param {type} numYears
 * @param {type} numMonths
 * @param {type} strPayBack
 * @returns {Number|undefined}
 */
function getTotalNumPayments(numYears, numMonths, strPayBack){
    let totalYears = 0;
    
    if((!haveNumber(numYears)) && (!haveNumber(numMonths))){
        alert("Please enter a valid term amount");
        document.querySelector("#txtYears").focus();
        return;
    }
    else if(haveNumber(numYears) && haveNumber(numMonths)===false)
        totalYears = (numYears*12)/12.0;
    else if(haveNumber(numMonths) && haveNumber(numYears)===false)
        totalYears = (numMonths)/12.0;
    else
        totalYears = (numYears*12 + numMonths)/12.0;    
    
    switch(strPayBack){
        case "Every Day":
            return totalYears*365.25;
            break;
        case "Every Week":
            return totalYears*52;
            break;
        case "Every 2 Weeks":
            return totalYears*26;
            break;
        case "Every Half Month":
            return totalYears*24;
            break;
        case "Every Month":
            return totalYears*12;
            break;
        case "Every Quarter":
            return totalYears*4;
            break;
        case "Every 6 Months":
            return totalYears*2;
            break;
        default:
            return totalYears;
    }
}

function getMonthlyPayment(a,r,n){    
    //plan b: M = PJ / [1-(1+J)^-N] 
    //where P = loan amount, J = periodic int rate N = number of payments
    //Therefore: a=P; r=J; n=N
    return (a*r)/(1-(1+r)**-n)
    
}


function getAmortizedPayments(periodicIntRate, loanAmount, numPayments, monthlyPayment)
{
//    const arrIntPayments=[];
//    const arrPrincipalPayments=[];
    const amortizedPayments={
        arrInterest:[],
        arrPrincipal:[]
    };
    
    let curPrincipal = loanAmount;
    
    for(let i=0; i<numPayments; i++)
    {
        //get amount of interest. This is a fee so it'll be added back on to the balance/current principal
        let curInterest = curPrincipal*periodicIntRate;
        amortizedPayments.arrInterest.push(curInterest);
        //Amount of montly payment that goes to the principal is monthlypayment - interest
        //keeping in mind that interest is a fee
        amortizedPayments.arrPrincipal.push(monthlyPayment-curInterest);
        //update current principal. Adding on the curInterest as a fee for the loan
        curPrincipal = curPrincipal - monthlyPayment+curInterest;
    }
    return amortizedPayments;
//    let sumYearOne = 0;
//    for(let i=0; i<12; i++)
//        sumYearOne += amortizedPayments.arrInterest[i];
//    console.log(`Year one interest: ${sumYearOne}`);
//    sumYearOne=0;
//    for(let i=0; i<12; i++)
//        sumYearOne += amortizedPayments.arrPrincipal[i];
//    console.log(`Year one principal: ${sumYearOne}`);
}