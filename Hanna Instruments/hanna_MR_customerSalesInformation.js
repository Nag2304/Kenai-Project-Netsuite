/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hanna_MR_customerSalesInformation.js
 * Script: Hanna | MR Customer Sales Information
 * Author           Date       Version               Remarks
 * mikewilliams  03.26.2024     1.00     Initial Creation of the Script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
    /* ------------------------ Global Variables - Begin ------------------------ */
    const exports = {};
    /* ------------------------- Global Variables - End ------------------------- */
    //
    /* ------------------------- Get Input Data - Begin ------------------------- */
    const getInputData = () => {
        const loggerTitle = ' Get Input Data';
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        log.debug(loggerTitle, ' Search Started');
        return search.create({
            type: 'customrecord_hanna_customer_sales',
            filters: [
                ['custrecord_hanna_customer_id.companyname', 'isnotempty', ''],
                'AND',
                ['custrecord_hanna_customer_id.status', 'anyof', '18'],
            ],
            columns: [
                search.createColumn({
                    name: 'internalid',
                    label: 'Internal ID',
                }),
                search.createColumn({
                    name: 'internalid',
                    join: 'CUSTRECORD_HANNA_CUSTOMER_ID',
                    label: 'Internal ID',
                }),
            ],
        });
    };
    /* ------------------------- Get Input Data - End ------------------------- */
    //
    /* -------------------------- Reduce Phase - Begin -------------------------- */
    /**
     *
     * @param {object} reduceContext
     */
    const reduce = (reduceContext) => {
        const loggerTitle = 'Reduce Phase';
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        try {
            // Retrieve Key & values.
            const key = reduceContext.key;
            log.debug(loggerTitle, 'Key: ' + key);
            const results = JSON.parse(reduceContext.values[0]);
            log.debug(loggerTitle + ' Values', results);
            //
            // Retrieve Customer ID
            const customerId =
                results.values['internalid.CUSTRECORD_HANNA_CUSTOMER_ID'].value;
            const customRecordId = results.id;
            //
            /* ---------------- Call the functions and set Values - Begin --------------- */
            // Orders Years To Date
            const ordersYearToDateValue = ordersYearToDate(customerId);
            //
            // Prior Years Sale
            const priorYearsSales = priorYearsSale(customerId);
            //
            // Last Years To Sale
            const lastYearSaleTotalValue = lastYearSalesTotal(customerId);
            //
            // TOTAL VALUE OF INVOICES
            const totalValueOfInvoicesValue = totalValueOfInvoices(customerId);
            //
            // SUM OF LIFETIME SALES
            const sumLifeTimeSalesValue = sumOfLifeTimeSales(customerId);
            //
            // LIFE TIME ORDERS
            const lifeTimeOrdersValue = lifeTimeOrders(customerId);
            //
            // ACTIVITES OF CUSTOMERS
            const customerActivites = activitesOfCustomers(customerId);
            //
            // COUNT OF SKU's THIS YEAR
            const countOfItemsThisYear = countOfSKUsThisYear(customerId);
            //
            // COUNT OF SKU's LAST YEAR
            const countOfItemsLastYear = countOfSKUsLastYear(customerId);
            //
            // COUNT OF SKU's TWO YEARS AGO
            const countOfItemsTwoYearsAgo = countOfSKUsTwoYearsAgo(customerId);
            //
            log.debug(loggerTitle, { ordersYearToDateValue, priorYearsSales, lastYearSaleTotalValue, totalValueOfInvoicesValue, sumLifeTimeSalesValu })
            /* ---------------- Call the functions and set Values - End --------------- */
            //
            /* ------------------- Submit - the Custom record - Begin ------------------- */
            record.submitFields({
                type: 'customrecord_hanna_customer_sales',
                id: customRecordId,
                values: {
                    custrecord_hanna_orderstodate: ordersYearToDateValue,
                    custrecord_hanna_prioryearssales: priorYearsSales,
                    custrecord_hanna_lastyears_salestotal: lastYearSaleTotalValue,
                    custrecord_hanna_total_value_invoices: totalValueOfInvoicesValue,
                    custrecord_hanna_sum_lifetime_sales: sumLifeTimeSalesValue,
                    custrecord_hanna_lifetime_orders: lifeTimeOrdersValue,
                    custrecord_hanna_calls_currentyear: customerActivites.phoneCall,
                    custrecord_hanna_tasks_currentyear: customerActivites.tasks,
                    custrecord_hanna_virtual_meetings_cyear:
                        customerActivites.virtualMeetings,
                    custrecord_hanna_totalactivites_lifetime:
                        customerActivites.totalActivites,
                    custrecord_hanna_codes_sku_currentyear: countOfItemsThisYear,
                    custrecord_hanna_codes_sku_2023: countOfItemsLastYear,
                    custrecord_hanna_codes_sku_2022: countOfItemsTwoYearsAgo,
                },
            });
            log.audit(
                loggerTitle,
                ' Hanna Customer Sales Information Saved Successfully: ' +
                customRecordId
            );
            /* ------------------- Submit - the Custom record - End ------------------- */
            //
        } catch (error) {
            log.error(loggerTitle + ' caught an exception', error);
        }
        //
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
    };
    /* --------------------------- Reduce Phase - End --------------------------- */
    //
    /* ------------------------- Summarize Phase - Begin ------------------------ */
    /**
     *
     * @param {object} summarizeContext
     */
    const summarize = (summarizeContext) => {
        const loggerTitle = 'Summarize Phase';
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        try {
            log.audit(
                loggerTitle + ' Usage',
                'Summary Usage: ' + summarizeContext.usage
            );
            log.audit(
                loggerTitle + ' Concurrency',
                'Summary Concurrency: ' + summarizeContext.concurrency
            );
            log.audit(
                loggerTitle + ' Yields',
                'Summary Yields: ' + summarizeContext.yields
            );
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
    };
    /* ------------------------- Summarize Phase - End ------------------------ */
    //
    /* ------------------------- Helper Functions - Begin ------------------------ */
    //
    /* *********************** Orders Year To Date - Begin *********************** */
    /**
     *
     * @param {string} customerId
     * @returns {Number} ordersYearToDateValue
     */
    const ordersYearToDate = (customerId) => {
        const loggerTitle = ' Orders Year To Date ';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        let ordersYearToDateValue = 0;
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                filters: [
                    ['datecreated', 'within', 'thisyear'],
                    'AND',
                    ['account', 'anyof', '123'],
                    'AND',
                    ['status', 'noneof', 'SalesOrd:C'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'tranid',
                        summary: 'COUNT',
                        label: 'Document Number',
                    }),
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                ],
            });
            log.debug(loggerTitle, ' Search Called Successfully ');
            const searchResultCount = transactionSearchObj.runPaged().count;
            log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
            //
            transactionSearchObj.run().each((result) => {
                ordersYearToDateValue = parseInt(
                    result.getValue({
                        name: 'tranid',
                        summary: 'COUNT',
                        label: 'Document Number',
                    })
                );
                return true;
            });
            log.debug(loggerTitle, ' Orders Year To Date: ' + ordersYearToDateValue);
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return ordersYearToDateValue ? ordersYearToDateValue : 0;
    };
    /* *********************** Orders Year To Date - End *********************** */
    //
    /* *********************** Prior Years Sale - Begin *********************** */
    /**
     *
     * @param {number} customerId
     * @returns {number} amount
     */
    const priorYearsSale = (customerId) => {
        const loggerTitle = ' Prior Years Sale ';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        let amount = 0;
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'ACCTTYPE',
                    },
                ],
                filters: [
                    ['trandate', 'within', 'lastyear'],
                    'AND',
                    [
                        'item.type',
                        'anyof',
                        'Assembly',
                        'Discount',
                        'Description',
                        'InvtPart',
                        'Group',
                        'Kit',
                        'Markup',
                        'NonInvtPart',
                        'OthCharge',
                        'Payment',
                        'Service',
                        'Subtotal',
                    ],
                    'AND',
                    [
                        'type',
                        'anyof',
                        'CustInvc',
                        'CashRfnd',
                        'CashSale',
                        'CustCred',
                        'Journal',
                        'CustRfnd',
                    ],
                    'AND',
                    ['customer.custentity_hanna_department', 'anyof', '282'],
                    'AND',
                    ['subsidiary', 'anyof', '1'],
                    'AND',
                    ['cseg_hi_hannaentity', 'anyof', '2'],
                    'AND',
                    ['account', 'noneof', '1190'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'amount',
                        summary: 'SUM',
                        label: 'Amount',
                    }),
                ],
            });
            //
            log.debug(loggerTitle, ' Search Called Successfully ');
            const searchResultCount = transactionSearchObj.runPaged().count;
            log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
            //
            transactionSearchObj.run().each((result) => {
                amount = result.getValue({
                    name: 'amount',
                    summary: 'SUM',
                    label: 'Amount',
                });

                return true;
            });
            //
            log.debug(loggerTitle, ' Amount: ' + amount);
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return amount ? amount : 0;
    };
    /* *********************** Prior Years Sale - End *********************** */
    //
    /* *********************** Last Year Sales Total - Begin *********************** */
    /**
     *
     * @param {number} customerId
     * @returns {number}
     */
    const lastYearSalesTotal = (customerId) => {
        const loggerTitle = ' Last Year Sales Total ';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        let total = 0;
        //
        try {
            // Subsidiary - 1 - "Hanna Instruments Inc"
            // Hanna Entity - 2 - "Hanna Instruments US"
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'ACCTTYPE',
                    },
                ],
                filters: [
                    ['subsidiary', 'anyof', '1'],
                    'AND',
                    ['cseg_hi_hannaentity', 'anyof', '2'],
                    'AND',
                    ['trandate', 'within', 'fiscalyearbeforelast'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    [
                        'type',
                        'anyof',
                        'CustInvc',
                        'CashRfnd',
                        'CashSale',
                        'CustCred',
                        'CustRfnd',
                        'Journal',
                    ],
                    'AND',
                    ['customer.custentity_hanna_department', 'anyof', '282'],
                    'AND',
                    ['account', 'noneof', '1190'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                    search.createColumn({
                        name: 'formulacurrency',
                        summary: 'SUM',
                        formula:
                            '(NVL({totalamount},0)-NVL({taxtotal},0)-NVL({shippingamount},0))',
                        label: 'Formula (Currency)',
                    }),
                ],
            });
            //
            log.debug(loggerTitle, ' Search Called Successfully ');
            const searchResultCount = transactionSearchObj.runPaged().count;
            log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
            //
            transactionSearchObj.run().each((result) => {
                total = result.getValue({
                    name: 'formulacurrency',
                    summary: 'SUM',
                    formula:
                        '(NVL({totalamount},0)-NVL({taxtotal},0)-NVL({shippingamount},0))',
                    label: 'Formula (Currency)',
                });
                return true;
            });
            //
            log.debug(loggerTitle, ' Total: ' + total);
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return total ? total : 0;
    };
    /* *********************** Last Year Sales Total - End *********************** */
    //
    /* *********************** Total Value of Invoices - Begin *********************** */
    const totalValueOfInvoices = (customerId) => {
        const loggerTitle = ' Total Value of Invoices ';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        let totalValueOfInvoices = 0;
        //
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'ACCTTYPE',
                    },
                ],
                filters: [
                    ['subsidiary', 'anyof', '1'],
                    'AND',
                    ['cseg_hi_hannaentity', 'anyof', '2'],
                    'AND',
                    [
                        'type',
                        'anyof',
                        'CustInvc',
                        'CashRfnd',
                        'CashSale',
                        'CustCred',
                        'CustRfnd',
                        'Journal',
                    ],
                    'AND',
                    ['trandate', 'within', 'thisyear'],
                    'AND',
                    ['customer.custentity_hanna_department', 'anyof', '282'],
                    'AND',
                    ['account', 'noneof', '1190'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                    search.createColumn({
                        name: 'formulacurrency',
                        summary: 'SUM',
                        formula: '{grossamount}-nvl({shippingamount},0)-nvl({taxamount},0)',
                        label: 'Formula (Currency)',
                    }),
                ],
            });
            //
            log.debug(loggerTitle, ' Search Called Successfully ');
            const searchResultCount = transactionSearchObj.runPaged().count;
            log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
            //
            transactionSearchObj.run().each((result) => {
                totalValueOfInvoices = result.getValue({
                    name: 'formulacurrency',
                    summary: 'SUM',
                    formula: '{grossamount}-nvl({shippingamount},0)-nvl({taxamount},0)',
                    label: 'Formula (Currency)',
                });
                return true;
            });
            //
            log.debug(
                loggerTitle,
                ' Total Value Of Invoices: ' + totalValueOfInvoices
            );
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return totalValueOfInvoices ? totalValueOfInvoices : 0;
    };
    /* *********************** Total Value of Invoices - End *********************** */
    //
    /* *********************** Sum of Lifetime Sales - Begin *********************** */
    const sumOfLifeTimeSales = (customerId) => {
        const loggerTitle = ' Total Value of Invoices ';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        let sumLifeTimeSales = 0;
        //
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'ACCTTYPE',
                    },
                ],
                filters: [
                    ['subsidiary', 'anyof', '1'],
                    'AND',
                    [
                        'type',
                        'anyof',
                        'CustInvc',
                        'CashRfnd',
                        'CashSale',
                        'CustCred',
                        'CustRfnd',
                        'Journal',
                    ],
                    'AND',
                    ['cseg_hi_hannaentity', 'anyof', '2'],
                    'AND',
                    ['customer.custentity_hanna_department', 'anyof', '282'],
                    'AND',
                    ['account', 'noneof', '1190'],
                    'AND',
                    [
                        'item.type',
                        'anyof',
                        'Assembly',
                        'Description',
                        'Discount',
                        'InvtPart',
                        'Group',
                        'Kit',
                        'Markup',
                        'NonInvtPart',
                        'OthCharge',
                        'Payment',
                        'Service',
                        'Subtotal',
                    ],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'amount',
                        summary: 'SUM',
                        label: 'Amount',
                    }),
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                ],
            });
            //
            log.debug(loggerTitle, ' Search Called Successfully ');
            const searchResultCount = transactionSearchObj.runPaged().count;
            log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
            //
            transactionSearchObj.run().each((result) => {
                sumLifeTimeSales = result.getValue({
                    name: 'amount',
                    summary: 'SUM',
                    label: 'Amount',
                });
                return true;
            });
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return sumLifeTimeSales ? sumLifeTimeSales : 0;
    };
    /* *********************** Sum of Lifetime Sales - End *********************** */
    //
    /* *********************** Life Time Orders - Begin *********************** */
    const lifeTimeOrders = (customerId) => {
        const loggerTitle = ' Life Time Orders ';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        let lifeTimeOrdersValue = 0;
        //
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'ACCTTYPE',
                    },
                ],
                filters: [
                    ['account', 'anyof', '123'],
                    'AND',
                    ['status', 'noneof', 'SalesOrd:C'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'tranid',
                        summary: 'COUNT',
                        label: 'Document Number',
                    }),
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                ],
            });
            //
            log.debug(loggerTitle, ' Search Called Successfully ');
            const searchResultCount = transactionSearchObj.runPaged().count;
            log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
            //
            transactionSearchObj.run().each((result) => {
                lifeTimeOrdersValue = result.getValue({
                    name: 'tranid',
                    summary: 'COUNT',
                    label: 'Document Number',
                });
                return true;
            });
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return lifeTimeOrdersValue ? lifeTimeOrdersValue : 0;
    };
    /* *********************** Life Time Orders - End *********************** */
    //
    /* *********************** Activites of Customers - Begin *********************** */
    /**
     *
     * @param {number} customerId
     * @returns {object}  customerActivites
     */
    const activitesOfCustomers = (customerId) => {
        const loggerTitle = ' Life Time Orders ';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        // Declare customer Activites
        const customerActivites = {};
        customerActivites.phoneCall = 0;
        customerActivites.tasks = 0;
        customerActivites.virtualMeetings = 0;
        customerActivites.totalActivites = 0;
        //
        try {
            const customerSearchObj = search.create({
                type: 'customer',
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['status', 'anyof', '18'],
                    'AND',
                    ['internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'formulanumeric',
                        formula:
                            "CASE WHEN {activity.type} = 'Phone Call' AND TO_CHAR({activity.createddate},'YYYY') = TO_CHAR(CURRENT_DATE, 'YYYY') THEN 1 ELSE 0 END",
                        label: 'Calls (current year)',
                    }),
                    search.createColumn({
                        name: 'formulanumeric',
                        formula:
                            "CASE WHEN {activity.type} = 'Task' AND TO_CHAR({activity.createddate},'YYYY') = TO_CHAR(CURRENT_DATE, 'YYYY') THEN 1 ELSE 0 END",
                        label: 'Tasks (current year)',
                    }),
                    search.createColumn({
                        name: 'formulanumeric',
                        formula:
                            "CASE WHEN {activity.type} = 'Virtual Meeting or In Person Visit' AND TO_CHAR({activity.createddate},'YYYY') = TO_CHAR(CURRENT_DATE, 'YYYY') THEN 1 ELSE 0 END",
                        label: 'Virtual Meetings (current year)',
                    }),
                    search.createColumn({
                        name: 'formulanumeric',
                        formula:
                            "CASE WHEN {activity.type} = 'Virtual Meeting or In Person Visit' OR {activity.type} = 'Task' OR {activity.type} = 'Phone Call'  THEN 1 ELSE 0 END",
                        label: 'Total Activities',
                    }),
                ],
            });
            //
            log.debug(loggerTitle, ' Search Called Successfully ');
            //

            const resultset = customerSearchObj.run();
            const results = resultset.getRange(0, 1000);
            //

            for (let index in results) {
                const eachResult = results[index].getAllValues();
                customerActivites.phoneCall += parseInt(eachResult.formulanumeric);
                customerActivites.tasks += parseInt(eachResult.formulanumeric_1);
                customerActivites.virtualMeetings += parseInt(
                    eachResult.formulanumeric_2
                );
                customerActivites.totalActivites += parseInt(
                    eachResult.formulanumeric_3
                );
            }
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return customerActivites;
    };
    /* *********************** Activites of Customers - End *********************** */
    //
    /* *********************** Counts Of SKUs This Year - Begin *********************** */
    /**
     *
     * @param {number} customerId
     * @returns {number}
     */
    const countOfSKUsThisYear = (customerId) => {
        const loggerTitle = 'Counts Of SKUs This Year';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        let result = 0;
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
                filters: [
                    ['type', 'anyof', 'CustInvc', 'CashSale'],
                    'AND',
                    ['subsidiary', 'anyof', '1'],
                    'AND',
                    ['cseg_hi_hannaentity', 'anyof', '2'],
                    'AND',
                    ['customer.custentity_hanna_department', 'anyof', '282'],
                    'AND',
                    ['account', 'noneof', '1190'],
                    'AND',
                    ['item.type', 'anyof', 'Assembly', 'InvtPart', 'Group', 'Kit'],
                    'AND',
                    ['item.name', 'isnotempty', ''],
                    'AND',
                    ['trandate', 'within', 'thisyear'],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                    search.createColumn({
                        name: 'item',
                        summary: 'GROUP',
                        label: 'Item',
                    }),
                ],
            });
            const searchResultCount = transactionSearchObj.runPaged().count;
            if (searchResultCount) {
                result = searchResultCount;
            }
            //
            log.debug(loggerTitle, ' Count of SKUs 1 year: ' + result);
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return result;
    };
    /* *********************** Counts Of SKUs This Year - End *********************** */
    //
    /* *********************** Counts Of SKUs Last Year - Begin *********************** */
    /**
     *
     * @param {number} customerId
     * @returns {number} result
     */
    const countOfSKUsLastYear = (customerId) => {
        const loggerTitle = 'Counts Of SKUs Last Year';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        let result = 0;
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
                filters: [
                    ['type', 'anyof', 'CustInvc', 'CashSale'],
                    'AND',
                    ['trandate', 'within', 'lastyear'],
                    'AND',
                    ['subsidiary', 'anyof', '1'],
                    'AND',
                    ['cseg_hi_hannaentity', 'anyof', '2'],
                    'AND',
                    ['customer.custentity_hanna_department', 'anyof', '282'],
                    'AND',
                    ['account', 'noneof', '1190'],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['item.type', 'anyof', 'Assembly', 'InvtPart', 'Group', 'Kit'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                    search.createColumn({
                        name: 'item',
                        summary: 'GROUP',
                        label: 'Item',
                    }),
                    search.createColumn({
                        name: 'item',
                        summary: 'COUNT',
                        label: 'Item',
                    }),
                ],
            });
            const searchResultCount = transactionSearchObj.runPaged().count;
            if (searchResultCount) {
                result = searchResultCount;
            }
            //
            log.debug(loggerTitle, ' Count of SKUs 1 year: ' + result);
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return result;
    };
    /* *********************** Counts Of SKUs Last Year - End *********************** */
    //
    /* *********************** Counts Of SKUs Two Years Ago - Begin *********************** */
    /**
     *
     * @param {number} customerId
     * @returns {number} result
     */
    const countOfSKUsTwoYearsAgo = (customerId) => {
        const loggerTitle = 'Counts Of SKUs Two Years Ago';
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        //
        let result = 0;
        try {
            const transactionSearchObj = search.create({
                type: 'transaction',
                settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
                filters: [
                    ['type', 'anyof', 'CustInvc', 'CashSale'],
                    'AND',
                    ['trandate', 'within', 'fiscalyearbeforelast'],
                    'AND',
                    ['subsidiary', 'anyof', '1'],
                    'AND',
                    ['cseg_hi_hannaentity', 'anyof', '2'],
                    'AND',
                    ['customer.custentity_hanna_department', 'anyof', '282'],
                    'AND',
                    ['account', 'noneof', '1190'],
                    'AND',
                    ['item.type', 'anyof', 'Assembly', 'InvtPart', 'Group', 'Kit'],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['customer.internalidnumber', 'equalto', customerId],
                ],
                columns: [
                    search.createColumn({
                        name: 'entity',
                        summary: 'GROUP',
                        label: 'Name',
                    }),
                    search.createColumn({
                        name: 'item',
                        summary: 'GROUP',
                        label: 'Item',
                    }),
                    search.createColumn({
                        name: 'item',
                        summary: 'COUNT',
                        label: 'Item',
                    }),
                ],
            });
            const searchResultCount = transactionSearchObj.runPaged().count;
            if (searchResultCount) {
                result = searchResultCount;
            }
            log.debug(loggerTitle, ' Count of SKUs two years: ' + result);
        } catch (error) {
            log.error(loggerTitle + ' caught with an exception', error);
        }
        //
        log.debug(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
        return result;
    };
    /* *********************** Counts Of SKUs Two Years Ago - End *********************** */
    //
    /* ------------------------- Helper Functions - End------------------------ */
    //
    /* ----------------------------- Exports - Begin ---------------------------- */
    exports.getInputData = getInputData;
    exports.reduce = reduce;
    exports.summarize = summarize;
    return exports;
    /* ------------------------------ Exports - End ----------------------------- */
});
