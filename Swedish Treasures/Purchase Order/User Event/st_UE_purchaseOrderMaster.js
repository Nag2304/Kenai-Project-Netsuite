/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * File name:st_UE_purchaseOrderMaster.js
 * Script: ST | UE Purchase Order Master
 * Author           Date       Version               Remarks
 * mikewilliams    03.27.2024   1.00          Initial creation of the script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Uses .
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search'], (search) => {
    /* ------------------------ Global Variables - Begin ------------------------ */
    const exports = {};
    /* ------------------------- Global Variables - End ------------------------- */
    //
    /* --------------------------- Before Load - Begin --------------------------- */
    /**
     *
     * @param {object} scriptContext
     */
    const beforeLoad = (scriptContext) => {
        const loggerTitle = 'Before Load';
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        try {
        } catch (error) {
            log.error(loggerTitle + ' caught an exception', error);
        }
        //
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
    };
    /* ---------------------------- Before Load - End ---------------------------- */
    //
    /* --------------------------- Before Submit - Begin --------------------------- */
    /**
     *
     * @param {object} scriptContext
     */
    const beforeSubmit = (scriptContext) => {
        const loggerTitle = 'Before Submit';
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        try {
            const poRecord = scriptContext.newRecord;
            const isCreate =
                scriptContext.type === scriptContext.UserEventType.CREATE;
            const isUpdate = scriptContext.type === scriptContext.UserEventType.EDIT;
            const isCopy = scriptContext.type === scriptContext.UserEventType.COPY;

            log.debug(loggerTitle, { isCreate, isUpdate, isCopy });

            // Context Type
            if (isCreate || isUpdate || isCopy) {
                const poLineCount = poRecord.getLineCount({ sublistId: 'item' });

                for (let index = 0; index < poLineCount; index++) {
                    // assembly Item
                    const assemblyItemId = poRecord.getSublistValue({ sublistId: 'item', fieldId: 'assembly',line:index });
                    log.debug(loggerTitle, `Assembly Item ID: ${assemblyItemId}`);

                    if (assemblyItemId) {
                        // Retrieve Assembly Item Fields
                        const assemblyItemFields = search.lookupFields({
                            type: search.Type.ASSEMBLY_ITEM,
                            id: assemblyItemId,
                            columns: ['displayname']
                        });

                        const displayName = assemblyItemFields.displayname;
                        log.debug(loggerTitle, ` Display Name: ${displayName}`);

                        // Setting the Display Name
                        if (displayName) {
                            poRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_mst_item_display_name',
                                value: displayName,
                                line: index,
                            });
                            log.debug(loggerTitle, `Display Name set at line level ${index}`);
                        }
                    }
                }

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
    /* ---------------------------- Before Submit - End ---------------------------- */
    //
    /* --------------------------- After Submit - Begin --------------------------- */
    /**
     *
     * @param {object} scriptContext
     */
    const afterSubmit = (scriptContext) => {
        const loggerTitle = 'After Submit';
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
        );
        try {
        } catch (error) {
            log.error(loggerTitle + ' caught an exception', error);
        }
        //
        log.audit(
            loggerTitle,
            '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
        );
    };
    /* ---------------------------- After Submit - End ---------------------------- */
    //
    /* ----------------------------- Exports - Begin ---------------------------- */
    exports.beforeLoad = beforeLoad;
    exports.beforeSubmit = beforeSubmit;
    exports.afterSubmit = afterSubmit;
    return exports;
    /* ------------------------------ Exports - End ----------------------------- */
});
