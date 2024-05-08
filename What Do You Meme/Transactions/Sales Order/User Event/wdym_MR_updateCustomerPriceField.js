/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/*global define,log*/
define(['N/record'], (record) => {
  //
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['customer.pricelevel', 'noneof', '@NONE@'],
        'AND',
        ['custcol_wdym_customer_price', 'isempty', ''],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [
        search.createColumn({
          name: 'pricelevel',
          join: 'customer',
          label: 'Price Level',
        }),
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
      '|>--------------------' + strLoggerTitle + '-Start--------------------<|'
    );
    try {
      // Retrieve Key & values.
      const key = reduceContext.key;
    } catch (err) {
      log.audit(strLoggerTitle + ' failed to execute', err);
    }
    log.audit(
      strLoggerTitle,
      '|>--------------------' + strLoggerTitle + '-Exit--------------------<|'
    );
  };
  /* ------------------------------ Reduce - End ------------------------------ */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.audit(
      strLoggerTitle,
      '|>--------------------' + strLoggerTitle + '-Start--------------------<|'
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
    } catch (err) {
      log.audit(strLoggerTitle + ' failed to execute', err);
    }
    log.audit(
      strLoggerTitle,
      '|>--------------------' + strLoggerTitle + '-Exit--------------------<|'
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
