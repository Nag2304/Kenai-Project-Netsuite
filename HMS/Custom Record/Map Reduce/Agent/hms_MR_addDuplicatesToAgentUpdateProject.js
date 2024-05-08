/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_addDuplicatesToAgentUpdateProject.js
 * Script: HMS | MR Add Duplicates To Agent Update
 * Author           Date       Version               Remarks
 * mikewilliams  04.12.2024     1.00     Initial Creation of the Script
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
                ['custrecord_agent_mls_region.internalidnumber', 'equalto', '3'],
            ],
            columns: [
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
            const key = reduceContext.key;
            const values = reduceContext.values;
            //
            log.debug(loggerTitle, 'Key: ' + key);
            log.debug(loggerTitle, values);
            log.emergency(loggerTitle, 'Values Length:' + values.length);
            //
            if (values.length > 1) {
                for (let index = 0; index < values.length; index++) {
                    const data = JSON.parse(values[index]);
                    log.emergency(loggerTitle + index, data);
                    //
                    /* ------------------------- Create Custom Record - Begin ------------------------ */
                    const agentProjectUpdateRecord = record.create({
                        type: 'customrecord_hms_agent_upd_project',
                        isDynamic: true,
                    });
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_agent_id_number',
                        value: key,
                    });
                    // Extracting name
                    const name = data.name;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_agent_name',
                        value: name,
                    });
                    // Extracting MLS region
                    const mlsRegion = data.mlsRegion;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_mls_region',
                        value: mlsRegion,
                    });
                    // Extracting agent's first name
                    const agentFirstName = data.agentFirstName;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_first_name',
                        value: agentFirstName,
                    });
                    // Extracting agent's last name
                    const agentLastName = data.agentLastName;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_last_name',
                        value: agentLastName,
                    });
                    // Extracting Email
                    const agentEmail = data.agentEmail;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_agent_email',
                        value: agentEmail,
                    });
                    // Extracting brokerage
                    const brokerage = data.brokerage;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_brokerage_name',
                        value: brokerage,
                    });
                    // Extracting agent's mobile number
                    const agentMobileNumber = data.agentMobileNumber;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_cell_phone',
                        value: agentMobileNumber,
                    });
                    // Extracting Agent Type
                    const agentType = data.agentType;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_agent_type',
                        value: agentType,
                    });
                    // Extracting Last Modified
                    const lastmodified = data.lastmodifiedDate;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_last_update',
                        value: lastmodified,
                    });
                    // Extracting Prefred Call Back Number
                    const callbackNumber = data.preferredCallbackNumber;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_pref_callback',
                        value: callbackNumber,
                    });
                    // Extracting NRDS ID
                    const nrdsId = data.nrdsId;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_nrds',
                        value: nrdsId,
                    });
                    // Extracting change agent
                    const changeAgent = data.changeAgent;
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_latest_rets_chg',
                        value: changeAgent,
                    });
                    // Save the Duplicate Email ID field 
                    agentProjectUpdateRecord.setValue({
                        fieldId: 'custrecord_hms_agent_id_dupe',
                        value: true
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
