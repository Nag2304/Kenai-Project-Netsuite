/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * File name:coterie_UE_purchaseOrderMaster.js
 * Script: Coterie | UE Purchase Order Master
 * Author           Date       Version               Remarks
 * mikewilliams   09.24.2023   1.00            Initial Creation of the script
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
      const purchaseOrderRecord = scriptContext.newRecord;
      const purchaseOrderLineItemCount = purchaseOrderRecord.getLineCount({
        sublistId: 'item',
      });
      let totalLineLevelWeight = 0;

      for (let index = 0; index < purchaseOrderLineItemCount; index++) {
        // Reterieve Item ID
        const itemId = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });
        //
        // Reterive Item Type
        const itemType = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: index,
        });
        //

        // Retrieve Quantity
        const quantity = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index,
        });

        log.debug(loggerTitle, { itemId, itemType, quantity });

        // Retrieve Item Weight
        let itemLookUpFields;
        if (itemType === 'InvtPart') {
          itemLookUpFields = search.lookupFields({
            type: search.Type.INVENTORY_ITEM,
            id: itemId,
            columns: ['weight'],
          });
        }
        log.debug(
          loggerTitle + ' Search Item Look Up Fields ',
          itemLookUpFields
        );

        if (itemLookUpFields && itemLookUpFields.weight) {
          const lineItemWeight = Math.ceil(itemLookUpFields.weight) * quantity;
          purchaseOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_coterie_total_line_weight',
            line: index,
            value: lineItemWeight,
          });
          totalLineLevelWeight += lineItemWeight;
        }
        //
      }

      // Set the Header Line Total Weight
      log.debug(loggerTitle, 'Header Total Weight ' + totalLineLevelWeight);
      purchaseOrderRecord.setValue({
        fieldId: 'custbody_coterie_total_po_weight',
        value: totalLineLevelWeight,
      });
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
