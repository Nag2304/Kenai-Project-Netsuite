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
      type: 'purchaseorder',
      filters: [
        ['type', 'anyof', 'PurchOrd'],
        'AND',
        ['custcol_wdym_orig_order_qty', 'isempty', ''],
        'AND',
        ['item', 'noneof', '@NONE@'],
      ],
      columns: [
        search.createColumn({
          name: 'internalid',
          summary: 'GROUP',
          label: 'Internal ID',
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
      // Read Key
      //   const poInternalId = reduceContext.key;
      //   log.debug(strLoggerTitle + ' Reduce PO Key', poInternalId);
      //   const poRecord = record.load({
      //     type: record.Type.PURCHASE_ORDER,
      //     id: poInternalId,
      //     isDynamic: false,
      //   });
      //
      const values = reduceContext.values;
      const bodyValue = JSON.parse(values[0]);
      log.debug(strLoggerTitle + ' Reduce Values', bodyValue);
      const poInternalId = bodyValue.values['GROUP(internalid)'].value;
      const poRecord = record.load({
        type: record.Type.PURCHASE_ORDER,
        id: poInternalId,
        isDynamic: false,
      });
      //
      const lineItemCount = poRecord.getLineCount({ sublistId: 'item' });
      for (let index = 0; index < lineItemCount; index++) {
        // Get Item Qty
        const itemQty = poRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index,
        });
        //
        poRecord.setSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_wdym_orig_order_qty',
          value: itemQty,
          line: index,
        });
      }
      //
      poRecord.save();
      log.audit(
        strLoggerTitle + ' Transaction Save',
        'Purchase Order Saved Successfully ' + poInternalId
      );
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
  //exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
