/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_purgeAgentUpdateProjectRecordsForRegion7.js
 * Script: HMS | MR Purge Agent Records Region 7
 * Author           Date       Version               Remarks
 * nagendrababu   04.19.2025    1.00     Initial Creation Of Script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'customrecord_hms_agent_upd_prjct_reg_7',
      filters: [['isinactive', 'is', 'F']],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
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
    try {
      const results = JSON.parse(mapContext.value);
      log.debug(loggerTitle + ' MAP CONTEXT VALUES', results);
      //
      // Retrieve Value
      const internalId = results.values.internalid.value;
      //
      // Delete Records
      record.delete({
        type: 'customrecord_hms_agent_upd_prjct_reg_7',
        id: internalId,
      });
      //
      log.emergency(loggerTitle, ' Record Deleted Successfully: ' + internalId);
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
