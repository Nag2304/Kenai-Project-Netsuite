/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/*global define,log*/
define(['N/record', 'N/search'], (record, search) => {
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
        [['name', 'anyof', '5443'], 'OR', ['name', 'anyof', '5440']],
        'AND',
        ['mainline', 'is', 'F'],
        'AND',
        ['location', 'anyof', '1'],
        'AND',
        ['custcol_ready_for_fulfillment', 'is', 'F'],
        'AND',
        [
          'formulanumeric: CASE        WHEN {quantity} = {quantitycommitted} THEN 1       ELSE 0END',
          'equalto',
          '1',
        ],
      ],
      columns: [
        search.createColumn({
          name: 'lineuniquekey',
          label: 'Line Unique Key',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  /**
   *
   * @param {object} reduceContext
   */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Entry ------------------<|'
    );
    //
    try {
      // Retrieve Key & values.
      const key = reduceContext.key;
      const results = reduceContext.values;
      log.debug(strLoggerTitle + ' After Parsing Results', results);
      //
      // Load Sales record
      const salesOrderRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: key,
      });

      for (let index = 0; index < results.length; index++) {
        const result = JSON.parse(results[index]);
        log.debug(strLoggerTitle + ' Individual Result', result);
        //
        const lineUniqueKey = result.values.lineuniquekey;
        log.debug(strLoggerTitle, ' Line Unique Key: ' + lineUniqueKey);

        const lineNumber = salesOrderRecord.findSublistLineWithValue({
          sublistId: 'item',
          fieldId: 'lineuniquekey',
          value: lineUniqueKey,
        });
        log.debug(strLoggerTitle, 'Sales Order Line Number: ' + lineNumber);
        if (lineUniqueKey !== -1) {
          salesOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_ready_for_fulfillment',
            value: true,
            ignoreFieldChange: false,
            line: lineNumber,
          });
        }
      }
      const salesOrderInternalId = salesOrderRecord.save();
      log.audit(
        strLoggerTitle,
        'Sales Order Internal ID Saved Successfully: ' + salesOrderInternalId
      );
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Exit ------------------<|'
    );
  };
  /* ----------------------------- Map Phase - End ---------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Entry ------------------<|'
    );
    //
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
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + ' -Exit ------------------<|'
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
