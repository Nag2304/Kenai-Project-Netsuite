/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: lw_MR_transformInvoicesToPayments.js
 * Script: LW | MR Convert Invoice To Payments
 * Author           Date       Version               Remarks
 * nagendrababu  06.06.2024     1.00        Initial Creation Of Script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record', 'N/format', 'N/runtime'], (
  search,
  record,
  format,
  runtime
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const scriptObj = runtime.getCurrentScript();
    const fileId = scriptObj.getParameter({
      name: 'custscript_lw_file_id',
    });
    return { type: 'file', id: fileId };
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  /**
   *
   * @param {object} mapContext
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Read & parse the data
      const key = mapContext.key;
      if (key > 0) {
        const searchResult = mapContext.value.split(',');
        log.debug(loggerTitle + ' After Parsing Results', searchResult);
        //
        const key = searchResult[0];

        if (
          key > 0 &&
          invoiceExist(key) &&
          getPaymentsRelatedToInvoice(key) == 0
        ) {
          //
          /* ---------------------- Form Key Value Pairs - Begin ---------------------- */
          const values = {};
          values.trandate = searchResult[3];
          values.refnum = searchResult[8];
          values.amount = searchResult[12];
          // Write Key & Values
          mapContext.write({
            key: key,
            value: values,
          });
          log.debug(loggerTitle + ' Key & Value Pairs', [key, values]);
          /* ---------------------- Form Key Value Pairs - End ---------------------- */
          //
        }
        //
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
  /* ----------------------------- Map Phase - End ---------------------------- */
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
    let invoiceInternalId;
    try {
      //Retireve Key
      invoiceInternalId = reduceContext.key;
      log.debug(loggerTitle + ' Invoice Key', invoiceInternalId);
      //
      // Read Values
      const values = reduceContext.values;
      const invoiceValues = JSON.parse(values[0]);
      log.debug(loggerTitle + ' After Parsing Results', invoiceValues);
      const invoiceTrandate = format.parse({
        value: invoiceValues.trandate,
        type: format.Type.DATE,
      });
      const invoiceRefnum = invoiceValues.refnum;
      const invoiceAmount = invoiceValues.amount;
      //
      const cpId = transformInvoiceToCustomerPayment(invoiceInternalId, {
        invoiceTrandate,
        invoiceRefnum,
        invoiceAmount,
      });
      if (cpId > 0) {
        log.error(
          loggerTitle,
          ' Invoice Successfully transformed into Customer Payment ' +
            invoiceInternalId +
            ' Customer Payment ID: ' +
            cpId
        );
      } else {
        log.error(loggerTitle, ' Failed To Transform: ' + invoiceInternalId);
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
  /* ----------------------- Helper Functions - Begin ----------------------- */
  //
  /* *********************** invoiceExist - Begin *********************** */
  /**
   *
   * @param {Number} internalId
   * @returns {Boolean} invoiceAvailable
   */
  const invoiceExist = (internalId) => {
    const loggerTitle = ' Invoice Exist ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let invoiceAvailable = false;
    try {
      log.debug(loggerTitle, ' Invoice Internal Id: ' + internalId);
      // Check if Invoice Exists (or) Not
      const invoiceFields = search.lookupFields({
        type: search.Type.INVOICE,
        id: internalId,
        columns: ['trandate'],
      });
      //
      if (invoiceFields.trandate) {
        log.debug(loggerTitle, ' Invoice Exists ');
        invoiceAvailable = true;
      } else {
        log.error(loggerTitle, ' Invoice does not exist ' + internalId);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return invoiceAvailable;
  };
  /* *********************** invoiceExist - End *********************** */
  //
  /* *********************** getPaymentsRelatedToInvoice - Begin *********************** */
  const getPaymentsRelatedToInvoice = (tranid) => {
    const loggerTitle = ' Get Payments Related To Invoice ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let searchResultCount;
    try {
      const customerpaymentSearchObj = search.create({
        type: 'customerpayment',
        settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
        filters: [
          ['type', 'anyof', 'CustPymt'],
          'AND',
          ['appliedtotransaction.type', 'anyof', 'CustInvc'],
          'AND',
          ['appliedtotransaction.internalidnumber', 'equalto', tranid],
        ],
        columns: [
          search.createColumn({ name: 'tranid', label: 'Document Number' }),
          search.createColumn({
            name: 'tranid',
            join: 'appliedToTransaction',
            label: 'Document Number',
          }),
        ],
      });
      searchResultCount = customerpaymentSearchObj.runPaged().count;
      log.debug(loggerTitle, `Customer Payment Count: ${searchResultCount}`);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return searchResultCount;
  };
  /* *********************** getPaymentsRelatedToInvoice - End *********************** */
  //
  /* *********************** transformInvoiceToCustomerPayment - Begin *********************** */
  /**
   *
   * @param {Number} tranid
   * @param {object} values
   * @returns {Number} cpId
   */
  const transformInvoiceToCustomerPayment = (tranid, values) => {
    const loggerTitle = ' Transform Invoice To Customer Payment ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let cpId = 0;
    const { invoiceTrandate, invoiceRefnum, invoiceAmount } = values;
    log.debug(loggerTitle + 'Values ', values);
    try {
      // Retrieve Script Parameter - AccountId
      const scriptObj = runtime.getCurrentScript();
      const accountId = scriptObj.getParameter({
        name: 'custscript_lw_accountid',
      });
      log.debug(loggerTitle, ` Account ID: ${accountId}`);
      //
      // Transform Invoice To Customer Payment
      const customerPaymentRecord = record.transform({
        fromType: record.Type.INVOICE,
        fromId: tranid,
        toType: record.Type.CUSTOMER_PAYMENT,
        isDynamic: true,
      });
      customerPaymentRecord.setValue({
        fieldId: 'trandate',
        value: invoiceTrandate,
      });

      customerPaymentRecord.setValue({
        fieldId: 'account',
        value: accountId,
      });

      const trandate = customerPaymentRecord.getValue({ fieldId: 'trandate' });
      log.debug(loggerTitle, ' TranDate Customer Payment Record: ' + trandate);
      const account = customerPaymentRecord.getValue({ fieldId: 'account' });
      log.debug(loggerTitle, ' Account After Setting: ' + account);

      // In the UI, this can be seen under the APPLY subtab > Invoices Sublist when creating a new CUSTOMER PAYMENT record.
      const linecount = customerPaymentRecord.getLineCount({
        sublistId: 'apply',
      });
      log.debug(loggerTitle, `Line Count: ${linecount}`);
      //
      for (let i = 0; i < linecount; i++) {
        // refnum is the field ID of column field "REF NO.". In the UI, this can be seen under the APPLY subtab > Invoices Sublist > "REF NO." column field, when creating a new CUSTOMER PAYMENT record.
        const refnum = customerPaymentRecord.getSublistValue({
          sublistId: 'apply',
          fieldId: 'refnum',
          line: i,
        });
        const total = customerPaymentRecord.getSublistValue({
          sublistId: 'apply',
          fieldId: 'total',
          line: i,
        });
        const amount = customerPaymentRecord.getSublistValue({
          sublistId: 'apply',
          fieldId: 'amount',
          line: i,
        });
        // log.debug(
        //   loggerTitle,
        //   `Index:${i}, RefNum: ${refnum} Total: ${total} Amount: ${amount}`
        // );
        // This will compare if the invoice that was saved can be seen on the list of INVOICES on the Customer Payment when the same Customer was selected.
        if (refnum == invoiceRefnum && amount == invoiceAmount) {
          customerPaymentRecord.selectLine({
            sublistId: 'apply',
            line: i,
          });
          // apply is the field ID of column field "APPLY". In the UI, this can be seen under the APPLY subtab > Invoices Sublist > "APPLY" column field when creating a new CUSTOMER PAYMENT record. This script line will put a CHECKMARK on the Invoice to where the Customer Payment will be APPLIED.
          customerPaymentRecord.setCurrentSublistValue({
            sublistId: 'apply',
            fieldId: 'apply',
            value: true,
          });
          if (!total) {
            customerPaymentRecord.setCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'total',
              value: invoiceAmount,
            });
          }
          if (!amount) {
            customerPaymentRecord.setCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'amount',
              value: invoiceAmount,
            });
          }
          customerPaymentRecord.commitLine({
            sublistId: 'apply',
          });
          log.debug(
            loggerTitle,
            'Applied to Invoice Ref Num: ' + refnum + ' Index: ' + i
          );
        }
        //
      }
      cpId = customerPaymentRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
      });
      log.emergency(
        loggerTitle,
        ' Customer Payment ID Created Successfully: ' + cpId
      );
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return cpId;
  };
  /* *********************** transformInvoiceToCustomerPayment - End *********************** */
  //
  /* *********************** parseDateString - Begin *********************** */
  const parseDateString = (dateString) => {
    // Assuming the format is MM/DD/YYYY
    var parts = dateString.split('/');
    var month = parseInt(parts[0], 10) - 1; // Months are 0-based in JavaScript Date
    var day = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };
  /* *********************** parseDateString - End *********************** */
  //
  /* ----------------------- Helper Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
