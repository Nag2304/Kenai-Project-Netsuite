/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_addDuplicatesToAgentUpdateProjectEmailForRegion13.js
 * Script: HMS | MR Duplicate Emails For Region 13
 * Author           Date       Version               Remarks
 * mikewilliams  05.10.2024     1.00     Initial Creation of the Script
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
    const loggerTitle = ' Get Input Data';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    log.debug(loggerTitle, ' Search Started');
    return search.create({
      type: 'customrecord_agent',
      filters: [
        ['custrecord_agent_mls_region.internalidnumber', 'equalto', '13'],
      ],
      columns: [
        search.createColumn({
          name: 'internalid',
          label: 'Internal ID',
        }),
        search.createColumn({
          name: 'custrecord_agent_id',
          label: 'Agent ID Number',
        }),
        search.createColumn({ name: 'name', label: 'Name' }),
        search.createColumn({
          name: 'custrecord_agent_mls_region',
          label: 'MLS Region',
        }),
        search.createColumn({ name: 'custrecord_agent_email', label: 'Email' }),
        search.createColumn({
          name: 'custrecord_agent_first_name',
          label: 'First Name',
        }),
        search.createColumn({
          name: 'custrecord_agent_last_name',
          label: 'Last Name',
        }),
        search.createColumn({
          name: 'custrecord_brokerage',
          label: 'Brokerage or Company Name',
        }),
        search.createColumn({
          name: 'custrecord_agent_mobile_number',
          label: 'Cell Number',
        }),
        search.createColumn({
          name: 'custrecord_agent_type',
          label: 'Agent Type',
        }),
        search.createColumn({
          name: 'custrecord_agent_preferred_number',
          label: 'Preferred Callback Number',
        }),
        search.createColumn({ name: 'custrecord_nrdsis', label: 'NRDS ID' }),
        search.createColumn({
          name: 'custrecord_latest_rets_change_agent',
          label: 'Latest RETS Change',
        }),
        search.createColumn({ name: 'lastmodified', label: 'Last Modified' }),
        search.createColumn({
          name: 'custrecord_verified_from_rets_agent',
          label: 'Verified from RETS Feed',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------- Map Phase - Begin ------------------------ */
  /**
   *
   * @param {object} mapContext
   * @returns {boolean}
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

      // Form Key
      const agentEmail = results.values.custrecord_agent_email;
      log.debug(loggerTitle, { agentEmail });
      const agentId = results.values.custrecord_agent_id;
      //

      // Values
      const reduceValues = {};
      reduceValues.agentInternalId = results.values.internalid.value;
      reduceValues.name = results.values.name;
      reduceValues.mlsRegion = results.values.custrecord_agent_mls_region.value;
      reduceValues.agentFirstName = results.values.custrecord_agent_first_name;
      reduceValues.agentLastName = results.values.custrecord_agent_last_name;
      reduceValues.brokerage = results.values.custrecord_brokerage.value;
      reduceValues.agentMobileNumber =
        results.values.custrecord_agent_mobile_number;
      reduceValues.agentType = results.values.custrecord_agent_type.value;
      reduceValues.preferredCallbackNumber =
        results.values.custrecord_agent_preferred_number.value;
      reduceValues.nrdsId = results.values.custrecord_nrdsis;
      reduceValues.changeAgent =
        results.values.custrecord_latest_rets_change_agent;
      reduceValues.lastmodifiedDate = results.values.lastmodified;
      reduceValues.agentId = agentId;
      reduceValues.verifiedFromRETSFeed =
        results.values.custrecord_verified_from_rets_agent;
      //

      // Form Key Values
      if (agentEmail) {
        mapContext.write({
          key: agentEmail,
          value: reduceValues,
        });
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* ------------------------- Map Phase - End ------------------------ */
  //
  /* ------------------------- Reduce Phase - Begin ------------------------ */
  /**
   *
   * @param {object} reduceContext
   * @returns {boolean}
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Key & Value Pairs
      const key = reduceContext.key;
      log.debug(loggerTitle + ' Key', key);
      const values = reduceContext.values;
      log.debug(loggerTitle + ' Values', values);
      //

      // Maintain count of occurrences for each email + first name pair
      const emailFirstNameCounts = new Map();

      if (values.length > 1) {
        log.emergency(loggerTitle, 'Values Length:' + values.length);
        //

        // Loop through values to identify duplicates based on email and first name
        for (let index = 0; index < values.length; index++) {
          const data = JSON.parse(values[index]);
          log.debug(loggerTitle + ' Data', data);

          // Retrieve Values
          const agentFirstName = data.agentFirstName;
          const keyValuePair = key + agentFirstName;

          // Update count for the pair
          const count = emailFirstNameCounts.get(keyValuePair) || 0;
          emailFirstNameCounts.set(keyValuePair, count + 1);
        }

        // Second loop to perform actions without inserting duplicate records
        for (let index = 0; index < values.length; index++) {
          const data = JSON.parse(values[index]);
          log.emergency(loggerTitle + index, data);

          // Form Key Value Pair
          const agentFirstName = data.agentFirstName;
          const keyValuePair = key + agentFirstName;

          // Check if count for the pair is greater than 1
          if (emailFirstNameCounts.get(keyValuePair) > 1) {
            // Retrieve Values
            const agentName = data.agentId;
            const name = data.name;
            const mlsRegion = data.mlsRegion;
            const agentLastName = data.agentLastName;
            const brokerage = data.brokerage;
            const agentMobileNumber = data.agentMobileNumber;
            const agentType = data.agentType;
            const lastmodified = data.lastmodifiedDate;
            const callbackNumber = data.preferredCallbackNumber;
            const nrdsId = data.nrdsId;
            const changeAgent = data.changeAgent;
            const verifiedFromRETSFeed =
              data.verifiedFromRETSFeed === 'T' ? true : false;
            const agentInternalId = data.agentInternalId;
            //
            /* ------------------------- Create Custom Record - Begin ------------------------ */
            const agentProjectUpdateRecord = record.create({
              type: 'customrecord_hms_agent_upd_prjct_reg_13',
              isDynamic: true,
            });
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_agent_id_number_13',
              value: agentName,
            });
            // Extracting name
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_agent_name_13',
              value: name,
            });
            // Extracting MLS region
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_mls_region_13',
              value: mlsRegion,
            });
            // Extracting Email
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_agent_email_13',
              value: key,
            });
            // Extracting agent's first name
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_first_name_13',
              value: agentFirstName,
            });
            // Extracting agent's last name
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_last_name_13',
              value: agentLastName,
            });
            // Extracting brokerage
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_brokerage_name_13',
              value: brokerage,
            });
            // Extracting agent's mobile number
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_cell_phone_13',
              value: agentMobileNumber,
            });
            // Extracting Agent Type
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_agent_type_13',
              value: agentType,
            });
            // Extracting Last Modified
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_last_update_13',
              value: lastmodified,
            });
            // Extracting Prefred Call Back Number
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_pref_callback_13',
              value: callbackNumber,
            });
            // Extracting NRDS ID
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_nrds_13',
              value: nrdsId,
            });
            // Extracting change agent
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_latest_rets_chg_13',
              value: changeAgent,
            });
            // Save the Duplicate Email ID field
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_email_dupe_13',
              value: true,
            });
            // Update the Verified RETS Feed
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_verified_from_rets_feed_13',
              value: verifiedFromRETSFeed,
            });
            if (agentInternalId) {
              // CRM Record Count
              agentProjectUpdateRecord.setValue({
                fieldId: 'custrecord_hms_crm_record_count_13',
                value: getCRMRecordCount(agentInternalId),
              });
              // Survey Count
              agentProjectUpdateRecord.setValue({
                fieldId: 'custrecord_hms_survery_count_13',
                value: getSurveyCount(agentInternalId),
              });
              // Sold Properties Count
              agentProjectUpdateRecord.setValue({
                fieldId: 'custrecord_hms_sold_properties_13',
                value: getSoldPropertiesCount(agentInternalId),
              });
            }
            // Save the custom Record
            const agentProjectUpdateRecordId = agentProjectUpdateRecord.save();
            log.emergency(
              loggerTitle,
              ' Agent Project Update Record: ' + agentProjectUpdateRecordId
            );
            /* ------------------------- Create Custom Record - End ------------------------ */
            //
          }
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* ------------------------- Reduce Phase - End ------------------------ */
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
  /* ------------------------- Helper Functions - Begin------------------------ */
  //
  /* *********************** Get CRM Record Count - Begin *********************** */
  /**
   * Get CRM Record Count Results
   * @param {string} agentId
   * @returns {number}
   */
  const getCRMRecordCount = (agentId) => {
    const loggerTitle = ' Get CRM Record Count ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let crmRecordCount = 0;
    try {
      const customrecord_agentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [
          ['isinactive', 'is', 'F'],
          'AND',
          ['custrecord_agent_mls_region', 'anyof', '3'],
          'AND',
          ['internalidnumber', 'equalto', agentId],
        ],
        columns: [
          search.createColumn({
            name: 'name',
            summary: 'GROUP',
            label: 'Name',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTEVENT_CALLER_NAME',
            summary: 'COUNT',
            label: 'Internal ID',
          }),
        ],
      });
      const searchResultCount = customrecord_agentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
      //
      if (searchResultCount) {
        // .run().each has a limit of 4,000 results
        customrecord_agentSearchObj.run().each((result) => {
          crmRecordCount = parseInt(
            result.getValue({
              name: 'internalid',
              join: 'CUSTEVENT_CALLER_NAME',
              summary: 'COUNT',
              label: 'Internal ID',
            })
          );
          return true;
        });
      }
      //
      log.debug(loggerTitle, ' CRM Record Count: ' + crmRecordCount);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return crmRecordCount;
  };
  /* *********************** Get CRM Record Count - End *********************** */
  //
  /* *********************** Get Survey Count - Begin *********************** */
  /**
   * Get Survey Count Results
   * @param {string} agentId
   * @returns {number}
   */
  const getSurveyCount = (agentId) => {
    const loggerTitle = ' Get Survey Count ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let surveyCount = 0;
    try {
      const customrecord_agentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [
          ['isinactive', 'is', 'F'],
          'AND',
          ['custrecord_agent_mls_region', 'anyof', '3'],
          'AND',
          ['internalidnumber', 'equalto', agentId],
        ],
        columns: [
          search.createColumn({
            name: 'name',
            summary: 'GROUP',
            label: 'Name',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTRECORD_SURVEY_AGENT',
            summary: 'COUNT',
            label: 'Internal ID',
          }),
        ],
      });
      const searchResultCount = customrecord_agentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
      //
      if (searchResultCount) {
        // .run().each has a limit of 4,000 results
        customrecord_agentSearchObj.run().each((result) => {
          surveyCount = parseInt(
            result.getValue({
              name: 'internalid',
              join: 'CUSTRECORD_SURVEY_AGENT',
              summary: 'COUNT',
              label: 'Internal ID',
            })
          );
          return true;
        });
      }
      //
      log.debug(loggerTitle, ' CRM Record Count: ' + surveyCount);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return surveyCount;
  };
  /* *********************** Get Survey Count - End *********************** */
  //
  /* *********************** Get Sold Properties Count - Begin *********************** */
  /**
   * Get Sold Properties Count
   * @param {string} agentId
   * @returns {number}
   */
  const getSoldPropertiesCount = (agentId) => {
    const loggerTitle = ' Get Sold Properties Count ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let soldPropertiesCount = 0;
    try {
      const customrecord_agentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [
          ['isinactive', 'is', 'F'],
          'AND',
          ['custrecord_agent_mls_region', 'anyof', '3'],
          'AND',
          ['internalidnumber', 'equalto', agentId],
        ],
        columns: [
          search.createColumn({
            name: 'name',
            summary: 'GROUP',
            label: 'Name',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTRECORD_REAL_ESTATE_AGENT_NAME',
            summary: 'COUNT',
            label: 'Internal ID',
          }),
        ],
      });
      const searchResultCount = customrecord_agentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
      //
      if (searchResultCount) {
        // .run().each has a limit of 4,000 results
        customrecord_agentSearchObj.run().each((result) => {
          soldPropertiesCount = parseInt(
            result.getValue({
              name: 'internalid',
              join: 'CUSTRECORD_REAL_ESTATE_AGENT_NAME',
              summary: 'COUNT',
              label: 'Internal ID',
            })
          );
          return true;
        });
      }
      //
      log.debug(loggerTitle, ' CRM Record Count: ' + soldPropertiesCount);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return soldPropertiesCount;
  };
  /* *********************** Get Sold Properties Count - End *********************** */
  //
  /* ------------------------- Helper Functions - End------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
