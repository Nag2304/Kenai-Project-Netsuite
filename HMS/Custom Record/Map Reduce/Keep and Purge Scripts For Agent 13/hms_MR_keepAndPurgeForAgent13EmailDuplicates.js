/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_keepAndPurgeEmailDuplicateRecordsForRegion13.js
 * Script: HMS | MR K & P For Region 13 Email Dup
 * Author           Date       Version               Remarks
 * nagendrababu  24.11.2024     1.00     Initial Creation of the Script.
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
  /**
   *
   * @returns {object}
   */
  const getInputData = () => {
    return searchAgentDuplicateswithTwoRecords();
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* -------------------------- Map Phase - Begin -------------------------- */
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
      // Parse the Values
      const mapContextValues = JSON.parse(mapContext.value);
      log.debug(loggerTitle, mapContextValues);
      //

      // Key
      const agent =
        mapContextValues.values['GROUP(custrecord_hms_agent_id_number_13)'];
      //

      // Values
      const reduceValues = {};
      reduceValues.crmCount = parseInt(
        mapContextValues.values['SUM(custrecord_hms_crm_record_count_13)']
      );
      reduceValues.surveyCount = parseInt(
        mapContextValues.values['SUM(custrecord_hms_survery_count_13)']
      );
      reduceValues.soldPropertiesCount = parseInt(
        mapContextValues.values['SUM(custrecord_hms_sold_properties_13)']
      );
      //

      // Form Key Values
      mapContext.write({
        key: agent,
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

    try {
      // Key
      const key = reduceContext.key;
      log.debug(loggerTitle, `Key: ${key}`);
      //
      // Values
      const results = JSON.parse(reduceContext.values[0]);
      log.debug(loggerTitle + ' Results', results);
      let crmCount = results.crmCount;
      let surveyCount = results.surveyCount;
      let soldPropertiesCount = results.soldPropertiesCount;

      // Retrieve Ids
      const agentIds = retrieveAgentInternalIds(key);
      log.debug(loggerTitle + ' Agent Ids ', agentIds);

      // Ensure we have exactly two records
      if (agentIds.length !== 2) {
        return true;
      }

      const [record1, record2] = agentIds;

      // Define comparison logic
      const determineKeepPurge = (rec1, rec2) => {
        const rec1Verified = rec1.verifiedFromRETSFeeds === true;
        const rec2Verified = rec2.verifiedFromRETSFeeds === true;

        log.debug(
          loggerTitle,
          `REC1 VERIFIED: ${rec1Verified} REC2 VERIFIED: ${rec2Verified}`
        );

        const rec1HasRelatedRecords =
          rec1.cCount > 0 || rec1.sCount > 0 || rec1.spCount > 0;
        const rec2HasRelatedRecords =
          rec2.cCount > 0 || rec2.sCount > 0 || rec2.spCount > 0;

        log.debug(
          loggerTitle,
          ` REC1 RELATED RECORDS: ${rec1HasRelatedRecords} REC 2 RELATED RECORDS: ${rec2HasRelatedRecords}`
        );

        if (
          !rec1Verified &&
          !rec2Verified &&
          rec1HasRelatedRecords &&
          rec2HasRelatedRecords
        ) {
          // Both records are unverified, and both have related records
          // Compare `lastUpdate` dates and keep the one with the most recent date
          if (new Date(rec1.lastUpdate) > new Date(rec2.lastUpdate)) {
            return { keep: rec1, purge: rec2 };
          } else {
            return { keep: rec2, purge: rec1 };
          }
        }

        if (rec1Verified && !rec2Verified) {
          return { keep: rec1, purge: rec2 };
        } else if (!rec1Verified && rec2Verified) {
          return { keep: rec2, purge: rec1 };
        } else if (rec1Verified && rec2Verified) {
          if (rec1HasRelatedRecords && !rec2HasRelatedRecords) {
            return { keep: rec1, purge: rec2 };
          } else if (!rec1HasRelatedRecords && rec2HasRelatedRecords) {
            return { keep: rec2, purge: rec1 };
          } else {
            return { purge1: rec1, purge2: rec2 };
          }
        } else {
          if (rec1HasRelatedRecords && !rec2HasRelatedRecords) {
            return { keep: rec1, purge: rec2 };
          } else if (!rec1HasRelatedRecords && rec2HasRelatedRecords) {
            return { keep: rec2, purge: rec1 };
          } else {
            if (rec1.lastName !== rec2.lastName) {
              return { keep: rec1, keep2: rec2 };
            } else {
              return { purge1: rec1, purge2: rec2 };
            }
          }
        }
      };

      // Get the keep and purge records
      const { keep, keep2, purge, purge1, purge2 } = determineKeepPurge(
        record1,
        record2
      );

      log.debug(loggerTitle + ' Determin Keep Purge ', {
        keep,
        keep2,
        purge,
        purge1,
        purge2,
      });

      // Update records based on determination
      if (keep) updateAgentUpdateProjectRecord(keep.id, 'keep');
      if (keep2) updateAgentUpdateProjectRecord(keep2.id, 'keep');
      if (purge) updateAgentUpdateProjectRecord(purge.id, 'purge');
      if (purge1) updateAgentUpdateProjectRecord(purge1.id, 'purge');
      if (purge2) updateAgentUpdateProjectRecord(purge2.id, 'purge');
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

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
   * @param {string} agentId
   * @returns {object}
   */
  const retrieveAgentInternalIds = (agentId) => {
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
        type: 'customrecord_hms_agent_upd_prjct_reg_13',
        filters: [
          ['custrecord_hms_agent_id_number_13', 'is', agentId],
          'AND',
          ['custrecord_hms_email_dupe_13', 'is', 'T'],
          'AND',
          ['isinactive', 'is', 'F'],
          'AND',
          ['custrecord_hms_keep_13', 'is', 'F'],
          'AND',
          ['custrecord_hms_purge_13', 'is', 'F'],
        ],
        columns: [
          search.createColumn({
            name: 'custrecord_hms_agent_id_number_13',
            label: 'Agent ID Number',
          }),
          search.createColumn({
            name: 'custrecord_hms_verified_from_ret_feed_13',
            label: 'VERIFIED FROM RETS FEED',
          }),
          search.createColumn({
            name: 'custrecord_hms_crm_record_count_13',
            label: 'CRM Record Count',
          }),
          search.createColumn({
            name: 'custrecord_hms_survery_count_13',
            label: 'Survey Count',
          }),
          search.createColumn({
            name: 'custrecord_hms_sold_properties_13',
            label: 'Sold Properties',
          }),
          search.createColumn({
            name: 'custrecord_hms_first_name_13',
            label: 'First Name',
          }),
          search.createColumn({
            name: 'custrecord_hms_last_name_13',
            label: 'Last Name',
          }),
          search.createColumn({
            name: 'custrecord_hms_last_update_13',
            label: 'Last Update',
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
            'custrecord_hms_agent_id_number_13'
          );
          resultObj.verifiedFromRETSFeeds = result.getValue(
            'custrecord_hms_verified_from_ret_feed_13'
          );
          resultObj.cCount = result.getValue(
            'custrecord_hms_crm_record_count_13'
          );
          resultObj.sCount = result.getValue('custrecord_hms_survery_count_13');
          resultObj.spCount = result.getValue(
            'custrecord_hms_sold_properties_13'
          );
          resultObj.firstName = result.getValue('custrecord_hms_first_name_13');
          resultObj.lastName = result.getValue('custrecord_hms_last_name_13');
          resultObj.lastUpdate = result.getValue(
            'custrecord_hms_last_update_13'
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
  /* *********************** searchAgentDuplicateswithTwoRecords - Begin *********************** */
  /**
   *
   * @returns {object}
   */
  const searchAgentDuplicateswithTwoRecords = () => {
    const loggerTitle = ' Search Agent Duplicates With Two Records ';
    log.debug(loggerTitle, ' Search Started');
    return search.create({
      type: 'customrecord_hms_agent_upd_prjct_reg_13',
      filters: [
        ['custrecord_hms_email_dupe_13', 'is', 'T'],
        'AND',
        ['isinactive', 'is', 'F'],
        'AND',
        ['custrecord_hms_keep_13', 'is', 'F'],
        'AND',
        ['custrecord_hms_purge_13', 'is', 'F'],
        'AND',
        ['count(internalid)', 'equalto', '2'],
      ],
      columns: [
        search.createColumn({
          name: 'custrecord_hms_agent_id_dupe_13',
          summary: 'GROUP',
          label: 'Agent Duplicate',
        }),
        search.createColumn({
          name: 'custrecord_hms_mls_region_13',
          summary: 'GROUP',
          label: 'MLS Region',
        }),
        search.createColumn({
          name: 'custrecord_hms_crm_record_count_13',
          summary: 'SUM',
          label: 'CRM Record Count',
        }),
        search.createColumn({
          name: 'custrecord_hms_survery_count_13',
          summary: 'SUM',
          label: 'Survey Count',
        }),
        search.createColumn({
          name: 'custrecord_hms_sold_properties_13',
          summary: 'SUM',
          label: 'Sold Properties',
        }),
        search.createColumn({
          name: 'custrecord_hms_agent_id_number_13',
          summary: 'GROUP',
          label: 'Agent Number',
        }),
      ],
    });
  };
  /* *********************** searchAgentDuplicateswithTwoRecords - End *********************** */
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
          type: 'customrecord_hms_agent_upd_prjct_reg_13',
          id: customRecordId,
          values: {
            custrecord_hms_purge_13: true,
            custrecord_hms_keep_13: false,
          },
        });
        log.debug(loggerTitle, `Updated ID: ${customRecordId} for ${flag}`);
      } else if (customRecordId && flag == 'keep') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_prjct_reg_13',
          id: customRecordId,
          values: {
            custrecord_hms_keep_13: true,
            custrecord_hms_purge_13: false,
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
