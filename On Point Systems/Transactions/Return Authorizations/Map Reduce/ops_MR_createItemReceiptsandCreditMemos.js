/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: ops_MR_createItemReceiptsandCreditMemos.js
 * Script:
 * Author           Date       Version               Remarks
 * mikewilliams   09.22.2023     1.00        Initial creation of the script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/format', 'N/record'], (search, format, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'returnauthorization',
      filters: [
        ['type', 'anyof', 'RtnAuth'],
        'AND',
        ['status', 'anyof', 'RtnAuth:B'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['trandate', 'within', 'thisyear'],
        'AND',
        ['createdfrom.internalidnumber', 'greaterthan', '0'],
      ],
      columns: [
        search.createColumn({ name: 'trandate', label: 'Date' }),
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
        search.createColumn({ name: 'statusref', label: 'Status' }),
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
      // Retrieve key and value pairs
      const key = reduceContext.key;
      const results = JSON.parse(reduceContext.values);
      log.debug(loggerTitle, ' Reduce Context Key: ' + key);
      log.debug(loggerTitle + ' Reduce Context Values', results);
      //

      // Retrieve Values
      const returnAuthDate = results.values.trandate;

      //const status = results.values.statusref.value;
      //

      //
      /* ------------------- Item Receipt Transformation - Begin ------------------ */
      const itemReceiptRecord = record.transform({
        fromType: 'returnauthorization',
        fromId: key,
        toType: 'itemreceipt',
        isDynamic: true,
      });
      if (returnAuthDate) {
        itemReceiptRecord.setValue({
          fieldId: 'trandate',
          value: format.parse({
            value: returnAuthDate,
            type: format.Type.DATE,
          }),
        });
      }

      itemReceiptRecord.setValue({
        fieldId: 'custbody_atlas_inspectedby',
        value: 14,
      });
      const itemReceiptRecordInternalId = itemReceiptRecord.save();
      log.audit(
        loggerTitle + ' Item Receipt Record Saved',
        `Item Receipt Record Saved Successfully ${itemReceiptRecordInternalId}`
      );
      /* ------------------- Item Receipt Transformation - End ------------------ */
      //
      /* ------------------- Credit Memo Transformation - Begin ------------------- */
      const creditMemoRecord = record.transform({
        fromType: 'returnauthorization',
        fromId: key,
        toType: 'creditmemo',
        isDynamic: true,
      });
      if (returnAuthDate) {
        creditMemoRecord.setValue({
          fieldId: 'trandate',
          value: format.parse({
            value: returnAuthDate,
            type: format.Type.DATE,
          }),
        });
      }
      const creditMemoRecordInternalId = creditMemoRecord.save();
      log.audit(
        loggerTitle + ' Credit Memo Record Saved',
        `Credit Memo Record Saved Successfully ${creditMemoRecordInternalId}`
      );
      /* -------------------- Credit Memo Transformation - End -------------------- */
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
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
