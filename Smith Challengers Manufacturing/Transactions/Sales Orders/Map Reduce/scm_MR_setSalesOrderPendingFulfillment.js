/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_MR_setSalesOrderPendingFulfillment.js
 * Script: SCM | MR Set SO Status
 * Author           Date       Version               Remarks
 * nagendrababu  02.10.2025      1.00            Initial creation of the script.
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
      type: 'salesorder',
      settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['status', 'anyof', 'SalesOrd:A'], // Pending Approval
        'AND',
        ['custbody_scm_sweeper_order', 'is', 'F'],
        'AND',
        ['mainline', 'is', 'T'], // Changed to mainline true
        'AND',
        ['terms', 'noneof', '10'],
      ],
      columns: [
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
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
      log.debug(loggerTitle + ' Reduce Context Keys', key);
      //
      let approvalStatus = true;
      const salesOrderRecord = record.load({ type: 'salesorder', id: key });
      log.debug(loggerTitle, 'Sales Order Record Loaded Successfully');
      //

      const lineItemCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });

      for (let index = 0; index < lineItemCount; index++) {
        const rate = salesOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          line: index,
        });
        if (rate == 0 || rate < 0 || rate == 0.0 || rate == null) {
          approvalStatus = false;
          break;
        }
      }

      if (approvalStatus) {
        salesOrderRecord.setValue({ fieldId: 'orderstatus', value: 'B' });
        salesOrderRecord.save();
        log.audit(
          loggerTitle,
          'Sales Order Record Updated Successfully: ' + key
        );
      } else {
        log.audit(
          loggerTitle,
          'Skipped Sales Order ID ' +
            key +
            ': At least one line item has a rate of zero or less'
        );
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
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
