/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_keepAndPurgeAgentEmailDuplicateRecords.js
 * Script: HMS | MR K & P For Region 3 Email Dup
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
        const rec1Verified =
          rec1.verifiedFromRETSFeeds === true ||
          rec1.verifiedFromRETSFeeds == 'T';
        const rec2Verified =
          rec2.verifiedFromRETSFeeds === true ||
          rec2.verifiedFromRETSFeeds == 'T';

        log.debug(
          'Determine Keep/Purge',
          `REC1 VERIFIED: ${rec1Verified}, REC2 VERIFIED: ${rec2Verified}`
        );

        const rec1HasRelatedRecords =
          rec1.cCount > 0 || rec1.sCount > 0 || rec1.spCount > 0;
        const rec2HasRelatedRecords =
          rec2.cCount > 0 || rec2.sCount > 0 || rec2.spCount > 0;

        log.debug(
          'Determine Keep/Purge',
          `REC1 RELATED RECORDS: ${rec1HasRelatedRecords}, REC2 RELATED RECORDS: ${rec2HasRelatedRecords}`
        );

        const rec1LastUpdate = new Date(rec1.lastUpdate);
        const rec2LastUpdate = new Date(rec2.lastUpdate);
        log.debug('Determine Keep Purge ', { rec1LastUpdate, rec2LastUpdate });

        // 1. If both records have related records
        if (rec1HasRelatedRecords && rec2HasRelatedRecords) {
          if (rec1Verified && !rec2Verified) {
            return { keep: rec1, purge: rec2 };
          } else if (!rec1Verified && rec2Verified) {
            return { keep: rec2, purge: rec1 };
          } else if (!rec1Verified && !rec2Verified) {
            return rec1LastUpdate > rec2LastUpdate
              ? { keep: rec1, purge: rec2 }
              : { keep: rec2, purge: rec1 };
          } else if (rec1Verified && rec2Verified) {
            return rec1LastUpdate > rec2LastUpdate
              ? { keep: rec1, purge: rec2 }
              : { keep: rec2, purge: rec1 };
          }
        }
        // 2. If one record is verified and the other is not, keep the verified one
        else if (rec1Verified && !rec2Verified) {
          return { keep: rec1, purge: rec2 };
        } else if (!rec1Verified && rec2Verified) {
          return { keep: rec2, purge: rec1 };
        }
        // 3. If one record has related records and the other does not
        else if (rec1HasRelatedRecords && !rec2HasRelatedRecords) {
          return { keep: rec1, purge: rec2 };
        } else if (!rec1HasRelatedRecords && rec2HasRelatedRecords) {
          return { keep: rec2, purge: rec1 };
        }
        // 4. If neither record has related records and neither is verified, keep the latest one
        else {
          return rec1LastUpdate > rec2LastUpdate
            ? { keep: rec1, purge: rec2 }
            : { keep: rec2, purge: rec1 };
        }

        // Fallback return (should never reach here, but prevents undefined errors)
        return { keep: null, purge: null };
      };

      // Call the function correctly
      const { keep, purge } = determineKeepPurge(record1, record2);

      // Ensure values exist before using them
      if (keep && purge) {
        log.debug('Final Keep/Purge Records', { keep, purge });
        updateAgentUpdateProjectRecord(keep.id, 'keep');
        updateAgentUpdateProjectRecord(purge.id, 'purge');
      } else {
        log.error(
          loggerTitle + 'Error: Unable to determine keep/purge records',
          {
            keep,
            purge,
          }
        );
      }

      log.debug(loggerTitle + ' Determin Keep Purge ', {
        keep,
        purge,
      });
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
        filters: [
          ['custrecord_hms_agent_email', 'is', email],
          'AND',
          ['custrecord_hms_email_dupe', 'is', 'T'],
          'AND',
          ['isinactive', 'is', 'F'],
          'AND',
          ['custrecord_hms_keep', 'is', 'F'],
          'AND',
          ['custrecord_hms_purge', 'is', 'F'],
        ],
        columns: [
          search.createColumn({
            name: 'custrecord_hms_agent_id_number',
            label: 'Agent ID Number',
          }),
          search.createColumn({
            name: 'custrecord_hms_verified_from_rets_feed',
            label: 'VERIFIED FROM RETS FEED',
          }),
          search.createColumn({
            name: 'custrecord_hms_crm_record_count',
            label: 'CRM Record Count',
          }),
          search.createColumn({
            name: 'custrecord_hms_survery_count',
            label: 'Survey Count',
          }),
          search.createColumn({
            name: 'custrecord_hms_sold_properties',
            label: 'Sold Properties',
          }),
          search.createColumn({
            name: 'custrecord_hms_first_name',
            label: 'First Name',
          }),
          search.createColumn({
            name: 'custrecord_hms_last_name',
            label: 'Last Name',
          }),
          search.createColumn({
            name: 'custrecord_hms_last_update',
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
            'custrecord_hms_agent_id_number'
          );
          resultObj.verifiedFromRETSFeeds = result.getValue(
            'custrecord_hms_verified_from_rets_feed'
          );
          resultObj.cCount = result.getValue('custrecord_hms_crm_record_count');
          resultObj.sCount = result.getValue('custrecord_hms_survery_count');
          resultObj.spCount = result.getValue('custrecord_hms_sold_properties');
          resultObj.firstName = result.getValue('custrecord_hms_first_name');
          resultObj.lastName = result.getValue('custrecord_hms_last_name');
          resultObj.lastUpdate = result.getValue('custrecord_hms_last_update');
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
            custrecord_hms_keep: false,
          },
        });
        log.debug(loggerTitle, `Updated ID: ${customRecordId} for ${flag}`);
      } else if (customRecordId && flag == 'keep') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_project',
          id: customRecordId,
          values: {
            custrecord_hms_keep: true,
            custrecord_hms_purge: false,
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
