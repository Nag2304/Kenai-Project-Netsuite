/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_keepAndPurgeAgentEmailDuplicateRecords.js
 * Script: HMS | MR Upd Agent Email Dup Records
 * Author           Date       Version               Remarks
 * nagendrababu  06.26.2024      1.00     Initial Creation of the Script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return searchAgentEmailDuplicateswithTwoRecords();
  };
  /* ------------------------- Get Input Data - End ------------------------- */
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
      // Parse the Values
      const reduceContextValues = JSON.parse(reduceContext.values[0]);
      log.debug(loggerTitle, reduceContextValues);
      //
      // Read the Values
      const agentIdNumber =
        reduceContextValues.values['GROUP(custrecord_hms_agent_id_number)'];
      log.debug(loggerTitle, `Agent ID:${agentIdNumber}`);
      //

      // Read the Count
      const crmCount = parseInt(
        reduceContextValues.values['SUM(custrecord_hms_crm_record_count)']
      );
      const surveyCount = parseInt(
        reduceContextValues.values['SUM(custrecord_hms_survery_count)']
      );
      const soldPropertiesCount = parseInt(
        reduceContextValues.values['SUM(custrecord_hms_sold_properties)']
      );
      //

      if (crmCount === 0 && surveyCount === 0 && soldPropertiesCount === 0) {
        keepPurgeRecords(agentIdNumber);
      }
      if (agentIdNumber) {
      }
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
  /* ----------------------- Helper Functions - Begin ----------------------- */
  //
  /* *********************** searchAgentEmailDuplicateswithTwoRecords - Begin *********************** */
  /**
   *
   * @returns {object}
   */
  const searchAgentEmailDuplicateswithTwoRecords = () => {
    const loggerTitle = ' Search Agent Duplicates With Two Records ';
    log.debug(loggerTitle, ' Search Started');
    return search.create({
      type: 'customrecord_hms_agent_upd_project',
      filters: [
        ['custrecord_hms_email_dupe', 'is', 'T'],
        'AND',
        ['isinactive', 'is', 'F'],
        'AND',
        ['count(internalid)', 'equalto', '2'],
      ],
      columns: [
        search.createColumn({
          name: 'custrecord_hms_agent_id_number',
          summary: 'GROUP',
          label: 'Agent ID Number',
        }),
        search.createColumn({
          name: 'custrecord_hms_crm_record_count',
          summary: 'SUM',
          label: 'CRM Record Count',
        }),
        search.createColumn({
          name: 'custrecord_hms_survery_count',
          summary: 'SUM',
          label: 'Survey Count',
        }),
        search.createColumn({
          name: 'custrecord_hms_sold_properties',
          summary: 'SUM',
          label: 'Sold Properties',
        }),
      ],
    });
  };
  /* *********************** searchAgentEmailDuplicateswithTwoRecords - End *********************** */
  //
  /* *********************** keepPurgeRecords - Begin *********************** */
  /**
   *
   * @param {string} agentIdNumber
   * @returns {boolean}
   */
  const keepPurgeRecords = (agentIdNumber) => {
    const loggerTitle = ' Keep Purge Records ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const customAgentUpdateProjectSearchObj = search.create({
        type: 'customrecord_hms_agent_upd_project',
        filters: [
          ['custrecord_hms_agent_id_number', 'is', agentIdNumber],
          'AND',
          ['custrecord_hms_email_dupe', 'is', 'T'],
          'AND',
          ['isinactive', 'is', 'F'],
        ],
        columns: [
          search.createColumn({
            name: 'custrecord_hms_agent_id_number',
            label: 'Agent ID Number',
          }),
          search.createColumn({
            name: 'custrecord_hms_agent_name',
            label: 'Name',
          }),
        ],
      });
      const searchResultCount =
        customAgentUpdateProjectSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
      //
      if (searchResultCount === 2) {
        customAgentUpdateProjectSearchObj.run().each((result) => {
          const internalId = result.id;
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* *********************** keepPurgeRecords - End *********************** */
  //
  /* ----------------------- Helper Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
