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
  /* -------------------------- Map Phase - Begin -------------------------- */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Parse the Values
      const mapContextValues = JSON.parse(mapContext.value);
      log.debug(loggerTitle, mapContextValues);
      //

      // Key
      const email =
        mapContextValues.values['GROUP(custrecord_hms_agent_email)'];
      //

      // Values
      const reduceValues = {};
      reduceValues.crmCount = parseInt(
        mapContextValues.values['SUM(custrecord_hms_crm_record_count)']
      );
      reduceValues.surveyCount = parseInt(
        mapContextValues.values['SUM(custrecord_hms_survery_count)']
      );
      reduceValues.soldPropertiesCount = parseInt(
        mapContextValues.values['SUM(custrecord_hms_sold_properties)']
      );
      //

      // Form Key Values
      mapContext.write({
        key: email,
        value: reduceValues,
      });
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit------------------<|'
    );
  };
  /* -------------------------- Map Phase- End-------------------------- */
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
      // Key
      const key = reduceContext.key;
      log.debug(loggerTitle, `Key: ${key}`);
      //
      // Values
      const results = JSON.parse(reduceContext.values[0]);
      log.debug(loggerTitle + ' Results', results);
      const crmCount = results.crmCount;
      const surveyCount = results.surveyCount;
      const soldPropertiesCount = results.soldPropertiesCount;
      //

      // Retrieve Ids
      const agentIds = retrieveAgentInternalIds(key);
      log.debug(loggerTitle + ' Agent Ids ', agentIds);
      //

      // Loop Through the Ids
      for (let index = 0; index < agentIds.length; index++) {
        // internal id
        const id = parseInt(agentIds[index].id);

        // VerifiedFrom RETS
        const verifiedFromRets = agentIds[index].verifiedFromRETSFeeds;

        // Keep & Purge Records
        if (crmCount === 0 && surveyCount === 0 && soldPropertiesCount === 0) {
          updateAgentUpdateProjectRecord(id, 'purge');
        } else {
          if (verifiedFromRets) {
            updateAgentUpdateProjectRecord(id, 'keep');
          } else {
            updateAgentUpdateProjectRecord(id, 'purge');
          }
        }
        //
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
  /* *********************** retrieveAgentInternalIds - Begin *********************** */
  /**
   *
   * @param {string} email
   * @returns {object}
   */
  const retrieveAgentInternalIds = (email) => {
    const loggerTitle = ' Retrieve Agent Internal Ids';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const resultValuesArr = [];
    try {
      // Create Search
      const customrecord_hms_agent_upd_projectSearchObj = search.create({
        type: 'customrecord_hms_agent_upd_project',
        filters: [['custrecord_hms_agent_email', 'is', email]],
        columns: [
          search.createColumn({
            name: 'custrecord_hms_agent_id_number',
            label: 'Agent ID Number',
          }),
          search.createColumn({
            name: 'custrecord_hms_verified_from_rets_feed',
            label: 'VERIFIED FROM RETS FEED',
          }),
        ],
      });
      var searchResultCount =
        customrecord_hms_agent_upd_projectSearchObj.runPaged().count;
      log.debug(loggerTitle, `Search Result Count: ${searchResultCount}`);
      //
      if (searchResultCount == 2) {
        customrecord_hms_agent_upd_projectSearchObj.run().each((result) => {
          let resultObj = {};
          resultObj.id = result.id;
          resultObj.agentIdNumber = result.getValue(
            'custrecord_hms_agent_id_number'
          );
          resultObj.verifiedFromRETSFeeds = result.getValue(
            'custrecord_hms_verified_from_rets_feed'
          );
          resultValuesArr.push(resultObj);
          return true;
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
    return resultValuesArr;
  };
  /* *********************** retrieveAgentInternalIds - End *********************** */
  //
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
        ['custrecord_hms_keep', 'is', 'F'],
        'AND',
        ['custrecord_hms_purge', 'is', 'F'],
        'AND',
        ['count(internalid)', 'equalto', '2'],
      ],
      columns: [
        search.createColumn({
          name: 'custrecord_hms_email_dupe',
          summary: 'GROUP',
          label: 'Email Duplicate',
        }),
        search.createColumn({
          name: 'custrecord_hms_mls_region',
          summary: 'GROUP',
          label: 'MLS Region',
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
        search.createColumn({
          name: 'custrecord_hms_agent_email',
          summary: 'GROUP',
          label: 'Email',
        }),
      ],
    });
  };
  /* *********************** searchAgentEmailDuplicateswithTwoRecords - End *********************** */
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
  /* ----------------------- Helper Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
