/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: ops_MR_addTaxAdjustmentLine.js
 * Script: OPS | MR Add Tax Adjustment Line
 * Author           Date       Version               Remarks
 * nagendrababu   09.22.2025    1.00      Initial creation of script
 * nagendrababu   10.03.2025    1.01      Corrected logic to adjust variance sign based on client feedback
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/*
 * Map/Reduce script to add/update/remove Sales Tax Adjustment lines
 * on Sales Orders based on eTail Tax Total Variance field.
 *
 * Parameters:
 * - custscript_ops_date_from   (date) : Only process orders on/after this date
 * - custscript_ops_order_id    (integer) : Specific SO internal ID (optional)
 *
 * */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record', 'N/runtime', 'N/format'], (
  search,
  record,
  runtime,
  format
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const TAX_ITEM_ID = 1242; // Sales Tax Adjustment item
  const FIELD_VARIANCE = 'custbody_celigo_etail_tax_total_var';
  const FIELD_TAX_UPDATED = 'custbody_os_tax_updated';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const loggerTitle = 'Get Input Data';
    const script = runtime.getCurrentScript();
    const dateFrom = script.getParameter({ name: 'custscript_ops_date_from' });
    let formattedDate = '';
    if (dateFrom) {
      formattedDate = format.format({
        value: dateFrom,
        type: format.Type.DATE,
      });
      log.debug(loggerTitle, 'Date Param: ' + formattedDate);
    }

    const orderId = script.getParameter({ name: 'custscript_ops_order_id' });
    //
    log.audit(loggerTitle, { dateFrom, orderId });
    //

    const filters = [
      ['type', 'anyof', 'SalesOrd'],
      'AND',
      ['mainline', 'is', 'T'],
      'AND',
      [FIELD_VARIANCE, 'notequalto', 0],
      'AND',
      [FIELD_TAX_UPDATED, 'is', 'F'],
    ];

    if (dateFrom) {
      filters.push('AND', ['trandate', 'onorafter', formattedDate]);
    }
    if (orderId) {
      filters.push('AND', ['internalidnumber', 'equalto', orderId]);
    }

    return search.create({
      type: search.Type.SALES_ORDER,
      filters: filters,
      columns: ['internalid', FIELD_VARIANCE],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  /**
   *
   * @param {object} mapContext
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const result = JSON.parse(mapContext.value);
      log.debug(loggerTitle, result);
      //
      mapContext.write({
        key: result.id,
        value: {
          id: result.id,
          variance: parseFloat(result.values[FIELD_VARIANCE]) || 0,
        },
      });
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
      const values = reduceContext.values.map((v) => JSON.parse(v));
      const soId = reduceContext.key;
      const variance = values[0].variance;
      //
      log.debug(loggerTitle, { soId, variance });
      //
      const rec = record.load({
        type: record.Type.SALES_ORDER,
        id: soId,
        isDynamic: true,
      });

      // Locate existing adjustment line if any
      let adjustmentLineIndex = -1;
      const lineCount = rec.getLineCount({ sublistId: 'item' });

      for (let i = 0; i < lineCount; i++) {
        const itemId = rec.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });
        if (parseInt(itemId, 10) === TAX_ITEM_ID) {
          adjustmentLineIndex = i;
          break;
        }
      }

      // Calculate adjusted amount based on variance sign
      let adjustedAmount = variance;
      if (variance < 0) {
        adjustedAmount = -variance; // Convert negative to positive
      } else if (variance > 0) {
        adjustedAmount = -variance; // Convert positive to negative
      }

      // Case 1: Variance = 0 → Remove adjustment line
      if (variance === 0) {
        if (adjustmentLineIndex !== -1) {
          rec.removeLine({ sublistId: 'item', line: adjustmentLineIndex });
          log.debug(loggerTitle, `Removed adjustment line on SO ${soId}`);
        }
      }
      // Case 2: Variance ≠ 0 → Add or Update adjustment line with adjusted amount
      else {
        if (adjustmentLineIndex !== -1) {
          rec.selectLine({ sublistId: 'item', line: adjustmentLineIndex });
          rec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: adjustedAmount,
          });
          rec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: adjustedAmount,
          });
          rec.commitLine({ sublistId: 'item' });
          log.debug(
            loggerTitle,
            `Updated adjustment line on SO ${soId} with amount ${adjustedAmount}`
          );
        } else {
          rec.selectNewLine({ sublistId: 'item' });
          rec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: TAX_ITEM_ID,
          });
          rec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: adjustedAmount,
          });
          rec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: adjustedAmount,
          });
          rec.commitLine({ sublistId: 'item' });
          log.debug(
            loggerTitle,
            `Added adjustment line on SO ${soId} with amount ${adjustedAmount}`
          );
        }
      }

      // Mark Tax Updated flag
      rec.setValue({ fieldId: FIELD_TAX_UPDATED, value: true });

      rec.save();
      log.debug(loggerTitle, `SO ${soId} saved successfully`);
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
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
