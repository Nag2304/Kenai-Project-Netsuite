/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_mergeRecordsforEmailDup_Dayton.js
 * Script: HMS | MR Merge Email Dup Dayton
 * Author           Date       Version               Remarks
 * nagendrababu 14th sep 2024   1.00        Initial creation of the script.
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
    return runSearchToGetInputData();
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
    // log.audit(
    //   loggerTitle,
    //   '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    // );
    //
    try {
      const results = JSON.parse(mapContext.value);
      //   log.debug(loggerTitle + ' MAP CONTEXT VALUES', results);
      //

      // Form Key
      const key = results.values.custrecord_hms_agent_email;
      //

      // Form Values
      const reduceValuesObject = {};
      reduceValuesObject.keep = results.values.custrecord_hms_keep;
      reduceValuesObject.purge = results.values.custrecord_hms_purge;
      reduceValuesObject.agentId =
        results.values.custrecord_hms_agent_id_number;
      reduceValuesObject.crmCount =
        results.values.custrecord_hms_crm_record_count;
      reduceValuesObject.surveyCount =
        results.values.custrecord_hms_survery_count;
      reduceValuesObject.soldPropertiesCount =
        results.values.custrecord_hms_sold_properties;
      //
      // Form Key Values
      if (key) {
        mapContext.write({
          key: key,
          value: reduceValuesObject,
        });
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    // log.audit(
    //   loggerTitle,
    //   '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    // );
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
    let originalAgentInternalPurgeObj = {};
    let originalAgentInternalKeepObj = {};
    try {
      // Key & Value Pairs
      const key = reduceContext.key;
      log.debug(loggerTitle + ' Key', key);
      const values = reduceContext.values;
      log.debug(loggerTitle + ' Values', values);
      //
      // Loop Thru each Values - 1
      for (let index = 0; index < values.length; index++) {
        if (values.length > 1) {
          const eachResult = JSON.parse(values[index]);
          log.debug(loggerTitle + ' For Loop', eachResult);
          //
          const purge = eachResult.purge;
          const keep = eachResult.keep;
          const crmCount = eachResult.crmCount;
          const surveyCount = eachResult.surveyCount;
          const soldPropertiesCount = eachResult.soldPropertiesCount;
          //
          // Retrieve Purge Record Obj
          if (
            purge == 'T' &&
            keep == 'F' &&
            (crmCount > 0 || surveyCount > 0 || soldPropertiesCount > 0)
          ) {
            log.debug(loggerTitle, ' Purge Record ');
            //
            const agentId = eachResult.agentId;
            originalAgentInternalPurgeObj = retrieveAgentRecordId(agentId, key);
            log.debug(
              loggerTitle + ' Original Agent ID: ',
              originalAgentInternalPurgeObj
            );
            //
          }
          //
          // Update Keep Record Obj
          if (
            keep == 'T' &&
            purge == 'F' &&
            (crmCount > 0 || surveyCount > 0 || soldPropertiesCount > 0)
          ) {
            log.debug(loggerTitle, ' Keep Record ');
            //
            const agentId = eachResult.agentId;
            originalAgentInternalKeepObj = retrieveAgentRecordId(agentId, key);
            log.debug(
              loggerTitle + ' Original Agent ID: ',
              originalAgentInternalKeepObj
            );
            //
          }
          //
        }
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
  /* ------------------------- Helper Functions - Begin ------------------------ */
  //
  /* *********************** Run Search to Get Input Data - Begin *********************** */
  /**
   *
   * @returns {object} agentEmailDuplicateSearch
   */
  const runSearchToGetInputData = () => {
    const loggerTitle = 'Run Search to Get Input Data';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    //
    let agentEmailDuplicateSearch;
    try {
      agentEmailDuplicateSearch = search.create({
        type: 'customrecord_hms_agent_upd_project',
        filters: [
          ['custrecord_hms_email_dupe', 'is', 'T'],
          'AND',
          [
            ['custrecord_hms_survery_count', 'greaterthan', '0'],
            'OR',
            ['custrecord_hms_crm_record_count', 'greaterthan', '0'],
            'OR',
            ['custrecord_hms_sold_properties', 'greaterthan', '0'],
          ],
        ],
        columns: [
          search.createColumn({
            name: 'custrecord_hms_agent_id_number',
            label: 'Agent ID Number',
          }),
          search.createColumn({
            name: 'custrecord_hms_agent_email',
            label: 'Email',
          }),
          search.createColumn({
            name: 'custrecord_hms_email_dupe',
            label: 'Email Duplicate',
          }),
          search.createColumn({ name: 'custrecord_hms_keep', label: 'Keep' }),
          search.createColumn({ name: 'custrecord_hms_purge', label: 'Purge' }),
          search.createColumn({
            name: 'custrecord_hms_crm_record_count',
            label: 'CRM Record Count',
          }),
          search.createColumn({
            name: 'custrecord_hms_sold_properties',
            label: 'Sold Properties',
          }),
          search.createColumn({
            name: 'custrecord_hms_survery_count',
            label: 'Survey Count',
          }),
        ],
      });
      log.debug(loggerTitle, ' Search Ran Successfully.');
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return agentEmailDuplicateSearch;
  };
  /* *********************** Run Search to Get Input Data - End *********************** */
  //
  /* *********************** Retrieve Agent Record Id - Begin *********************** */
  /**
   *
   * @param {string} agentId
   * @param {string} emailAddress
   * @returns {object} agentRecordObj
   */
  const retrieveAgentRecordId = (agentId, emailAddress) => {
    const loggerTitle = 'Retrieve Agent Record Id';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    //
    let agentRecordObj = {};
    try {
      const agentOriginalSearch = search.create({
        type: 'customrecord_agent',
        filters: [
          ['custrecord_agent_email', 'is', emailAddress],
          'AND',
          ['custrecord_agent_id', 'is', agentId],
        ],
        columns: [
          search.createColumn({ name: 'name', label: 'Name' }),
          search.createColumn({ name: 'id', label: 'ID' }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTEVENT_CALLER_NAME',
            label: 'CRM Internal ID',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTRECORD_SURVEY_AGENT',
            label: 'Survey Internal ID',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTRECORD_REAL_ESTATE_AGENT_NAME',
            label: 'Property Internal ID',
          }),
        ],
      });
      //
      const searchResultCount = agentOriginalSearch.runPaged().count;
      log.debug(loggerTitle, 'agentOriginalSearch: ' + searchResultCount);
      agentOriginalSearch.run().each((result) => {
        // .run().each has a limit of 4,000 results
        agentRecordObj.agentInternalIdOriginal = result.getValue('id');
        agentRecordObj.crmId = result.getValue({
          name: 'internalid',
          join: 'CUSTEVENT_CALLER_NAME',
          label: 'CRM Internal ID',
        });
        agentRecordObj.surveryId = result.getValue({
          name: 'internalid',
          join: 'CUSTRECORD_SURVEY_AGENT',
          label: 'Survey Internal ID',
        });
        agentRecordObj.propertyId = result.getValue({
          name: 'internalid',
          join: 'CUSTRECORD_REAL_ESTATE_AGENT_NAME',
          label: 'Property Internal ID',
        });
        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return agentRecordObj;
  };
  /* *********************** Retrieve Agent Record Id - End *********************** */
  //
  /* *********************** Set Purge Record Inactive - Begin *********************** */
  /**
   *
   * @param {Number} agentId
   */
  const setPurgeRecordInactive = (agentId) => {
    const loggerTitle = 'Set Purge Record Inactive';
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
          },
        });
        log.debug(loggerTitle, ' Custom Record Agent: ' + agentId);
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
  /* *********************** Set Purge Record Inactive - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
