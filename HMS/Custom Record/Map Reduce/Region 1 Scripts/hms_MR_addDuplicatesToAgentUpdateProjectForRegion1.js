/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_addDuplicatesToAgentUpdateProjectForRegion1.js
 * Script: HMS | MR Add Agent Dup for Region 1
 * Author           Date       Version               Remarks
 * nagendrababu     02.24.2025 1.00     Initial Creation of the Script
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
        ['custrecord_agent_mls_region.internalidnumber', 'equalto', '1'],
        'AND',
        ['isinactive', 'is', 'F'],
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
      const agentId = results.values.custrecord_agent_id;
      log.debug(loggerTitle, { agentId });
      const agentEmail = results.values.custrecord_hms_agent_email;
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
      reduceValues.agentEmail = agentEmail;
      reduceValues.verifiedFromRETSFeed =
        results.values.custrecord_verified_from_rets_agent;
      //

      // Form Key Values
      // Agent ID
      if (agentId) {
        mapContext.write({ key: agentId, value: reduceValues });
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
      if (values.length > 1) {
        log.emergency(loggerTitle, 'Values Length:' + values.length);
        //
        for (let index = 0; index < Math.min(values.length, 2); index++) {
          const data = JSON.parse(values[index]);
          log.emergency(loggerTitle + index, data);
          // Retrieve Values
          const name = data.name;
          const mlsRegion = data.mlsRegion;
          const agentFirstName = data.agentFirstName;
          const agentLastName = data.agentLastName;
          const agentEmail = data.agentEmail;
          const brokerage = data.brokerage;
          const agentMobileNumber = data.agentMobileNumber;
          const agentType = data.agentType;
          const lastmodified = data.lastmodifiedDate;
          const callbackNumber = data.preferredCallbackNumber;
          const nrdsId = data.nrdsId;
          const changeAgent = data.changeAgent;
          const verifiedFromRETSFeed = data.verifiedFromRETSFeed;
          const agentInternalId = data.agentInternalId;
          //
          //
          /* ------------------------- Create Custom Record - Begin ------------------------ */
          const agentProjectUpdateRecord = record.create({
            type: 'customrecord_hms_agent_upd_prjct_reg_1',
            isDynamic: true,
          });
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_agent_id_number_1',
            value: key,
          });
          // Extracting name
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_agent_name_1',
            value: name,
          });
          // Extracting MLS region
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_mls_region_1',
            value: mlsRegion,
          });
          // Extracting agent's first name
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_first_name_1',
            value: agentFirstName,
          });
          // Extracting agent's last name
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_last_name_1',
            value: agentLastName,
          });
          // Extracting Email
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_agent_email_1',
            value: agentEmail,
          });
          // Extracting brokerage
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_brokerage_name_1',
            value: brokerage,
          });
          // Extracting agent's mobile number
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_cell_phone_1',
            value: agentMobileNumber,
          });
          // Extracting Agent Type
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_agent_type_1',
            value: agentType,
          });
          // Extracting Last Modified
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_last_update_1',
            value: lastmodified,
          });
          // Extracting Prefred Call Back Number
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_pref_callback_1',
            value: callbackNumber,
          });
          // Extracting NRDS ID
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_nrds_1',
            value: nrdsId,
          });
          // Extracting change agent

          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_latest_rets_chg_1',
            value: changeAgent,
          });

          // Save the Duplicate Agent ID field

          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_agent_id_dupe_1',
            value: true,
          });
          // Extracting change agent
          if (verifiedFromRETSFeed == 'T' || verifiedFromRETSFeed == true) {
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_verified_from_ret_feed_1',
              value: true,
            });
          } else if (
            verifiedFromRETSFeed == 'F' ||
            verifiedFromRETSFeed == false
          ) {
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_verified_from_ret_feed_1',
              value: false,
            });
          }

          if (agentInternalId) {
            // CRM Record Count
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_crm_record_count_1',
              value: getCRMRecordCount(agentInternalId),
            });
            // Survey Count
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_survery_count_1',
              value: getSurveyCount(agentInternalId),
            });
            // Sold Properties Count
            agentProjectUpdateRecord.setValue({
              fieldId: 'custrecord_hms_sold_properties_1',
              value: getSoldPropertiesCount(agentInternalId),
            });
          }
          agentProjectUpdateRecord.setValue({
            fieldId: 'custrecord_hms_orig_agt_rec_1',
            value: agentInternalId,
          });
          const agentProjectUpdateRecordId = agentProjectUpdateRecord.save();
          log.emergency(
            loggerTitle,
            ' Agent Project Update Record: ' + agentProjectUpdateRecordId
          );
          /* ------------------------- Create Custom Record - End ------------------------ */
          //
        }
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
          ['custrecord_agent_mls_region', 'anyof', '1'],
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
          ['custrecord_agent_mls_region', 'anyof', '1'],
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
          ['custrecord_agent_mls_region', 'anyof', '1'],
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
