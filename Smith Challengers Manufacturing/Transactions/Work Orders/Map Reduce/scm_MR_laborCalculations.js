/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_MR_laborCalculations.js
 * Script: SCM | MR Labor Calculations
 * Author           Date       Version               Remarks
 * nagendrababu   02.12.2025    1.00       Initial creation of the script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const LABOR_ITEMS = {
    1948: 'custbody_scm_ttl_labor_gen_assy',
    1949: 'custbody_scm_tlt_assy_setup',
    1950: 'custbody_scm_ttl_labor_paint',
    1951: 'custbody_scm_ttl_labor_mtl_weld',
    1952: 'custbody_scm_ttl_labor_jig_fixtures',
    1953: 'custbody_scm_ttl_labor_machine_gnl',
    1954: 'custbody_scm_ttl_machine_setup',
    1955: 'custbody_scm_ttl_labor_drill_tap',
    1956: 'custbody_scm_ttl_labor_cleaning',
  };

  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'workorder',
      settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
      filters: [
        ['type', 'anyof', 'WorkOrd'],
        'AND',
        ['custbody_scm_labor_calc', 'is', 'F'],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
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
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const workOrderId = JSON.parse(mapContext.value).id;
    let laborTotals = Object.values(LABOR_ITEMS).reduce(
      (acc, fieldId) => ({ ...acc, [fieldId]: 0 }),
      {}
    );
    log.debug(loggerTitle, { workOrderId, laborTotals });
    try {
      const workOrder = record.load({
        type: 'workorder',
        id: workOrderId,
        isDynamic: true,
      });
      const lineCount = workOrder.getLineCount({ sublistId: 'item' });
      //
      for (let i = 0; i < lineCount; i++) {
        let itemId = workOrder.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });
        let qty =
          parseFloat(
            workOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: i,
            })
          ) || 0;

        if (LABOR_ITEMS[itemId]) laborTotals[LABOR_ITEMS[itemId]] += qty;
      }
      //
      // Update Work Order Header Fields
      Object.keys(laborTotals).forEach((fieldId) =>
        workOrder.setValue({ fieldId, value: laborTotals[fieldId] })
      );

      // Mark as processed
      workOrder.setValue({ fieldId: 'custbody_scm_labor_calc', value: true });

      workOrder.save();
      log.audit(`Updated Work Order ${workOrderId}`, laborTotals);
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
