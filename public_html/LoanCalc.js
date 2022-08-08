/* 
https://www.thebalance.com/loan-payment-calculations-315564

 I ended up using this formula: M = (P*J) / [1-(1+J)^-N] 
 where P = loan amount, J = periodic int rate N = total number of payments

 */
function calcMonthlyPayment() {
    const loanForm = document.querySelector("#frmCalculator");
    let dblLoanAmount = parseFloat(loanForm.txtLoanAmount.value);
    let intYears = parseInt(loanForm.txtYears.value);
    let intMonths = parseInt(loanForm.txtMonths.value);
    //convert % to decimal then to monthly periodic rate
    let periodicIntRate = parseFloat(loanForm.txtRate.value) / 100 / 12;

    //need to get to total number of payment periods
    let totalNumPayments = getTotalNumPayments(intYears, intMonths);
    loanForm.txtTotalMonthlyPayments.value = totalNumPayments;

    //Get monthly payment using formula:
    let monthlyPayment = getMonthlyPayment(dblLoanAmount, periodicIntRate, totalNumPayments);
    //format monthlyPayment to currency. Save returned value in new value
    //so you can still do math with 'monthlyPayment'
    const formattedMonthlyPayment = formatNumber(monthlyPayment);
    loanForm.txtMonthlyPayment.value = formattedMonthlyPayment;

    //Separate amount of each payment that pays down the balance and what part is interest
    const objAmortizedPayments = getAmortizedPayments(periodicIntRate, dblLoanAmount, totalNumPayments, monthlyPayment);

    //In order to create an annual amortization table you'll need the annual
    //sums of interest and principal amounts paid out
    const arrAnnualSums = getAnnualSums(objAmortizedPayments, totalNumPayments);

    //Tallying total interest and principal
    let sumTotalInterest = tallyAnnualSums(arrAnnualSums, true);
    let sumTotalPrincipal = tallyAnnualSums(arrAnnualSums, false);

    //Display total interest formatted with comma
    formattedSumTotalInterest = formatNumber(sumTotalInterest);
    loanForm.txtTotalInterest.value = formattedSumTotalInterest;

    showPieGraph(sumTotalInterest, sumTotalPrincipal);

    createAmortizedSchedule(arrAnnualSums, dblLoanAmount);
    //    console.log(`
    //        Loan Amount: ${dblLoanAmount}
    //        Num Years: ${intYears}
    //        Num Months: ${intMonths}
    //        Rate: ${dblRate}
    //        Compounded: ${strCompound}
    //        PayBack: ${strPayBack}
    //        `);

} //END calcMonthlyPayment method

const formatNumber = (() => {
    const formattedOptions = { style: 'currency', currency: 'USD' };
    const numFormat = new Intl.NumberFormat('en-US', formattedOptions);

    /**
     * Formats 'curNum' to currency US Dollars
     * 
     * @param {number} curNum
     * @returns {string} formatted number to currency USD
     */
    return (curNum) => numFormat.format(curNum);
})();

/**
 * Helper function to getTotalNumPayments
 * @param {type} someValue
 * @returns {Boolean}frue if someValue is a number; false otherwise
 */
