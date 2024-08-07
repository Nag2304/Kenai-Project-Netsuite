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
  const retrieveCustomerSalesInfo = (customerName) => {
    const loggerTitle = ' Retrieve Customer Sales Info ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const customerSalesInfoResultObj = {};
    try {
      const customrecord_hanna_customer_salesSearchObj = search.create({
        type: 'customrecord_hanna_customer_sales',
        filters: [['custrecord_hanna_customer_id', 'anyof', customerName]],
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
      //
      customrecord_hanna_customer_salesSearchObj.run().each((result) => {
        customerSalesInfoResultObj.ordersYearToDate = result.getValue(
          'custrecord_hanna_orderstodate'
        );
        customerSalesInfoResultObj.thisYearSales = result.getValue(
          'custrecord_hanna_total_value_invoices'
        );
        customerSalesInfoResultObj.sumofLifeTimeSales = result.getValue(
          'custrecord_hanna_sum_lifetime_sales'
        );
        customerSalesInfoResultObj.lifeTimeOrders = result.getValue(
          'custrecord_hanna_lifetime_orders'
        );
        customerSalesInfoResultObj.callsCurrentYear = result.getValue(
          'custrecord_hanna_calls_currentyear'
        );
        customerSalesInfoResultObj.tasksCurrentYear = result.getValue(
          'custrecord_hanna_tasks_currentyear'
        );
        customerSalesInfoResultObj.virtualMeetingsCurrentYear = result.getValue(
          'custrecord_hanna_virtual_meetings_cyear'
        );
        customerSalesInfoResultObj.totalActivitesLifeTime = result.getValue(
          'custrecord_hanna_totalactivites_lifetime'
        );
        customerSalesInfoResultObj.skuSoldInCurrentYear = result.getValue(
          'Codes (SKU) Sold in Current Year Quantity'
        );
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
    return customerSalesInfoResultObj;
  };
  /* *********************** Retrieve Customer Sales Info - End *********************** */
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
