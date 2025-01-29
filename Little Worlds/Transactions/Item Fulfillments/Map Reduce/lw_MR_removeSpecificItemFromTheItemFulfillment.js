/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: lw_MR_removeSpecificItemFromItemFulfillment.js
 * Script:LW | MR Remove Specific Item
 * Author           Date       Version               Remarks
 * nagendrababu   01.24.2025    1.00      Initial creation of he script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record', 'N/runtime'], (search, record, runtime) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const scriptObj = runtime.getCurrentScript();
    const itemId = scriptObj.getParameter({
      name: 'custscript_lw_mr_item_id',
    });
    const customerId = scriptObj.getParameter({
      name: 'custscript_lw_mr_customer',
    });
    const createdFromDate = scriptObj.getParameter({
      name: 'custscript_lw_mr_created_from_date',
    });

    log.audit('Get Input Data', { itemId, customerId, createdFromDate });

    if (itemId && createdFromDate && customerId) {
      return search.create({
        type: 'itemfulfillment',
        filters: [
          ['type', 'anyof', 'ItemShip'],
          'AND',
          ['name', 'anyof', customerId],
          'AND',
          ['item', 'anyof', itemId],
          'AND',
          ['createdfrom.trandate', 'on', createdFromDate],
          'AND',
          ['item', 'noneof', '@NONE@'],
          'AND',
          ['taxline', 'is', 'F'],
          'AND',
          ['shipping', 'is', 'F'],
          'AND',
          ['mainline', 'any', ''],
        ],
        columns: [
          search.createColumn({
            name: 'internalid',
            summary: 'GROUP',
            label: 'Internal ID',
          }),
          search.createColumn({
            name: 'tranid',
            summary: 'GROUP',
            label: 'Document Number',
          }),
          search.createColumn({
            name: 'item',
            summary: 'GROUP',
            label: 'Item',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'item',
            summary: 'GROUP',
            label: 'Item Internal ID',
          }),
        ],
      });
    } else {
      log.error(
        'Get Input Data',
        `The Script Parameter Item ID, Customer ID, and Created From Date are empty. 
        Please populate the Script Paramters with Apporpiate Values and Try Again.`
      );
      return null;
    }
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  /**
   *
   * @param {object} context
   */
  const map = (context) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      //
      const searchResult = JSON.parse(context.value);
      //

      log.debug(loggerTitle, searchResult);
      const itemFulfillmentId = searchResult.values['GROUP(internalid)'].value;
      const itemId = searchResult.values['GROUP(internalid.item)'].value;
      //
      log.debug(loggerTitle, { itemFulfillmentId, itemId });
      const fulfillmentRecord = record.load({
        type: record.Type.ITEM_FULFILLMENT,
        id: itemFulfillmentId,
        isDynamic: true,
      });

      const lineCount = fulfillmentRecord.getLineCount({
        sublistId: 'item',
      });

      log.debug(loggerTitle, { lineCount });

      for (let i = 0; i < lineCount; i++) {
        fulfillmentRecord.selectLine({ sublistId: 'item', line: i });
        const currentItemId = fulfillmentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
        });

        log.debug(loggerTitle, { currentItemId });

        if (currentItemId == itemId) {
          fulfillmentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'itemreceive',
            value: false,
          });
          fulfillmentRecord.commitLine({ sublistId: 'item' });
          log.debug(
            'Item Updated',
            'Item with ID ' +
              itemId +
              ' updated in Item Fulfillment ' +
              itemFulfillmentId
          );
          break;
        }
      }

      const itemfulfillmentId = fulfillmentRecord.save();
      log.debug(
        loggerTitle,
        `Item Fulfillment Record is saved successfully: ${itemfulfillmentId}`
      );
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
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
