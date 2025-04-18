/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name:hms_MR_keepAndPurgeForAgent13EmailDuplicates_morethan2records.js
 * Script: HMS K & P Region 13 Email Dup More
 * Author           Date       Version               Remarks
 * nagendrababu   04.16.2025     1.00      Deduplication for email-based agent records across 2 or more duplicates.
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
   * Retrieves input data from NetSuite Saved Search
   * @returns {Search} - search object for agent email duplicates
   */
  const getInputData = () => {
    const loggerTitle = 'Get Input Data';
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Entry-------------------<|'
    );
    const result = searchAgentEmailDuplicates();
    log.debug(loggerTitle, 'Search Started');
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Exit-------------------<|'
    );
    return result;
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
      const email =
        mapContextValues.values['GROUP(custrecord_hms_agent_email_13)'];
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
  //
  /* -------------------------- Reduce Phase - Begin -------------------------- */

  /**
   * Reduce phase to determine which agent records to keep or purge
   * @param {ReduceContext} reduceContext
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Entry-------------------<|'
    );

    try {
      const emailKey = reduceContext.key;
      log.debug(loggerTitle, `Reduce for email: ${emailKey}`);

      const agentRecords = retrieveAgentInternalIds(emailKey);
      log.debug(
        loggerTitle,
        `Retrieved ${agentRecords.length} agent records for deduplication`
      );

      if (!agentRecords || agentRecords.length < 2) {
        log.audit(loggerTitle, 'Less than 2 records, skipping.');
        return;
      }

      const actions = determineKeepAndPurgeMultiple(agentRecords);
      log.debug(loggerTitle + ' Actions Determined', actions);

      actions.forEach(({ id, action }) => {
        updateAgentUpdateProjectRecord(id, action);
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Exit-------------------<|'
    );
  };

  /* --------------------------- Reduce Phase - End --------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   * Summarize phase to log usage and stats
   * @param {SummaryContext} summaryContext
   */
  const summarize = (summaryContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
      log.audit(loggerTitle, `Usage: ${summaryContext.usage}`);
      log.audit(loggerTitle, `Concurrency: ${summaryContext.concurrency}`);
      log.audit(loggerTitle, `Yields: ${summaryContext.yields}`);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------- Helper Functions - Begin ----------------------- */
  /**
   * Creates a saved search for agent records with email duplicates
   * @returns {search} - Saved Search object
   */
  const searchAgentEmailDuplicates = () => {
    const loggerTitle = 'Search Agent Email Duplicates';

    const searchObj = search.create({
      type: 'customrecord_hms_agent_upd_project',
      filters: [
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
          name: 'custrecord_hms_email_dupe_13',
          summary: 'GROUP',
          label: 'Email ID Duplicate',
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
          label: 'Sold Properties Count',
        }),
        search.createColumn({
          name: 'custrecord_hms_agent_email_13',
          summary: 'GROUP',
          label: 'EMAIL',
        }),
      ],
    });

    return searchObj;
  };
  /**
   * Retrieves duplicate agent records by email
   * @param {string} email
   * @returns {Array<Object>} - array of record objects
   */
  const retrieveAgentInternalIds = (email) => {
    const loggerTitle = 'Retrieve Agent Internal Ids';
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Entry-------------------<|'
    );
    const resultValuesArr = [];

    try {
      const searchObj = search.create({
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
          'custrecord_hms_agent_email',
          'custrecord_hms_verified_from_rets_feed',
          'custrecord_hms_crm_record_count',
          'custrecord_hms_survery_count',
          'custrecord_hms_sold_properties',
          'custrecord_hms_first_name',
          'custrecord_hms_last_name',
          'custrecord_hms_last_update',
        ].map((name) => search.createColumn({ name })),
      });

      searchObj.run().each((result) => {
        resultValuesArr.push({
          id: result.id,
          email: result.getValue('custrecord_hms_agent_email'),
          verifiedFromRETSFeeds: result.getValue(
            'custrecord_hms_verified_from_rets_feed'
          ),
          cCount: result.getValue('custrecord_hms_crm_record_count'),
          sCount: result.getValue('custrecord_hms_survery_count'),
          spCount: result.getValue('custrecord_hms_sold_properties'),
          firstName: result.getValue('custrecord_hms_first_name'),
          lastName: result.getValue('custrecord_hms_last_name'),
          lastUpdate: result.getValue('custrecord_hms_last_update'),
        });
        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.audit(
      loggerTitle,
      `Found ${resultValuesArr.length} records for email: ${email}`
    );
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Exit-------------------<|'
    );
    return resultValuesArr;
  };
  /**
   * Determines keep/purge actions for multiple duplicate agent records
   * @param {Array<Object>} records
   * @returns {Array<{id: string, action: 'keep' | 'purge'}>}
   */
  const determineKeepAndPurgeMultiple = (records) => {
    const loggerTitle = 'Determine Keep and Purge Multiple';
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Entry-------------------<|'
    );

    const nameSet = new Set(
      records.map((r) =>
        `${(r.firstName || '').trim()} ${(
          r.lastName || ''
        ).trim()}`.toLowerCase()
      )
    );

    if (nameSet.size > 1) {
      log.debug(loggerTitle, 'Multiple names found. Keeping all.');
      return records.map((r) => ({ id: r.id, action: 'keep' }));
    }

    records.forEach((r) => {
      r.verified =
        r.verifiedFromRETSFeeds === true || r.verifiedFromRETSFeeds === 'T';
      r.lastUpdateDate = new Date(r.lastUpdate);
    });

    const verified = records.filter((r) => r.verified);

    if (verified.length === 1) {
      log.debug(loggerTitle, 'Only one record verified. Keeping it.');
      return records.map((r) => ({
        id: r.id,
        action: r.id === verified[0].id ? 'keep' : 'purge',
      }));
    }

    if (verified.length > 1) {
      const latestVerified = verified.reduce((latest, r) =>
        r.lastUpdateDate > latest.lastUpdateDate ? r : latest
      );
      log.debug(
        loggerTitle,
        `Multiple verified. Keeping latest updated ID: ${latestVerified.id}`
      );
      return records.map((r) => ({
        id: r.id,
        action: r.id === latestVerified.id ? 'keep' : 'purge',
      }));
    }

    const latest = records.reduce((latest, r) =>
      r.lastUpdateDate > latest.lastUpdateDate ? r : latest
    );
    log.debug(
      loggerTitle,
      `No verified. Keeping latest updated ID: ${latest.id}`
    );
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Exit-------------------<|'
    );
    return records.map((r) => ({
      id: r.id,
      action: r.id === latest.id ? 'keep' : 'purge',
    }));
  };

  /**
   * Updates agent record to mark as keep or purge
   * @param {string} customRecordId
   * @param {'keep'|'purge'} flag
   */
  const updateAgentUpdateProjectRecord = (customRecordId, flag) => {
    const loggerTitle = 'Update Agent Record';
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Entry-------------------<|'
    );

    try {
      if (customRecordId && flag === 'keep') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_project',
          id: customRecordId,
          values: { custrecord_hms_keep: true, custrecord_hms_purge: false },
        });
      } else if (customRecordId && flag === 'purge') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_project',
          id: customRecordId,
          values: { custrecord_hms_keep: false, custrecord_hms_purge: true },
        });
      }
      log.debug(loggerTitle, `Updated ID: ${customRecordId} as ${flag}`);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' -Exit-------------------<|'
    );
  };

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
