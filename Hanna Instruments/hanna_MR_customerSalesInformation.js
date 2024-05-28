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
      name: 'custscript_hmk_ss_to_prcs',
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
      const scriptObj = runtime.getCurrentScript();
      const savedToSearchProcess = scriptObj.getParameter({
        name: 'custscript_hmk_ss_to_prcs',
      });
      //
      const environmentType = runtime.envType;
      log.debug(loggerTitle, 'Environment Type: ' + environmentType);
      //
      if (environmentType === 'PRODUCTION') {
        // ! TODO: Once Code will be written when moved to production.
        if (savedToSearchProcess == '92373850') {
          processCustomerSalesRecords(reduceContext);
        }
        // Suite Script MR Load Customers
        else if (savedToSearchProcess == '92374050') {
          loadCustomerRecords(reduceContext);
        }
        // Suitescript MR Delete Customers Sales Records
        else if (savedToSearchProcess == '92373950') {
          deleteCustomerRecords(reduceContext);
        }
      } else if (environmentType === 'SANDBOX') {
        // Suite Script MR Customer Sales
        if (savedToSearchProcess == '92372361') {
          processCustomerSalesRecords(reduceContext);
        }
        // Suite Script MR Load Customers
        else if (savedToSearchProcess == '92372362') {
          loadCustomerRecords(reduceContext);
        }
        // Suitescript MR Delete Customers Sales Records
        else if (savedToSearchProcess == '92372363') {
          deleteCustomerRecords(reduceContext);
        }
      }
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
  /* *********************** Delete Customer Records - Begin *********************** */
  /**
   *
   * @param {object} reduceContext
   */
  const deleteCustomerRecords = (reduceContext) => {
    const loggerTitle = 'Delete Customer Records';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Retrieve Key & values.
      const key = reduceContext.key;
      //

      record.delete({
        type: 'customrecord_hanna_customer_sales',
        id: key,
      });
      //
      log.debug(loggerTitle, 'Record Deleted successfully:' + key);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* *********************** Delete Customer Records - Begin *********************** */
  //
  /* *********************** Load Customer Record - Begin *********************** */
  /**
   *
   * @param {object} reduceContext
   */
  const loadCustomerRecords = (reduceContext) => {
    const loggerTitle = 'Load Customer Records';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Retrieve Key & values.
      const key = reduceContext.key;
      //
      const customRec = record.create({
        type: 'customrecord_hanna_customer_sales',
        isDynamic: true,
      });
      customRec.setValue({
        fieldId: 'custrecord_hanna_customer_id',
        value: key,
      });
      const customRecId = customRec.save();
      //
      log.audit(loggerTitle, 'Custom Record Saved Successfully ' + customRecId);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* *********************** Load Customer Record - End *********************** */
  //
  /* *********************** Process Customer Sales Records- Begin *********************** */
  /**
   *
   * @param {object} reduceContext
   * @returns {boolean}
   */
  const processCustomerSalesRecords = (reduceContext) => {
    const loggerTitle = 'Process Customer Sales Records';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );

    try {
      const key = reduceContext.key;
      log.debug(loggerTitle, 'Key: ' + key);
      const results = JSON.parse(reduceContext.values[0]);
      log.debug(loggerTitle + ' Values', results);

      const customerId =
        results.values['internalid.CUSTRECORD_HANNA_CUSTOMER_ID'].value;
      const customRecordId = results.id;

      const customerSalesInformationRecordValues =
        getCustomerSalesInformationRecordValues(customRecordId);

      const salesData = calculateSalesData(
        customerId,
        customerSalesInformationRecordValues
      );

      log.debug(loggerTitle + ' Values', salesData);

      submitCustomerSalesRecord(customRecordId, salesData);

      log.audit(
        loggerTitle,
        'Hanna Customer Sales Information Saved Successfully: ' + customRecordId
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* *********************** Process Customer Sales Records - End*********************** */
  //
  /* *********************** Get Customer SalesInformation RecordValues- Begin *********************** */
  /**
   *
   * @param {Number} customRecordId
   * @returns {Object}
   */
  const getCustomerSalesInformationRecordValues = (customRecordId) => {
    const loggerTitle = 'Get Customer Sales Information Record Values';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let cleanedResult = {};

    try {
      const result = search.lookupFields({
        type: 'customrecord_hanna_customer_sales',
        id: customRecordId,
        columns: [
          'custrecord_hanna_totalactivites_lifetime',
          'custrecord_hanna_sum_lifetime_sales',
          'custrecord_hanna_lifetime_orders',
        ],
      });

      // Set default values for empty, null, or undefined fields
      const defaultValue = 0;
      cleanedResult = {
        custrecord_hanna_totalactivites_lifetime:
          result.custrecord_hanna_totalactivites_lifetime || defaultValue,
        custrecord_hanna_sum_lifetime_sales:
          result.custrecord_hanna_sum_lifetime_sales || defaultValue,
        custrecord_hanna_lifetime_orders:
          result.custrecord_hanna_lifetime_orders || defaultValue,
      };
      log.debug(loggerTitle + ' Cleaned Result', cleanedResult);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );

    return cleanedResult;
  };

  /* *********************** Get Customer SalesInformation RecordValues - End *********************** */
  //
  /* *********************** Calculate Sales Data - Begin *********************** */
  /**
   *
   * @param {Number} customerId
   * @param {Object} customerSalesInformationRecordValues
   * @returns {Object}
   */
  const calculateSalesData = (
    customerId,
    customerSalesInformationRecordValues
  ) => {
    const loggerTitle = 'Calculate Sales Data';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const ordersYearToDateValue = ordersYearToDate(customerId);
      const priorYearsSales = priorYearsSale(customerId);
      const lastYearSaleTotalValue = lastYearSalesTotal(customerId);
      const totalValueOfInvoicesValue = totalValueOfInvoices(customerId);
      const sumLifeTimeSalesValue =
        sumOfLifeTimeSales(customerId, true) +
        customerSalesInformationRecordValues.custrecord_hanna_totalactivites_lifetime;
      const lifeTimeOrdersValue =
        lifeTimeOrders(customerId, true) +
        customerSalesInformationRecordValues.custrecord_hanna_sum_lifetime_sales;
      const customerActivites = activitesOfCustomers(customerId);
      const countOfItemsThisYear = countOfSKUsThisYear(customerId);
      const countOfItemsLastYear = countOfSKUsLastYear(customerId);
      const countOfItemsTwoYearsAgo = countOfSKUsTwoYearsAgo(customerId);
      const totalActivites =
        Number(
          customerSalesInformationRecordValues.custrecord_hanna_totalactivites_lifetime
        ) + Number(customerActivites.totalActivites);
      return {
        ordersYearToDateValue,
        priorYearsSales,
        lastYearSaleTotalValue,
        totalValueOfInvoicesValue,
        sumLifeTimeSalesValue,
        lifeTimeOrdersValue,
        customerActivites,
        countOfItemsThisYear,
        countOfItemsLastYear,
        countOfItemsTwoYearsAgo,
        totalActivites,
      };
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* *********************** Calculate Sales Data - End *********************** */
  //
  /* *********************** Submit CustomerSales Record - Begin *********************** */
  /**
   *
   * @param {Number} customRecordId
   * @param {Object} salesData
   */
  const submitCustomerSalesRecord = (customRecordId, salesData) => {
    const loggerTitle = 'Submit Customer Sales Record';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      record.submitFields({
        type: 'customrecord_hanna_customer_sales',
        id: customRecordId,
        values: {
          custrecord_hanna_orderstodate: salesData.ordersYearToDateValue,
          custrecord_hanna_prioryearssales: salesData.priorYearsSales,
          custrecord_hanna_lastyears_salestotal:
            salesData.lastYearSaleTotalValue,
          custrecord_hanna_total_value_invoices:
            salesData.totalValueOfInvoicesValue,
          custrecord_hanna_sum_lifetime_sales: salesData.sumLifeTimeSalesValue,
          custrecord_hanna_lifetime_orders: salesData.lifeTimeOrdersValue,
          custrecord_hanna_calls_currentyear:
            salesData.customerActivites.phoneCall,
          custrecord_hanna_tasks_currentyear: salesData.customerActivites.tasks,
          custrecord_hanna_virtual_meetings_cyear:
            salesData.customerActivites.virtualMeetings,
          custrecord_hanna_totalactivites_lifetime: salesData.totalActivites,
          custrecord_hanna_codes_sku_currentyear:
            salesData.countOfItemsThisYear,
          custrecord_hanna_codes_sku_2023: salesData.countOfItemsLastYear,
          custrecord_hanna_codes_sku_2022: salesData.countOfItemsTwoYearsAgo,
        },
      });
      log.debug(
        loggerTitle,
        ' Submitted Record Successfully: ' + customRecordId
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* *********************** Submit CustomerSales Record - End *********************** */
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
      // Create Search
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
      // Create Search
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
      // Create Search
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
      // Create Search
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
  /**
   *
   * @param {Number} customerId
   * @param {Boolean} includeYesterdayFilter
   * @returns {Number}
   */
  const sumOfLifeTimeSales = (customerId, includeYesterdayFilter = false) => {
    const loggerTitle = ' Total Value of Invoices ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    let sumLifeTimeSales = 0;
    //
    try {
      // Create Search
      let transactionSearchObj;
      if (!includeYesterdayFilter) {
        transactionSearchObj = search.create({
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
      } else {
        transactionSearchObj = search.create({
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
            'AND',
            ['trandate', 'within', 'yesterday'],
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
      }

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
  /**
   *
   * @param {Number} customerId
   * @param {Boolean} includeYesterdayFilter
   * @returns
   */
  const lifeTimeOrders = (customerId, includeYesterdayFilter = false) => {
    const loggerTitle = ' Life Time Orders ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    let lifeTimeOrdersValue = 0;
    //
    try {
      // Create Search
      let transactionSearchObj;
      if (!includeYesterdayFilter) {
        transactionSearchObj = search.create({
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
      } else {
        transactionSearchObj = search.create({
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
      }
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
  const activitesOfCustomers = (customerId, includeYesterdayFilter = false) => {
    const loggerTitle = ' Activites Of Customers ';
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
      // Create Search
      let customerSearchObj;
      if (!includeYesterdayFilter) {
        customerSearchObj = search.create({
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
      } else {
        customerSearchObj = search.create({
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
      }

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
