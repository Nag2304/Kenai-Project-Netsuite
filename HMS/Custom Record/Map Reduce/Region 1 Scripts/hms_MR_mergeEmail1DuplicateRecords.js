/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_mergeEmail1DuplicateRecords.js
 * Script: HMS | MR Merge Email 1 Duplicate Records
 * Author           Date       Version               Remarks
 * nagendrababu  12.11.2024      1.00     Initial Creation of the Script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record', 'N/runtime'], (search, record, runtime) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return searchEmailDuplicateswithTwoRecords();
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
      const email =
        reduceContextValues.values['GROUP(custrecord_hms_agent_email_1)'];
      log.debug(loggerTitle, `Email ID:${email}`);
      //
      if (email) {
        getAgentRelatedRecords(email);
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
  /* *********************** searchEmailDuplicateswithTwoRecords - Begin *********************** */
  /**
   *
   * @returns {object}
   */
  const searchEmailDuplicateswithTwoRecords = () => {
    const loggerTitle = ' Search Email Duplicates With Two Records ';
    log.debug(loggerTitle, ' Search Started');

    const scriptObj = runtime.getCurrentScript();
    const emailIdParameter = scriptObj.getParameter({
      name: 'custscript_hms_emailid1',
    });

    let filtersArr;

    if (emailIdParameter) {
      filtersArr = [
        ['custrecord_hms_email_dupe_1', 'is', 'T'],
        'AND',
        ['isinactive', 'is', 'F'],
        'AND',
        ['custrecord_hms_agent_email_1', 'is', emailIdParameter],
      ];
    } else {
      filtersArr = [
        ['custrecord_hms_email_dupe_1', 'is', 'T'],
        'AND',
        ['isinactive', 'is', 'F'],
      ];
    }

    return search.create({
      type: 'customrecord_hms_agent_upd_prjct_reg_1',
      filters: filtersArr,
      columns: [
        search.createColumn({
          name: 'custrecord_hms_agent_email_1',
          summary: 'GROUP',
          label: 'Email',
        }),
      ],
    });
  };
  /* *********************** searchEmailDuplicateswithTwoRecords - End *********************** */
  //
  /* *********************** getAgentRelatedRecords - Begin *********************** */
  /**
   *
   * @param {string} email
   * @returns {boolean}
   */
  const getAgentRelatedRecords = (email) => {
    const loggerTitle = ' Get Agent Related Records ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let searchResultCount = 0;
    let customAgentUpdateProjectSearchObj;
    let previousInternalId;
    let previousKeep;
    let previousNrdsId;
    let previousAgentId;
    let previousCrmCount;
    let previousSoldPropertiesCount;
    const updateObject = {
      agentUpdate: false,
      CRM: false,
      soldProperties: false,
    };
    try {
      customAgentUpdateProjectSearchObj = search.create({
        type: 'customrecord_hms_agent_upd_prjct_reg_1',
        filters: [
          ['custrecord_hms_agent_email_1', 'is', email],
          'AND',
          ['custrecord_hms_email_dupe_1', 'is', 'T'],
          'AND',
          ['isinactive', 'is', 'F'],
        ],
        columns: [
          search.createColumn({
            name: 'custrecord_hms_agent_id_number_1',
            label: 'Agent ID Number',
          }),
          search.createColumn({
            name: 'custrecord_hms_nrds_1',
            label: 'NRDS',
          }),
          search.createColumn({
            name: 'custrecord_hms_agent_name_1',
            label: 'Name',
          }),
          search.createColumn({
            name: 'custrecord_hms_keep_1',
            label: 'Keep',
            sort: search.Sort.DESC,
          }),
          search.createColumn({
            name: 'custrecordhms_purge_1',
            label: 'Purge',
          }),
          search.createColumn({
            name: 'custrecord_hms_crm_record_count_1',
            label: 'CRM Record Count',
          }),
          search.createColumn({
            name: 'custrecord_hms_survery_count_1',
            label: 'Survey Count',
          }),
          search.createColumn({
            name: 'custrecord_hms_sold_properties_1',
            label: 'Sold Properties',
          }),
          search.createColumn({
            name: 'custrecord_hms_brokerage_name_1',
            label: 'brokerage name',
          }),
        ],
      });
      searchResultCount = customAgentUpdateProjectSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
      //

      customAgentUpdateProjectSearchObj.run().each((result) => {
        const internalId = result.id;
        // Get Agent ID
        const agentIdNumber = result.getValue(
          'custrecord_hms_agent_id_number_1'
        );
        const name = result.getValue('custrecord_hms_brokerage_name_1');
        const agentName = removeSpecialCharacters(
          result.getValue('custrecord_hms_agent_name_1')
        );
        log.debug(loggerTitle + ' Before callng the getAgent Record ID', {
          agentIdNumber,
          name,
        });
        const agentId = getAgentRecordId(agentIdNumber, name, agentName);
        //
        const keep = result.getValue('custrecord_hms_keep_1');
        const purge = result.getValue('custrecordhms_purge_1');
        const nrdsId = result.getValue('custrecord_hms_nrds_1');
        const crmCount = result.getValue('custrecord_hms_crm_record_count_1');
        const soldPropertiesCount = result.getValue(
          'custrecord_hms_sold_properties_1'
        );
        const surveyCount = result.getValue('custrecord_hms_survery_count');
        // If Previous NRDS ID is Null and Current NRDS ID has value && Purge is true
        if (!previousNrdsId && nrdsId && purge) {
          if (previousKeep && previousInternalId) {
            updateObject.agentUpdate = updateAgentUpdateProject(
              previousInternalId,
              nrdsId,
              'A'
            );
          }
        } else if (previousKeep && previousInternalId) {
          updateObject.agentUpdate = updateAgentUpdateProject(
            previousInternalId,
            nrdsId,
            'A'
          );
        }
        //

        // CRM Count
        if (crmCount > 0 && purge && agentId) {
          log.debug(
            loggerTitle,
            ' Calling the Update Agent CRM Records and Agent ID is ' +
              agentId +
              ' Previous Agent ID ' +
              previousAgentId
          );
          updateObject.CRM = updateAgentCRMRecords(previousAgentId, agentId);
        }
        //

        // Sold Properties Count
        if (soldPropertiesCount > 0 && purge && agentId) {
          log.debug(
            loggerTitle,
            ' Calling the Update Agent Sold Properties and Agent ID is ' +
              agentId +
              ' Previous Agent ID ' +
              previousAgentId
          );
          updateObject.soldProperties = updateAgentSoldProperties(
            previousAgentId,
            agentId
          );
        }
        //
        log.debug(loggerTitle, { updateObject, purge, agentId });
        if (
          Object.values(updateObject).some((val) => val) &&
          purge &&
          agentId
        ) {
          log.debug(loggerTitle, ' Calling the Update Original Agent Record ');
          updateOriginalAgentRecord(agentId);
          log.debug(
            loggerTitle,
            ` Marked the Original Agent Id to Inactive ${agentId}`
          );
        }

        if (soldPropertiesCount == 0 && crmCount == 0 && purge && agentId) {
          log.debug(loggerTitle, ' Calling the Update Original Agent Record ');
          updateOriginalAgentRecord(agentId);
          log.debug(
            loggerTitle,
            ` Marked the Original Agent Id to Inactive Where There are no Related Records ${agentId}`
          );
        }

        log.debug(loggerTitle, {
          internalId,
          agentIdNumber,
          name,
          keep,
          purge,
          nrdsId,
          agentId,
          crmCount,
          soldPropertiesCount,
        });
        previousInternalId = internalId;
        previousKeep = keep;
        previousNrdsId = nrdsId;
        previousAgentId = agentId;
        previousCrmCount = crmCount;
        previousSoldPropertiesCount = soldPropertiesCount;
        return true;
      });
      // Update the Purge Record
      updateAgentUpdateProject(previousInternalId, 0, 'I');
      //
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
  /* *********************** getAgentRelatedRecords - End *********************** */
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
  /* *********************** updateAgentUpdateProject - Begin *********************** */
  /**
   *
   * @param {number} id
   * @param {number} nrdsId
   * @param {string} flag
   * @returns {boolean}
   */
  const updateAgentUpdateProject = (id, nrdsId, flag = 'A') => {
    const loggerTitle = ' Update Agent Update Project ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let updateFlag = false;
    try {
      if (flag == 'A') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_prjct_reg_1',
          id: id,
          values: {
            custrecord_hms_nrds_1: nrdsId,
          },
        });
        log.debug(loggerTitle, `Updated ID: ${id} with NRDS ID:${nrdsId}`);
        updateFlag = true;
      } else if (flag == 'I') {
        record.submitFields({
          type: 'customrecord_hms_agent_upd_prjct_reg_1',
          id: id,
          values: {
            isinactive: true,
          },
        });
        log.debug(loggerTitle, `Updated ID: ${id} and set to inactive`);
        updateFlag = true;
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return updateFlag;
  };
  /* *********************** updateAgentUpdateProject - End *********************** */
  //
  /* *********************** getAgentRecordId - Begin *********************** */
  const getAgentRecordId = (agentName, name, cleanedName) => {
    const loggerTitle = ' Get Agent Record Id ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );

    let agentId;
    try {
      const customAgentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [
          ['custrecord_agent_id', 'is', agentName],
          'AND',
          ['custrecord_brokerage.internalidnumber', 'equalto', name],
        ],
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({
            name: 'formulatext',
            formula: "TRIM(REGEXP_REPLACE({name}, '[^a-zA-Z0-9]', ''))",
            label: 'Formula (Text)',
          }),
        ],
      });

      const searchResultCount = customAgentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Count: ' + searchResultCount);

      if (searchResultCount) {
        customAgentSearchObj.run().each((result) => {
          const name = result.getValue('formulatext');
          log.debug(loggerTitle, `Checking Name: ${name === cleanedName}`);
          if (name === cleanedName) {
            agentId = result.id;
            log.debug(loggerTitle, `Agent ID retrieved: ${agentId}`);
            return;
          }
          return true;
        });
        log.debug(loggerTitle, ' Agent ID: ' + agentId);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );

    return agentId;
  };
  /* *********************** getAgentRecordId - End *********************** */
  //
  /* *********************** updateAgentCRMRecords - Begin *********************** */
  /**
   *
   * @param {number} pId
   * @param {number} cId
   * @returns {boolean}
   */
  const updateAgentCRMRecords = (pId, cId) => {
    const loggerTitle = ' Update Agent CRM Records ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let updateFlag = false;
    try {
      const customAgentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [['internalidnumber', 'equalto', cId]],
        columns: [
          search.createColumn({
            name: 'type',
            join: 'CUSTEVENT_CALLER_NAME',
            label: 'Type',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTEVENT_CALLER_NAME',
            label: 'Internal ID',
          }),
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        ],
      });
      const searchResultCount = customAgentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Count: ' + searchResultCount);
      //
      log.debug(loggerTitle, `Current ID: ${cId} Previous ID: ${pId}`);
      if (searchResultCount) {
        customAgentSearchObj.run().each((result) => {
          const crmType = result.getValue({
            name: 'type',
            join: 'CUSTEVENT_CALLER_NAME',
            label: 'Type',
          });
          const crmId = result.getValue({
            name: 'internalid',
            join: 'CUSTEVENT_CALLER_NAME',
            label: 'Internal ID',
          });
          log.debug(loggerTitle, { crmType, crmId });
          //
          if (crmType == 'CASE' && crmId > 0) {
            updateSupportCaseRecord(crmId, pId);
            updateFlag = true;
          } else if (crmType == 'CALL' && crmId > 0) {
            updatePhoneCallRecord(crmId, pId);
            updateFlag = true;
          }
          //
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
    return updateFlag;
  };
  /* *********************** updateAgentCRMRecords - End *********************** */
  //
  /* *********************** updateAgentSoldProperties - Begin *********************** */
  /**
   *
   * @param {number} pId
   * @param {number} cId
   * @returns {boolean}
   */
  const updateAgentSoldProperties = (pId, cId) => {
    const loggerTitle = ' Update Agent Sold Properties ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let updateFlag = false;
    try {
      const customAgentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [['internalidnumber', 'equalto', cId]],
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTRECORD_REAL_ESTATE_AGENT_NAME',
            label: 'Internal ID',
          }),
        ],
      });
      const searchResultCount = customAgentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Count: ' + searchResultCount);
      //
      if (searchResultCount) {
        customAgentSearchObj.run().each((result) => {
          const propertyRecordId = result.getValue({
            name: 'internalid',
            join: 'CUSTRECORD_REAL_ESTATE_AGENT_NAME',
            label: 'Internal ID',
          });
          if (propertyRecordId > 0) {
            updatePropertyRecord(propertyRecordId, pId);
            updateFlag = true;
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
    return updateFlag;
  };
  /* *********************** updateAgentSoldProperties - End *********************** */
  //
  /* *********************** updateAgentSurvey - Begin *********************** */
  /**
   *
   * @param {number} pId
   * @param {number} cId
   * @returns {boolean}
   */
  const updateAgentSurvey = (pId, cId) => {
    const loggerTitle = ' Update Agent Survey ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let updateFlag = false;
    try {
      const customAgentSearchObj = search.create({
        type: 'customrecord_agent',
        filters: [['internalidnumber', 'equalto', cId]],
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({
            name: 'internalid',
            join: 'CUSTRECORD_SURVEY_AGENT',
            label: 'Survey Record ID',
          }),
        ],
      });
      const searchResultCount = customAgentSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Count: ' + searchResultCount);
      //
      if (searchResultCount) {
        customAgentSearchObj.run().each((result) => {
          const surveyRecordId = result.getValue({
            name: 'internalid',
            join: 'CUSTRECORD_SURVEY_AGENT',
            label: 'Survey Record ID',
          });
          if (surveyRecordId > 0) {
            record.submitFields({
              type: 'customrecord_survey_agent',
              id: surveyRecordId,
              values: {
                custrecord_survey_agent: pId,
              },
            });
            updateFlag = true;
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
    return updateFlag;
  };
  /* *********************** updateAgentSurvey - End *********************** */
  //
  /* *********************** updatePropertyRecord - Begin *********************** */
  /**
   *
   * @param {number} propertyRecordId
   * @param {number} agentId
   * @returns {boolean}
   */
  const updatePropertyRecord = (propertyRecordId, agentId) => {
    const loggerTitle = ' Update Property Record ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const propertyRecord = record.load({
        type: 'customrecord_property_record',
        id: propertyRecordId,
      });
      propertyRecord.setValue({
        fieldId: 'custrecord_real_estate_agent_name',
        value: agentId,
      });
      propertyRecord.save();
      log.debug(
        loggerTitle,
        ' Property Record Saved Successfully: ' + propertyRecordId
      );
      //
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
  /* *********************** updatePropertyRecord - End *********************** */
  //
  /* *********************** updatePhoneCallRecord - Begin *********************** */
  /**
   *
   * @param {number} phoneCallId
   * @param {number} agentId
   * @returns {boolean}
   */
  const updatePhoneCallRecord = (phoneCallId, agentId) => {
    const loggerTitle = ' Update Phone Call Record ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // record.submitFields({
      //   type: 'phonecall',
      //   id: phoneCallId,
      //   values: {
      //     custevent_caller_name: agentId,
      //   },
      // });
      const phoneCallRecord = record.load({
        type: 'phonecall',
        id: phoneCallId,
      });
      phoneCallRecord.setValue({
        fieldId: 'custevent_caller_name',
        value: agentId,
      });
      phoneCallRecord.save();
      log.debug(
        loggerTitle,
        ' Phone Call Record Saved Successfully: ' + phoneCallId
      );
      //
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
  /* *********************** updatePhoneCallRecord - End *********************** */
  //
  /* *********************** updateSupportCaseRecord - Begin *********************** */
  /**
   *
   * @param {number} supportCaseId
   * @param {number} agentId
   * @returns {boolean}
   */
  const updateSupportCaseRecord = (supportCaseId, agentId) => {
    const loggerTitle = ' Update Support Case Record ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      record.submitFields({
        type: 'supportcase',
        id: supportCaseId,
        values: {
          custevent_caller_name: agentId,
        },
      });
      log.debug(
        loggerTitle,
        ' Support Case Record Saved Successfully: ' + supportCaseId
      );
      //
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
  /* *********************** updateSupportCaseRecord - End *********************** */
  //
  function removeSpecialCharacters(input) {
    return input.replace(/[^a-zA-Z0-9]/g, '');
  }
  /* ----------------------- Helper Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
