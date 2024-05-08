/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'itemreceipt',
      filters: [
        ['type', 'anyof', 'ItemRcpt'],
        'AND',
        ['createdfrom.type', 'anyof', 'PurchOrd'],
        'AND',
        ['createdfrom.status', 'anyof', 'PurchOrd:F'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['datecreated', 'on', 'today'],
        'AND',
        ['custbody_wdym_bill_processed', 'is', 'F'],
      ],
      columns: [
        search.createColumn({
          name: 'internalid',
          join: 'createdFrom',
          label: 'PO Internal ID',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------- Reduce - Begin ------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.audit(strLoggerTitle, '-------------<< Reduce - Entry >>-------------');
    //
    try {
      const values = reduceContext.values;
      const bodyValue = JSON.parse(values[0]);
      log.debug(strLoggerTitle + ' Reduce Values', bodyValue);
      //
      const purchaseOrderId = bodyValue.values['internalid.createdFrom'].value;
      log.debug(
        strLoggerTitle,
        'Purchase Order Internal ID: ' + purchaseOrderId
      );
      //
      const vbRecord = record.transform({
        fromType: 'purchaseorder',
        fromId: purchaseOrderId,
        toType: 'vendorbill',
      });
      vbRecord.setValue({
        fieldId: 'custbody_wdym_bill_processed',
        value: true,
      });
      const vbId = vbRecord.save();
      //
      log.audit(strLoggerTitle, ' VB ID: ' + vbId);
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(strLoggerTitle, '-------------<< Reduce - Exit >>-------------');
  };
  /* ------------------------- Reduce - End ------------------------- */
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
