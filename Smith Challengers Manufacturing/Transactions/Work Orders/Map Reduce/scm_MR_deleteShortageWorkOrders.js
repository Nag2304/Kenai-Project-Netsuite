/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_MR_deleteShortageWorkOrders.js
 * Script: SCM | MR Delete Shortage Work Orders
 * Author           Date       Version               Remarks
 * nagendrababu 01.26.2026     1.00         Initial creation of the script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record', 'N/runtime', 'N/search'], (record, runtime, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const script = runtime.getCurrentScript();
    const testWoId = script.getParameter({ name: 'custscript_sc_test_wo_id' });

    const filters = [
      ['type', 'anyof', 'WorkOrd'],
      'AND',
      ['status', 'anyof', 'WorkOrd:B', 'WorkOrd:D'],
      'AND',
      ['item.type', 'anyof', 'Assembly', 'InvtPart'],
      'AND',
      ['trandate', 'onorafter', '10/7/2024'],
      'AND',
      [
        'formulanumeric: case when {buildable} != {quantity} then 1 else 0 end',
        'equalto',
        '1',
      ],
      'AND',
      ['itemsource', 'noneof', 'PHANTOM'],
      'AND',
      ['mainline', 'is', 'T'],
      'AND',
      ['createdfrom', 'anyof', '@NONE@'],
      'AND',
      ['printedpickingticket', 'is', 'F'],
    ];

    // Optional test mode filter
    if (testWoId) {
      filters.push('AND');
      filters.push(['internalid', 'anyof', testWoId]);

      log.audit({
        title: 'Get Input Data',
        details: `TEST MODE ENABLED → Only deleting Work Order ID ${testWoId}`,
      });
    }

    return search.create({
      type: 'workorder',
      settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
      filters,
      columns: [
        search.createColumn({ name: 'internalid' }),
        search.createColumn({ name: 'tranid' }),
      ],
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
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|',
    );
    //
    try {
      const result = JSON.parse(mapContext.value);

      mapContext.write({
        key: result.id,
        value: result.values.tranid || 'N/A',
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|',
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
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|',
    );
    //
    const woId = reduceContext.key;
    const woNumber = reduceContext.values[0];
    try {
      log.audit({
        title: loggerTitle,
        details: `Deleting Work Order ${woNumber} (ID ${woId})`,
      });

      record.delete({
        type: record.Type.WORK_ORDER,
        id: woId,
      });

      log.audit({
        title: loggerTitle,
        details: `Successfully deleted Work Order ${woNumber} (ID ${woId})`,
      });
    } catch (error) {
      log.error({
        title: `${loggerTitle} – Delete failed`,
        details: `WO ${woNumber} (ID ${woId}) → ${error.message}`,
      });
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|',
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
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|',
    );
    //
    try {
      log.audit(
        loggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage,
      );
      log.audit(
        loggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency,
      );
      log.audit(
        loggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields,
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|',
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
