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
    // SHOPIFY, ZOLA, AMAZON US FBM
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        [
          ['name', 'anyof', '5443'],
          'OR',
          ['name', 'anyof', '5440'],
          'OR',
          ['name', 'anyof', '6570'],
        ],
        'AND',
        ['mainline', 'is', 'F'],
        'AND',
        ['location', 'anyof', '1'],
        'AND',
        ['custcol_ready_for_fulfillment', 'is', 'F'],
        'AND',
        [
          'formulanumeric: case when {quantity} = {quantitycommitted} then 1 else 0 end',
          'equalto',
          '1',
        ],
      ],
      columns: [
        search.createColumn({
          name: 'lineuniquekey',
          label: 'Line Unique Key',
        }),
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
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

      const salesOrderLineCount = salesOrderRecord.getLineCount({
        sublistId: 'item',
      });
      const resultsLength = results.length;

      log.debug(strLoggerTitle, {
        soLineCount: salesOrderLineCount,
        mapReduceResults: resultsLength,
      });

      if (salesOrderLineCount === resultsLength) {
        log.debug(strLoggerTitle, 'Getting to ready set ready to fulfill true');
        //
        for (let index = 0; index < salesOrderLineCount; index++) {
          log.debug(
            strLoggerTitle,
            ' Setting ready to fulfill to true:' + index
          );
          //
          salesOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_ready_for_fulfillment',
            value: true,
            ignoreFieldChange: false,
            line: index,
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
