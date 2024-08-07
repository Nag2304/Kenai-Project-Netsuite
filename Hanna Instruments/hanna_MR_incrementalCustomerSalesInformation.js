/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hanna_MR_incrementalCustomerSalesInformation.js
 * Script: Hanna | MR Incremental Cust Sales Info
 * Author           Date       Version               Remarks
 * nagendrababu  01st Aug 2024 1.00           Initial creation of script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {
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
    // Retrieve Script Parameter - Narvar Location Exclude
    const scriptObj = runtime.getCurrentScript();
    const savedToSearchProcess = scriptObj.getParameter({
      name: 'custscript_hanna_ss_to_prcs1',
    });
    log.debug(loggerTitle, 'Saved Search ID: ' + savedToSearchProcess);
    //
    return {
      type: 'search',
      id: savedToSearchProcess,
    };
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
      const key = reduceContext.key;
      log.debug(loggerTitle, 'Key: ' + key);
      const results = JSON.parse(reduceContext.values[0]);
      log.debug(loggerTitle + ' Values', results);
      //

      // Retrieve Customer ID
      const customerID = results.values['GROUP(entityid.customer)'];
      //

      // Retrieve CustomerSales Info Results
      const customerSalesInfoResults = retrieveCustomerSalesInfo(customerID);
      log.debug(loggerTitle + ' Customer Sales Info', customerSalesInfoResults);
      //

      // Calculate Incremental Values and Update the Customer Sales Info
      if (Object.keys(customerSalesInfoResults).length) {
        //Retrieve Custom Record Customer Sales Info Internal ID
        const id = customerSalesInfoResults.internalId;

        // Retrieve Custom Record Customer Sales Info Customer ID
        const customerId = customerSalesInfoResults.customerId;

        // Build the object
        const customerSalesInfo = {};
        //

        //Calculate Order Years To Date
        const ordersYearToDateTotal =
          ordersYearToDate(customerId) +
          customerSalesInfoResults.ordersYearToDate;
        if (
          ordersYearToDateTotal != customerSalesInfoResults.ordersYearToDate
        ) {
          customerSalesInfo.custrecord_hanna_orderstodate =
            ordersYearToDateTotal;
        }
        //

        // Calculate This Years Sales
        const thisYearsSalesTotal =
          thisYearsSales(customerId) + customerSalesInfoResults.thisYearSales;
        if (thisYearsSalesTotal != customerSalesInfoResults.thisYearSales) {
          customerSalesInfo.custrecord_hanna_total_value_invoices =
            thisYearsSalesTotal.toFixed(2);
        }
        //

        // Calculate Sum of Lifetime Sales
        const sumLifeTimeSalesTotal =
          sumOfLifeTimeSales(customerId) +
          customerSalesInfoResults.sumofLifeTimeSales;
        if (
          sumLifeTimeSalesTotal != customerSalesInfoResults.sumofLifeTimeSales
        ) {
          customerSalesInfo.custrecord_hanna_sum_lifetime_sales =
            sumLifeTimeSalesTotal.toFixed(2);
        }
        //

        // Calculate Lifetime Orders
        const lifeTimeOrdersTotal =
          lifeTimeOrders(customerId) + customerSalesInfoResults.lifeTimeOrders;
        if (lifeTimeOrdersTotal != customerSalesInfoResults.lifeTimeOrders) {
          customerSalesInfo.custrecord_hanna_lifetime_orders =
            lifeTimeOrdersTotal.toFixed(2);
        }
        //

        // Calculate Total Activities (lifetime)
        const totalActivitesLifeTimeTotal = totalActivitesLifeTime(customerId);
        customerSalesInfo.custrecord_hanna_calls_currentyear =
          totalActivitesLifeTimeTotal.phoneCall +
          customerSalesInfoResults.callsCurrentYear;
        customerSalesInfo.custrecord_hanna_tasks_currentyear =
          totalActivitesLifeTimeTotal.tasks +
          customerSalesInfoResults.tasksCurrentYear;
        customerSalesInfo.custrecord_hanna_virtual_meetings_cyear =
          totalActivitesLifeTimeTotal.virtualMeetings +
          customerSalesInfoResults.virtualMeetingsCurrentYear;
        customerSalesInfo.custrecord_hanna_totalactivites_lifetime =
          totalActivitesLifeTimeTotal.totalActivites +
          customerSalesInfoResults.totalActivitesLifeTime;
        //

        // Calculate Codes (SKU) Sold in Current Year Quantity
        const skuSoldInCurrentYearQuantityTotal =
          skuSoldInCurrentYearQuantity(customerId) +
          customerSalesInfoResults.skuSoldInCurrentYear;

        if (
          skuSoldInCurrentYearQuantityTotal !=
          customerSalesInfoResults.skuSoldInCurrentYear
        ) {
          customerSalesInfo.custrecord_hanna_codes_sku_currentyear =
            skuSoldInCurrentYearQuantityTotal;
        }
        //

        // All the Object Built
        log.debug(
          loggerTitle + ' Customer Sales Info Update Object',
          customerSalesInfo
        );

        if (Object.keys(customerSalesInfo).length) {
          updateCustomerSalesInfo(customerSalesInfo, id);
        }
      }
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
  /* *********************** Retrieve Customer Sales Info - Begin *********************** */
  /**
   *
   * @param {object} customerName
   * @returns {object} customerSalesInfoResultObj
   */
  const retrieveCustomerSalesInfo = (customerName) => {
    const loggerTitle = ' Retrieve Customer Sales Info ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const customerSalesInfoResultObj = {};
    try {
      if (customerName) {
        const customrecord_hanna_customer_salesSearchObj = search.create({
          type: 'customrecord_hanna_customer_sales',
          filters: [
            ['custrecord_hanna_customer_id.companyname', 'is', customerName],
          ],
          columns: [
            search.createColumn({
              name: 'custrecord_hanna_customer_id',
              label: 'Customer ID',
            }),
            search.createColumn({
              name: 'custrecord_hanna_orderstodate',
              label: 'Orders Year to Date',
            }),
            search.createColumn({
              name: 'custrecord_hanna_total_value_invoices',
              label: 'This Years Sales',
            }),
            search.createColumn({
              name: 'custrecord_hanna_sum_lifetime_sales',
              label: 'Sum of Lifetime Sales',
            }),
            search.createColumn({
              name: 'custrecord_hanna_lifetime_orders',
              label: 'Lifetime Orders',
            }),
            search.createColumn({
              name: 'custrecord_hanna_calls_currentyear',
              label: 'Calls (current year)',
            }),
            search.createColumn({
              name: 'custrecord_hanna_tasks_currentyear',
              label: 'Tasks (current year)',
            }),
            search.createColumn({
              name: 'custrecord_hanna_virtual_meetings_cyear',
              label: 'Virtual Meetings (current year)',
            }),
            search.createColumn({
              name: 'custrecord_hanna_totalactivites_lifetime',
              label: 'Total Activities (lifetime)',
            }),
            search.createColumn({
              name: 'custrecord_hanna_codes_sku_currentyear',
              label: 'Codes (SKU) Sold in Current Year Quantity',
            }),
          ],
        });
        const searchResultCount =
          customrecord_hanna_customer_salesSearchObj.runPaged().count;
        log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
        //
        customrecord_hanna_customer_salesSearchObj.run().each((result) => {
          customerSalesInfoResultObj.internalId = result.id;
          customerSalesInfoResultObj.customerId = result.getValue(
            'custrecord_hanna_customer_id'
          );
          customerSalesInfoResultObj.ordersYearToDate = parseInt(
            result.getValue('custrecord_hanna_orderstodate')
          );
          customerSalesInfoResultObj.thisYearSales = parseFloat(
            result.getValue('custrecord_hanna_total_value_invoices')
          );
          customerSalesInfoResultObj.sumofLifeTimeSales = parseFloat(
            result.getValue('custrecord_hanna_sum_lifetime_sales')
          );
          customerSalesInfoResultObj.lifeTimeOrders = parseFloat(
            result.getValue('custrecord_hanna_lifetime_orders')
          );
          customerSalesInfoResultObj.callsCurrentYear =
            parseInt(result.getValue('custrecord_hanna_calls_currentyear')) ??
            0;
          customerSalesInfoResultObj.tasksCurrentYear =
            parseInt(result.getValue('custrecord_hanna_tasks_currentyear')) ??
            0;
          customerSalesInfoResultObj.virtualMeetingsCurrentYear =
            parseInt(
              result.getValue('custrecord_hanna_virtual_meetings_cyear')
            ) ?? 0;
          customerSalesInfoResultObj.totalActivitesLifeTime =
            parseInt(
              result.getValue('custrecord_hanna_totalactivites_lifetime')
            ) || 0;
          customerSalesInfoResultObj.skuSoldInCurrentYear =
            parseInt(
              result.getValue('custrecord_hanna_codes_sku_currentyear')
            ) ?? 0;
          //
          return true;
        });
      } else {
        log.debug(loggerTitle, ' Customer Name is missing: ' + customerName);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return customerSalesInfoResultObj;
  };
  /* *********************** Retrieve Customer Sales Info - End *********************** */
  //
  /* *********************** Orders Year To Date - Begin *********************** */
  /**
   *
   * @param {Number} id
   * @returns {Number}  ordersYearToDateValue
   */
  const ordersYearToDate = (id) => {
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
          ['trandate', 'within', 'yesterday'],
          'AND',
          ['account', 'anyof', '123'],
          'AND',
          ['status', 'noneof', 'SalesOrd:C'],
          'AND',
          ['customer.internalidnumber', 'equalto', id],
          'AND',
          ['mainline', 'is', 'T'],
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
  /* *********************** This Years Sales - Begin *********************** */
  /**
   *
   * @param {Number} customerId
   * @returns {Number}
   */
  const thisYearsSales = (customerId) => {
    const loggerTitle = 'This Years Sales';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let thisYearsSalesValue = 0.0;
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
          ['trandate', 'within', 'yesterday'],
          'AND',
          [
            'type',
            'anyof',
            'CustInvc',
            'Journal',
            'CashRfnd',
            'CashSale',
            'CustCred',
            'CustRfnd',
          ],
          'AND',
          ['subsidiary', 'anyof', '1'],
          'AND',
          ['cseg_hi_hannaentity', 'anyof', '2'],
          'AND',
          ['customer.custentity_hanna_department', 'anyof', '282'],
          'AND',
          ['account', 'noneof', '1190'],
          'AND',
          ['mainline', 'is', 'T'],
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
            formula: '{netamountnotax}-nvl({shippingamount},0)',
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
        thisYearsSalesValue = parseFloat(
          result.getValue({
            name: 'formulacurrency',
            summary: 'SUM',
            formula: '{netamountnotax}-nvl({shippingamount},0)',
            label: 'Formula (Currency)',
          })
        );
        return true;
      });
      //
      log.debug(loggerTitle, ' This Year Sales: ' + thisYearsSalesValue);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    return thisYearsSalesValue;
  };
  /* *********************** This Years Sales - End *********************** */
  //
  /* *********************** Sum of Lifetime Sales - Begin *********************** */
  /**
   *
   * @param {Number} customerId
   * @returns {Number}
   */
  const sumOfLifeTimeSales = (customerId) => {
    const loggerTitle = 'Sum of LifeTime Sales';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let sumLifeTimeSalesValue = 0.0;
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
          [
            'type',
            'anyof',
            'CustInvc',
            'Journal',
            'CashRfnd',
            'CashSale',
            'CustCred',
            'CustRfnd',
          ],
          'AND',
          ['subsidiary', 'anyof', '1'],
          'AND',
          ['cseg_hi_hannaentity', 'anyof', '2'],
          'AND',
          ['customer.custentity_hanna_department', 'anyof', '282'],
          'AND',
          ['account', 'noneof', '1190'],
          'AND',
          ['mainline', 'is', 'T'],
          'AND',
          ['customer.internalidnumber', 'equalto', customerId],
          'AND',
          ['trandate', 'within', 'yesterday'],
        ],
        columns: [
          search.createColumn({
            name: 'formulacurrency',
            summary: 'SUM',
            formula: '{netamountnotax}-nvl({shippingamount},0)',
            label: 'Formula (Currency)',
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
        sumLifeTimeSalesValue = parseFloat(
          result.getValue({
            name: 'formulacurrency',
            summary: 'SUM',
            formula: '{netamountnotax}-nvl({shippingamount},0)',
            label: 'Formula (Currency)',
          })
        );
        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    return sumLifeTimeSalesValue;
  };
  /* *********************** Sum of Lifetime Sales - End *********************** */
  //
  /* *********************** Lifetime Orders - Begin *********************** */
  /**
   *
   * @param {Number} customerId
   * @returns {Number}
   */
  const lifeTimeOrders = (customerId) => {
    const loggerTitle = 'Life Time Orders';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let lifeTimeOrdersValue = 0;
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
          'AND',
          ['trandate', 'within', 'yesterday'],
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
        lifeTimeOrdersValue = parseFloat(
          result.getValue({
            name: 'tranid',
            summary: 'COUNT',
            label: 'Document Number',
          })
        );
        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    return lifeTimeOrdersValue;
  };
  /* *********************** Lifetime Orders - End *********************** */
  //
  /* *********************** Total Activities LifeTime - Begin *********************** */
  /**
   *
   * @param {Number} customerId
   * @returns {Number}
   */
  const totalActivitesLifeTime = (customerId) => {
    const loggerTitle = 'Total Activites Life Time';
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
    try {
      const customerSearchObj = search.create({
        type: 'customer',
        filters: [
          ['isinactive', 'is', 'F'],
          'AND',
          ['status', 'anyof', '18'],
          'AND',
          ['internalidnumber', 'equalto', customerId],
          'AND',
          ['datecreated', 'within', 'yesterday'],
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
      log.debug(loggerTitle + ' Customer Activites', customerActivites);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    return customerActivites;
  };
  /* *********************** Total Activities LifeTime  - End *********************** */
  //
  /* *********************** SKU Sold in Current Year Quantity - Begin *********************** */
  /**
   *
   * @param {Number} customerId
   * @returns {Number}
   */
  const skuSoldInCurrentYearQuantity = (customerId) => {
    const loggerTitle = 'SKU Sold In Current Year Quantity';
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
          ['trandate', 'within', 'yesterday'],
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
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    return result;
  };
  /* *********************** SKU Sold in Current Year Quantity - End *********************** */
  //
  /* *********************** Update Customer Sales Info - Begin *********************** */
  /**
   *
   * @param {object} customerSalesInfo
   * @param {Number} customRecordId
   */
  const updateCustomerSalesInfo = (customerSalesInfo, customRecordId) => {
    const loggerTitle = 'Update Customer Sales Info';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      record.submitFields({
        type: 'customrecord_hanna_customer_sales',
        id: customRecordId,
        values: customerSalesInfo,
      });
      log.debug(loggerTitle, 'Updated Successfully');
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
  };
  /* *********************** Update Customer Sales Info - End *********************** */
  //
  /* ------------------------- Helper Functions  - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