function haveNumber(someValue) {
    if (isNaN(someValue) && !someValue)
        return false; //don't have a number
    else if (someValue <= 0) //? dont need b/c I set input's min attribute to one
        return false;
    else
        return true; //have a number
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
function getTotalNumPayments(numYears, numMonths) {
    //let totalYears = 0;

    if ((!haveNumber(numYears)) && (!haveNumber(numMonths))) {
        alert("Please enter a valid term amount");
        document.querySelector("#txtYears").focus();
        return;
    } else if (haveNumber(numYears) && haveNumber(numMonths) === false)
    //totalYears = (numYears*12)/12.0;
        return numYears * 12;
    else if (haveNumber(numMonths) && haveNumber(numYears) === false)
    //totalYears = (numMonths)/12.0;
        return numMonths;
    else
    //totalYears = (numYears*12 + numMonths)/12.0;
        return numYears * 12 + numMonths;
}

function getMonthlyPayment(a, r, n) {
    //plan b: M = PJ / [1-(1+J)^-N] 
    //where P = loan amount, J = periodic int rate N = number of payments
    //Therefore: a=P; r=J; n=N
    return a * (r / (1 - (1 + r) ** -n))

}


function getAmortizedPayments(periodicIntRate, loanAmount, numPayments, monthlyPayment) {
    const amortizedPayments = {
        arrInterest: [],
        arrPrincipal: []
    };

    let curPrincipal = loanAmount;

    for (let i = 0; i < numPayments; i++) {
        //get amount of interest. This is a fee so it'll be added back on to the balance/current principal
        let curInterest = curPrincipal * periodicIntRate;
        amortizedPayments.arrInterest.push(curInterest);
        //Amount of montly payment that goes to the principal is monthlypayment - interest
        //keeping in mind that interest is a fee
        amortizedPayments.arrPrincipal.push(monthlyPayment - curInterest);
        //update current principal. Adding on the curInterest as a fee for the loan
        curPrincipal = curPrincipal - monthlyPayment + curInterest;
    }
    return amortizedPayments;

}

function getAnnualSums(objAmortizedPayments) {
    const arrAnnualSums = [];
    //const numAnnualPayments = getNumAnnualPayments(strPayBack);
    for (let i = 0; i < objAmortizedPayments.arrInterest.length; i += 12) {
        const objAnnuals = {
            "annualInterest": 0,
            "annualPrincipal": 0
        };
        let sumAnnualInterest = 0;
        let sumAnnualPrincipal = 0;
        for (let j = 1, k = i; j <= 12; j++, k++) {
            if (k < objAmortizedPayments.arrInterest.length) {
                sumAnnualInterest += objAmortizedPayments.arrInterest[k];
                sumAnnualPrincipal += objAmortizedPayments.arrPrincipal[k];
            } else
                break;

        }
        objAnnuals["annualInterest"] = sumAnnualInterest;
        objAnnuals["annualPrincipal"] = sumAnnualPrincipal;
        arrAnnualSums.push(objAnnuals);
    }

    return arrAnnualSums;
}

/**
 * Tally total amount of interest and principal. Total interest is displayed 
 *   as output to the user.  ?Don't think I need to tally total annual principals
 * @param {type} arrAnnualSums
 * @param {type} isInterest
 * @returns {unresolved}
 */
function tallyAnnualSums(arrAnnualSums, isInterest) {
    if (isInterest)
        return arrAnnualSums.reduce((result, b) => result + b.annualInterest, 0);
    else
        return arrAnnualSums.reduce((result, b) => result + b.annualPrincipal, 0);

}


function showPieGraph(sumTotalInterest, sumTotalPrincipal) {
    let interestPercent = (sumTotalInterest / (sumTotalPrincipal + sumTotalInterest) * 100);
    let principalPercent = (sumTotalPrincipal / (sumTotalPrincipal + sumTotalInterest) * 100);


    var chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        title: {
            text: "Interest vs. Principal"
        },
        data: [{
            type: "pie",
            startAngle: 240,
            yValueFormatString: "##0\"%\"",
            indexLabel: "{label} {y}",
            dataPoints: [
                { y: principalPercent, label: "Principal" },
                { y: interestPercent, label: "Interest" }
            ]
        }]
    });
    chart.render();
}

/**
 * Create a table showing the annual amortized shedule
 * @param {type} arrAnnualSums
 * @param {type} amountBorrowed
 * @returns nothing
 */
function createAmortizedSchedule(arrAnnualSums, amountBorrowed) {
    //console.log(document.querySelector("#tableContainer").childElementCount);
    //If table currently exist from previous calcuation, remove it
    if (document.querySelector("#tableContainer").childElementCount > 0) {
        //we have a previous table, remove it
        document.querySelector("#tableContainer").children[0].remove();
    }
    //create table
    const tempTable = document.createElement("TABLE");
    tempTable.id = "amortizedTable";

    //Create Caption for table
    const tempCaption = document.createElement("CAPTION");
    tempCaption.innerHTML = "Annual Amortized Schedule";
    tempTable.append(tempCaption);

    //Create ColumnHeadings
    const arrHeadings = ["", "Beginning Balance", "Interest", "Principal", "Ending Balance"];
    const rowHeadings = document.createElement("TR");
    arrHeadings.forEach((curHeading) => {
        let tempTH = document.createElement("TH");
        tempTH.innerHTML = curHeading;
        rowHeadings.append(tempTH);
    });
    tempTable.append(rowHeadings); //add row headings to table

    //Create row for each year, formatting data as currency for each TD cell created
    for (let i = 0; i < arrAnnualSums.length; i++) {
        let tempRow = document.createElement("TR");
        tempRow.append(createTD(i + 1));
        tempRow.append(createTD(formatNumber(amountBorrowed)));
        tempRow.append(createTD(formatNumber(arrAnnualSums[i].annualInterest)));
        tempRow.append(createTD(formatNumber(arrAnnualSums[i].annualPrincipal)));
        tempRow.append(createTD(formatNumber(amountBorrowed - arrAnnualSums[i].annualPrincipal)));
        amountBorrowed -= arrAnnualSums[i].annualPrincipal;
        tempTable.appendChild(tempRow);
    }

    //append table to div container
    document.querySelector("#tableContainer").append(tempTable);
}

function createTD(data) {
    tempCell = document.createElement("TD");
    tempCell.innerHTML = data;
    return tempCell;
}