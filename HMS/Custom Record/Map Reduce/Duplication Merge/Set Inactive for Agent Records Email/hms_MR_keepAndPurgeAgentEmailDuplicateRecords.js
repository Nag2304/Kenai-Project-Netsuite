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

      // Keep & Purge Records
      if (crmCount === 0 && surveyCount === 0 && soldPropertiesCount === 0) {
        markRecordsAsPurge(agentIdNumber);
      } else if (crmCount > 0 || surveyCount > 0 || soldPropertiesCount > 0) {
        markRecordsAsKeepAndPurge(agentIdNumber);
      }
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
        [
          ['custrecord_hms_keep', 'is', 'T'],
          'OR',
          ['custrecord_hms_purge', 'is', 'T'],
        ],
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
  /* *********************** markRecordsAsPurge - Begin *********************** */
  /**
   *
   * @param {string} agentIdNumber
   * @returns {boolean}
   */
  const markRecordsAsPurge = (agentIdNumber) => {
    const loggerTitle = ' Mark Records As Purge ';
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
          updateAgentUpdateProjectRecord(internalId);
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
  /* *********************** markRecordsAsPurge - End *********************** */
  //
  /* *********************** updateAgentUpdateProjectRecord - Begin *********************** */
  /**
   *
   * @param {Number} customRecordId
   * @param {string} flag
   * @returns {boolean}
   */
  const updateAgentUpdateProjectRecord = (customRecordId, flag) => {
    const loggerTitle = ' Update Agent Update Project Record ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      if (customRecordId && flag == 'purge') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_project',
          id: customRecordId,
          values: {
            custrecord_hms_purge: true,
          },
        });
        log.debug(loggerTitle, `Updated ID: ${customRecordId} for ${flag}`);
      } else if (customRecordId && flag == 'keep') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_project',
          id: customRecordId,
          values: {
            custrecord_hms_keep: true,
          },
        });
        log.debug(loggerTitle, `Updated ID: ${customRecordId} for ${flag}`);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* *********************** updateAgentUpdateProjectRecord - End *********************** */
  //
  /* *********************** markRecordsAsKeepAndPurge - Begin *********************** */
  const markRecordsAsKeepAndPurge = (agentIdNumber) => {
    const loggerTitle = ' Mark Records As Keep And Purge';
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
          search.createColumn({
            name: 'custrecord_hms_verified_from_rets_feed',
            label: 'VERIFIED FROM RETS FEED',
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
          const verifiedFromRETSFeeds = result.getValue({
            name: 'custrecord_hms_verified_from_rets_feed',
            label: 'VERIFIED FROM RETS FEED',
          });
          if (verifiedFromRETSFeeds) {
            updateAgentUpdateProjectRecord(internalId, 'keep');
          } else if (!verifiedFromRETSFeeds) {
            updateAgentUpdateProjectRecord(internalId, 'purge');
          }
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
    return true;
  };
  /* *********************** markRecordsAsKeepAndPurge - End *********************** */
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
