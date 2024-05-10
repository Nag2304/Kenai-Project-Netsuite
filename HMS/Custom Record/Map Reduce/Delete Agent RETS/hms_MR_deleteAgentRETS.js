/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_deleteAgentRETS.js
 * Script: HMS | MR Delete Agent RETS
 * Author           Date       Version               Remarks
 * mikewilliams   05.10.2024    1.00        Initial Creation Of Script
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
      type: 'customrecord_agent',
      filters: [
        ['custrecord_verified_from_rets_agent', 'is', 'T'],
        'AND',
        ['custrecord_agent_mls_region', 'anyof', '3'],
        'AND',
        [
          [
            'formulanumeric: case when {custrecord_survey_agent.internalid} IS NULL then 1 else 0 end',
            'equalto',
            '1',
          ],
          'AND',
          [
            'formulanumeric: case when {custrecord_real_estate_agent_name.internalid} IS NULL then 1 else 0 end',
            'equalto',
            '1',
          ],
          'AND',
          [
            'formulanumeric: case when {custevent_caller_name.internalid} IS NULL then 1 else 0 end',
            'equalto',
            '1',
          ],
        ],
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
      const internalId = results.values['GROUP(internalid)'].value;
      // Delete Records
      record.delete({
        type: 'customrecord_agent',
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
  //exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
