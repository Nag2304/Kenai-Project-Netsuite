/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_setInactiveForAgentRecords.js
 * Script: HMS | MR Set Inactive Agent Original Record
 * Author           Date       Version               Remarks
 * nagendrababu   06.20.2024   1.00          Initial Creation of script
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
    return search.create({
      type: 'customrecord_hms_agent_upd_project',
      filters: [['isinactive', 'is', 'T']],
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
      const agentName = reduceContextValues.values.custrecord_hms_agent_name;
      log.debug(loggerTitle, `Agent Name:${agentName}`);
      //
      if (agentName) {
        const agentId = getAgentRecordId(agentName);
        if (agentId) {
          updateOriginalAgentRecord(agentId);
        }
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
  /* *********************** getAgentRecordId - Begin *********************** */
  /**
   *
   * @param {string} agentName
   * @returns {number} agentId
   */
  const getAgentRecordId = (agentName) => {
    const loggerTitle = ' Get Agent Record Id ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let agentId;
    try {
      const customAgentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [['name', 'is', agentName]],
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        ],
      });
      const searchResultCount = customAgentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Count: ' + searchResultCount);
      //
      if (searchResultCount) {
        customAgentSearchObj.run().each((result) => {
          agentId = result.id;
        });
        log.debug(loggerTitle, ' Agent ID: ' + agentId);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return agentId;
  };
  /* *********************** getAgentRecordId - End *********************** */
  //
  /* *********************** updateOriginalAgentRecord - Begin *********************** */
  /**
   *
   * @param {Number} agentId
   */
  const updateOriginalAgentRecord = (agentId) => {
    const loggerTitle = ' Update Original Agent Record ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      if (agentId) {
        record.submitFields({
          type: 'customrecord_agent',
          id: agentId,
          values: {
            isinactive: true,
            custrecord_hms_marked_dup: true,
          },
        });
        log.debug(loggerTitle, `Updated ID: ${agentId} `);
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
  /* *********************** updateOriginalAgentRecord - End *********************** */
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
