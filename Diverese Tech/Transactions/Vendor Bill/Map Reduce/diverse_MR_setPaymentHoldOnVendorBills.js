/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: diverse_MR_setPaymentHoldOnVendorBills.js
 * Script: DIV | MR Set Payment Hold On Vend Bill
 * Author           Date       Version               Remarks
 * nagendrababu  14th Aug 2024  1.01           Set Payment Hold
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'vendorbill',
      settings: [{ name: 'includeperiodendtransactions', value: 'F' }],
      filters: [
        ['type', 'anyof', 'VendBill'],
        'AND',
        ['paymenthold', 'is', 'T'],
        'AND',
        [
          'custbody_dct_ar_invoice_pay_when_paid.internalidnumber',
          'isnotempty',
          '',
        ],
        'AND',
        ['custbody_dct_pay_when_paid', 'is', 'T'],
        'AND',
        ['custbody_dct_ar_invoice_pay_when_paid.status', 'anyof', 'CustInvc:B'],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [
        search.createColumn({
          name: 'internalid',
          join: 'CUSTBODY_DCT_AR_INVOICE_PAY_WHEN_PAID',
          label: 'Internal ID',
        }),
        search.createColumn({ name: 'paymenthold', label: 'Payment Hold' }),
      ],
    });
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
      const searchResult = JSON.parse(mapContext.value);
      log.debug(loggerTitle + ' After Parsing Results', searchResult);
      //
      /* ---------------------- Form Key Value Pairs - Begin ---------------------- */
      const key = searchResult.id;
      const values = {};
      values.paymentHold = searchResult.values.paymenthold;
      // Write Key & Values
      mapContext.write({
        key: key,
        value: values,
      });
      log.debug(loggerTitle + ' Key & Value Pairs', [key, values]);
      //
      /* ---------------------- Form Key Value Pairs - End ---------------------- */
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
    let vbInternalId;
    try {
      //Retireve Key and Load the Invoice Record
      vbInternalId = reduceContext.key;
      //
      if (vbInternalId) {
        record.submitFields({
          type: record.Type.VENDOR_BILL,
          id: vbInternalId,
          values: {
            paymenthold: false,
          },
        });
        log.debug(
          loggerTitle,
          ' Vendor Bill Submitted Successfully: ' + vbInternalId
        );
      }
    } catch (error) {
      log.error(
        loggerTitle + ' caught an exception and internal id is ' + vbInternalId,
        error
      );
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
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
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
