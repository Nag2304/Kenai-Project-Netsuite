/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['datecreated', 'onorafter', '2/5/2023 12:00 am', '2/1/2023 12:00 am'],
        'AND',
        ['custbody_ccc_checkout_token', 'isempty', ''],
        'AND',
        ['numbertext', 'startswith', 'RET'],
        'AND',
        ['custbody_shopify_subscription_order', 'is', 'F'],
        'AND',
        ['status', 'anyof', 'SalesOrd:B'],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ----------------------------- Reduce - Begin ----------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.audit(
      strLoggerTitle,
      '-------------<< Reduce  - Entry >>-------------'
    );
    try {
      const key = reduceContext.key;
      record.delete({
        type: record.Type.SALES_ORDER,
        id: key,
      });
      log.audit(strLoggerTitle, 'Record deleted successfully ' + key);
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    log.audit(strLoggerTitle, '-------------<< Reduce  - Exit >>-------------');
  };
  /* ------------------------------ Reduce - End ------------------------------ */
  //
  /* ------------------------- Summarize - Begin ------------------------- */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Begin >>-------------'
    );
    try {
      log.audit(
        strLoggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        strLoggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        strLoggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(strLoggerTitle + ' failed to Execute', error);
    }
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Exit >>-------------'
    );
  };
  /* ------------------------- Summarize - End ------------------------- */
  //
  /* ------------------------- Exports - Begin ------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
