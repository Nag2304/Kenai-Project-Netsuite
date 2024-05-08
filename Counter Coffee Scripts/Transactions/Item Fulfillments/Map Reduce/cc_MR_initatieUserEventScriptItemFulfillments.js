/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
  //
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const itemfulfillmentSearchColDocumentNumber = search.createColumn({
      name: 'tranid',
    });
    return search.create({
      type: 'itemfulfillment',
      filters: [
        ['type', 'anyof', 'ItemShip'],
        'AND',
        ['datecreated', 'onorafter', '1/26/2023 12:00 am'],
        'AND',
        ['custbody_is_wholesale', 'is', 'T'],
        'AND',
        ['custbody_update_woo', 'is', 'T'],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [itemfulfillmentSearchColDocumentNumber],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ----------------------------- Reduce - Begin ----------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    try {
      // Retrieve Key & values.
      const key = reduceContext.key;
      //
      // Update Sales Order Record
      const ifRecord = record.load({
        type: record.Type.ITEM_FULFILLMENT,
        id: key,
      });
      ifRecord.setValue({ fieldId: 'custbody_update_woo', value: false });
      ifRecord.save();
      log.debug(
        strLoggerTitle + ' Item Fulfillment Record Updated Successfully',
        `ITEM FULFILLMENT ID:${key}`
      );
    } catch (err) {
      log.audit(strLoggerTitle + ' failed to execute', err);
    }
  };
  /* ------------------------------ Reduce - End ------------------------------ */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
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
